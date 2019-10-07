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

function getConfig(): any | undefined {
    let uri: vscode.Uri | undefined = getWorkspaceRoot();
    if (uri) {
        uri = vscode.Uri.parse(uri + CONFIG_FILENAME);
        let buffer = fs.readFileSync(uri.fsPath, { encoding: 'UTF-8' });
        let json = JSON.parse(buffer.toString());
        return json;
    }
}

function saveConfig(config: any) {
    let uri: vscode.Uri | undefined = getWorkspaceRoot();
    if (uri) {
        uri = vscode.Uri.parse(uri + CONFIG_FILENAME);
        fs.writeFileSync(uri.fsPath, JSON.stringify(config), { encoding: 'UTF-8' });
    }
}

export function addInclude(include: string): boolean {
    let config = getConfig();
    if (config) {
        if (!config.includes) {
            config.includes = [];
        }
        for (let i in config.includes) {
            if (config.includes[i] == include) {
                return true;
            }
        }
        config.includes.push(include);
        saveConfig(config);
        return true;
    }
    return false;
}

export function rmInclude(include: string): boolean {
    let config = getConfig();
    if (config) {
        if (!config.includes) {
            return true;
        }
        for (let i in config.includes) {
            if (config.includes[i] == include) {
                config.includes.splice(i, 1);
            }
        }
        saveConfig(config);
        return true;
    }
    return false;
}

export function getInclude(): string[] {
    let config = getConfig();
    if (config) {
        if (config.includes) {
            return config.includes;
        }
    }
    return [];
}