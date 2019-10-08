import * as vscode from 'vscode';
import * as tpTemplate from './tpTemplate';
import * as config from '../config'

export class TPCIncludes extends tpTemplate.tpTemplate<vscode.TreeItem>{
    getChildren(element?: vscode.TreeItem) {
        let result: vscode.TreeItem[] = [];
        //root
        if (!element) {
            let conf = config.getConfig();
            if (conf && conf.includes) {
                conf.includes.forEach(element => result.push(new vscode.TreeItem(element)));
            }
        }
        return Promise.resolve(result);
    }
}
