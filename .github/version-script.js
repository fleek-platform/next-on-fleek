const fs = require('fs');
const { exec } = require('child_process');

try {
	const nextOnFleekPackage = JSON.parse(
		fs.readFileSync('./packages/next-on-fleek/package.json'),
	);
	const eslintPluginPackage = JSON.parse(
		fs.readFileSync('./packages/eslint-plugin-next-on-fleek/package.json'),
	);

	exec('git rev-parse --short HEAD', (err, stdout) => {
		if (err) {
			console.log(err);
			process.exit(1);
		}
		const version = '0.0.0-' + stdout.trim();
		const nextOnFleekMetadata = {
			pullRequest: getPullRequestNumber(),
			beta: getIsBeta(),
		};
		nextOnFleekPackage.version = version;
		nextOnFleekPackage.nextOnFleekMetadata = nextOnFleekMetadata;
		eslintPluginPackage.version = version;
		nextOnFleekPackage.nextOnFleekMetadata = nextOnFleekMetadata;

		fs.writeFileSync(
			'./packages/next-on-fleek/package.json',
			JSON.stringify(nextOnFleekPackage, null, '\t') + '\n',
		);
		fs.writeFileSync(
			'./packages/eslint-plugin-next-on-fleek/package.json',
			JSON.stringify(eslintPluginPackage, null, '\t') + '\n',
		);
	});
} catch (error) {
	console.error(error);
	process.exit(1);
}

function getPullRequestNumber() {
	const match = /^PR=(\d+)$/.exec(process.argv[2] ?? '');
	return match?.[1];
}

function getIsBeta() {
	const isBeta = (process.argv[2] ?? '') === 'BETA';
	return isBeta || undefined;
}
