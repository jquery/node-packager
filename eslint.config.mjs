import jqueryConfig from "eslint-config-jquery";
import globals from "globals";

export default [
	{
		languageOptions: {
			sourceType: "script",
			globals: {
				...globals.node
			}
		},
		rules: {
			...jqueryConfig.rules,
			strict: [ "error", "global" ]
		}
	},

	{
		files: [
			"*.mjs"
		],

		languageOptions: {
			sourceType: "module",
			globals: {
				...globals.node
			}
		},
		rules: {
			...jqueryConfig.rules
		}
	},

	{
		files: [
			"test/**/*.js"
		],
		languageOptions: {
			sourceType: "module",
			globals: {
				...globals.node,
				...globals.mocha
			}
		},
		rules: {
			...jqueryConfig.rules,

			// Chai `expect` API violates this rule
			"no-unused-expressions": "off"
		}
	}
];
