const vscode = require('vscode');
const fs = require('fs')

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
            let stdPeriph = vscode.Uri.file(vscode.workspace.getConfiguration('kstm32.libs').get('STM32f10xStdPeriph') + '/STM32F10x_StdPeriph_Driver/src').fsPath;
            if (fs.existsSync(stdPeriph) && fs.statSync(stdPeriph).isDirectory()) {
                let result = [];
                fs.readdirSync(stdPeriph).forEach(filename => {
                    if (filename.endsWith('.c')) {
                        let name = filename.substr(0, filename.length - 2);
                        // result.push(filename.substr(0, filename.length - 2));
                        result.push(new vscode.TreeItem(name));
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

function register() {
    vscode.window.registerTreeDataProvider('kstm32.stdperiph', new TPCSources());
}

module.exports = {
    register
}