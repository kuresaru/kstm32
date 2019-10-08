import * as vscode from 'vscode';
import * as tpTemplate from './tpTemplate';
import * as config from '../config';

export class TPCDefines extends tpTemplate.tpTemplate<vscode.TreeItem> {
    getChildren(element?: vscode.TreeItem) {
        let result: vscode.TreeItem[] = [];
        // Root
        if (!element) {
            let conf = config.getConfig();
            if (conf && conf.defines) {
                conf.defines.forEach(define => result.push(new vscode.TreeItem(define)));
            }
        }
        return Promise.resolve(result);
    }
}

export function registerCmd(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('kstm32.cdefs.add', define => {
        if (define) {
            let conf = config.getConfig();
            if (conf) {
                if (!conf.defines) {
                    conf.defines = [];
                }
                config.myArrayAdd(conf.defines, define);
                config.saveConfig(conf);
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
            let conf = config.getConfig();
            if (conf && conf.defines) {
                config.myArrayDel(conf.defines, define.label);
                config.saveConfig(conf);
                vscode.commands.executeCommand('kstm32.refresh');
            }
        }
    }));
}