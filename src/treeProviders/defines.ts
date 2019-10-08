import * as vscode from 'vscode';
import * as tpTemplate from './tpTemplate';
import * as config from '../config';

export class TPCDefines extends tpTemplate.tpTemplate<vscode.TreeItem> {
    getChildren(element?: vscode.TreeItem) {
        let result: vscode.TreeItem[] = [];
        // Root
        if (!element) {
            let defines = config.getDefine();
            defines.forEach(define => result.push(new vscode.TreeItem(define)));
        }
        return Promise.resolve(result);
    }
}

export function registerCmd(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('kstm32.cdefs.add', define => {
        if (define) {
            if (config.addDefine(define)) {
                vscode.commands.executeCommand('kstm32.refresh');
            } else {
                vscode.window.showErrorMessage('添加失败');
            }
        } else {
            vscode.window.showInputBox().then(input => {
                if (input && input.length > 0) {
                    vscode.commands.executeCommand('kstm32.cdefs.add', input);
                }
            });
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('kstm32.cdefs.remove', define => {
        if (define instanceof vscode.TreeItem && define.label) {
            config.rmDefine(define.label);
            vscode.commands.executeCommand('kstm32.refresh');
        }
    }));
}