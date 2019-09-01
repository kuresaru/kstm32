import * as vscode from 'vscode';
import * as fs from 'fs';
// import * as path from 'path';

export class TPStdPeriph implements vscode.TreeDataProvider<vscode.TreeItem> {

    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined> = new vscode.EventEmitter<vscode.TreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }
    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        if (!element) {
            let stdPeriph = vscode.Uri.file(vscode.workspace.getConfiguration('kstm32.libs').get('STM32f10xStdPeriph') + '/STM32F10x_StdPeriph_Driver/src').fsPath;
            if (fs.existsSync(stdPeriph) && fs.statSync(stdPeriph).isDirectory()) {
                let result: vscode.TreeItem[] = [];
                fs.readdirSync(stdPeriph).forEach(filename => {
                    if (filename.endsWith('.c')) {
                        let name = filename.substr(0, filename.length - 2);
                        // result.push(filename.substr(0, filename.length - 2));
                        result.push(new ItemTpStdPeriph(name));
                    }
                });
                return Promise.resolve(result);
            } else {
                return Promise.resolve([new vscode.TreeItem('Invalid StdPeriphLibrary Path')]);
            }
        }
        return Promise.resolve([]);
    }
}

class ItemTpStdPeriph extends vscode.TreeItem {
    constructor(label: string) {
        super(label);
    }
    get description(): string {
        let cfg: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('kstm32');
        let useLib: string[] | undefined = cfg.get('useLib');
        if (!useLib) {
            return '';
        } else if (this.label) {
            if ((<string[]>useLib).indexOf(this.label) != -1) {
                return '[已启用]'
            }
        }
        return '';
    }
}

export function registerCmd(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('kstm32.toggleuselib', (libname) => {
        if (libname instanceof vscode.TreeItem && libname.label) {
            let cfg: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('kstm32');
            let useLib: string[] | undefined = cfg.get('useLib');
            if (!useLib) {
                useLib = [];
            }
            let index = (<string[]>useLib).indexOf(libname.label);
            if (index != -1) {
                useLib.splice(index, 1);
            } else {
                useLib.push(libname.label);
            }
            cfg.update('useLib', useLib, vscode.ConfigurationTarget.Workspace);
            vscode.commands.executeCommand('kstm32.refresh');
        }
    }));
}
