import * as vscode from 'vscode';

export abstract class tpTemplate<T> implements vscode.TreeDataProvider<T> {

    private _onDidChangeTreeData: vscode.EventEmitter<T | undefined> = new vscode.EventEmitter<T | undefined>();
    readonly onDidChangeTreeData: vscode.Event<T | undefined> = this._onDidChangeTreeData.event;

    public items: T[] | undefined;

    abstract reload(showerr?: boolean): void;

    refresh(): void {
        this.reload();
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: T): T {
        return element;
    }

    getChildren(element?: T): Thenable<T[]> {
        if (!element) {
            if (!this.items) {
                this.reload(false);
            }
            return Promise.resolve(this.items);
        }
        return Promise.resolve([]);
    }
}