import * as vscode from 'vscode';
import * as fs from 'fs';
import * as config from '../config';

export class TPStdPeriph implements vscode.TreeDataProvider<vscode.TreeItem> {

    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined> = new vscode.EventEmitter<vscode.TreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }
    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        if (!element) {
            let kstm32conf: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('kstm32');
            let conf = config.getConfig() || {};
            if (conf.type) {
                let libPath: LibPath | undefined = getLibPath(kstm32conf, conf);
                if (libPath) {
                    let srcPath = `${libPath.stdperiph}/src`
                    if (fs.existsSync(srcPath) && fs.statSync(srcPath).isDirectory()) {
                        let result: vscode.TreeItem[] = [];
                        fs.readdirSync(srcPath).forEach(filename => {
                            if (filename.endsWith('.c') || filename.endsWith('.C')) {
                                result.push(new ItemTpStdPeriph(filename));
                            }
                        })
                        return Promise.resolve(result);
                    } else {
                        return Promise.resolve([new vscode.TreeItem(`错误的类型或插件设置`)]);
                    }
                } else {
                    return Promise.resolve([new vscode.TreeItem(`未知的项目类型或错误的插件设置`)]);
                }
            } else {
                return Promise.resolve([new vscode.TreeItem(`未知的项目类型`)]);
            }
        }
        return Promise.resolve([]);
    }
}

class ItemTpStdPeriph extends vscode.TreeItem {
    filename: string;
    constructor(filename: string) {
        super(filename.substring(0, filename.length - 2));
        this.filename = filename;
    }
    get description(): string {
        let conf: config.Kstm32Config | undefined = config.getConfig();
        if (conf) {
            let useLib: string[] = conf.useLib || [];
            let index = useLib.indexOf(this.filename);
            if (index != -1) {
                return '[已启用]'
            }
        }
        return '';
    }
}

export type LibPath = {
    root: string;
    stdperiph: string;
}

export function getLibPath(kstm32cfg: vscode.WorkspaceConfiguration, cfg: config.Kstm32Config): LibPath | undefined {
    let type: string | undefined = cfg.type;
    let libPath: string | undefined;
    let result: LibPath | undefined;
    if (type) {
        if (type.match(/STM32F10.*/)) {
            libPath = kstm32cfg.get('libs.STM32F10xStdPeriph');
            if (libPath) {
                result = {
                    root: libPath,
                    stdperiph: `${libPath}/STM32F10x_StdPeriph_Driver`
                };
            }
        } else if (type.match(/STM32F4.*/)) {
            libPath = kstm32cfg.get('libs.STM32F4xxStdPeriph');
            if (libPath) {
                result = {
                    root: libPath,
                    stdperiph: `${libPath}/STM32F4xx_StdPeriph_Driver`
                };
            }
        }
    }
    return result;
}

export function registerCmd(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('kstm32.toggleuselib', (libname) => {
        if (libname instanceof ItemTpStdPeriph) {
            let conf: config.Kstm32Config | undefined = config.getConfig();
            if (conf) {
                let useLib: string[] = conf.useLib || [];
                let index = useLib.indexOf(libname.filename);
                if (index == -1) {
                    useLib.push(libname.filename);
                } else {
                    config.myArrayDel(useLib, libname.filename);
                }
                conf.useLib = useLib;
                config.saveConfig(conf);
                vscode.commands.executeCommand('kstm32.refresh');
            }
        }
    }));
}
