import * as vscode from 'vscode';
import { createHash } from 'crypto';

export interface SelectedLine {
    lineNumber: number;
    text: string;
    range: vscode.Range;
    selectedText: string;
    selectedRange: vscode.Range | undefined;
}

export interface DecorationRecord {
    textEditor: vscode.TextEditor;
    decorationType: vscode.TextEditorDecorationType;
    ranges: vscode.Range[];
}

export interface Command {
    name: string;
    actions: any[];
    params?: { [key: string]: any; };
    allowEditorIsNull?: boolean;
}

export class Processer {

    private _outputchannel?: vscode.OutputChannel;

    public makeUuid(): Processer {
        let uuid = Utils.makeUuid();
        this.showMsg(uuid);
        return this;
    }

    public makepass(len: number): Processer {
        let pass = Utils.makePass(len);
        this.showMsg(pass);
        return this;
    }

    public showMsg(msg: string) {
        const outputChannel = this.getOutputChannel();
        outputChannel.appendLine(msg);
        outputChannel.show();
    }
    public getOutputChannel(): vscode.OutputChannel {
        if (this._outputchannel === undefined) {
            this._outputchannel = vscode.window.createOutputChannel("PowerTools");
        }
        return this._outputchannel;
    }
}

export class TextProcesser extends Processer {
    private _editor: vscode.TextEditor;
    private static _decorationRecords: Array<DecorationRecord> = new Array<DecorationRecord>();

    public constructor(editor: vscode.TextEditor) {
        super();
        this._editor = editor;
    }

    public async copyDoc(): Promise<TextProcesser> {
        let content = this._editor.document.getText();
        let doc = await vscode.workspace.openTextDocument({ content: content, language: this._editor.document.languageId });
        vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
        return this;
    }

    public async mapSelections(ranges: vscode.Selection[], fn: (str: string) => string): Promise<TextProcesser> {
        for (let index = 0; index < ranges.length; index++) {
            const selection = ranges[index];
            if (selection.isEmpty) {
                continue;
            }
            let oldText = this._editor.document.getText(selection);
            await this._editor.edit((textEdit) => { textEdit.replace(selection, fn(oldText)); });
        }
        return this;
    }

    public async mapSelection(range: vscode.Selection, fn: (str: string) => string): Promise<TextProcesser> {
        return this.mapSelections([range], fn);
    }

    public mark(ranges: vscode.Selection[]) {
        let dr = TextProcesser.getMarkDecorationRecord(this._editor);
        dr.ranges.push(...ranges);
        this._editor.setDecorations(dr.decorationType, dr.ranges);
    }

    public unmark(ranges: vscode.Selection[]) {
        let dr = TextProcesser.getMarkDecorationRecord(this._editor);
        ranges.forEach(range => {
            let len = dr.ranges.length;
            let index = 0;
            while (index < dr.ranges.length) {
                const markRange = dr.ranges[index];
                if (markRange.contains(range)) {
                    dr.ranges.splice(index, 1);
                } else {
                    index++;
                }
            }
        });
        this.resetMarkDecorationType();
        this._editor.setDecorations(dr.decorationType, dr.ranges);
    }

    public static getMarkDecorationRecord(editor: any): DecorationRecord {
        for (let index = 0; index < TextProcesser._decorationRecords.length; index++) {
            const decorationRecord = TextProcesser._decorationRecords[index];
            if ((<any>decorationRecord.textEditor).id === editor.id) {
                return decorationRecord;
            }
        }
        let decorationRecord = { textEditor: editor, ranges: new Array<vscode.Range>(), decorationType: TextProcesser.getMarkTextEditorDecorationType() };
        TextProcesser._decorationRecords.push(decorationRecord);
        return decorationRecord;
    }

    public async reverse(lines: SelectedLine[]): Promise<SelectedLine[]> {
        await this._editor.edit((textEdit) => {
            let start = lines[0].lineNumber;
            let length = lines.length;
            let end = start + length - 1;
            for (let index = 0; index < length; index++) {
                const line = this._editor.document.lineAt(start + index);
                const replaceLine = this._editor.document.lineAt(end - index);
                textEdit.replace(line.range, replaceLine.text); 
                lines[index].lineNumber = end - index;
            }
        });
        return lines.reverse();
    }

