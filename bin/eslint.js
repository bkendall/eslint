#!/usr/bin/env node
var concat = require("concat-stream"),
    cli = require("../lib/cli"),
    fs = require("fs"),
    inquirer = require("inquirer"),
    yaml = require('js-yaml');

var exitCode = 0,
    useStdIn = (process.argv.indexOf("--stdin") > -1),
    init = (process.argv.indexOf("--init") > -1);

if (useStdIn) {
    process.stdin.pipe(concat({ encoding: "string" }, function(text) {
        try {
            exitCode = cli.execute(process.argv, text);
        } catch (ex) {
            console.error(ex.message);
            console.error(ex.stack);
            exitCode = 1;
        }
    }));
} else if (init) {
    inquirer.prompt([
        { type: "list", name: "indent", message: "What style of indentation do you use?", default: "tabs", choices: [{ name: "Tabs", value: "tabs" }, { name: "Spaces", value: 4}] },
        { type: "list", name: "quotes", message: "What quotes do you use for strings?", default: "double", choices: [{ name: "Double", value: "double" }, { name: "Single", value: "single" }] },
        { type: "list", name: "linebreak", message: "What line endings do you use?", default: "unix", choices: [{ name: "Unix", value: "unix" }, { name: "Windows", value: "windows" }]},
        { type: "confirm", name: "semi", message: "Do you require semicolons?", default: true},
        { type: "confirm", name: "es6", message: "Are you using ECMAScript 6 features?", default: false},
        { type: "list", name: "env", message: "Where will your code run?", default: "browser", choices: [{ name: "Node", value: "node" }, { name: "Browser", value: "browser" }]},
        { type: "confirm", name: "jsx", message: "Will you use JSX?", default: false},
        { type: "confirm", name: "react", message: "Will you use React", default: false, when: function(answers) { return answers.jsx; }},
        { type: "list", name: "format", message: "What format do you want your config file to be in?", default: "JSON", choices: ["JSON", "YAML"]}
    ], function(answers) {
        var config = { rules: {}, env: {} };
        config.rules.indent = [2, answers.indent];
        config.rules.quotes = [2, answers.quotes];
        config.rules["linebreak-style"] = [2, answers.linebreak];
        config.rules.semi = [2, answers.semi ? "always" : "never"];
        if (answers.es6) {
            config.env.es6 = true;
        }
        config.env[answers.env] = true;
        if (answers.jsx) {
            config.ecmaFeatures = { jsx: true };
            if (answers.react) {
                config.plugins = ["react"];
            }
        }
        fs.writeFile("./.eslintrc", answers.format === "JSON" ? JSON.stringify(config, null, 4) : yaml.safeDump(config), function(err) {
            exitCode = err ? 1 : 0;
        });
    });
} else {
    exitCode = cli.execute(process.argv);
}

/*
 * Wait for the stdout buffer to drain.
 * See https://github.com/eslint/eslint/issues/317
 */
process.on("exit", function() {
    process.exit(exitCode);
});
