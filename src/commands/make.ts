// import * as vscode from 'vscode';
// import * as config from '../config/projectConfig';

// export const MakeTaskType = 'KSTM32.make';

// TODO 改成TaskProvider
// export function register(context: vscode.ExtensionContext) {
//     context.subscriptions.push(vscode.commands.registerCommand('kstm32.make', function () {
//         let kstm32cfg: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('kstm32');
//         let make: string | undefined = kstm32cfg.get('make');
//         let gccHome: string | undefined = kstm32cfg.get('gccHome');
//         let win = config.isWindows();
//         if (!make) {
//             if (win) {
//                 make = 'make.exe';
//             } else {
//                 make = 'make';
//             }
//         }
//         let cmd: string;
//         let args: string[] = [];
//         if (win) {
//             cmd = `cmd`;
//             args.push('/C', `chcp 65001 & ${make}`);
//         } else {
//             let setgcc = '';
//             if (gccHome) {
//                 setgcc = `export GCC_PATH='${gccHome}/bin'`
//             }
//             cmd = `sh`;
//             args.push('-c', `${setgcc}; ${make}`);
//         }
//         vscode.commands.executeCommand('kstm32.refresh').then(() => {
//             vscode.tasks.executeTask(new vscode.Task({ type: "shell" }, vscode.TaskScope.Workspace, 'make', 'shell',
//                 new vscode.ShellExecution(cmd, args)));
//         });
//     }));
// }
