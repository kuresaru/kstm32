import * as vscode from 'vscode';
import * as tpTemplate from './tpTemplate';
import * as config from '../projectConfig';
import * as kstm32_i from '../extension';
import * as stdperiph_i from './stdperiph';
import * as fs from 'fs';
import * as path_i from 'path';

type SourceType = 'auto' | 'included' | 'excluded' | 'projectDir' | 'otherDir';

export class Provider extends tpTemplate.tpTemplate<Item> {

    public sources: string[] = [];
    public asms: string[] = [];

    reload(): void {
        const srcExts: string[] = ['.c', '.s'];
        let root = config.getWorkspaceRoot();
        let conf = config.getConfig();
        if (root && conf) {
            let srcExc: string[] = conf.sourceExcludes || [];
            let srcInc: string[] = conf.sourceIncludes || [];
            // 自动检测src目录中的源文件
            let source = config.lsRecursion(root.fsPath, '/src', filename => srcExts.indexOf(config.getFileExtName(filename)) != -1);
            // stdp
            let stdperiph: string[] = kstm32_i.stdperiph.getEnabled();
            let lib = stdperiph_i.getLibPath();
            if (lib) {
                stdperiph.forEach(name => config.myArrayAdd(source, `${lib.stdperiph}/src/${name}`.replace(/\\/g, '/')));
                let type = (config.getConfig() || {}).type || '';
                if (type.startsWith('STM32F103')) {
                    config.myArrayAdd(source, `${lib.root}/CMSIS/CM3/CoreSupport/core_cm3.c`.replace(/\\/g, '/'));
                }
            }
            // 排除需要排除的文件
            srcExc.forEach(exc => {
                config.myArrayDel(srcInc, exc);
                config.myArrayDel(source, exc);
            });
            // 手动添加的文件
            srcInc.forEach(src => config.myArrayAdd(source, src));

            // 整理给Makefile
            this.sources = [];
            this.asms = [];
            source.forEach(src => {
                if (config.getFileExtName(src) == '.c') {
                    config.myArrayAdd(this.sources, src);
                } else if (config.getFileExtName(src) == '.s') {
                    config.myArrayAdd(this.asms, src);
                }
            });
        }
    }

    getChildren(element: Item): Thenable<Item[]> {
        if (!this.items) {
            this.reload();
        }
        let root = config.getWorkspaceRoot();
        let conf = config.getConfig();
        if (root && conf) {
            if (!element) {
                // 根列表
                return Promise.resolve([
                    new Item('工程目录', undefined, undefined, true, 'projectDir'),
                    new Item('其它路径', undefined, undefined, true, 'otherDir')
                ]);
            } else {
                const srcExts: string[] = ['.c', '.s'];
                let result: Item[] = [];
                let srcExc: string[] = conf.sourceExcludes || [];
                let srcInc: string[] = conf.sourceIncludes || [];
                if (element.type == 'projectDir') {
                    // src目录
                    let path = `${root.fsPath}/src`;
                    if (fs.existsSync(path) && fs.statSync(path).isDirectory()) {
                        result.push(new Item("src", path, undefined, true, 'auto'));
                    }
                    // 自定义
                    srcInc.forEach(inc => {
                        path = `${root.fsPath}/${inc}`;
                        if ((!path_i.isAbsolute(inc)) && (!inc.startsWith('..')) && fs.existsSync(path)) {
                            let isDir = fs.statSync(path).isDirectory();
                            let baseName = path_i.basename(inc);
                            if (isDir || (srcExts.indexOf(config.getFileExtName(baseName)) != -1)) {
                                result.push(new Item(baseName, path, undefined, isDir, 'included'));
                            }
                        }
                    });
                } else if (element.type == 'otherDir') {
                    // 手动加入的文件
                } else {
                    // 某列表的子列表
                    let path = element.path;
                    if (path) {
                        let dir = config.lsObject(path);
                        if (dir) {
                            dir.forEach(src => {
                                let isDir = src.folder;
                                if (isDir || (srcExts.indexOf(config.getFileExtName(src.name)) != -1)) {
                                    let srcPath = `${path}/${src.name}`;
                                    let relPath = config.toRelativePath(srcPath).replace(/\\/g, '/');
                                    let srcType: SourceType = 'auto';
                                    if (srcExc.indexOf(relPath) != -1)
                                        srcType = 'excluded';
                                    else if (srcInc.indexOf(relPath) != -1)
                                        srcType = 'included';
                                    result.push(new Item(src.name, srcPath, element, src.folder, srcType));
                                }
                            });
                        }
                    }
                }
                return Promise.resolve(result);
            }
        }
        return Promise.resolve([]);
    }
}

class Item extends vscode.TreeItem {
    constructor(
        label: string, // 目录或文件的名字
        public path: string | undefined,    // 它自己的绝对路径
        public father: Item | undefined,    // 父元素
        public folder: boolean,             // 是否是目录
        public type: SourceType = 'auto'    // 类型
    ) {
        super(label);
        this.collapsibleState = this.getCollapsibleState();
    }

    getCollapsibleState(): vscode.TreeItemCollapsibleState {
        if (this.type == 'projectDir' || this.type == 'otherDir' || this.folder) {
            return vscode.TreeItemCollapsibleState.Collapsed;
        }
        return vscode.TreeItemCollapsibleState.None;
    }

    get description(): string | false {
        switch (this.type) {
            case 'included':
                return '[手动]';
            case 'excluded':
                return '[已排除]'
        }
        return false;
    }
}

function addSrc(folder: boolean) {
    let root: vscode.Uri | undefined = config.getWorkspaceRoot();
    let conf = config.getConfig();
    if (root && conf) {
        if (!conf.sourceIncludes) {
            conf.sourceIncludes = [];
        }
        vscode.window.showOpenDialog({
            defaultUri: root,
            canSelectFiles: !folder,
            canSelectFolders: folder,
            canSelectMany: true
        }).then(uris => {
            uris.forEach(uri => {
                if (uri.scheme == 'file') {
                    let file: string = config.toRelativePath(uri.fsPath).replace(/\\/g, '/');
                    // 保证不是本身
                    if (file.length > 0) {
                        // 路径有效
                        config.myArrayAdd(conf.sourceIncludes, file);
                    } else {
                        vscode.window.showWarningMessage("不能添加工程目录本身.");
                    }
                }
            });
            config.saveConfig(conf);
            vscode.commands.executeCommand("kstm32.refresh");
        });
    } else {
        vscode.window.showErrorMessage('添加失败');
    }
}

export function registerCmd(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('kstm32.source.add.file', () => addSrc(false)));
    context.subscriptions.push(vscode.commands.registerCommand('kstm32.source.add.dir', () => addSrc(true)));
    context.subscriptions.push(vscode.commands.registerCommand('kstm32.source.remove', src => {
        if (src instanceof Item && src.path) {
            let path: string = config.toRelativePath(src.path).replace(/\\/g, '/');
            let conf = config.getConfig();
            let root = config.getWorkspaceRoot();
            if (conf && root) {
                let inc = conf.sourceIncludes || [];
                let exc = conf.sourceExcludes || [];
                if (exc.indexOf(path) != -1) {
                    config.myArrayDel(conf.sourceExcludes, path);
                } else if (inc.indexOf(path) != -1) {
                    config.myArrayDel(conf.sourceIncludes, path);
                } else {
                    if (!conf.sourceExcludes) {
                        conf.sourceExcludes = [];
                    }
                    config.myArrayAdd(conf.sourceExcludes, path);
                }
                config.saveConfig(conf);
                vscode.commands.executeCommand('kstm32.refresh');
            }
        }
    }));
}
