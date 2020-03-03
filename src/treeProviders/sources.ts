import * as vscode from 'vscode';
import * as tpTemplate from './tpTemplate';
import * as config from '../projectConfig';
import * as kstm32_i from '../extension';
import * as stdperiph_i from './stdperiph';

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
        if (!element) {
            // 根列表
            let root = config.getWorkspaceRoot();
            let conf = config.getConfig();
            if (root && conf) {
                let projDir: vscode.Uri[] = [];
                let otherDir: vscode.Uri[] = [];
                return Promise.resolve([
                    new Item('默认', undefined, undefined, projDir, 'projectDir'),
                    new Item('其它', undefined, undefined, otherDir, 'otherDir')
                ]);
            }
        } else {
            // 某列表的子列表
            let content = element.content;
            if (content) {
                // TODO: subdir
            }
        }
        return Promise.resolve([]);
    }
}

class Item extends vscode.TreeItem {
    constructor(
        label: string,
        public path: string | undefined,
        public father: Item | undefined,
        public content: vscode.Uri[] | undefined,
        public type: SourceType = 'auto'
    ) {
        super(label);
        this.collapsibleState = this.getCollapsibleState();
    }

    getCollapsibleState(): vscode.TreeItemCollapsibleState {
        if (this.type == 'projectDir' || this.type == 'otherDir' || this.content) {
            return vscode.TreeItemCollapsibleState.Collapsed;
        }
        return vscode.TreeItemCollapsibleState.None;
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
                    let file: string = uri.fsPath;
                    // 如果是工程目录里的, 转换成相对路径
                    if (file.startsWith(root.fsPath)) {
                        file = file.substring(root.fsPath.length + 1);
                    }
                    file = file.replace(/\\/g, '/');
                    // 保证不是本身
                    if (file.length > 0) {
                        // 路径有效
                        // console.log(file);
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
        if (src instanceof vscode.TreeItem && src.label) {
            let file: string = src.label;
            let conf = config.getConfig();
            if (conf) {
                let inc = conf.sourceIncludes || [];
                let exc = conf.sourceExcludes || [];
                if (exc.indexOf(file) != -1) {
                    config.myArrayDel(conf.sourceExcludes, file);
                } else if (inc.indexOf(file) != -1) {
                    config.myArrayDel(conf.sourceIncludes, file);
                } else {
                    if (!conf.sourceExcludes) {
                        conf.sourceExcludes = [];
                    }
                    config.myArrayAdd(conf.sourceExcludes, file);
                }
                config.saveConfig(conf);
                vscode.commands.executeCommand('kstm32.refresh');
            }
        }
    }));
}
