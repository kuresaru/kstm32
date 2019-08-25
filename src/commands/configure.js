const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */
function register(context) {
    context.subscriptions.push(vscode.commands.registerCommand('kstm32.configure', function () {
        console.log('初始化新的工程');
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

    //写入makefile
    let makefileUri = vscode.Uri.parse(projectUri + '/Makefile');
    let makefileContent = makefiles.f10x;
    let configuration = vscode.workspace.getConfiguration('kstm32');
    let projectName = configuration.get('projectName');
    let csources = configuration.get('csources').toString().replace(/,/g, ' ');
    let cincludes = configuration.get('cincludes');
    let cdefs = configuration.get('cdefs');
    let asmSources = configuration.get('asmSources');
    let gcc = configuration.get('gcc');
    let prefix = configuration.get('gccPrefix');
    if (gcc != '')
        makefileContent = makefileContent.replace(/\{kstm32\:gccpath\}/g, 'GCC_PATH' + gcc + '\n');
    if (cincludes != '')
        cincludes = (',' + cincludes).toString().replace(/,/g, ' -I');
    if (cdefs != '')
        cdefs = (',' + cdefs).toString().replace(/,/g, ' -D');
    makefileContent = makefileContent
        .replace(/\{kstm32\:target\}/g, projectName)
        .replace(/\{kstm32\:csources\}/g, csources)
        .replace(/\{kstm32\:cincludes\}/g, cincludes)
        .replace(/\{kstm32\:cdefs\}/g, cdefs)
        .replace(/\{kstm32\:asmsources\}/g, asmSources)
        .replace(/\{kstm32\:gccpath\}/g, '')
        .replace(/\{kstm32\:prefix\}/g, prefix);
    vscode.workspace.fs.writeFile(makefileUri, new encoding.TextEncoder('utf-8').encode(makefileContent));
}

module.exports = {
    register,
    configure
}