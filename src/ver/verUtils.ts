import * as vscode from 'vscode';
import * as fs from 'fs';
import * as config from '../projectConfig';

export const templateVer = 1;

type templateInfo = {
    ver?: number;
};

export function checkLibVer(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        let conf = vscode.workspace.getConfiguration('kstm32');
        let templatePath = conf.get('libs.templates');
        if (templatePath) {
            let infoFile = vscode.Uri.file(`${templatePath}/info.json`);
            fs.readFile(infoFile.fsPath, { encoding: 'utf-8' }, (err, data) => {
                let info: templateInfo = {};
                if (err) {
                    console.log(err);
                } else {
                    info = <templateInfo>JSON.parse(data);
                }
                let ver = info.ver || 0;
                if (templateVer != ver) {
                    reject(ver);
                } else {
                    resolve();
                }
            });
        } else {
            reject(0);
        }
    });
}

export function checkProjectLibVer(projectUri: vscode.Uri): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        let conf: config.Kstm32Config = config.getConfig() || {};
        let ver: number = conf.fromLibVer || 0;
        if (templateVer != ver) {
            reject(ver);
        } else {
            resolve();
        }
    });
}

export function doUpdate(projectUri: vscode.Uri) {
    // TODO
}