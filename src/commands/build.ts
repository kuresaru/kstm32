import * as vscode from 'vscode';

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
                new vscode.ShellExecution(`make`)
            );
        }
        return undefined;
    }

}

export function register(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('kstm32.build', () => {
        let task = BuildTaskProvider.getBuildTask();
        if (task) {
            vscode.tasks.executeTask(task);
        }
    }));
}