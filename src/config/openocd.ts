import * as vscode from 'vscode';
import * as config from './projectConfig';
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
            let cfgFile: string = `# kstm32自动生成的OpenOCD运行配置，git应该忽略该文件。
source [find ${ocdScripts}/interface/${_debugger}.cfg]
source [find ${ocdScripts}/target/${target}.cfg]`;
            fs.writeFile(vscode.Uri.parse(`${root}/kstm32-openocd-autogen.cfg`).fsPath, cfgFile,
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
