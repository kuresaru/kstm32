import * as vscode from 'vscode';
import { getConfigFiles } from "../config/openocd";
import { getConfig } from "../config/projectConfig";

export function register(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('kstm32.run', function () {
        let folders: readonly vscode.WorkspaceFolder[] | undefined = vscode.workspace.workspaceFolders;
        let folder: vscode.WorkspaceFolder | undefined = undefined;
        if (folders && folders.length > 0) {
            folder = folders[0];
        }
        getConfigFiles().then(configFiles => {
            vscode.debug.startDebugging(folder, {
                type: "cortex-debug",
                name: "kstm32",
                request: "launch",
                cwd: "${workspaceRoot}",
                executable: `./build/${getConfig().name || "invalid"}.elf`,
                servertype: "openocd",
                configFiles: configFiles
            } as vscode.DebugConfiguration);
        });
    }));
}
