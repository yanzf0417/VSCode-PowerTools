# ReadMe

PowerTools目的是扩展VSCode文本处理能力,提供转换大小写、base64编码解码、排序行，哈希文本、自定义扩展指令等功能。 

## 主要功能

### 自定义扩展指令
- [如何编写自定义扩展指令文件](#Custom%20Command)
- [配置](#配置指令文件路径)
### 文本处理

- 大小写转换
- base64编码/解码
- 移除空行
- 移除首尾空格
- 筛选行

### 行处理
- 按文本排序行
- 按数字排序行
- 翻转行

### 其他功能
- 选中文本哈希
- 生成32位随机串
- 生成强密码
- 对选中文本求和
- 对选中文本取平均数字

### 演示
#### 功能列表截图
![list](https://github.com/yanzf0417/assets/blob/master/powertools/list.png?raw=true)

#### 大小写转换
![toupper](https://github.com/yanzf0417/assets/blob/master/powertools/toupper.gif?raw=true)

#### 行排序
![sort](https://github.com/yanzf0417/assets/blob/master/powertools/sort.gif?raw=true)

#### base64编码
![base64](https://github.com/yanzf0417/assets/blob/master/powertools/base64.gif?raw=true)

#### 求和
![sum](https://github.com/yanzf0417/assets/blob/master/powertools/sum.gif?raw=true)

#### 翻转行
![reverse](https://github.com/yanzf0417/assets/blob/master/powertools/reverse.gif?raw=true)


## Custom Command
插件支持用户通过加载外部js文件来达到扩展功能的目的。对于有自定义扩展需求的用户，可以参照以下步骤来实现。

## 一.编写js文件
在本地新建一个js文件，复制以下内容：
```javascript
module.exports.custom_toupper = async function(context) {
    var text = context.getText();
    await context.setText(text.toUpperCase());
}
```
这段代码的作用是导出一个名字为`custom_toupper`的自定义指令，这个指令的作用是将选中文本转成大写。

现在我们看看函数的实现，可以注意到函数有一个`context`参数，插件会在运行时把当前上下文对象注入到该参数。`context`暴露了以下方法供用户使用：
#### `function getText(): string;`
获取选中文本

#### `function setText(text: string): Promise<void>;`
将当前选中内容设置为指定文本

#### `function require(module: string): any;`
用于加载外部模块
```javascript
var vscode = context.require('vscode');
```
> PS: 对于大部分情况，vscode模块将会是最常使用的，相关vscode-api请点击[这里](https://code.visualstudio.com/api/references/vscode-api)查看。

#### `function getEditor(): vscode.TextEditor;`
获取当前要执行指令的编辑器
```javascript
var editor = context.getEditor();
```

#### `function getProcessSelection(): vscode.Range;`
获取当前待处理区域。请注意以下两点：
- 当没有选择任何文本时，会选择整个文档内容
- 当选择了多个区域，会返回第一个
以下代码会打印当前选择文本：
```javascript 
var editor = context.getEditor();
var selection = context.getProcessSelection();
var text = editor.document.getText(selection);
context.print(text);
```

#### `public async edit(changes: [vscode.Range, string][]): Promise<boolean>;`
更新指定区域文本，支持一次更改多个，在一个事务操作中完成。
例如以下代码将每行第一个字符转成大写：
```javascript
module.exports.toUpper = async function (context) {
    var vscode = context.require('vscode');
    var editor = context.getEditor();
    var changes = new Array();
    var document = editor.document;
    for (var index = 0; index < document.lineCount; index++) {
        var line = document.lineAt(index);
        if (line.isEmptyOrWhitespace) {
            continue;
        }
        var range = line.range.with(new vscode.Position(line.lineNumber, 0), new vscode.Position(line.lineNumber, 1));
        var changeText = document.getText(range).toUpperCase();
        changes.push([range, changeText]);
    }
    await context.edit(changes);
}
```
#### `public isColumnBlock(): boolean;`
判断当前选择内容是否列模式

```javascript
 var columnBlock = context.isColumnBlock();
 context.print(columnBlock);
```

#### `public print(): void;`
打印文本


## 二.配置指令文件路径
##### 1）通过`文件菜单` -> `首选项` -> `设置` -> `扩展` -> `PowerTools`，然后点击`在setting.json中编辑`。
##### 2）在配置文件末尾加上以下节点：
```json
"powertools.CommandFiles": []
```
- 支持配置多个
- 支持配置文件夹，当路径时文件夹时，自动加载该文件夹下所有js文件
  
操作演示：
![configcustom](https://github.com/yanzf0417/assets/blob/master/powertools/configcustom.gif?raw=true)

## Release Notes 

### 1.0.2
自定义指令新增支持getText和setText方法方便快速修改文本

### 1.0.1

支持用户自定义扩展指令

### 1.0.0

Initial release
 
**Enjoy!**
