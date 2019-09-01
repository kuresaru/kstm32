// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import * as create from './commands/create';
import * as configure from './commands/configure';

import * as tpStdPeriph from './treeProviders/tpStdPeriph';
import * as tpCdefs from './treeProviders/tpCDefs';
import * as tpCincludes from './treeProviders/tpCIncludes';
import * as tpCsources from './treeProviders/tpCSources';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "kstm32" is now active!');

	create.register(context);
	configure.register(context);
	
	tpStdPeriph.registerCmd(context);
	tpCdefs.registerCmd(context);

	let tpstdperiph = new tpStdPeriph.TPStdPeriph();
	let tpcdefs = new tpCdefs.TPCDefines();
	let tpcincludes = new tpCincludes.TPCIncludes();
	let tpcsources = new tpCsources.TPCSources();

	vscode.window.registerTreeDataProvider('kstm32.stdperiph', tpstdperiph);
	vscode.window.registerTreeDataProvider('kstm32.cdefs', tpcdefs);
	vscode.window.registerTreeDataProvider('kstm32.cincludes', tpcincludes);
	vscode.window.registerTreeDataProvider('kstm32.csources', tpcsources);

	context.subscriptions.push(vscode.commands.registerCommand('kstm32.refresh', () => {
		tpstdperiph.refresh();
		tpcdefs.refresh();
		tpcincludes.refresh();
		tpcsources.refresh();
		vscode.commands.executeCommand('kstm32.configure');
	}));
}

// this method is called when your extension is deactivated
export function deactivate() {}
