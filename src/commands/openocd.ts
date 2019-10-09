import * as vscode from 'vscode';
import * as config from '../config';
import * as path from 'path';

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

        let kstm32cfg: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('kstm32');
        let ocd: string | undefined = kstm32cfg.get('openocd');
        let win = config.isWindows();
        if (!ocd) {
            let ocdPath: string | undefined = config.getExePath(`openocd`);
            if (ocdPath) {
                ocd = path.join(ocdPath, '../');
            } else {
                vscode.window.showErrorMessage('无法找到OpenOCD根路径');
                return;
            }
        }
        ocd = ocd.replace(/\\/g, '/');
        if (ocd.endsWith('/')) {
            ocd = ocd.substring(0, ocd.length - 1);
        }

        let cmd = `${ocd}/bin/openocd${win ? '.exe' : ''}`;

        vscode.commands.executeCommand('kstm32.refresh').then(() => {
            vscode.tasks.executeTask(new vscode.Task({ type: "shell" }, vscode.TaskScope.Workspace, 'make', 'shell',
                new vscode.ShellExecution(cmd, args, {cwd: `${ocd}/scripts`})));
        });
    }));
}
