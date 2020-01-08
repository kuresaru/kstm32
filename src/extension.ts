// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import * as create from './commands/create';
import * as configure from './commands/configure';
import * as make from './commands/make';
import * as openocd from './commands/openocd';

import * as stdperiph_i from './treeProviders/stdperiph';
import * as defines_i from './treeProviders/defines';
import * as includes_i from './treeProviders/includes';
import * as sources_i from './treeProviders/sources';
import * as options_i from './treeProviders/options';

import * as config from './projectConfig';


export let defines: defines_i.Provider = new defines_i.Provider();
export let stdperiph: stdperiph_i.Provider = new stdperiph_i.Provider();
export let includes: includes_i.Provider = new includes_i.Provider();
export let sources: sources_i.Provider = new sources_i.Provider();

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "kstm32" is now active!');

	create.register(context);
	configure.register(context);
	make.register(context);
	openocd.register(context);

	stdperiph_i.registerCmd(context);
	defines_i.registerCmd(context);

	vscode.window.registerTreeDataProvider('kstm32.stdperiph', stdperiph);
	vscode.window.registerTreeDataProvider('kstm32.cdefs', defines);
	vscode.window.registerTreeDataProvider('kstm32.cincludes', includes);
	vscode.window.registerTreeDataProvider('kstm32.csources', sources);
	vscode.window.registerTreeDataProvider('kstm32.options', new options_i.Provider());

	context.subscriptions.push(vscode.commands.registerCommand('kstm32.refresh', () => {
		stdperiph.refresh();
		defines.refresh();
		includes.refresh();
		sources.refresh();
		vscode.commands.executeCommand('kstm32.configure');
	}));
}

// this method is called when your extension is deactivated
export function deactivate() { }
