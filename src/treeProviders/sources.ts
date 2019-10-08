import * as vscode from 'vscode';
import * as tpTemplate from './tpTemplate';
import * as config from '../config';

export class TPCSources extends tpTemplate.tpTemplate<vscode.TreeItem> {
    getChildren(element: vscode.TreeItem) {
        let result: vscode.TreeItem[] = [];
        if (!element) {
            let conf = config.getConfig();
            if (conf && conf.sources) {
                conf.sources.forEach(element => result.push(new vscode.TreeItem(element)));
            }
        }
        return Promise.resolve(result);
    }
}
