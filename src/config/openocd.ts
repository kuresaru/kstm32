import * as vscode from 'vscode';
import * as config from './projectConfig';

export function getConfigFiles(): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
        let kstm32cfg: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('kstm32');
        let ocdScripts = kstm32cfg.get('ocdScripts');
        if (ocdScripts) {
            let conf: config.Kstm32Config | undefined = config.getConfig();
            if (!(conf && conf.type)) {
                vscode.window.showErrorMessage('无法读取项目类型');
                reject();
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
            resolve([
                `${ocdScripts}/interfaces/${_debugger}.cfg`,
                `${ocdScripts}/target/${target}.cfg`
            ]);
        } else {
            vscode.window.showErrorMessage("未配置OpenOCD脚本路径");
            reject();
        }
    });
}
