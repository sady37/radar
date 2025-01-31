import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.{js,mjs,cjs,ts,vue}"] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs["flat/essential"],
  { files: ["**/*.vue"], languageOptions: { parserOptions: { parser: tseslint.parser } } },
  {
    rules: {
      // 将未使用变量规则调整为警告级别
      "@typescript-eslint/no-unused-vars": "warn",
      // 将 case 块声明规则调整为警告级别
      "no-case-declarations": "warn",
      // 关闭 Vue 组件名称多单词规则
      "vue/multi-word-component-names": "off"
    }
  }
];