import type { AsyncLocalStorage } from 'node:async_hooks';
import type { FleekRequest, FleekResponse } from '../types';
import { handleRequest } from './handleRequest';
import { adjustRequestForVercel, handleImageResizingRequest } from './utils';

declare const __CONFIG__: ProcessedVercelConfig;

declare const __BUILD_OUTPUT__: VercelBuildOutput;

declare const __BUILD_METADATA__: NextOnPagesBuildMetadata;

declare const __ALSes_PROMISE__: Promise<null | {
	envAsyncLocalStorage: AsyncLocalStorage<unknown>;
	requestContextAsyncLocalStorage: AsyncLocalStorage<unknown>;
}>;

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LoggerOptions = {
	level?: 'debug' | 'info' | 'warn' | 'error';
};

export async function main(fleekRequest: FleekRequest): Promise<FleekResponse> {
	const request = adaptFleekRequestToFetch(fleekRequest);

	const asyncLocalStorages = await __ALSes_PROMISE__;

	if (!asyncLocalStorages) {
		throw new Error('AsyncLocalStorages not found');
	}

	const { envAsyncLocalStorage, requestContextAsyncLocalStorage } =
		asyncLocalStorages;

	return envAsyncLocalStorage.run({}, async () => {
		return requestContextAsyncLocalStorage.run({ request }, async () => {
			const url = new URL(request.url);
			if (url.pathname.startsWith('/_next/image')) {
				const res = await handleImageResizingRequest(request, {
					buildOutput: __BUILD_OUTPUT__,
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					assetsFetcher: globalThis.ASSETS,
					imagesConfig: __CONFIG__.images,
				});
				return res.bytes();
				// return adaptFetchResponseToFleekResponse(res);
			}

			const adjustedRequest = adjustRequestForVercel(request);

			const res = await handleRequest(
				{
					request: adjustedRequest,
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					ctx: globalThis.CONTEXT,
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					assetsFetcher: globalThis.ASSETS,
				},
				__CONFIG__,
				__BUILD_OUTPUT__,
				__BUILD_METADATA__,
			);

			const response = await adaptFetchResponseToFleekResponse(res);

			return response;
		});
	});
}

function adaptFleekRequestToFetch(fleekRequest: FleekRequest): Request {
	const url = new URL(`http://0.0.0.0${fleekRequest.path}`);

	// Add query parameters
	for (const [key, value] of Object.entries(fleekRequest.query ?? {})) {
		url.searchParams.append(key, value);
	}

	return new Request(url, {
		method: fleekRequest.method,
		headers: fleekRequest.headers,
		body: fleekRequest.body,
	});
}

async function adaptFetchResponseToFleekResponse(
	response: Response,
): Promise<FleekResponse> {
	const body = await response.text();
	const headers = {};
	response.headers.forEach((value, key) => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		headers[key] = value;
	});

	return {
		status: response.status,
		headers,
		body,
	};
}
