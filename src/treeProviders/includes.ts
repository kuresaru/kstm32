import * as vscode from 'vscode';
import * as tpTemplate from './tpTemplate';
import * as config from '../config/projectConfig';
import * as kstm32_i from '../extension';
import * as stdperiph_i from '../treeProviders/stdperiph';

type IncludeType = 'auto' | 'included' | 'excluded';

export class Provider extends tpTemplate.tpTemplate<Item> {

    public includes_buffer: string[] = [];

    reload(showerr: boolean = true): void {
        let inc_auto: string[] = [];
        let inc_man: string[] = [];
        let exc_man: string[] = [];
        let root: vscode.Uri | undefined = config.getWorkspaceRoot();
        if (root) {
            config.lsRecursion(root.fsPath, '/src').forEach(filename => {
                if (filename.endsWith('.h') || filename.endsWith('.H')) {
                    config.myArrayAdd(inc_auto, filename.substring(0, filename.lastIndexOf('/')));
                }
            });
        }
        let stdperiph: string[] = kstm32_i.stdperiph.getEnabled();
        if (stdperiph.length > 0) {
            config.myArrayAdd(inc_auto, `${(stdperiph_i.getLibPath() || {}).stdperiph}/inc`.replace(/\\/g, '/'));
        }
        let conf: config.Kstm32Config | undefined = config.getConfig();
        if (conf) {
            // StdPeriph
            let type: string = conf.type || '';
            let libPath: stdperiph_i.LibPath | undefined = stdperiph_i.getLibPath();
            if (libPath) {
                if (type.startsWith('STM32F103')) {
                    config.myArrayAdd(inc_auto, `${libPath.root}/CMSIS/CM3/CoreSupport`.replace(/\\/g, '/'))
                } else if (type.startsWith('STM32F407')) {
                    config.myArrayAdd(inc_auto, `${libPath.root}/CMSIS/Include`.replace(/\\/g, '/'))
                }
            }
            // Manual Include
            let mInclude: string[] = conf.includes || [];
            mInclude.forEach(mInc => config.myArrayAdd(inc_man, mInc));
            // Manual Exclude
            let mExclude: string[] = conf.excludes || [];
            mExclude.forEach(mExc => {
                config.myArrayDel(inc_auto, mExc);
                config.myArrayDel(inc_man, mExc);
                config.myArrayAdd(exc_man, mExc);
            });
        }

        // 计算结果
        let result: Item[] = [];
        this.includes_buffer = [];
        exc_man.forEach(exc => result.push(new Item(exc, 'excluded')));
        inc_man.forEach(inc => {
            this.includes_buffer.push(inc);
            result.push(new Item(inc, 'included'));
        })
        inc_auto.forEach(inc => {
            this.includes_buffer.push(inc);
            result.push(new Item(inc, 'auto'));
        });
        this.items = result;
    }
}

export class Item extends vscode.TreeItem {
    public type: IncludeType;

    constructor(label: string, type: IncludeType) {
        super(label);
        this.type = type;
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
export function registerCmd(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('kstm32.cinc.add', inc => {
        if (inc) {
            let conf = config.getConfig();
            if (conf) {
                if (!conf.includes) {
                    conf.includes = [];
                }
                config.myArrayAdd(conf.includes, inc);
                config.saveConfig(conf);
                vscode.commands.executeCommand('kstm32.refresh');
            } else {
                vscode.window.showErrorMessage('添加失败');
            }
        } else {
            vscode.window.showInputBox().then(input => {
                if (input && input.length > 0) {
                    vscode.commands.executeCommand('kstm32.cinc.add', input);
                }
            });
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('kstm32.cinc.remove', inc => {
        if (inc instanceof vscode.TreeItem && inc.label) {
            let conf: config.Kstm32Config | undefined = config.getConfig();
            if (conf) {
                let mInclude: string[] = conf.includes || [];
                let mExclude: string[] = conf.excludes || [];
                if (mExclude.indexOf(inc.label) != -1) {
                    config.myArrayDel(conf.excludes, inc.label);
                } else if (mInclude.indexOf(inc.label) != -1) {
                    config.myArrayDel(conf.includes, inc.label);
                } else {
                    if (!conf.excludes) {
                        conf.excludes = [];
                    }
                    config.myArrayAdd(conf.excludes, inc.label);
                }
                config.saveConfig(conf);
                vscode.commands.executeCommand('kstm32.refresh');
            }
        }
    }));
}
