module.exports = {
	root: true,
	env: {
		node: true,
	},
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint', 'eslint-plugin-n8n-nodes-base'],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',		 
		'prettier',
	],
	rules: {
		'@typescript-eslint/no-explicit-any': 'off',
		'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
		'@typescript-eslint/explicit-function-return-type': ['error', {
			allowExpressions: true,
			allowTypedFunctionExpressions: true,
		}],
		"n8n-nodes-base/node-param-array-type-assertion": "warn",
    "n8n-nodes-base/node-param-default-wrong-for-collection": "error"
	},
	ignorePatterns: ['dist/**/*', '.n8n/**/*'],
};