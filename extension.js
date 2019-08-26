// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

const create = require('./src/commands/create');
const configure = require('./src/commands/configure');

const tpCSources = require('./src/treeProviders/tpCSources');
const tpCIncludes = require('./src/treeProviders/tpCIncludes');
const tpCDefs = require('./src/treeProviders/tpCDefs');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "kstm32" is now active!');

	configure.register(context);
	create.register(context);
	
	tpCSources.register();
	tpCIncludes.register();
	tpCDefs.register();
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
