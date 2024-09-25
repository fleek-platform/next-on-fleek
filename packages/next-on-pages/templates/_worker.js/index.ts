import { FleekRequest, FleekResponse } from '../types';
import { handleRequest } from './handleRequest';
import { setupRoutesIsolation } from './routesIsolation';
import {
	adjustRequestForVercel,
	handleImageResizingRequest,
	patchFetch,
} from './utils';

declare const __NODE_ENV__: string;

declare const __CONFIG__: ProcessedVercelConfig;

declare const __BUILD_OUTPUT__: VercelBuildOutput;

declare const __BUILD_METADATA__: NextOnPagesBuildMetadata;

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LoggerOptions = {
	level?: 'debug' | 'info' | 'warn' | 'error';
};

const format = (level: LogLevel, ...args: unknown[]) => {
	return {
		timestamp: new Date().toISOString(),
		level,
		message: args,
	};
};

const wrapLogger = (): { logs: unknown[] } => {
	const chunks: unknown[] = [];

	console.log = (...args) => chunks.push(format('info', args));
	console.debug = (...args) => chunks.push(format('debug', args));
	console.info = (...args) => chunks.push(format('info', args));
	console.warn = (...args) => chunks.push(format('warn', args));
	console.error = (...args) => chunks.push(format('error', args));

	return { logs: chunks };
};

type WrapperOptions = {
	log?: LoggerOptions;
};

const wrapper = async (
	fn: (request: FleekRequest) => Promise<FleekResponse>,
	request: FleekRequest,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	opts?: WrapperOptions,
): Promise<FleekResponse> => {
	const debug = request?.query?.debug ?? false;
	const { logs } = wrapLogger();

	try {
		const response = await fn(request);

		return debug
			? {
					status: response.status,
					headers: response.headers,
					body: {
						success: true,
						result: JSON.stringify(response),
						logs,
					},
			  }
			: response;
	} catch (error: unknown) {
		let errorMsg;
		if (error instanceof Error && error.message) {
			errorMsg = {
				message: error.message,
				name: error.name,
				cause: error.cause,
				stack: error.stack,
			};
		} else {
			errorMsg = error;
		}

		return debug
			? {
					status: 500,
					headers: {},
					body: {
						success: false,
						error: errorMsg,
						logs,
					},
			  }
			: error;
	}
};

export async function main(fleekRequest: FleekRequest): Promise<FleekResponse> {
	const response: FleekResponse = await wrapper(
		async (wrappedFleekRequest: FleekRequest): Promise<FleekResponse> => {
			setupRoutesIsolation();

			patchFetch();

			const request = adaptFleekRequestToFetch(wrappedFleekRequest);

			const url = new URL(request.url);
			if (url.pathname.startsWith('/_next/image')) {
				let res = await handleImageResizingRequest(request, {
					buildOutput: __BUILD_OUTPUT__,
					assetsFetcher: globalThis.ASSETS,
					imagesConfig: __CONFIG__.images,
				});
				return adaptFetchResponseToFleekResponse(res);
			}

			const adjustedRequest = adjustRequestForVercel(request);

			let res = await handleRequest(
				{
					request: adjustedRequest,
					ctx: globalThis.CONTEXT,
					assetsFetcher: globalThis.ASSETS,
				},
				__CONFIG__,
				__BUILD_OUTPUT__,
				__BUILD_METADATA__,
			);

			return await adaptFetchResponseToFleekResponse(res);
		},
		fleekRequest,
	);

	return response;
}

function adaptFleekRequestToFetch(fleekRequest: FleekRequest): Request {
	return new Request(new URL(`http://0.0.0.0/${fleekRequest.path}`), {
		method: fleekRequest.method,
		headers: fleekRequest.headers,
		body: fleekRequest.body,
	});
}

async function adaptFetchResponseToFleekResponse(
	response: Response,
): Promise<FleekResponse> {
	const body = await response.text();
	let headers = {};
	response.headers.forEach((value, key) => {
		headers[key] = value;
	});

	return {
		status: response.status,
		headers,
		body,
	};
}
