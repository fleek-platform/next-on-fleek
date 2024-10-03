import { FleekSdk, PersonalAccessTokenService } from '@fleek-platform/sdk';
import { encodeFile } from '@web3-storage/upload-client/unixfs';
import { filesFromPaths } from 'files-from-path';
import { readdir } from 'fs/promises';
import { join } from 'path';

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
		await walkDir(props.filePath, result);
		// eslint-disable-next-line no-console
		console.log('CIDs', result);

		// eslint-disable-next-line no-console
		console.log('Successfully uploaded to IPFS', uploadFileResult);

		return { rootCid: uploadFileResult.pin.cid, cidMap: result };
	} catch (e) {
		// eslint-disable-next-line no-console
		console.error('Error uploading file to IPFS', JSON.stringify(e, null, 2));
		throw e;
	}
}

async function walkDir(dir: string, result: Record<string, string>) {
	const entries = await readdir(dir, { withFileTypes: true });

	for (const entry of entries) {
		const path = join(dir, entry.name);
		// const relativePath = relative(dir, path);

		if (entry.isDirectory()) {
			await walkDir(path, result);
		} else {
			const files = await filesFromPaths([path]);
			const file = files[0];

			if (!file) {
				// eslint-disable-next-line no-console
				console.warn('File not found', path);
				continue;
			}

			const encodedFile = await encodeFile(file);

			const cid = encodedFile.cid.toV1().toString();

			result[path] = cid;
		}
	}
}
