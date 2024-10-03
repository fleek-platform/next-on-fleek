import 'server-only';

export default {
	async fetch() {
		throw new Error(
			'Invalid invocation of the next-on-pages fetch handler - this method should only be used alongside the --custom-entrypoint CLI option. For more details, see: https://github.com/fleek-platform/next-on-fleek/blob/main/packages/next-on-fleek/docs/advanced-usage.md#custom-entrypoint',
		);
	},
} as { fetch: ExportedHandlerFetchHandler<{ ASSETS: Fetcher }> };
