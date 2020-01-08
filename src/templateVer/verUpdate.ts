import * as fs from 'fs';
import * as vscode from 'vscode';
import * as config_i from '../projectConfig';

function update0_1(projectUri: vscode.Uri): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        let makefilePath = vscode.Uri.parse(`${projectUri}/Makefile`).fsPath;
        fs.readFile(makefilePath, {encoding: 'utf-8'}, (err, data) => {
            if (err) {
                reject(`读取Makefile出错: ${err}`);
            } else {
                let newline = '\r\n';
                // 注释掉无用文本，顺便取换行符
                let match = data.match(/(#--kstm32-autoconf:sources)(\r?\n)([a-zA-Z0-9_]+ *=(.*\\\r?\n)*.*)/);
                if (match) {
                    newline = match[2];
                    data = data.replace(match[0], `# kstm32自动升级0=>1时自动注释删除\r\n${match[1]}${newline}# ${match[3]}`);
                }
                match = data.match(/(#--kstm32-autoconf:defines\r?\n)([a-zA-Z0-9_]+ *=(.*\\\r?\n)*.*)/);
                if (match) {
                    data = data.replace(match[0], `# kstm32自动升级0=>1时自动注释删除\r\n${match[1]}# ${match[2]}`);
                }
                match = data.match(/(#--kstm32-autoconf:includes\r?\n)([a-zA-Z0-9_]+ *=(.*\\\r?\n)*.*)/);
                if (match) {
                    data = data.replace(match[0], `# kstm32自动升级0=>1时自动注释删除\r\n${match[1]}# ${match[2]}`);
                }
                match = data.match(/(#--kstm32-autoconf:asm\r?\n)([a-zA-Z0-9_]+ *=(.*\\\r?\n)*.*)/);
                if (match) {
                    data = data.replace(match[0], `# kstm32自动升级0=>1时自动注释删除\r\n${match[1]}# ${match[2]}`);
                }
                match = data.match(/(#--kstm32-autoconf:name\r?\n)([a-zA-Z0-9_]+ *=(.*\\\r?\n)*.*)/);
                if (match) {
                    data = data.replace(match[0], `# kstm32自动升级0=>1时自动注释删除\r\n${match[1]}# ${match[2]}`);
                }
                // 开头新加内容
                data = `# kstm32自动升级0=>1时自动添加${newline}include kstm32-makefile-autogen.mk${newline}${newline}${data}`;
                // 写回文件
                fs.writeFile(makefilePath, data, {encoding: 'utf-8'}, err => {
                    if (err) {
                        reject(`保存Makefile出错: ${err}`);
                    } else {
                        let conf = config_i.getConfig();
                        conf.fromLibVer = 1;
                        config_i.saveConfig(conf);
                        resolve();
                    }
                });
            }
        });
    });
}

export let updates: ((projectUri: vscode.Uri) => Promise<void>)[] = [
    update0_1,
];
