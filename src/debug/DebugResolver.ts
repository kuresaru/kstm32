import {
    DebugConfigurationProvider,
    WorkspaceFolder,
    CancellationToken,
    DebugConfiguration,
    ProviderResult,
    debug
} from 'vscode';
import { getConfig } from "../config/projectConfig";

export default class DebugProvider implements DebugConfigurationProvider {

    resolveDebugConfiguration?(folder: WorkspaceFolder | undefined, debugConfiguration: DebugConfiguration, token?: CancellationToken): ProviderResult<DebugConfiguration> {
        console.log(debugConfiguration);
        if (debugConfiguration.type == 'kstm32') {
            let config: DebugConfiguration = {
                type: "cortex-debug",
                name: "kstm32",
                request: "launch",
                cwd: "${workspaceRoot}",
                executable: `./build/${getConfig().name || "invalid"}.elf`,
                servertype: "openocd",
                configFiles: [
                    "kstm32-openocd-autogen.cfg"
                ]
            };
            debug.startDebugging(folder, config);
        }
        return undefined;
    }

}
