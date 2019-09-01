import * as vscode from 'vscode';
import * as tpTemplate from './tpTemplate';

export class TPCDefines extends tpTemplate.tpTemplate<vscode.TreeItem> {
    getChildren(element?: vscode.TreeItem) {
        let result: vscode.TreeItem[] = [];
        // Root
        if (!element) {
            // Get configuration
            let cdefs: string[] | undefined = vscode.workspace.getConfiguration('kstm32').get('cdefs');
            // config avaliable
            if (cdefs) {
                cdefs.forEach(element => result.push(new vscode.TreeItem(element)));
            }
        }
        return Promise.resolve(result);
    }
}

export function registerCmd(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('kstm32.cdefs.add', define => {
        let cfg: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('kstm32');
        let cdefs: string[] | undefined = cfg.get('cdefs');
        if (!cdefs) {
            cdefs = [];
        }
        if (!define) {
            vscode.window.showInputBox().then(input => {
                if (!input || input == '') {
                    return;
                }
                (<string[]>cdefs).push(<string>input);
                cfg.update('cdefs', cdefs, vscode.ConfigurationTarget.Workspace);
                vscode.commands.executeCommand('kstm32.refresh');
            });
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('kstm32.cdefs.remove', define => {
        if (define instanceof vscode.TreeItem && define.label) {
            let cfg: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('kstm32');
            let cdefs: string[] | undefined = cfg.get('cdefs');
            if (!cdefs) {
                cdefs = [];
            }
            let index = cdefs.indexOf(define.label);
            if (index != -1) {
                cdefs.splice(index, 1);
                cfg.update('cdefs', cdefs, vscode.ConfigurationTarget.Workspace);
                vscode.commands.executeCommand('kstm32.refresh');
            }
        }
    }));
}