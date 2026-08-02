import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

// Flat config (ESLint 9). Antes deste arquivo não havia lint algum no frontend —
// havia até um eslint-disable órfão em ListaSimples.tsx suprimindo nada.
export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // A razão principal de instalar o lint: as regras que pegariam sozinhas
      // vários achados da revisão (deps de efeito, hook em condicional).
      'react-hooks/exhaustive-deps': 'error',

      // Variável de descarte em destructuring é o padrão usado para remover uma
      // chave de objeto sem mutar (ver ListaSimples.excluir).
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
    },
  },
  {
    // Arquivos de config rodam em Node, não no browser.
    files: ['*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
);