    public resetMarkDecorationType() {
        let dr = TextProcesser.getMarkDecorationRecord(this._editor);
        dr.decorationType.dispose();
        dr.decorationType = TextProcesser.getMarkTextEditorDecorationType();
    }

    public static getMarkTextEditorDecorationType() {
        return vscode.window.createTextEditorDecorationType({ "rangeBehavior": vscode.DecorationRangeBehavior.ClosedClosed, "dark": { "backgroundColor": "#3300FF" }, "light": { "backgroundColor": "#FFCC99" } });
    }

    public cal(lines: SelectedLine[], fn: (nums: number[]) => number) {
        let columnBlock = this.isColumnBlock();
        let nums = new Array<number>();
        for (let index = 0; index < lines.length; index++) {
            const line = lines[index];
            const txt = (columnBlock ? line.selectedText : line.text).trim();
            if (!/^[0-9]+$/.test(txt)) {
                this.showMsg(`[line:${line.lineNumber}][text:${txt}] is not a number`);
                return;
            }
            const num = parseFloat(txt);
            nums.push(num);
        }
        this.showMsg(fn(nums).toString());
    }

    public deleteLineChars(lines: SelectedLine[], pattern: string) {
        this._editor.edit((textEdit) => {
            let start = lines[0].lineNumber;
            let length = lines.length;
            for (let index = 0; index < length; index++) {
                const line = this._editor.document.lineAt(start + index);
                textEdit.replace(line.range, line.text.replace(RegExp(pattern), ""));
            }
        });
    }

    public removeLine(lines: SelectedLine[], filter: (line: vscode.TextLine) => boolean) {
        this._editor.edit((textEdit) => {
            let start = lines[0].lineNumber;
            let length = lines.length;
            for (let index = 0; index < length; index++) {
                const line = this._editor.document.lineAt(start + index);
                if (filter(line)) {
                    textEdit.delete(line.rangeIncludingLineBreak);
                }
            }
        });
    }
    public async sort(lines: SelectedLine[], compareFn: (a: SelectedLine, b: SelectedLine) => number): Promise<SelectedLine[]> {
        let start = lines[0].lineNumber;
        let length = lines.length;
        lines.sort(compareFn);
        await this._editor.edit((textEdit) => {
            for (let index = 0; index < length; index++) {
                const line = this._editor.document.lineAt(start + index);
                const replaceLine = lines[index];
                textEdit.replace(line.range, replaceLine.text);
                lines[index].lineNumber = start + index;
            }
        });
        return lines;
    }

    public md5(range: vscode.Range): TextProcesser {
        let text = this._editor.document.getText(range);
        let hashText = Utils.hash(text, "md5");
        this.showMsg(hashText);
        return this;
    }

    public sha1(range: vscode.Range): TextProcesser {
        let text = this._editor.document.getText(range);
        let hashText = Utils.hash(text, "sha1");
        this.showMsg(hashText);
        return this;
    }

    public getProcessLines(): SelectedLine[] {
        return this.isSelectNothing() ? this.getAllLines() : this.getSelectedLines();
    }

    public getProcessSelection(): vscode.Range {
        return this.isSelectNothing() ? this.getWholeSelected() : this._editor.selection;
    }

    public getProcessSelections(): vscode.Range[] {
        return this._editor.selections;
    }

    public getWholeSelected(): vscode.Range {
        return new vscode.Range(this._editor.document.positionAt(0), this._editor.document.positionAt(this._editor.document.getText().length));
    }

    public getAllLines(): SelectedLine[] {
        let lines = new Array<SelectedLine>();
        for (let index = 0; index < this._editor.document.lineCount; index++) {
            const line = this._editor.document.lineAt(index);
            lines.push({ lineNumber: line.lineNumber, text: line.text, range: line.range, selectedText: line.text, selectedRange: line.range });
        }
        return lines;
    }

