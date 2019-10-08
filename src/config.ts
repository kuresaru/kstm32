import * as vscode from 'vscode';
import * as fs from 'fs';

const CONFIG_FILENAME = '/kstm32.json';

type Kstm32Config = {
    includes?: string[];
    defines?: string[];
    sources?: string[];
};

export function getWorkspaceRoot(): vscode.Uri | undefined {
    let workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
        if (workspaceFolders.length == 1) {
            return workspaceFolders[0].uri;
        }
    }
}

function getConfig(): Kstm32Config | undefined {
    let uri: vscode.Uri | undefined = getWorkspaceRoot();
    if (uri) {
        uri = vscode.Uri.parse(uri + CONFIG_FILENAME);
        let buffer: string;
        try {
            buffer = fs.readFileSync(uri.fsPath, { encoding: 'UTF-8' }).toString();
        } catch {
            buffer = '{}';
        }
        try {
            let json = JSON.parse(buffer);
            return json;
        } catch {
            vscode.window.showErrorMessage('读取配置文件失败');
        }
    }
}

function saveConfig(config: Kstm32Config) {
    let uri: vscode.Uri | undefined = getWorkspaceRoot();
    if (uri) {
        uri = vscode.Uri.parse(uri + CONFIG_FILENAME);
        fs.writeFileSync(uri.fsPath, JSON.stringify(config), { encoding: 'UTF-8' });
    }
}

export function myArrayAdd(array: any, item: any) {
    for (let i in array) {
        if (array[i] == item) {
            return;
        }
    }
    array.push(item);
}

function myArrayDel(array: any, item: any) {
    if (array) {
        let index = array.indexOf(item);
        while (index != -1) {
            array.splice(index, 1);
            index = array.indexOf(item);
        }
    }
}

export function addInclude(include: string): boolean {
    let config = getConfig();
    if (config) {
        if (!config.includes) {
            config.includes = [];
        }
        myArrayAdd(config.includes, include);
        saveConfig(config);
        return true;
    }
    return false;
}

export function rmInclude(include: string): boolean {
    let config = getConfig();
    if (config) {
        myArrayDel(config.includes, include);
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

export function addDefine(define: string): boolean {
    let config = getConfig();
    if (config) {
        if (!config.defines) {
            config.defines = [];
        }
        myArrayAdd(config.defines, define);
        saveConfig(config);
        return true;
    }
    return false;
}

export function rmDefine(define: string): boolean {
    let config = getConfig();
    if (config) {
        myArrayDel(config.defines, define);
        saveConfig(config);
        return true;
    }
    return false;
}

export function getDefine(): string[] {
    let config = getConfig();
    if (config) {
        if (config.defines) {
            return config.defines;
        }
    }
    return [];
}

export function addSource(source: string): boolean {
    let config = getConfig();
    if (config) {
        if (!config.sources) {
            config.sources = [];
        }
        myArrayAdd(config.sources, source);
        saveConfig(config);
        return true;
    }
    return false;
}

export function rmSource(source: string): boolean {
    let config = getConfig();
    if (config) {
        myArrayDel(config.sources, source);
        saveConfig(config);
        return true;
    }
    return false;
}

export function getSource(): string[] {
    let config = getConfig();
    if (config) {
        if (config.sources) {
            return config.sources;
        }
    }
    return [];
}
