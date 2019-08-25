const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */
function register(context) {
    context.subscriptions.push(vscode.commands.registerCommand('kstm32.init', function () {
        console.log('初始化新的工程');
        //取工作区所有的目录 如果只是普通打开了一个目录就只有一个
        let workspaceFolders = vscode.workspace.workspaceFolders;
        let project;
        //现在好像是只有打开一个的时候能用 其它情况报错
        if (workspaceFolders.length == 0) {
            vscode.window.showErrorMessage('没有打开任何目录');
            return;
        } else if (workspaceFolders.length == 1) {
            project = workspaceFolders[0];
            initProject(project.uri);
        } else {
            let names;
            workspaceFolders.forEach((folder, index, folders) => {
                names[index] = folder.name;
            })
            vscode.window.showWarningMessage('请选择一个工程目录', names).then(name => {
                for (let i = 0; i < workspaceFolders.length; i++) {
                    if (workspaceFolders[i].name == name) {
                        initProject(workspaceFolders[i].uri);
                        break;
                    }
                }
            });
        }
    }));
}

function initProject(projectUri) {
    console.log('工程目录uri=' + projectUri);
    
}

module.exports = {
    register
}