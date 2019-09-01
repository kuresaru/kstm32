import * as vscode from 'vscode';
import * as fs from 'fs';

export function register(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('kstm32.configure', function () {
        let workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders) {
            if (workspaceFolders.length == 1) {
                configure(workspaceFolders[0].uri);
            } else {
                vscode.window.showErrorMessage('请不要打开多个目录');
            }
        } else {
            vscode.window.showErrorMessage('没有打开任何目录');
        }
    }));
}

function configure(projectUri: vscode.Uri) {
    let encoding = require('text-encoding');
    let makefiles = require('../templates/makefiles');

    configSources();
    //写入makefile
    let makefileUri: vscode.Uri = vscode.Uri.parse(projectUri + '/Makefile');
    let makefileContent: String = makefiles.f10x;
    let cfg: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('kstm32');
    let projectName = <string>cfg.get('projectName');
    let projectType = <string>cfg.get('projectType');
    let useLib = <string[]>cfg.get('useLib');
    let gcc = (<string>cfg.get('gccToolchainHome'));
    let csources: string = '';
    (<string[]>cfg.get('csources')).forEach(source => csources += `${source} `);
    let cincludes: string = '';
    (<string[]>cfg.get('cincludes')).forEach(include => cincludes += `-I${include} `);
    let cdefs: string = '';
    (<string[]>cfg.get('cdefs')).forEach(define => cdefs += `-D${define} `);
    let asmSources: string = '';
    (<string[]>cfg.get('asmSources')).forEach(source => asmSources += `${source} `);
    //加入库文件
    let libs: string;
    switch (projectType) {
        case 'STM32F103C8Tx':
            libs = <string>cfg.get('libs.STM32f10xStdPeriph');
            asmSources += `${libs}/CMSIS/CM3/DeviceSupport/ST/STM32F10x/startup/gcc_ride7/startup_stm32f10x_md.s `;
            csources += `${libs}/CMSIS/CM3/CoreSupport/core_cm3.c `;
            useLib.forEach(name => csources += `${libs}/STM32F10x_StdPeriph_Driver/src/${name}.c `);
            cincludes += `-I${vscode.Uri.file(libs + '/STM32F10x_StdPeriph_Driver/inc').fsPath} -I${vscode.Uri.file(libs + '/CMSIS/CM3/CoreSupport').fsPath} `;
            break;
        case 'STM32F103RCTx':
            libs = <string>cfg.get('libs.STM32f10xStdPeriph');
            asmSources += `${libs}/CMSIS/CM3/DeviceSupport/ST/STM32F10x/startup/gcc_ride7/startup_stm32f10x_hd.s `;
            csources += `${libs}/CMSIS/CM3/CoreSupport/core_cm3.c `;
            useLib.forEach(name => csources += `${libs}/STM32F10x_StdPeriph_Driver/src/${name}.c `);
            cincludes += `-I${vscode.Uri.file(libs + '/STM32F10x_StdPeriph_Driver/inc').fsPath} -I${vscode.Uri.file(libs + '/CMSIS/CM3/CoreSupport').fsPath} `;
            break;
    }
    makefileContent = makefileContent
        .replace(/\{kstm32\:target\}/g, projectName)
        .replace(/\{kstm32\:csources\}/g, csources.replace(/\\/g, '/'))
        .replace(/\{kstm32\:cincludes\}/g, cincludes.replace(/\\/g, '/'))
        .replace(/\{kstm32\:cdefs\}/g, cdefs)
        .replace(/\{kstm32\:asmsources\}/g, asmSources.replace(/\\/g, '/'))
        .replace(/\{kstm32\:gccpath\}/g, `${gcc}/bin`.replace(/\\/g, '/'))
        .replace(/\{kstm32\:prefix\}/g, 'arm-none-eabi-');
    vscode.workspace.fs.writeFile(makefileUri, new encoding.TextEncoder('utf-8').encode(makefileContent));
}

/**
 * 当kstm32.autoConfigSources=true时
 * 自动设置includes sources
 */
function configSources() {
    let root = vscode.workspace.rootPath;
    if (!root) {
        return;
    }
    let cfg = vscode.workspace.getConfiguration('kstm32');
    let autoConfigEnable = cfg.get('autoConfigSources');
    if (autoConfigEnable) {
        let cppcfg = vscode.workspace.getConfiguration('C_Cpp.default');
        let contents = rlsDir(root, '');
        let excludes = cfg.get("autoConfigParams");
        let libs = cfg.get('libs.STM32f10xStdPeriph');
        let gcc = (<string>cfg.get('gccToolchainHome'));
        let cincludesNew: String[] = [];
        let cincludesNewForCext: String[] = [];
        let csourcesNew: String[] = [];
        let asmsourcesNew: String[] = [];

        contents.forEach(content => {
            //如果不在排除列表里 或者根本没有排除列表 就加入
            if (!excludes || (<String[]>excludes).indexOf(content) == -1) {
                if (content.endsWith('/')) {
                    content = content.substring(0, content.length - 1);
                    let str = fs.readdirSync(root + '/' + content).join(',') + ','; //[a,b,c]->"a,b,c,"
                    //只有目录里有.h文件才会作为包含目录
                    if (str.indexOf('.h,') != -1) {
                        cincludesNew.push(content);
                        cincludesNewForCext.push('{workspaceFolder}/' + content + '/*');
                    }
                } else if (content.endsWith('.c')) {
                    csourcesNew.push(content);
                } else if (content.endsWith('.s')) {
                    asmsourcesNew.push(content);
                }
            }
        });

        cfg.update('cincludes', cincludesNew, vscode.ConfigurationTarget.Workspace);
        cfg.update('csources', csourcesNew, vscode.ConfigurationTarget.Workspace);
        cfg.update('asmSources', asmsourcesNew, vscode.ConfigurationTarget.Workspace);
        
        cincludesNewForCext.push(vscode.Uri.file(libs + '/STM32F10x_StdPeriph_Driver/inc/*').fsPath);
        // cincludesNewForCext.push(vscode.Uri.file(`${gcc}/arm-none-eabi/include/*`).fsPath);
        cincludesNewForCext.push(vscode.Uri.file(libs + '/CMSIS/CM3/CoreSupport/*').fsPath);

        cppcfg.update('includePath', cincludesNewForCext, vscode.ConfigurationTarget.Workspace);
        cppcfg.update('defines', cfg.get('cdefs'), vscode.ConfigurationTarget.Workspace);
        cppcfg.update('compilerPath', vscode.Uri.file(`${gcc}/bin/arm-none-eabi-gcc`).fsPath, vscode.ConfigurationTarget.Workspace);
    }
}

/**
 * 递归列目录内容
 */
function rlsDir(basePath: String, subPath?: String): String[] {
    let result: String[] = [];
    fs.readdirSync(`${basePath}${subPath}`).forEach(filename => {
        if (filename != '.vscode') {
            let stat = fs.statSync(basePath + '/' + subPath + '/' + filename);
            let r = (subPath + '/' + filename).substring(1);
            if (stat.isFile()) {
                result.push(r);
            } else if (stat.isDirectory()) {
                result.push(r + '/');
                rlsDir(basePath, subPath + '/' + filename).forEach(_name => {
                    result.push(_name);
                });
            }
        }
    });
    return result;
}
