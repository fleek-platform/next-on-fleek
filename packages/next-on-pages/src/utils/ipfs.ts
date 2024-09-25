import { FleekSdk, PersonalAccessTokenService } from '@fleek-platform/sdk';

export async function uploadDir(props: { filePath: string }): Promise<string> {
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

		// eslint-disable-next-line no-console
		console.log('Successfully uploaded to IPFS', uploadFileResult);

		return uploadFileResult.pin.cid;
	} catch (e) {
		// eslint-disable-next-line no-console
		console.error('Error uploading file to IPFS', JSON.stringify(e, null, 2));
		throw e;
	}
}
