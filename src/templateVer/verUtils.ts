import * as vscode from 'vscode';
import * as fs from 'fs';
import * as config from '../projectConfig';
import * as verUpdate from './verUpdate';
import { promises, resolve } from 'dns';

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

export async function getProjectLibVer(projectUri: vscode.Uri): Promise<number> {
    let conf: config.Kstm32Config = config.getConfig() || {};
    let ver: number = conf.fromLibVer || 0;
    return typeof (ver) == 'number' ? ver : 0;
}

export function checkProjectLibVer(projectUri: vscode.Uri): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        getProjectLibVer(projectUri).then(ver => {
            if (templateVer != ver) {
                reject(ver);
            } else {
                resolve();
            }
        });
    });
}

export async function doUpdate(projectUri: vscode.Uri): Promise<void> {
    let ver = await getProjectLibVer(projectUri);
    while (ver < templateVer) {
        let err = null;
        await verUpdate.updates[ver](projectUri).catch(e => err = e);
        if (err) {
            throw new Error(err);
        }
        ver = await getProjectLibVer(projectUri);
    }
}