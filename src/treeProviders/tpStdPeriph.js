const vscode = require('vscode');
const fs = require('fs')
const path = require('path');



class TPCSources {

    _onDidChangeTreeData = new vscode.EventEmitter();

    get onDidChangeTreeData() {
        return new vscode.EventEmitter();
    }

    refresh() {
        this._onDidChangeTreeData().file();
    }

    getTreeItem(element) {
        return element;
    }
    /**
     * 
     * @param {vscode.TreeItem} element 
     */
    getChildren(element) {
        if (!element) {
            let stdPeriph = vscode.Uri.file(vscode.workspace.getConfiguration('kstm32.libs').get('STM32f10xStdPeriph') + '/STM32F10x_StdPeriph_Driver/src').fsPath;
            if (fs.existsSync(stdPeriph) && fs.statSync(stdPeriph).isDirectory()) {
                let result = [];
                fs.readdirSync(stdPeriph).forEach(filename => {
                    if (filename.endsWith('.c')) {
                        let name = filename.substr(0, filename.length - 2);
                        // result.push(filename.substr(0, filename.length - 2));
                        result.push(new ItemTpStdPeriph(name));
                    }
                });
                return Promise.resolve(result);
            } else {
                return Promise.resolve([new vscode.TreeItem('Invalid StdPeriphLibrary Path')]);
            }
        }
        return Promise.resolve([]);
    }
}

class ItemTpStdPeriph extends vscode.TreeItem {
    constructor(label) {
        super(label);
    }
    get description() {
        return 'test';
    }
}

function register() {
    vscode.window.registerTreeDataProvider('kstm32.stdperiph', new TPCSources());
}

module.exports = {
    register
}