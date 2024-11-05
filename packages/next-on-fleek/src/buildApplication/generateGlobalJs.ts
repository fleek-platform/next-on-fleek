/**
 * Generates the javascript content (as a plain string) that deals with the global scope that needs to be
 * added to the built worker.
 *
 * @returns the plain javascript string that should be added at the top of the the _worker.js file
 */
export function generateGlobalJs(): string {
	return `
		const sharedGlobalProperties = new Set([
			'_nextOriginalFetch',
			'fetch',
			'__incrementalCache',
		]);

		function getProxyFor(route) {
			const existingProxy = globalThis.__nextOnPagesRoutesIsolation._map.get(route);
			if (existingProxy) {
				return existingProxy;
			}

			const newProxy = createNewRouteProxy();
			globalThis.__nextOnPagesRoutesIsolation._map.set(route, newProxy);
			return newProxy;
		}

		function createNewRouteProxy() {
			const overrides = new Map();

			return new Proxy(globalThis, {
				get: (_, property) => {
					if (overrides.has(property)) {
						return overrides.get(property);
					}
					return Reflect.get(globalThis, property);
				},
				set: (_, property, value) => {
					if (sharedGlobalProperties.has(property)) {
						// this property should be shared across all routes
						return Reflect.set(globalThis, property, value);
					}
					overrides.set(property, value);
					return true;
				},
			});
		}

		globalThis.__nextOnPagesRoutesIsolation ??= {
			_map: new Map(),
			getProxyFor,
		};

		const originalFetch = globalThis.fetch;

		function setRequestUserAgentIfNeeded(request) {
			if (!request.headers.has('user-agent')) {
				request.headers.set(\`user-agent\`, \`Next.js Middleware\`);
			}
		}

		const patchFlagSymbol = Symbol.for('next-on-pages fetch patch');

		async function handleInlineAssetRequest(request) {
			if (request.url.startsWith('blob:')) {
				try {
					const url = new URL(request.url);
					const pathname = url.pathname;
					const noExt = pathname.replace(/.html$/, '');
					const withExt = \`\${noExt.replace(/^\\/$/, '/index')}.html\`;

					const builtUrl = \`https://\${process.env.ASSETS_CID}.ipfs.flk-ipfs.xyz/_worker.js/__next-on-fleek-dist__/assets/\${pathname}\`;
					
					const response = await fetch(
						builtUrl,
					);
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

		globalThis.fetch = async (...args) => {
			const request = new Request(...args);

			const response = await handleInlineAssetRequest(request);
			if (response) return response;

			setRequestUserAgentIfNeeded(request);

			return originalFetch(request);
		};

		globalThis.ASSETS = {
			fetch: async req => {
				try {
					let pathname;
					if (req instanceof URL) {
						pathname = new URL(req).pathname;
					} else {
						pathname = new URL(req.url).pathname;
					}

					let assetPath = pathname;
					if (!/\\.[^.]+$/.test(assetPath)) {
						const noExt = pathname.replace(/.html$/, '');
						assetPath = \`\${noExt.replace(/\\/$/, '/index')}.html\`;
					}

					const response = await fetch(
						\`https://\${process.env.ASSETS_CID}.ipfs.flk-ipfs.xyz\${assetPath}\`,
					);
					return Promise.resolve(response);
				} catch (error) {
					return Promise.reject(error);
				}
			},
		};

		import('node:buffer').then(({ Buffer }) => {
			globalThis.Buffer = Buffer;
		})
		.catch(() => null);
	`;
}
