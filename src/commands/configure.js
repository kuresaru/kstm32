const vscode = require('vscode');
const fs = require('fs');

/**
 * @param {vscode.ExtensionContext} context
 */
function register(context) {
    context.subscriptions.push(vscode.commands.registerCommand('kstm32.configure', function () {
        let workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders.length == 1) {
            configure(workspaceFolders[0].uri);
        } else {
            vscode.window.showErrorMessage('请不要打开多个目录');
        }
    }));
}

/**
 * @param {vscode.Uri} projectUri 
 */
function configure(projectUri) {
    let encoding = require('text-encoding');
    let makefiles = require('../templates/makefiles');

    configSources();
    //写入makefile
    let makefileUri = vscode.Uri.parse(projectUri + '/Makefile');
    let makefileContent = makefiles.f10x;
    let cfg = vscode.workspace.getConfiguration('kstm32');
    let projectName = cfg.get('projectName');
    let projectType = cfg.get('projectType');
    let csources = cfg.get('csources').toString().replace(/,/g, ' ');
    let cincludes = cfg.get('cincludes');
    let cdefs = cfg.get('cdefs');
    let asmSources = cfg.get('asmSources');
    let gcc = cfg.get('gcc');
    let prefix = cfg.get('gccPrefix');
    if (gcc != '')
        makefileContent = makefileContent.replace(/\{kstm32\:gccpath\}/g, 'GCC_PATH' + gcc + '\n');
    if (cincludes != '')
        cincludes = (',' + cincludes).toString().replace(/,/g, ' -I');
    if (cdefs != '')
        cdefs = (',' + cdefs).toString().replace(/,/g, ' -D');
    if (asmSources != '') {
        asmSources = (',' + asmSources).toString().replace(/,/g, ' ');
    }
    let libs;
    switch (projectType) {
        case 'STM32F103C8Tx':
            libs = cfg.get('libs.STM32f10xStdPeriph');
            asmSources += ' ' + (libs + '/CMSIS/CM3/DeviceSupport/ST/STM32F10x/startup/gcc_ride7/startup_stm32f10x_md.s');
            csources += ' ' + (libs + '/CMSIS/CM3/CoreSupport/core_cm3.c');
            cincludes += ' -I' + vscode.Uri.file(libs + '/STM32F10x_StdPeriph_Driver/inc').fsPath;
            cincludes += ' -I' + vscode.Uri.file(libs + '/CMSIS/CM3/CoreSupport').fsPath;
            break;
        case 'STM32F103RCTx':
            libs = cfg.get('libs.STM32f10xStdPeriph');
            asmSources += ' ' + (libs + '/CMSIS/CM3/DeviceSupport/ST/STM32F10x/startup/gcc_ride7/startup_stm32f10x_hd.s');
            csources += ' ' + (libs + '/CMSIS/CM3/CoreSupport/core_cm3.c');
            cincludes += ' -I' + vscode.Uri.file(libs + '/STM32F10x_StdPeriph_Driver/inc').fsPath;
            cincludes += ' -I' + vscode.Uri.file(libs + '/CMSIS/CM3/CoreSupport').fsPath;
            break;
    }
    makefileContent = makefileContent
        .replace(/\{kstm32\:target\}/g, projectName)
        .replace(/\{kstm32\:csources\}/g, csources.replace(/\\/g, '/'))
        .replace(/\{kstm32\:cincludes\}/g, cincludes.replace(/\\/g, '/'))
        .replace(/\{kstm32\:cdefs\}/g, cdefs)
        .replace(/\{kstm32\:asmsources\}/g, asmSources.replace(/\\/g, '/'))
        .replace(/\{kstm32\:gccpath\}/g, '') //如果有配置了 上边已经替换了 这个匹配不到
        .replace(/\{kstm32\:prefix\}/g, prefix);
    vscode.workspace.fs.writeFile(makefileUri, new encoding.TextEncoder('utf-8').encode(makefileContent));
}

/**
 * 当kstm32.autoConfigSources=true时
 * 自动设置includes sources
 */
function configSources() {
    let cfg = vscode.workspace.getConfiguration('kstm32');
    let cd = vscode.workspace.getConfiguration('C_Cpp.default');
    let autoConfigEnable = cfg.get('autoConfigSources');
    if (autoConfigEnable) {
        let root = vscode.workspace.rootPath;
        let contents = rlsDir(root, '');
        let excludes = cfg.get("autoConfigParams");
        let libs = cfg.get('libs.STM32f10xStdPeriph');
        let cincludesNew = [];
        let cincludesNewForCext = [];
        let csourcesNew = [];
        let asmsourcesNew = [];

        contents.forEach(content => {
            //如果不在排除列表里就加入
            if (excludes.indexOf(content) == -1) {
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

        // cincludesNew.push(vscode.Uri.file(libs + '/STM32F10x_StdPeriph_Driver/inc').fsPath);
        cincludesNewForCext.push(vscode.Uri.file(libs + '/STM32F10x_StdPeriph_Driver/inc/*').fsPath);
        // cincludesNew.push(vscode.Uri.file(libs + '/CMSIS/CM3/CoreSupport').fsPath);
        cincludesNewForCext.push(vscode.Uri.file(libs + '/CMSIS/CM3/CoreSupport/*').fsPath);
        cfg.update('cincludes', cincludesNew, vscode.ConfigurationTarget.Workspace);
        cfg.update('csources', csourcesNew, vscode.ConfigurationTarget.Workspace);
        cfg.update('asmSources', asmsourcesNew, vscode.ConfigurationTarget.Workspace);

        cd.update('includePath', cincludesNewForCext, vscode.ConfigurationTarget.Workspace);
        cd.update('defines', cfg.get('cdefs'), vscode.ConfigurationTarget.Workspace);
    }
}

/**
 * 递归列目录内容
 * @param {String} basePath 目录路径
 * @param {String} subPath 空字符串
 */
function rlsDir(basePath, subPath) {
    let result = [];
    fs.readdirSync(basePath + subPath).forEach(filename => {
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

module.exports = {
    register,
    configure,
    configSources
}