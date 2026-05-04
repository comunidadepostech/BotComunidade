import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import sonarjs from 'eslint-plugin-sonarjs';
import gitignore from "eslint-config-flat-gitignore";

export default [
  gitignore(),
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  sonarjs.configs.recommended,
  {
    ignores: ["./assets/**", "./node_modules", "./bun.lock"]
  },
  {
    plugins: {
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      'sonarjs/cognitive-complexity': ['error', 15],
      'sonarjs/no-duplicate-string': ['warn', { threshold: 5 }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "complexity": ["error", 15],
      "id-length": ["error", { "min": 2 }],
      'import/no-restricted-paths': [
        'error',
        {
          basePath: './',
          zones: [
            {
              target: './controllers/**/*.ts',
              from: ['./repositories/**/*.ts'],
              message: 'A camada de controllers não pode conhecer repositories.'
            }
          ]
        }
      ],
      "max-depth": ["error", 4]
    }
  },
  eslintConfigPrettier,
]