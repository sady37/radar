// 导入 ESLint 核心配置
// 将 @eslint/js 作为默认导出导入
import pkg from '@eslint/js';
// 通过解构赋值获取 flatConfig
const { flatConfig: eslintFlatConfig } = pkg;
// 导入 typescript-eslint 解析器和插件
import parser from '@typescript-eslint/parser';
import plugin from '@typescript-eslint/eslint-plugin';
// 导入 Vue 插件
import vuePlugin from 'eslint-plugin-vue';

export default [
  // 使用 ESLint 推荐配置
  eslintFlatConfig.recommended,
  {
    // 对所有 .js、.ts 和 .vue 文件应用规则
    files: ['src/**/*.{js,ts,vue}'],
    // 使用 @typescript-eslint/parser 解析 TypeScript 文件
    languageOptions: {
      parser: parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json' // 根据实际情况调整 tsconfig 文件路径
      }
    },
    // 使用 @typescript-eslint 和 vue 插件
    plugins: {
      '@typescript-eslint': plugin,
      'vue': vuePlugin
    },
    // 扩展插件的推荐规则
    rules: {
      ...plugin.configs.recommended.rules,
      ...vuePlugin.configs.base.rules,
      // 自定义规则
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'indent': ['error', 2],
      'no-console': 'warn',
      'no-debugger': 'warn'
    }
  }
];