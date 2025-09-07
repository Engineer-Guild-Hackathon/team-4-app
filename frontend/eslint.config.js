// eslint.config.js
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierConfig from 'eslint-config-prettier'; // Prettierとの連携用

export default [
  // 1. グローバルな無視設定
  {
    ignores: ['node_modules/', '.expo/', 'dist/'],
  },

  // 2. TypeScript/Reactコードの基本設定
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: {
      react: {
        version: 'detect', // インストールされているReactのバージョンを自動で検出
      },
    },
    rules: {
      // 各プラグインの推奨ルールを適用
      ...tseslint.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,

      // プロジェクト独自のルールを上書き
      'react/react-in-jsx-scope': 'off', // React 17以降は不要
      'react/prop-types': 'off', // TypeScriptで型チェックするため不要
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // 3. Prettierとの競合ルールを無効化（必ず最後に配置）
  prettierConfig,
];
