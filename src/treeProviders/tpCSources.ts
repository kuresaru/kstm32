import * as vscode from 'vscode';
import * as tpTemplate from './tpTemplate';

export class TPCSources extends tpTemplate.tpTemplate<vscode.TreeItem> {
    getChildren(element: vscode.TreeItem) {
        let result: vscode.TreeItem[] = [];
        if (!element) {
            let cSources: string[] | undefined = vscode.workspace.getConfiguration('kstm32').get('csources');
            if (!cSources) {
                cSources = [];
            }
            cSources.forEach(element => result.push(new vscode.TreeItem(element)));
        }
        return Promise.resolve(result);
    }
}
