const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");
const importPlugin = require("eslint-plugin-import");
const eslintUnusedImports = require("eslint-plugin-unused-imports");

module.exports = tseslint.config(
	{
		ignores: [
			"dist/",
			"coverage/",
			"dist/",
			".angular/",
			".husky/",
			".idea/",
			".vscode/",
			"cypress/",
			"nginx/",
			"node_modules/",
			"public/",
			"src/assets/"
		]
	},
	{
		files: ["**/*.ts"],
		plugins: {
			import: importPlugin,
			"unused-imports": eslintUnusedImports
		},
		extends: [
			eslint.configs.recommended,
			...tseslint.configs.recommended,
			...tseslint.configs.stylistic,
			...angular.configs.tsRecommended
		],
		processor: angular.processInlineTemplates,
		rules: {
			"@typescript-eslint/no-explicit-any": "error",
			"@typescript-eslint/no-unused-vars": "off",
			"no-unused-vars": "off",
			"unused-imports/no-unused-imports": "error",
			"unused-imports/no-unused-vars": "error",
			"import/no-duplicates": ["error", { considerQueryString: true }],
			"@typescript-eslint/consistent-type-definitions": "off",
			"@typescript-eslint/no-namespace": "error",
			"@typescript-eslint/no-empty-function": "error",
			"@typescript-eslint/no-inferrable-types": "off",
			"@typescript-eslint/consistent-generic-constructors": "error",
			"@typescript-eslint/adjacent-overload-signatures": "error",
			"@typescript-eslint/consistent-indexed-object-style": "off",
			"@typescript-eslint/consistent-type-assertions": "error",
			"@typescript-eslint/array-type": "error",
			"@typescript-eslint/no-empty-object-type": "error",
			"@typescript-eslint/ban-ts-comment": "error",
			"@typescript-eslint/prefer-for-of": "off",
			"@typescript-eslint/no-duplicate-enum-values": "error",
			"no-useless-escape": "error",
			"no-var": "error",
			"prefer-const": "error",
			"@angular-eslint/no-output-native": "error",
			"@angular-eslint/no-output-rename": "warn",
			"@angular-eslint/prefer-standalone": "error",
			"@angular-eslint/prefer-inject": "error",
			"@angular-eslint/no-output-on-prefix": "error",
			eqeqeq: "error",
			"@angular-eslint/directive-selector": [
				"error",
				{
					type: "attribute",
					prefix: "app",
					style: "camelCase"
				}
			],
			"@angular-eslint/component-selector": [
				"error",
				{
					type: "element",
					prefix: "app",
					style: "kebab-case"
				}
			]
		}
	},
	{
		files: ["**/*.html"],
		extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
		rules: {
			"@angular-eslint/template/prefer-self-closing-tags": "error",
			"@angular-eslint/template/label-has-associated-control": "error",
			"@angular-eslint/template/click-events-have-key-events": "off",
			"@angular-eslint/template/interactive-supports-focus": "off",
			"@angular-eslint/template/alt-text": "error",
			"@angular-eslint/template/eqeqeq": "error"
		}
	}
);
