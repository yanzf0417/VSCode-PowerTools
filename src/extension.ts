import * as vscode from 'vscode';
import { CommandContext, TextProcesser } from './lib';
import { config } from './config';

export function activate(context: vscode.ExtensionContext) {
	CommandContext.regist(context, config);
	vscode.window.onDidChangeActiveTextEditor((editor) => {
		if (!editor) {
			return;
		}
		let dr = TextProcesser.getMarkDecorationRecord(editor);
		editor.setDecorations(dr.decorationType, dr.ranges);
	}); 
}

export function deactivate() { }
