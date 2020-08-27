import * as vscode from 'vscode';
import * as fs from 'fs';
import * as config from '../config/projectConfig';
import * as verUtils from '../templateVer/verUtils';

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
    verUtils.checkLibVer().then(() => {
        let test: string[] = fs.readdirSync(projectUri.fsPath);
        if (test.length > 0 && !(test.length == 1 && test[0] == '.vscode')) {
            vscode.window.showWarningMessage("目录非空，继续创建会被模板文件覆盖同名文件", "继续", "取消").then(v => {
                if (v == '继续') {
                    doCreate(projectUri, verUtils.templateVer);
                } else {
                    vscode.window.showInformationMessage('创建被取消: 工作目录非空');
                }
            });
        } else {
            doCreate(projectUri, verUtils.templateVer);
        }
    }).catch(ver => vscode.window.showErrorMessage(`插件支持${verUtils.templateVer}版本的模板，但是当前模板版本是${ver}`,
        "继续创建(不推荐)", "取消(去手动更新)").then(opt => {
            if (opt == '继续创建(不推荐)') {
                doCreate(projectUri, ver);
            }
        }));
}

function doCreate(projectUri: vscode.Uri, fromLibVer: number) {
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
                            createConfig(type, fromLibVer);
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

function createConfig(type: string, fromLibVer: number) {
    let conf = config.getConfig();
    if (conf) {
        let name: string | vscode.Uri | undefined = config.getWorkspaceRoot();
        if (name) {
            name = name.fsPath.replace(/\\/g, '/');
            conf.name = name.substring(name.lastIndexOf('/') + 1);
        } else {
            // 正常情况应该不会执行这个 做个备用
            conf.name = type;
        }
        conf.type = type;
        conf.fromLibVer = fromLibVer;
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
