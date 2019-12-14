import * as vscode from 'vscode'; 
export function activate(context: vscode.ExtensionContext) {

	let disposables = [
		vscode.commands.registerCommand('extension.touppercase', async () => {
			let editor = vscode.window.activeTextEditor;
			if (editor === undefined) {
				return;
			}
			for (let index = 0; index < editor.selections.length; index++) {
				const selection = editor.selections[index];
				if (selection.isEmpty) {
					continue;
				}
				let range = new vscode.Range(selection.start, selection.end);
				let oldText = editor.document.getText(range); 
				await editor.edit((textEdit) => { textEdit.replace(range, oldText.toUpperCase()); });
			}
		}),
		vscode.commands.registerCommand('extension.tolowercase', async () => {
			let editor = vscode.window.activeTextEditor;
			if (editor === undefined) {
				return;
			}
			for (let index = 0; index < editor.selections.length; index++) {
				const selection = editor.selections[index];
				if (selection.isEmpty) {
					continue;
				}
				let range = new vscode.Range(selection.start, selection.end);
				let oldText = editor.document.getText(range); 
				await editor.edit((textEdit) => { textEdit.replace(range, oldText.toLocaleLowerCase()); })
			}
		}),
		vscode.commands.registerCommand('extension.showlinebreak', async () => {
			let editor = vscode.window.activeTextEditor;
			if (editor === undefined) {
				return;
			}
			const decorationTypeCR = vscode.window.createTextEditorDecorationType({
				light:{
					backgroundColor: 'black',
					color: 'white'
				},
				dark:{
					"after":{
						contentText : "CR", 
						backgroundColor: 'white',
						color: 'black',
						margin: "3px", 
						border: "1px solid white;border-radius:5px;",
						fontStyle: "inherit;margin:0px;"
					} 
				}
			});
			const lineBreaks : vscode.DecorationOptions[] = [];
			for (let index = 0; index < editor.document.lineCount; index++) {
				let line = editor.document.lineAt(index);
				let lineRange = line.range;
				
				let r1 = lineRange.with(new vscode.Position(line.lineNumber,lineRange.end.character + 1),new vscode.Position(line.lineNumber,lineRange.end.character + 2 ));
				lineBreaks.push({range:r1});
			}
			editor.setDecorations(decorationTypeCR,lineBreaks);
		})
	];

	context.subscriptions.push(...disposables);
}

export function deactivate() { }
