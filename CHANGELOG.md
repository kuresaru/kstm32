# Change Log

All notable changes to the "kstm32" extension will be documented in this file


## [0.1.3]

- 加入手动添加Source的功能.
- 加入排除自动扫描到的Source功能.


## [0.1.2]

- 加入手动添加Include路径的功能.
- 加入排除自动Include路径的功能.

## [0.1.1]

- 在使用编辑器创建或删除文件时，自动重新配置项目，重新生成Makefile。
- 创建新工程且目录非空时，给出提示确认是否继续，而不是直接取消报错。
- C/CPP插件Include Path加入标准库src目录，Ctrl单击跳转时能跳转到库源码。
- 自动动态生成用于启动OpenOCD的配置文件功能。
- 项目Makefile动态部分分离，方便Git管理。
- 库路径有空格时给出警告。


## [0.0.1]

- Initial release