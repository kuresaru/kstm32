import * as vscode from 'vscode';
import * as fs from 'fs';
import * as config from '../config/projectConfig';
import * as stdperiph from '../treeProviders/stdperiph';
import * as path from 'path';
import * as kstm32_i from '../extension';
import * as openocd_i from '../config/openocd';
import * as verUtils from '../templateVer/verUtils';

export function register(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('kstm32.configure', function () {
        let root: vscode.Uri | undefined = config.getWorkspaceRoot();
        if (root) {
            const opt_update = `自动升级到版本${verUtils.templateVer}(可能会出问题)`;
            const opt_continue = `继续操作(基本不会正常工作)`;
            const opt_cancel = `取消并手动解决`;
            verUtils.checkProjectLibVer(root)
                .then(() => doConfigure(root))
                .catch(ver => vscode.window.showWarningMessage
                    (`插件支持${verUtils.templateVer}版本的模板，但是当前工程是从${ver}版本模板创建的.
详细信息请参考插件Readme文档.
无论如何请先备份此工程.`, opt_update, opt_continue, opt_cancel).then(opt => {
                        if (opt == opt_continue) {
                            doConfigure(root);
                        } else if (opt == opt_update) {
                            verUtils.doUpdate(root)
                            .then(() => vscode.window.showInformationMessage(`升级完成`))
                            .catch(err => vscode.window.showErrorMessage(`升级出错: ${err}`));
                        }
                    }));
        }
    }));
}

function doConfigure(root: vscode.Uri) {
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

    let spaceWarnFlag: boolean = false;
    let makefile = `# kstm32自动生成的部分Makefile，git应忽略该文件`;
    makefile += `\r\nTARGET = ${conf.name}`;

    // sources
    makefile += `\r\n\r\nC_SOURCES =`;
    let sources: string[] = kstm32_i.sources.sources;
    sources.forEach(source => {
        makefile += ` \\\r\n${source.replace(/ /g, '\\ ')}`;
        if (source.indexOf(' ') > -1) {
            spaceWarnFlag = true;
        }
    });

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
    let asmSources: string[] = kstm32_i.sources.asms;
    asmSources.forEach(a => {
        makefile += ` \\\r\n${a}`;
        if (a.indexOf(' ') > -1) {
            spaceWarnFlag = true;
        }
    });

    // endl
    makefile += `\r\n`;

    if (spaceWarnFlag) {
        vscode.window.showWarningMessage('检测到库或外部C/ASM源文件路径中有空格，可能无法正常使用!');
    }

    // write Makefile
    fs.writeFile(makefilePath, makefile, { encoding: 'UTF-8' }, err => {
        if (err) {
            vscode.window.showErrorMessage(`写入 ./kstm32-makefile-autogen.mk 出错: ${err.message}`);
        }
    });

    openocd_i.genCfgFile(root).catch(err => vscode.window.showErrorMessage(err));
}

