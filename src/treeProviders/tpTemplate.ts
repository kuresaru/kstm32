import * as vscode from 'vscode';

export abstract class tpTemplate<T> implements vscode.TreeDataProvider<T> {

    private _onDidChangeTreeData: vscode.EventEmitter<T | undefined> = new vscode.EventEmitter<T | undefined>();
    readonly onDidChangeTreeData: vscode.Event<T | undefined> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: T): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    abstract getChildren(element?: T | undefined): vscode.ProviderResult<T[]>;
}