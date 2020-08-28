import * as vscode from 'vscode';
import * as fs from 'fs';
import * as config from '../config/projectConfig';
import { tpTemplate } from './tpTemplate';

export class Provider extends tpTemplate<Item> {

    private enabled: string[] = [];

    reload(showerr: boolean = true): void {
        this.items = undefined;
        this.enabled = [];
        let conf = config.getConfig() || {};
        if (conf.type) {
            let libPath: LibPath | undefined = getLibPath();
            if (libPath) {
                let srcPath = `${libPath.stdperiph}/src`
                if (fs.existsSync(srcPath) && fs.statSync(srcPath).isDirectory()) {
                    this.items = [];
                    this.enabled = conf.useLib || [];
                    fs.readdirSync(srcPath).forEach(filename => {
                        if (filename.endsWith('.c') || filename.endsWith('.C')) {
                            this.items.push(new Item(filename, this.enabled.indexOf(filename) != -1));
                        }
                    });
                    return;
                }
            }
            if (showerr) {
                vscode.window.showWarningMessage('无法找到项目对应的标准库');
            }
        } else {
            if (showerr) {
                vscode.window.showErrorMessage('未知的项目类型');
            }
        }
    }
    getEnabled(): string[] {
        if (!this.items) {
            this.refresh();
        }
        return this.enabled;
    }
}

class Item extends vscode.TreeItem {
    filename: string;
    enabled: boolean;
    constructor(filename: string, enabled: boolean) {
        super(filename.substring(0, filename.length - 2));
        this.filename = filename;
        this.enabled = enabled;
    }
    get description(): string {
        return this.enabled ? '[已启用]' : '';
    }
    get command(): vscode.Command {
        return {
            title: this.label,
            command: 'kstm32.toggleuselib',
            arguments: [this]
        };
    }
}

export type LibPath = {
    root: string;
    stdperiph: string;
}

export function getLibPath(): LibPath | undefined {
    let kstm32cfg: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('kstm32');
    let cfg: config.Kstm32Config = config.getConfig() || {};
    let type: string | undefined = cfg.type;
    let libPath: string | undefined;
    let result: LibPath | undefined;
    if (type) {
        if (type.match(/STM32F10.*/)) {
            libPath = kstm32cfg.get('libs.STM32F10xStdPeriph');
            if (libPath && fs.existsSync(libPath) && fs.statSync(libPath).isDirectory()) {
                result = {
                    root: libPath,
                    stdperiph: `${libPath}/STM32F10x_StdPeriph_Driver`
                };
            } else {
                vscode.window.showWarningMessage('错误的库路径配置');
            }
        } else if (type.match(/STM32F4.*/)) {
            libPath = kstm32cfg.get('libs.STM32F4xxStdPeriph');
            if (libPath && fs.existsSync(libPath) && fs.statSync(libPath).isDirectory()) {
                result = {
                    root: libPath,
                    stdperiph: `${libPath}/STM32F4xx_StdPeriph_Driver`
                };
            } else {
                vscode.window.showWarningMessage('错误的库路径配置');
            }
        }
    }
    return result;
}

export function registerCmd(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('kstm32.toggleuselib', (libname) => {
        if (libname instanceof Item) {
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
