import * as vscode from 'vscode';
import * as fs from 'fs';
import * as config from '../config';
import * as stdperiph from '../treeProviders/stdperiph';
import * as path from 'path';
import * as kstm32_i from '../extension';

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
    let makefilePath = vscode.Uri.parse(`${root}/Makefile`).fsPath;
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
    
    fs.readFile(makefilePath, { encoding: 'UTF-8' }, (err, makefile) => {
        if (err) {
            vscode.window.showErrorMessage(`读取Makefile出错: ${err.message}`);
            return;
        }

        // sources
        let makefileSources: string = '';
        kstm32_i.sources.sources_buffer.forEach(source => makefileSources = `${makefileSources} \\\r\n${source}`);
        let msarr = makefile.match(/#--kstm32-autoconf:sources\r?\n([a-zA-Z0-9_]+) *=(.*\\\r?\n)*.*/);
        if (msarr) {
            makefile = makefile.replace(msarr[0], `#--kstm32-autoconf:sources\r\n${msarr[1]} =${makefileSources}`);
        }

        // defines
        let makefileDefines: string = '';
        let defines = kstm32_i.defines.defines_buffer;
        defines.forEach(define => makefileDefines = `${makefileDefines} \\\r\n-D${define}`);
        let mdarr = makefile.match(/#--kstm32-autoconf:defines\r?\n([a-zA-Z0-9_]+) *=(.*\\\r?\n)*.*/);
        if (mdarr) {
            makefile = makefile.replace(mdarr[0], `#--kstm32-autoconf:defines\r\n${mdarr[1]} =${makefileDefines}`);
        }
        cppcfg.update('defines', defines, vscode.ConfigurationTarget.Workspace);

        // includes
        let makefileIncludes: string = '';
        let includes: string[] = kstm32_i.includes.includes_buffer;
        includes.forEach(include => makefileIncludes = `${makefileIncludes} \\\r\n-I${include}`);
        let miarr = makefile.match(/#--kstm32-autoconf:includes\r?\n([a-zA-Z0-9_]+) *=(.*\\\r?\n)*.*/);
        if (miarr) {
            makefile = makefile.replace(miarr[0], `#--kstm32-autoconf:includes\r\n${miarr[1]} =${makefileIncludes}`);
        }
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
        let makefileAsm: string = '';
        kstm32_i.sources.asm_buffer.forEach(a => makefileAsm = `${makefileAsm} \\\r\n${a}`);
        let maarr = makefile.match(/#--kstm32-autoconf:asm\r?\n([a-zA-Z0-9_]+) *=(.*\\\r?\n)*.*/);
        if (maarr) {
            makefile = makefile.replace(maarr[0], `#--kstm32-autoconf:asm\r\n${maarr[1]} =${makefileAsm}`);
        }

        // name
        let mnarr = makefile.match(/#--kstm32-autoconf:name\r?\n([a-zA-Z0-9_]+) *=(.*\\\r?\n)*.*/);
        if (mnarr && conf.name) {
            makefile = makefile.replace(mnarr[0], `#--kstm32-autoconf:name\r\n${mnarr[1]} = ${conf.name}`);
        }

        // write Makefile
        fs.writeFile(makefilePath, makefile, { encoding: 'UTF-8' }, err => {
            if (err) {
                vscode.window.showErrorMessage(`写入 ./Makefile 出错: ${err.message}`);
            }
        });
    });
}

