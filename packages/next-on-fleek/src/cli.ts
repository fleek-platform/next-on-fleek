import os from 'os';
import dedent from 'dedent-tabs';
import type { ChalkInstance } from 'chalk';
import chalk from 'chalk';
import { getPackageManager } from 'package-manager-manager';
import {
	getPackageVersionOrNull,
	nextOnPagesVersion,
} from './utils';

export type CliOptions = {
	skipBuild?: boolean;
	experimentalMinify?: boolean;
	disableWorkerMinification?: boolean;
	disableChunksDedup?: boolean;
	watch?: boolean;
	noColor?: boolean;
	info?: boolean;
	outdir: string;
	customEntrypoint?: string;
};

type LogOptions = {
	fromVercelCli?: boolean;
	spaced?: boolean;
	skipDedent?: boolean;
};

export function cliLog(message: string, opts: LogOptions = {}): void {
	// eslint-disable-next-line no-console
	console.log(prepareCliMessage(message, opts));
}

export function cliSuccess(message: string, opts: LogOptions = {}): void {
	// eslint-disable-next-line no-console
	console.log(
		prepareCliMessage(message, { ...opts, styleFormatter: chalk.green }),
	);
}

export function cliError(
	message: string,
	{
		showReport,
		fromVercelCli,
		...opts
	}: LogOptions & { showReport?: boolean } = {},
): void {
	// eslint-disable-next-line no-console
	console.error(
		prepareCliMessage(message, {
			...opts,
			fromVercelCli,
			styleFormatter: chalk.red,
		}),
	);
	if (showReport) {
		cliError(
			'Please report this at https://github.com/fleek-platform/next-on-fleek/issues.',
			{ fromVercelCli },
		);
	}
}

export function cliWarn(message: string, opts: LogOptions = {}): void {
	// eslint-disable-next-line no-console
	console.warn(
		prepareCliMessage(message, { ...opts, styleFormatter: chalk.yellow }),
	);
}

/**
 * prepares a message for Cli printing (simple prefixes each line with the appropriate prefix)
 *
 * the function also removes extra indentation on the message allowing us to indent the messages
 * in the code as we please (see https://www.npmjs.com/package/dedent-tabs)
 */
function prepareCliMessage(
	message: string,
	{
		fromVercelCli,
		styleFormatter,
		spaced,
		skipDedent,
	}: LogOptions & {
		styleFormatter?: ChalkInstance;
	},
): string {
	const prefix = fromVercelCli ? '▲ ' : '⚡️';
	const preparedMessage = (skipDedent ? message : dedent(message))
		.split('\n')
		.map(line => `${prefix} ${styleFormatter ? styleFormatter(line) : line}`)
		.join('\n');

	return spaced ? `\n${preparedMessage}\n` : preparedMessage;
}

export async function printEnvInfo(): Promise<void> {
	const pm = await getPackageManager();

	const pmInfo = pm
		? `\n		Package Manager Used: ${pm.name} (${pm.version})\n`
		: '';

	const [vercelVersion, nextVersion] = await Promise.all(
		['vercel', 'next']
			.map(async pkg => (pm ? getPackageVersionOrNull(pm, pkg) : null))
			.filter(Boolean),
	);

	const envInfoMessage = dedent(
		`
		System:
			Platform: ${os.platform()}
			Arch: ${os.arch()}
			Version: ${os.version()}
			CPU: (${os.cpus().length}) ${os.arch()} ${os.cpus()[0]?.model}
			Memory: ${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB
			Shell: ${process.env.SHELL?.toString() ?? 'Unknown'}` +
			pmInfo +
			`
		Relevant Packages:
			@fleek-platform/next-on-fleek: ${nextOnPagesVersion}
			vercel: ${vercelVersion ?? 'N/A'}
			next: ${nextVersion ?? 'N/A'}
	`,
	);

	// eslint-disable-next-line no-console
	console.log(`\n${envInfoMessage}\n`);
}
