import * as vscode from 'vscode';
import * as tpTemplate from './tpTemplate';
import * as config from '../config';
import * as kstm32_i from '../extension';
import * as stdperiph_i from './stdperiph';

export class Provider implements vscode.TreeDataProvider<Item> {

    private _onDidChangeTreeData: vscode.EventEmitter<Item | undefined> = new vscode.EventEmitter<Item | undefined>();
    readonly onDidChangeTreeData: vscode.Event<Item | undefined> = this._onDidChangeTreeData.event;

    private sources_project: object;
    // private asm_project: object;

    public sources_buffer: string[] = [];
    public asm_buffer: string[] = [];

    reload(): void {
        this.sources_project = {};
        let root = config.getWorkspaceRoot();
        if (root) {
            // source
            let source = config.lsRecursionObject(root.fsPath, '/src', (filename) => {
                return filename.endsWith('.c') || filename.endsWith('C');
            });
            console.log(source);
            if (typeof source == 'object') {
                this.sources_project = source;
            }
            this.sources_buffer = config.lsRecursion(root.fsPath, '/src', (filename) => {
                return filename.endsWith('.c') || filename.endsWith('C');
            });
            let stdperiph: string[] = kstm32_i.stdperiph.getEnabled();
            let lib = stdperiph_i.getLibPath();
            if (lib) {
                stdperiph.forEach(name => this.sources_buffer.push(`${lib.stdperiph}/src/${name}`.replace(/\\/g, '/')));
                let type = (config.getConfig() || {}).type || '';
                if (type.startsWith('STM32F103')) {
                    this.sources_buffer.push(`${lib.root}/CMSIS/CM3/CoreSupport/core_cm3.c`.replace(/\\/g, '/'));
                }
            }
            // asm
            this.asm_buffer = config.lsRecursion(root.fsPath, '/src', (filename) => {
                return filename.endsWith('.s') || filename.endsWith('S');
            });
        }
    }
    refresh(): void {
        this.reload();
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element: Item): Item {
        return element;
    }
    getChildren(element: Item): Thenable<Item[]> {
        if (!this.sources_project) {
            this.reload();
        }
        if (!element) {
            let ele: Item[] = [];
            for (let i in this.sources_project) {
                let content = this.sources_project[i];
                if (content) {
                    ele.push(new Item(i, undefined, content));
                }
            }
            for (let i in this.sources_project) {
                let content = this.sources_project[i];
                if (!content) {
                    ele.push(new Item(i, undefined, content));
                }
            }
            return Promise.resolve(ele);
        } else {
            let content = element.content;
            if (content) {
                let ele: Item[] = [];
                for (let i in content) {
                    let content2 = content[i];
                    if (content2) {
                        ele.push(new Item(i, element, content[i]));
                    }
                }
                for (let i in content) {
                    let content2 = content[i];
                    if (!content2) {
                        ele.push(new Item(i, element, content[i]));
                    }
                }
                return Promise.resolve(ele);
            }
        }
        return Promise.resolve([]);
    }
}

class Item extends vscode.TreeItem {
    public father: Item | undefined;
    public content: object | null;
    constructor(label: string, father: Item | undefined, content: object | null) {
        super(label, content == null ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed);
        this.father = father;
        this.content = content;
    }
}
