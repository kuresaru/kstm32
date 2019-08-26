const vscode = require('vscode');

class TPCSources {
    getTreeItem(element) {
        return element;
    }
    /**
     * 
     * @param {vscode.TreeItem} element 
     */
    getChildren(element) {
        if (!element) {
            let cSources = vscode.workspace.getConfiguration('kstm32').get('csources');
            let result = [];
            cSources.forEach(element => {
                result.push(new vscode.TreeItem(element));
            });
            return Promise.resolve(result);
        }
        return Promise.resolve([]);
    }
}

function register() {
    vscode.window.registerTreeDataProvider('kstm32.csources', new TPCSources());
}

module.exports = {
    register
}