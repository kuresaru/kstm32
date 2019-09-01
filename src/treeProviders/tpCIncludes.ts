import * as vscode from 'vscode';
import * as tpTemplate from './tpTemplate';

export class TPCIncludes extends tpTemplate.tpTemplate<vscode.TreeItem>{
    getChildren(element?: vscode.TreeItem) {
        let result: vscode.TreeItem[] = [];
        //root
        if (!element) {
            let cSources: string[] | undefined = vscode.workspace.getConfiguration('kstm32').get('cincludes');
            if (!cSources) {
                cSources = [];
            }
            cSources.forEach(element => result.push(new vscode.TreeItem(element)));
        }
        return Promise.resolve(result);
    }
}