    public getSelectedLines(): SelectedLine[] {
        let columnBlock = this.isColumnBlock();
        let lines = new Array<SelectedLine>();
        for (let index = 0; index < this._editor.selections.length; index++) {
            const selection = this._editor.selections[index];
            for (let lineNum = selection.start.line; lineNum <= selection.end.line; lineNum++) {
                const line = this._editor.document.lineAt(lineNum);
                const range = line.range.intersection(selection);
                const selectedText = columnBlock ? this._editor.document.getText(range) : line.text;
                lines.push({ lineNumber: line.lineNumber, text: line.text, range: line.range, selectedText: selectedText, selectedRange: range });
            }
        }
        return lines;
    }
    public isSelectNothing(): boolean {
        return this._editor.selections.length === 1 && this._editor.selection.start.isEqual(this._editor.selection.end);
    }

    public isColumnBlock() {
        let firstSelection = this._editor.selection;
        return this._editor.selections.length > 1 && this._editor.selections.reduce<boolean>((previousValue, currentValue) => { return previousValue && currentValue.start.character === firstSelection.start.character && currentValue.end.character <= firstSelection.end.character; }, true);
    }
}

export class Utils {
    public static toNumber(str: string): number {
        return parseFloat(str.trim().replace(",", ""));
    }
    public static makeUuid(): string {
        let uuidValue = "";
        for (let index = 0; index < 32; index++) {
            let randomValue = Math.random() * 16 | 0;
            uuidValue += randomValue.toString(16);
        }
        return uuidValue;
    }

    public static makePass(len: number): string {
        let pass = "";
        let chars = ["abcdefghijklmnopqrstuvwxyz", "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "~!@#￥%^&*[],.;"];
        for (let index = 0; index < len; index++) {
            let randomValue = Math.random() * 10 | 0;
            let charType = randomValue < 4 ? 0 : randomValue < 8 ? 1 : 2;
            pass += chars[charType][Math.random() * chars[charType].length | 0];
        }
        return pass;
    }

    public static hash(text: string, algo: string): string {
        let hash = createHash(algo);
        hash.write(text, "string");
        let hashText = hash.digest().toString("hex");
        return hashText;
    }
}

export class CommandContext {
    public static regist(context: vscode.ExtensionContext, commands: Command[]): void {
        commands.forEach(command => {
            let disposable = CommandContext.registCommand(command);
            context.subscriptions.push(disposable);
        });
    }

    public static registCommand(command: Command): vscode.Disposable {
        let doActions = CommandContext.registActions(command, TextProcesser);
        return vscode.commands.registerCommand(command.name, () => {
            if (!vscode.window.activeTextEditor && !command.allowEditorIsNull) {
                return;
            }
            let processer: Processer = command.allowEditorIsNull
                ? new Processer()
                : new TextProcesser(<vscode.TextEditor>vscode.window.activeTextEditor);
            doActions(processer);
        });
    }

    public static registActions(command: Command, target: Function): Function {
        let actions = command.actions.map((action) => { return CommandContext.resolveAction(action, target); });
        let fn = async (p: Processer) => {
            let context: { [key: string]: any; } = command.params ? command.params : {};
            for (let index = 0; index < actions.length; index++) {
                const action = actions[index];
                let func = action.func;
                let params = new Array<any>();
                for (let index = 0; index < action.params.length; index++) {
                    const paramName = action.params[index];
                    const paramValue = context[paramName];
                    if (!paramValue) {
                        return;
                    }
                    params.push(paramValue);
                }
                let result = await func.call(p, ...params);
                context[index.toString()] = result;
            }
        };
        return fn;
    }

    public static resolveAction(action: any, target: Function): { func: Function, params: string[] } {
        if (typeof action === "function") {
            return { "func": action, params: new Array<string>() };
        }
        let actionObj = CommandContext.resolveActionStr(action);
        return { "func": target.prototype[actionObj.name], params: actionObj.params };
    }

    public static resolveActionStr(action: string): { name: string, params: string[] } {
        let regexWhole = /^([a-zA-Z_][a-zA-Z_0-9]*)(\(.*?\))?$/g;
        let regexParam = /\$[a-zA-Z_0-9]+/g;
        let matches = <RegExpExecArray>regexWhole.exec(action);
        let name = matches[1];
        let result: { name: string, params: string[] } = { "name": name, "params": new Array<string>() };
        if (matches.length > 2 && matches[2]) {
            let matchParms = matches[2].match(regexParam);
            result.params = matchParms ? matchParms.map((m) => { return m.substr(1); }) : result.params;
        }
        return result;
    }
}