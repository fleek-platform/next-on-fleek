# `@fleek-platform/next-on-fleek`

`@fleek-platform/next-on-fleek` is a CLI tool that you can use to build and develop [Next.js](https://nextjs.org/) applications so that they can run on [Fleek Functions](https://fleek.xyz/docs/platform/fleek-functions/).

This tool is a best-effort library implemented by the Fleek team, on the shoulders of the Cloudflare team and the community. As such, most, but not all, Next.js features are supported. See the [Supported Versions and Features document](https://github.com/fleek-platform/next-on-fleek/blob/main/packages/next-on-fleek/docs/supported.md) for more details.

## Quick Start

This section describes how to bundle and deploy a (new or existing) Next.js application to [Fleek Functions](https://fleek.xyz/docs/platform/fleek-functions/), using `@fleek-platform/next-on-fleek`.

### 1. Select your Next.js app

To start using `@fleek-platform/next-on-fleek`, you must have a Next.js project that you wish to deploy. If you already have one, change to its directory. Otherwise, you can use the `create-next-app` command to start a new one.

```sh
npx create-next-app@latest my-next-app
cd my-next-app
```

<details>
<summary>Note on the Next.js version</summary>

We have confirmed support for the current version of Next.js at the time of writing, `14.2.14`. Although we'll endeavor to keep support for newer versions, we cannot guarantee that we'll always be up-to-date with the latest version. If you experience any problems with `@fleek-platform/next-on-fleek`, you may wish to try pinning to `14.2.14` while we work on supporting any recent breaking changes.

</details>

### 2. Configure the application to use the Edge Runtime

For your application to run on Fleek Functions, it needs to opt in to use the Edge Runtime for routes containing server-side code (e.g. API Routes or pages that use `getServerSideProps`). To do this, export a `runtime` [route segment config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#runtime) option from each file, specifying that it should use the Edge Runtime.

```typescript
export const runtime = 'edge';
```

&NewLine;

For more examples of this and for Next.js versions prior to v14.2.14, take a look at our [examples document](https://github.com/fleek-platform/next-on-fleek/blob/main/packages/next-on-fleek/docs/examples.md). Additionally, ensure that your application is not using any unsupported [APIs](https://nextjs.org/docs/app/api-reference/edge#unsupported-apis) or [features](https://github.com/fleek-platform/next-on-fleek/blob/main/packages/next-on-fleek/docs/supported.md).

### 3. Deploy your application to Fleek Functions

To deploy your application to Fleek Functions, you need to install the `@fleek-platform/next-on-fleek` package.

```sh
npm install -D @fleek-platform/next-on-fleek
```

TODO

## Recommended development workflow

When developing a `next-on-fleek` application, this is the development workflow that Fleek recommends:

### Deploy your application and iterate

After you have previewed your application locally, you can deploy it to Fleek (via [Fleek Next CLI](https://github.com/fleekxyz/fleek-next)) and iterate over the process to make new changes.

## Examples

To see some examples on how to use Next.js features with `@fleek-platform/next-on-fleek`, see the [Examples document](https://github.com/fleek-platform/next-on-fleek/blob/main/packages/next-on-fleek/docs/examples.md).

## Troubleshooting

If you find yourself hitting some issues with `@fleek-platform/next-on-fleek` please check out our [official troubleshooting documentation](TODO).

## More Information

For more information on the project please check out the [README](https://github.com/fleek-platform/next-on-fleek/blob/main/README.md) in the next-on-pages github repository.
