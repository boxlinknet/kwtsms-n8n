/**
 * ESLint configuration for n8n-nodes-kwtsms
 */
module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint'],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
	],
	parserOptions: {
		ecmaVersion: 2019,
		sourceType: 'module',
		project: './tsconfig.json',
		tsconfigRootDir: __dirname,
	},
	rules: {
		'@typescript-eslint/no-explicit-any': 'warn',
		'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
		'@typescript-eslint/no-floating-promises': 'error',
		'@typescript-eslint/no-misused-promises': 'error',
		'no-console': 'warn',
	},
	ignorePatterns: ['dist/', 'node_modules/', 'gulpfile.js'],
};
