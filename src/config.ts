import * as vscode from 'vscode';
import * as fs from 'fs';

const CONFIG_FILENAME = '/kstm32.json';

export function getWorkspaceRoot(): vscode.Uri | undefined {
    let workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
        if (workspaceFolders.length == 1) {
            return workspaceFolders[0].uri;
        }
    }
}

export function addInclude(include: string): boolean {
    let uri: vscode.Uri | undefined = getWorkspaceRoot();
    if (uri) {
        uri = vscode.Uri.parse(uri + CONFIG_FILENAME);
        let buffer = fs.readFileSync(uri.fsPath, {encoding: 'UTF-8'});
        let json = JSON.parse(buffer.toString());
        if (!json.includes) {
            json.includes = [];
        }
        for (let i in json.includes) {
            if (json.includes[i] == include) {
                return true;
            }
        }
        json.includes.push(include);
        fs.writeFileSync(uri.fsPath, JSON.stringify(json), {encoding: 'UTF-8'});
        return true;
    }
    return false;
}

export function rmInclude(include: string): boolean {
    let uri: vscode.Uri | undefined = getWorkspaceRoot();
    if (uri) {
        uri = vscode.Uri.parse(uri + CONFIG_FILENAME);
        let buffer = fs.readFileSync(uri.fsPath, {encoding: 'UTF-8'});
        let json = JSON.parse(buffer.toString());
        if (!json.includes) {
            json.includes = [];
        }
        for (let i in json.includes) {
            if (json.includes[i] == include) {
                json.includes.splice(i, 1);
            }
        }
        fs.writeFileSync(uri.fsPath, JSON.stringify(json), {encoding: 'UTF-8'});
        return true;
    }
    return false;
}