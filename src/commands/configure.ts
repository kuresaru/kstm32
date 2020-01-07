import * as vscode from 'vscode';
import * as fs from 'fs';
import * as config from '../config';
import * as stdperiph from '../treeProviders/stdperiph';
import * as path from 'path';
import * as kstm32_i from '../extension';
import * as openocd_i from '../commands/openocd';

export function register(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('kstm32.configure', function () {
        let root: vscode.Uri | undefined = config.getWorkspaceRoot();
        if (root) {
            configure(root);
        }
    }));
}

function configure(root: vscode.Uri) {
    let kstm32cfg: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('kstm32');
    let cppcfg = vscode.workspace.getConfiguration('C_Cpp.default');
    let conf: config.Kstm32Config = config.getConfig() || {};
    let makefilePath = vscode.Uri.parse(`${root}/kstm32-makefile-autogen.mk`).fsPath;
    let gccHome: string | undefined = kstm32cfg.get('gccHome');

    if (!gccHome) {
        let gcc: string | undefined = config.getExePath(`arm-none-eabi-gcc`);
        if (gcc) {
            gccHome = path.join(gcc, '../');
            gccHome = gccHome.substring(0, gccHome.length - 1);
        } else {
            vscode.window.showWarningMessage('没有找到正确的GCC根路径');
        }
    }

    cppcfg.update('compilerPath', `${gccHome}/bin/arm-none-eabi-gcc${config.isWindows() ? '.exe' : ''}`.replace(/\\/g, '/'), vscode.ConfigurationTarget.Workspace);

    let makefile = `# kstm32自动生成的部分Makefile，git应忽略该文件`;
    makefile += `\r\nTARGET = ${conf.name}`;

    // sources
    makefile += `\r\n\r\nC_SOURCES =`;
    let sources: string[] = kstm32_i.sources.sources_buffer;
    sources.forEach(source => makefile += ` \\\r\n${source.replace(/ /g, '\\ ')}`);

    // defines
    makefile += `\r\n\r\nC_DEFS =`;
    let defines: string[] = kstm32_i.defines.defines_buffer;
    defines.forEach(define => makefile += ` \\\r\n-D${define}`);
    cppcfg.update('defines', defines, vscode.ConfigurationTarget.Workspace);

    // includes
    makefile += `\r\n\r\nC_INCLUDES =`;
    let includes: string[] = kstm32_i.includes.includes_buffer;
    includes.forEach(include => makefile += ` \\\r\n-I'${include}'`);
    // cpp插件需要gcc库
    if (gccHome) {
        includes.push(`${gccHome}/arm-none-eabi/include/*`.replace(/\\/g, '/'));
    }
    // cpp插件需要标准库源文件
    if (kstm32_i.stdperiph.getEnabled().length > 0) {
        let libPath: stdperiph.LibPath | undefined = stdperiph.getLibPath();
        if (libPath) {
            includes.push(`${libPath.stdperiph}/src/*`.replace(/\\/g, '/'));
        }
    }
    cppcfg.update('includePath', includes, vscode.ConfigurationTarget.Workspace);

    // asm
    makefile += `\r\n\r\nASM_SOURCES =`;
    let asmSources: string[] = kstm32_i.sources.asm_buffer;
    asmSources.forEach(a => makefile += ` \\\r\n${a}`);

    // endl
    makefile += `\r\n`;

    // write Makefile
    fs.writeFile(makefilePath, makefile, { encoding: 'UTF-8' }, err => {
        if (err) {
            vscode.window.showErrorMessage(`写入 ./kstm32-makefile-autogen.mk 出错: ${err.message}`);
        }
    });

    openocd_i.genCfgFile(root).catch(err => vscode.window.showErrorMessage(err));
}

