import * as vscode_i from 'vscode';

export class Provider implements vscode_i.TreeDataProvider<Item> {
    getTreeItem(element: Item): Item {
        return element;
    }
    getChildren(element?: Item): Item[] | undefined {
        if (!element) {
            return [
                new Item('刷新并配置', 'kstm32_refresh', 'kstm32.refresh', '刷新项目资源并重新配置项目环境'),
                new Item('自动配置项目环境', 'kstm32_configure', 'kstm32.configure', '自动修改Makefile等文件'),
                new Item('重新编译', 'kstm32_make', 'kstm32.make', '运行make命令'),
                new Item('运行OpenOCD', 'kstm32_openocd', 'kstm32.ocd', '运行OpenOCD')
            ];
        }
        return undefined;
    }
}

class Item extends vscode_i.TreeItem {
    constructor(label: string, contextValue: string, command: string, tooltip: string) {
        super(label);
        this.contextValue = contextValue;
        this.command = {
            title: label,
            command: command
        };
        this.tooltip = tooltip;
    }
}
