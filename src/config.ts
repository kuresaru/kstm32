import * as vscode from 'vscode';
import * as fs from 'fs';

const CONFIG_FILENAME = '/kstm32.json';

export type Kstm32Config = {
    name?: string;
    type?: string;
    includes?: string[];
    defines?: string[];
    useLib?: string[];
    // TODO 外部资源导入 排除项目资源
    sourceExcludes?: string[];
    sourceIncludes?: string[];
};

export function getWorkspaceRoot(): vscode.Uri | undefined {
    let workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
        if (workspaceFolders.length == 1) {
            return workspaceFolders[0].uri;
        }
    }
}

export function getConfig(): Kstm32Config | undefined {
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

export function saveConfig(config: Kstm32Config) {
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

export function myArrayDel(array: any, item: any) {
    if (array) {
        let index = array.indexOf(item);
        while (index != -1) {
            array.splice(index, 1);
            index = array.indexOf(item);
        }
    }
}
