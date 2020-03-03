import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';

const CONFIG_FILENAME = '/kstm32.json';

export type Kstm32Config = {
    name?: string;
    type?: string;
    includes?: string[];
    excludes?: string[];
    defines?: string[];
    useLib?: string[];
    // TODO 外部资源导入 排除项目资源
    sourceExcludes?: string[];
    sourceIncludes?: string[];
    debugger?: string;
    fromLibVer?: number;
};

export function getWorkspaceRoot(): vscode.Uri | undefined {
    let workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
        if (workspaceFolders.length == 1) {
            return workspaceFolders[0].uri;
        }
    }
    return undefined;
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
    return undefined;
}

export function saveConfig(config: Kstm32Config) {
    let uri: vscode.Uri | undefined = getWorkspaceRoot();
    if (uri) {
        uri = vscode.Uri.parse(uri + CONFIG_FILENAME);
        fs.writeFileSync(uri.fsPath, JSON.stringify(config), { encoding: 'UTF-8' });
    }
}

/**
 * 数据加入元素, 保证数组元素不重复
 * @param array 数组
 * @param item 元素
 */
export function myArrayAdd(array: any[], item: any) {
    for (let i in array) {
        if (array[i] == item) {
            return;
        }
    }
    array.push(item);
}

/**
 * 删除数据中指定的元素
 * @param array 数组
 * @param item 元素
 */
export function myArrayDel(array: any[], item: any) {
    if (array) {
        let index = array.indexOf(item);
        while (index != -1) {
            array.splice(index, 1);
            index = array.indexOf(item);
        }
    }
}

export function isWindows(): boolean {
    return os.platform() == 'win32';
}

export function getExePath(name: string): string | undefined {
    let syspath: string | undefined = process.env['PATH'];
    if (syspath) {
        let win = isWindows();
        let splitSym = win ? ';' : ':';
        let ext = win ? '.exe' : '';
        let split: string[] = syspath.split(splitSym);
        for (let pdsi in split) {
            let pds = split[pdsi];
            if (fs.existsSync(pds) && fs.statSync(pds).isDirectory()) {
                let contents: string[] = fs.readdirSync(pds);
                for (let pdi in contents) {
                    let pd = contents[pdi];
                    if (pd == `${name}${ext}`) {
                        return pds;
                    }
                }
            }
        }
    }
    return undefined;
}

/**
 * 递归列目录内容
 */
export function lsRecursion(basePath: string, subPath?: string, filter: (filename: string) => boolean = (f) => true): string[] {
    let result: string[] = [];
    fs.readdirSync(`${basePath}${subPath}`).forEach(filename => {
        if (filename != '.vscode') {
            let stat = fs.statSync(basePath + '/' + subPath + '/' + filename);
            let r = (subPath + '/' + filename).substring(1);
            if (stat.isFile() && filter(filename)) {
                result.push(r);
            } else if (stat.isDirectory()) {
                lsRecursion(basePath, subPath + '/' + filename, filter).forEach(_name => {
                    result.push(_name);
                });
            }
        }
    });
    return result;
}

/**
 * 递归列目录内容 返回对象
 * 键是文件或目录名 值为目录内容
 * 如果键是文件 值是null
 */
export function lsRecursionObject(basePath: string, subPath: string, filter: (filename: string) => boolean): object | string {
    let root = `${basePath}${subPath}`;
    if (fs.existsSync(root)) {
        let stat = fs.statSync(root);
        if (stat.isDirectory()) {
            let content = {};
            fs.readdirSync(root).forEach(filename => {
                let obj = lsRecursionObject(root, `/${filename}`, filter);
                if (typeof obj != 'string') {
                    content[filename] = obj;
                }
            });
            return content;
        } else if (stat.isFile()) {
            return ((!filter) || filter(subPath.substring(1))) ? null : '';
        }
    }
    return '';
}