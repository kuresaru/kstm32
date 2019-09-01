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

export function register(): TPStdPeriph {
    let result = new TPStdPeriph();
    vscode.window.registerTreeDataProvider('kstm32.stdperiph', result);
    return result;
}
