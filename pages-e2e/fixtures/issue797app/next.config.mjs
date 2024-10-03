import { setupDevPlatform } from '@fleek-platform/next-on-fleek/next-dev';

// Here we use the @fleek-platform/next-on-fleek next-dev module to allow us to use bindings during local development
// (when running the application with `next dev`), for more information see:
// https://github.com/fleek-platform/next-on-fleek/blob/5712c57ea7/internal-packages/next-dev/README.md
if (process.env.NODE_ENV === 'development') {
	await setupDevPlatform();
}

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
