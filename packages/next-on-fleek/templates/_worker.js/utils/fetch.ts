import { handleSuspenseCacheRequest } from './cache';

/**
 * Patches the global fetch in ways necessary for Next.js (/next-on-fleek) applications
 * to work
 */
export function patchFetch(): void {
	const alreadyPatched = (globalThis as GlobalWithPatchSymbol)[patchFlagSymbol];

	if (alreadyPatched) return;

	applyPatch();

	(globalThis as GlobalWithPatchSymbol)[patchFlagSymbol] = true;
}

function applyPatch() {
	const originalFetch = globalThis.fetch;
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	globalThis.fetch = async (...args) => {
		const request = new Request(...args);

		let response = await handleInlineAssetRequest(request);
		if (response) return response;

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		response = await handleSuspenseCacheRequest(request);
		if (response) return response;

		setRequestUserAgentIfNeeded(request);

		return originalFetch(request);
	};
}

/**
 * This function checks if a given request is trying to fetch an inline if it is it returns a response containing a stream for the asset,
 * otherwise returns null (signaling that the request hasn't been handled).
 *
 * This is necessary so that users can fetch urls such as: `new URL("file", import.meta.url)`
 * (used for example with `@vercel/og`)
 *
 * Note: this function's aim is to mimic the following Next behavior:
 * 	https://github.com/vercel/next.js/blob/6705c803021d3bdea7fec20e5d98f6899e49836d/packages/next/src/server/web/sandbox/fetch-inline-assets.ts
 *
 * @param request the request to handle
 * @returns the response to return to the caller if the request was for an inline asset one (and the file exists), null otherwise
 */
async function handleInlineAssetRequest(request: Request) {
	if (request.url.startsWith('blob:')) {
		try {
			const url = new URL(request.url);
			const pathname = url.pathname;

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			const builtUrl = `https://${globalThis.cid}.ipfs.flk-ipfs.xyz/_worker.js/__next-on-pages-dist__/assets/${pathname}`;

			const response = await fetch(builtUrl);
			return Promise.resolve(response);
		} catch (error) {
			// eslint-disable-next-line no-console
			console.log('Failed to fetch from IPFS');
			// eslint-disable-next-line no-console
			console.error(error);
		}
	}
	return null;
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
globalThis.ASSETS = {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	fetch: async req => {
		try {
			console.log('fetching asset', req.url);
			const { pathname } = new URL(req.url);

			let assetPath = pathname;
			if (/\.[^.]+$/.test(assetPath)) {
				const noExt = pathname.replace(/\.html$/, '');
				assetPath = `${noExt.replace(/^\/$/, '/index')}.html`;
			}

			const response = await fetch(
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				`https://${globalThis.cid}.ipfs.flk-ipfs.xyz${assetPath}`,
			);
			return Promise.resolve(response);
		} catch (error) {
			return Promise.reject(error);
		}
	},
};

/**
 *	updates the provided request by adding a Next.js specific user-agent header if the request has no user-agent header
 *
 *  Note: this is done by the Vercel network, but also in their next dev server as you can see here:
 * 		https://github.com/vercel/next.js/blob/6705c803021d3bdea7fec20e5d98f6899e49836d/packages/next/src/server/web/sandbox/context.ts#L318-L320)
 * @param request the request to update
 */
function setRequestUserAgentIfNeeded(
	request: Request<unknown, RequestInitCfProperties>,
): void {
	if (!request.headers.has('user-agent')) {
		request.headers.set(`user-agent`, `Next.js Middleware`);
	}
}

const patchFlagSymbol = Symbol.for('next-on-pages fetch patch');

type GlobalWithPatchSymbol = typeof globalThis & { [patchFlagSymbol]: boolean };
