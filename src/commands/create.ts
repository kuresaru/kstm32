import * as vscode from 'vscode';
import * as fs from 'fs';

const vfs: vscode.FileSystem = vscode.workspace.fs;

export function register(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('kstm32.create', function () {
        let workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders) {
            if (workspaceFolders.length == 1) {
                create(workspaceFolders[0].uri);
            } else {
                vscode.window.showErrorMessage('请不要打开多个目录');
            }
        } else {
            vscode.window.showErrorMessage('没有打开任何目录');
        }
    }));
}

function create(projectUri: vscode.Uri) {
    vscode.window.showQuickPick([
        "STM32F103C8Tx",
        "STM32F103RCTx",
        "STM32F407ZGTx"
    ]).then(result => {
        let cd = vscode.workspace.getConfiguration('C_Cpp.default');
        cd.update('intelliSenseMode', 'gcc-x64', vscode.ConfigurationTarget.Workspace);
        cd.update('cStandard', 'c11', vscode.ConfigurationTarget.Workspace);
        if (result) {
            //找模板目录
            let templatePath = vscode.Uri.file(vscode.workspace.getConfiguration('kstm32.libs').get('templates') + '/' + result).fsPath;
            if (fs.existsSync(templatePath) && fs.statSync(templatePath).isDirectory()) {
                let templates = fs.readdirSync(templatePath);
                if (templates.length == 0) {
                    vscode.window.showErrorMessage(templatePath + '中无模板');
                    //如果不存在 创建源码目录(./src)
                    vfs.createDirectory(vscode.Uri.parse(projectUri + '/src'));
                    createConfig(result);
                    return;
                }
                //选择一个模板
                vscode.window.showQuickPick(templates).then(name => {
                    if (!name) {
                        vscode.window.showInformationMessage('操作被取消');
                        return;
                    }
                    //把模板内容复制到当前工程目录下
                    let srcPath = vscode.Uri.file(templatePath + '/' + name).fsPath;
                    copyDirectory(srcPath, projectUri.fsPath);
                    createConfig(result);
                    vscode.window.showInformationMessage('初始化完成');
                });
            } else {
                vscode.window.showWarningMessage('没有找到模板目录' + templatePath);
            }
        } else {
            vscode.window.showInformationMessage('操作被取消');
        }
    });
}

function createConfig(type) {
    let cfg = vscode.workspace.getConfiguration('kstm32');
    cfg.update("projectName", type, vscode.ConfigurationTarget.Workspace);
    cfg.update("projectType", type, vscode.ConfigurationTarget.Workspace);
    let cdefsNew = ['USE_STDPERIPH_DRIVER'];
    switch (type) {
        case 'STM32F103C8Tx':
            cdefsNew.push('STM32F10X_MD');
            break;
        case 'STM32F103RCTx':
            cdefsNew.push('STM32F10X_HD');
            break;
    }
    cfg.update('cdefs', cdefsNew, vscode.ConfigurationTarget.Workspace);
    //不知道为什么 cpp的不更新
    // let cd = vscode.workspace.getConfiguration('C_Cpp.default');
    // cd.update('defines', cfg.get('cdefs'), vscode.ConfigurationTarget.Workspace);
    // configure.configSources();
    vscode.commands.executeCommand('kstm32.configure');
}

/**
 * 递归复制目录
 */
function copyDirectory(src: fs.PathLike, dest: fs.PathLike) {
    let content: String[] = fs.readdirSync(src);
    mkdirSync(dest);
    content.forEach(filename => {
        let _src = vscode.Uri.file(src + '/' + filename).fsPath;
        let _dest = vscode.Uri.file(dest + '/' + filename).fsPath;
        let stats = fs.statSync(_src);
        if (stats.isFile()) {
            let readStream = fs.createReadStream(_src);
            let writeStream = fs.createWriteStream(_dest);
            readStream.pipe(writeStream);
        } else if (stats.isDirectory) {
            copyDirectory(_src, _dest);
        }
    });
}

/**
 * 如果不存在 创建目录
 * @param {String} dir 
 */
function mkdirSync(dir: fs.PathLike) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    } else {
        if (!fs.statSync(dir).isDirectory()) {
            fs.unlinkSync(dir); //不是目录 先删除
            fs.mkdirSync(dir);
        }
    }
}
