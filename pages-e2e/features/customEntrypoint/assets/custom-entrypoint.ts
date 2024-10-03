//@ts-nocheck
import nextOnPagesHandler from '@fleek-platform/next-on-fleek/fetch-handler';

export default {
	async fetch(...args) {
		const response = await nextOnPagesHandler.fetch(...args);

		response.headers.set('custom-entrypoint', '1');

		return response;
	},
} as ExportedHandler<{ ASSETS: Fetcher }>;
