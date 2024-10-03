# `eslint-plugin-next-on-fleek`

`eslint-plugin-next-on-fleek` is an ESlint plugin intended to support developers developing Next.js application via `@fleek-platform/next-on-fleek`.

## Setup

To install the plugin run:

```sh
 npm i --save-dev eslint-plugin-next-on-fleek@V
```

where `V` indicates the version of your `@fleek-platform/next-on-fleek` package.

> **Note**
> The `eslint-plugin-next-on-fleek` package is versioned identically to `@fleek-platform/next-on-fleek`, this can be used to ensure that the two packages are in sync with each other. For best results make sure that the versions of the two packages are always the same.

Then simply register the plugin in your eslintrc file. As part of this we suggest to also extend the recommended configuration. After that you can also further tweak the available rules:

```diff
// .eslintrc.json
{
  "plugins": [
+    "next-on-fleek"
  ],
  "extends": [
+    // apply the recommended rules
+    "plugin:next-on-fleek/recommended"
  ],
  "rules": {
+    // specify or tweak the rules
+    "next-on-fleek/no-unsupported-configs": "warn"
  }
}
```

## Rules

For more details check out the [rules documentation](https://github.com/fleek-platform/next-on-fleek/tree/main/packages/eslint-plugin-next-on-fleek/docs/rules).
