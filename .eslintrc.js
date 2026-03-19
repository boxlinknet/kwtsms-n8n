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
	},
	rules: {
		'@typescript-eslint/no-explicit-any': 'warn',
		'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
		'no-console': 'warn',
	},
	ignorePatterns: ['dist/', 'node_modules/', 'gulpfile.js'],
};
