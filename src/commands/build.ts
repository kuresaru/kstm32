import * as vscode from 'vscode';
import { isWindows } from "../config/projectConfig";

type MakeMode = 'build' | 'clean';

function getMake(mode: MakeMode): vscode.ShellExecution {
    let kstm32cfg: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('kstm32');
    let make: string | undefined = kstm32cfg.get('make');
    let gccHome: string | undefined = kstm32cfg.get('gccHome');
    let options: vscode.ShellExecutionOptions | undefined;
    // 命令
    if (!make) {
        make = `make`;
        if (isWindows()) {
            make += '.exe';
        }
    }
    // 参数
    let args: string[] = [];
    if (isWindows()) {
        options = {
            executable: 'cmd.exe',
            shellArgs: ['/D', '/C']
        };
        args.push('RD="RD /S /Q"');
    }
    if (gccHome) {
        args.push(`GCC_PATH="${gccHome}/bin"`);
    }
    // 模式
    switch (mode) {
        case 'clean': {
            args.push('clean');
        }
    }
    return new vscode.ShellExecution(make, args, options);
}

export class BuildTaskProvider implements vscode.TaskProvider {

    static type = 'build';

    provideTasks(token?: vscode.CancellationToken): vscode.ProviderResult<vscode.Task[]> {
        return [BuildTaskProvider.getBuildTask()];
    }

    resolveTask(task: vscode.Task, token?: vscode.CancellationToken): vscode.ProviderResult<vscode.Task> {
        if (task.definition.type === BuildTaskProvider.type && task.name === 'kstm32-build') {
            return task;
        }
        return undefined;
    }

    static getBuildTask(): vscode.Task | undefined {
        let workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            return new vscode.Task(
                {
                    type: BuildTaskProvider.type,
                } as vscode.TaskDefinition,
                workspaceFolders[0],
                'kstm32-build',
                'build',
                getMake('build')
            );
        }
        return undefined;
    }

    static getCleanTask(): vscode.Task | undefined {
        let workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            return new vscode.Task(
                {
                    type: BuildTaskProvider.type,
                } as vscode.TaskDefinition,
                workspaceFolders[0],
                'kstm32-clean',
                'clea ',
                getMake('clean')
            );
        }
        return undefined;
    }

}

function executeTask(task: vscode.Task | undefined) {
    if (task) {
        vscode.tasks.executeTask(task);
    }
}

export function register(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('kstm32.build', () => executeTask(BuildTaskProvider.getBuildTask())));
    context.subscriptions.push(vscode.commands.registerCommand('kstm32.clean', () => executeTask(BuildTaskProvider.getCleanTask())));
}