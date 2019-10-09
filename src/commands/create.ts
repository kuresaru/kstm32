import * as vscode from 'vscode';
import * as fs from 'fs';
import * as config from '../config';

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
        "STM32F103x8",
        "STM32F103xC",
        "STM32F407xG"
    ]).then(type => {
        if (type) {
            let cd = vscode.workspace.getConfiguration('C_Cpp.default');
            cd.update('intelliSenseMode', 'gcc-x64', vscode.ConfigurationTarget.Workspace);
            cd.update('cStandard', 'c11', vscode.ConfigurationTarget.Workspace);

            let type_t = type.substr(0, 9);
            let type_s = type.substr(10, 11);

            let templatePath: string = vscode.workspace.getConfiguration('kstm32').get('libs.templates') || '';
            templatePath = `${templatePath}/${type_t}`;
            if (fs.existsSync(templatePath) && fs.statSync(templatePath).isDirectory()) {
                let templates: string[] = [];
                fs.readdirSync(templatePath).forEach(template => {
                    if (!template.startsWith('_')) {
                        templates.push(template);
                    }
                });
                if (templates.length == 0) {
                    vscode.window.showErrorMessage(`${templatePath}中无模板`);
                } else {
                    vscode.window.showQuickPick(templates).then(templateName => {
                        if (templateName) {
                            copyTemplate(projectUri.fsPath, templatePath, type_s, templateName);
                            createConfig(type);
                            vscode.commands.executeCommand('kstm32.refresh');
                            vscode.window.showInformationMessage('初始化完成');
                        } else {
                            vscode.window.showInformationMessage('操作被取消');
                        }
                    });
                }
            } else {
                vscode.window.showErrorMessage(`模板路径配置不正确`);
            }
        } else {
            vscode.window.showInformationMessage('操作被取消');
        }
    });
}

function copyTemplate(projectPath: string, templatePath: string, type_s: string, templateName: string) {
    copyRecursion(`${templatePath}/${templateName}`, projectPath);
    copyRecursion(`${templatePath}/_${type_s}`, projectPath);
}

function createConfig(type: string) {
    let conf = config.getConfig();
    if (conf) {
        conf.type = type;
        config.saveConfig(conf);
    }
}

function copyRecursion(src: string, dest: string, overwrite: boolean = false) {
    if (fs.existsSync(src)) {
        let stat = fs.statSync(src);
        if (stat.isDirectory()) {
            if (!mymkdir(dest)) {
                vscode.window.showWarningMessage(`目标${dest}不是目录`);
                return;
            }
            let contents: string[] = fs.readdirSync(src);
            contents.forEach(content => copyRecursion(`${src}/${content}`, `${dest}/${content}`, overwrite));
        } else if (stat.isFile()) {
            let exists = fs.existsSync(dest);
            if (exists && !overwrite) {
                return;
            }
            if (exists) {
                fs.unlinkSync(dest);
            }
            let readStream = fs.createReadStream(src)
            let writeStream = fs.createWriteStream(dest);
            readStream.pipe(writeStream);
        }
    }
}

// /**
//  * 递归复制目录
//  * @returns 返回出错的目录
//  */
// function copyDirectory(src: fs.PathLike, dest: fs.PathLike): string | undefined {
//     let content: String[] = fs.readdirSync(src);
//     if (!mymkdir(dest)) {
//         return dest.toString();
//     }
//     content.forEach(filename => {
//         let _src = vscode.Uri.file(src + '/' + filename).fsPath;
//         let _dest = vscode.Uri.file(dest + '/' + filename).fsPath;
//         let stats = fs.statSync(_src);
//         if (stats.isFile()) {
//             let readStream = fs.createReadStream(_src);
//             let writeStream = fs.createWriteStream(_dest);
//             readStream.pipe(writeStream);
//         } else if (stats.isDirectory) {
//             let errpath = copyDirectory(_src, _dest);
//             if (errpath) {
//                 return errpath;
//             }
//         }
//     });
// }

/**
 * 如果不存在 创建目录
 * @param {String} dir 
 * @returns 目录可用返回true
 */
function mymkdir(dir: fs.PathLike): boolean {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    } else if (!fs.statSync(dir).isDirectory()) {
        return false;
    }
    return true;
}
