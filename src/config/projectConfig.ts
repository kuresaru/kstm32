import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path_i from 'path';

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
 * 取文件扩展名
 * @param filename 文件名
 * @returns 扩展名的点加小写字母, 或不存在
 */
export function getFileExtName(filename: string): string | undefined {
    let extIdx = filename.lastIndexOf('.');
    if (extIdx > 0) {
        let ext = filename.substring(extIdx);
        return ext.toLowerCase();
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
            // 取状态
            let stat = fs.statSync(basePath + '/' + subPath + '/' + filename);
            if (stat.isFile() && filter(filename)) {
                // 是文件 保存到结果
                if (filter(filename)) {
                    result.push(`${subPath}/${filename}`.substring(1));
                }
            } else if (stat.isDirectory()) {
                // 是目录 递归
                lsRecursion(basePath, `${subPath}/${filename}`, filter).forEach(_name => result.push(_name));
            }
        }
    });
    return result;
}

export type LsResult = {
    name: string,
    folder: boolean
};

/**
 * 列目录内容 返回对象
 * @param basePath eg: /test
 * @param subPath eg: /dir
 * @param filter 判断回调 true为接受文件, 回调不存在默认为true
 */
export function lsObject(path: string, filter: (filename: string) => boolean = (f) => true): LsResult[] | undefined {
    // 判断存在
    if (fs.existsSync(path)) {
        // 判断是目录
        let stat = fs.statSync(path);
        if (stat.isDirectory()) {
            let result: LsResult[] = [];
            // 读取目录
            let dir = fs.readdirSync(path);
            dir.forEach(file => {
                // 处理文件
                if (filter(file)) {
                    stat = fs.statSync(`${path}/${file}`);
                    if (stat.isDirectory()) {
                        result.push({
                            name: file,
                            folder: true
                        });
                    } else if (stat.isFile()) {
                        result.push({
                            name: file,
                            folder: false
                        });
                    } else if (stat.isSymbolicLink) {
                        // TODO: Symlink
                    }
                }
            });
            return result;
        }
    }
    return undefined;
}

/**
 * 把绝对路径转换成相对当前打开目录的相对路径
 * @param src 绝对路径
 */
export function tryToRelativePath(src: string): string {
    let root = getWorkspaceRoot();
    if (root) {
        let rel = path_i.relative(root.fsPath, src);
        if (!rel.startsWith('..')) {
            return rel;
        }
    }
    return src;
}

/**
 * 把相对路径转换成绝对路径
 * @param src 相对路径
 */
export function toAbsolutePath(src: string): string {
    let root = getWorkspaceRoot();
    if (root && !path_i.isAbsolute(src)) {
        return path_i.join(root.fsPath, src);
    }
    return src;
}