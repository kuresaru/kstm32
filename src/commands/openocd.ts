import * as vscode from 'vscode';
import * as config from '../config';
import * as path from 'path';
import * as fs from 'fs';

export function getOcdPath(): string | undefined {
    let kstm32cfg: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('kstm32');
    let ocd: string | undefined = kstm32cfg.get('openocd');
    if (!ocd) {
        let ocdPath: string | undefined = config.getExePath(`openocd`);
        if (ocdPath) {
            ocd = path.join(ocdPath, '../');
        } else {
            vscode.window.showErrorMessage('无法找到OpenOCD根路径');
            return undefined;
        }
    }
    ocd = ocd.replace(/\\/g, '/');
    if (ocd.endsWith('/')) {
        ocd = ocd.substring(0, ocd.length - 1);
    }
    return ocd;
}

export function genCfgFile(root: vscode.Uri): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        let ocdPath = getOcdPath();
        if (ocdPath) {
            let conf: config.Kstm32Config | undefined = config.getConfig();
            if (!(conf && conf.type)) {
                reject('无法读取项目类型');
                return;
            }
            // 判断f1或者f4
            let target: string;
            if (conf.type.startsWith('STM32F1')) {
                target = 'stm32f1x'
            } else if (conf.type.startsWith('STM32F4')) {
                target = 'stm32f4x'
            } else {
                reject('未知项目类型');
                return;
            }
            // 调试器类型
            let _debugger: string = conf.debugger || 'stlink';
            // 两个路径
            let ocdScripts: string = `${ocdPath}/scripts`;
            let cfgFile: string = `source [find ${ocdScripts}/interface/${_debugger}.cfg]
source [find ${ocdScripts}/target/${target}.cfg]`;
            fs.writeFile(vscode.Uri.parse(`${root}/kstm32-openocd.cfg`).fsPath, cfgFile,
                { encoding: 'UTF-8' }, err => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
        } else {
            reject("未知OpenOCD路径");
        }
    });
}

export function register(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('kstm32.ocd', function () {
        let conf: config.Kstm32Config | undefined = config.getConfig();
        if (!(conf && conf.type)) {
            vscode.window.showErrorMessage('无法读取项目类型');
            return;
        }

        let args: string[] = ['-f', 'interface/stlink-v2.cfg', '-f'];
        if (conf.type.startsWith('STM32F1')) {
            args.push('target/stm32f1x.cfg');
        } else if (conf.type.startsWith('STM32F4')) {
            args.push('target/stm32f4x.cfg');
        } else {
            vscode.window.showErrorMessage('未知项目类型');
            return;
        }

        let ocd: string | undefined = getOcdPath();
        if (ocd) {
            let win = config.isWindows();
            let cmd = `${ocd}/bin/openocd${win ? '.exe' : ''}`;

            vscode.commands.executeCommand('kstm32.refresh').then(() => {
                vscode.tasks.executeTask(new vscode.Task({ type: "shell" }, vscode.TaskScope.Workspace, 'OpenOCD', 'shell',
                    new vscode.ShellExecution(cmd, args, { cwd: `${ocd}/scripts` })));
            });
        }
    }));
}
