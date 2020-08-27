import * as vscode from 'vscode';
import * as tpTemplate from './tpTemplate';
import * as config from '../config/projectConfig';

type DefineType = 'auto' | 'manual';

export class Provider extends tpTemplate.tpTemplate<Item> {

    public defines_buffer: string[] = [];

    reload(showerr: boolean = true) {
        let defines_manual: string[] = [];
        let defines_auto: string[] = [];
        let conf = config.getConfig();
        if (conf) {
            (conf.defines || []).forEach(define => defines_manual.push(define));
            let uselib: string[] = conf.useLib || [];
            if (uselib.length > 0) {
                defines_auto.push('USE_STDPERIPH_DRIVER');
            }
            let type: string | undefined = conf.type;
            if (type) {
                let type_s = type.substr(10, 11);
                if (type.startsWith('STM32F10')) {
                    if (type_s == '8') {
                        defines_auto.push('STM32F10X_MD');
                    } else if (type_s == 'C') {
                        defines_auto.push('STM32F10X_HD');
                    }
                } else if (type.startsWith('STM32F407')) {
                    defines_auto.push('STM32F40_41xxx');
                }
            }
        }
        let result: Item[] = [];
        this.defines_buffer = [];
        defines_manual.forEach(define => {
            this.defines_buffer.push(define);
            result.push(new Item(define, 'manual'));
        });
        defines_auto.forEach(define => {
            this.defines_buffer.push(define);
            result.push(new Item(define, 'auto'));
        });
        this.items = result;
    }
}

export class Item extends vscode.TreeItem {
    public type: DefineType;

    constructor(label: string, type: DefineType) {
        super(label);
        this.type = type;
    }
}

export function registerCmd(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('kstm32.cdefs.add', define => {
        if (define) {
            let conf = config.getConfig();
            if (conf) {
                if (!conf.defines) {
                    conf.defines = [];
                }
                config.myArrayAdd(conf.defines, define);
                config.saveConfig(conf);
                vscode.commands.executeCommand('kstm32.refresh');
            } else {
                vscode.window.showErrorMessage('添加失败');
            }
        } else {
            vscode.window.showInputBox().then(input => {
                if (input && input.length > 0) {
                    vscode.commands.executeCommand('kstm32.cdefs.add', input);
                }
            });
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('kstm32.cdefs.remove', define => {
        if (define instanceof vscode.TreeItem && define.label) {
            let conf = config.getConfig();
            if (conf && conf.defines) {
                config.myArrayDel(conf.defines, define.label);
                config.saveConfig(conf);
                vscode.commands.executeCommand('kstm32.refresh');
            }
        }
    }));
}