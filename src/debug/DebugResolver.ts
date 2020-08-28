import { debug, DebugConfiguration, DebugConfigurationProvider, ProviderResult, WorkspaceFolder } from 'vscode';
import { getConfigFiles } from "../config/openocd";
import { getConfig } from "../config/projectConfig";

export default class DebugProvider implements DebugConfigurationProvider {

    resolveDebugConfiguration?(folder: WorkspaceFolder | undefined, debugConfiguration: DebugConfiguration): ProviderResult<DebugConfiguration> {
        console.log(debugConfiguration);
        if (debugConfiguration.type == 'kstm32') {
            getConfigFiles().then(configFiles => {
                debug.startDebugging(folder, {
                    type: "cortex-debug",
                    name: "kstm32",
                    request: "launch",
                    cwd: "${workspaceRoot}",
                    executable: `./build/${getConfig().name || "invalid"}.elf`,
                    servertype: "openocd",
                    configFiles: configFiles
                } as DebugConfiguration);
            });
        }
        return undefined;
    }

}
