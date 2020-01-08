import * as vscode from 'vscode';
import * as tpTemplate from './tpTemplate';
import * as config from '../projectConfig';
import * as kstm32_i from '../extension';
import * as stdperiph_i from '../treeProviders/stdperiph';

type IncludeType = 'auto' | 'included' | 'excluded';

export class Provider extends tpTemplate.tpTemplate<Item> {

    public includes_buffer: string[] = [];

    reload(showerr: boolean = true): void {
        let inc_auto: string[] = [];
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
            let type: string = conf.type || '';
            let libPath: stdperiph_i.LibPath = stdperiph_i.getLibPath();
            if (type.startsWith('STM32F103')) {
                config.myArrayAdd(inc_auto, `${(libPath || {}).root}/CMSIS/CM3/CoreSupport`.replace(/\\/g, '/'))
            } else if (type.startsWith('STM32F407')) {
                config.myArrayAdd(inc_auto, `${(libPath || {}).root}/CMSIS/Include`.replace(/\\/g, '/'))
            }
        }

        let result: Item[] = [];
        this.includes_buffer = [];
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
}
