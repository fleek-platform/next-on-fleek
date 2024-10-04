import { FleekSdk, PersonalAccessTokenService } from '@fleek-platform/sdk';
import { cliLog } from '../cli';

export async function uploadDir(props: {
	filePath: string;
}): Promise<{ rootCid: string; cidMap: Record<string, string> }> {
	try {
		const personalAccessToken = process.env['FLEEK_PAT'] as string | undefined;
		const projectId = process.env['FLEEK_PROJECT_ID'] as string | undefined;

		if (!personalAccessToken) {
			throw new Error('Missing personal access token');
		}

		if (!projectId) {
			throw new Error('Missing project id');
		}

		const accessTokenService = new PersonalAccessTokenService({
			projectId,
			personalAccessToken,
		});
		const sdk = new FleekSdk({ accessTokenService });

		const uploadFileResult = await sdk.storage().uploadDirectory({
			path: props.filePath,
		});

		const result: Record<string, string> = {};

		// eslint-disable-next-line no-console
		cliLog(
			`Successfully uploaded static assets to IPFS: ${uploadFileResult.pin.cid}`,
		);

		return { rootCid: uploadFileResult.pin.cid, cidMap: result };
	} catch (e) {
		// eslint-disable-next-line no-console
		console.error('Error uploading file to IPFS', JSON.stringify(e, null, 2));
		throw e;
	}
}
