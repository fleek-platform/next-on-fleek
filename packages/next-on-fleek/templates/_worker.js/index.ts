import { AsyncLocalStorage } from 'node:async_hooks';
import type { FleekRequest, FleekResponse } from '../types';
import { handleRequest } from './handleRequest';
import { adjustRequestForVercel, handleImageResizingRequest } from './utils';

declare const __CONFIG__: ProcessedVercelConfig;

declare const __BUILD_OUTPUT__: VercelBuildOutput;

declare const __BUILD_METADATA__: NextOnPagesBuildMetadata;

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LoggerOptions = {
	level?: 'debug' | 'info' | 'warn' | 'error';
};

export async function main(fleekRequest: FleekRequest): Promise<FleekResponse> {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	globalThis.AsyncLocalStorage = AsyncLocalStorage;
	const envAsyncLocalStorage: AsyncLocalStorage<unknown> =
		new AsyncLocalStorage();
	const requestContextAsyncLocalStorage: AsyncLocalStorage<unknown> =
		new AsyncLocalStorage();

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	globalThis.process = {
		env: new Proxy(
			{},
			{
				ownKeys: () =>
					Reflect.ownKeys(envAsyncLocalStorage.getStore() as object),
				getOwnPropertyDescriptor: (_, ...args) =>
					Reflect.getOwnPropertyDescriptor(
						envAsyncLocalStorage.getStore() as object,
						...args,
					),
				get: (_, property) =>
					Reflect.get(envAsyncLocalStorage.getStore() as object, property),
				set: (_, property, value) =>
					Reflect.set(
						envAsyncLocalStorage.getStore() as object,
						property,
						value,
					),
			},
		),
	};

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	globalThis[Symbol.for('__fleek-request-context__')] = new Proxy(
		{},
		{
			ownKeys: () =>
				Reflect.ownKeys(requestContextAsyncLocalStorage.getStore() as object),
			getOwnPropertyDescriptor: (_, ...args) =>
				Reflect.getOwnPropertyDescriptor(
					requestContextAsyncLocalStorage.getStore() as object,
					...args,
				),
			get: (_, property) =>
				Reflect.get(
					requestContextAsyncLocalStorage.getStore() as object,
					property,
				),
			set: (_, property, value) =>
				Reflect.set(
					requestContextAsyncLocalStorage.getStore() as object,
					property,
					value,
				),
		},
	);

	const request = await adaptFleekRequestToFetch(fleekRequest);

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

async function adaptFleekRequestToFetch(
	fleekRequest: FleekRequest,
): Promise<Request> {
	let url;
	if (fleekRequest.headers?.['origin']) {
		url = new URL(`${fleekRequest.headers['origin']}${fleekRequest.path}`);
	} else {
		url = new URL(`http://0.0.0.0${fleekRequest.path}`);
	}

	// Add query parameters
	for (const [key, value] of Object.entries(fleekRequest.query ?? {})) {
		url.searchParams.append(key, value);
	}

	return new Request(url, {
		method: fleekRequest.method,
		headers: fleekRequest.headers,
		body:
			typeof fleekRequest.body === 'object'
				? JSON.stringify(fleekRequest.body)
				: fleekRequest.body,
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
