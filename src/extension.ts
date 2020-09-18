import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	console.log('String template converter is running!');

	vscode.workspace.onDidChangeTextDocument(e => {
		let configuration = vscode.workspace.getConfiguration();
		let quoteType = configuration.get<{}>('template-string-converter.quoteType');
		let enabled = configuration.get<{}>('template-string-converter.enabled');

		if (enabled) {
			let changes = e.contentChanges[0];
			let lineNumber = changes.range.start.line;
			let currentChar = changes.range.start.character;
			let lineText = e.document.lineAt(lineNumber).text;

			let startPosition = new vscode.Position(lineNumber, currentChar - 1);
			let endPosition = new vscode.Position(lineNumber, currentChar);

			let openingQuotePosition = new vscode.Position(lineNumber, getStartQuote(lineText, getQuoteChar(quoteType)));
			let endQuotePosition = new vscode.Position(lineNumber, getEndQuote(lineText, getQuoteChar(quoteType)));

			let priorChar = e.document.getText(new vscode.Range(startPosition, endPosition));
			let nextChar = e.document.getText(new vscode.Range(startPosition.translate(undefined, 2), endPosition.translate(undefined, 2)));

			if (!lineText.includes("//")) {
				if (changes.text === "{" && priorChar === "$") {
					let edit = new vscode.WorkspaceEdit();
					edit.replace(e.document.uri, new vscode.Range(openingQuotePosition, openingQuotePosition.translate(undefined, 1)), "`");
					edit.insert(e.document.uri, endPosition.translate(undefined, 1), "}");
					edit.replace(e.document.uri, new vscode.Range(endQuotePosition, endQuotePosition.translate(undefined, 1)), "`");
					vscode.workspace.applyEdit(edit);
				} else if (changes.text === "$" && nextChar === "{") {
					let edit = new vscode.WorkspaceEdit();
					edit.replace(e.document.uri, new vscode.Range(openingQuotePosition, openingQuotePosition.translate(undefined, 1)), "`");
					edit.insert(e.document.uri, endPosition.translate(undefined, 2), "}");
					edit.replace(e.document.uri, new vscode.Range(endQuotePosition, endQuotePosition.translate(undefined, 1)), "`");
					vscode.workspace.applyEdit(edit);
				}
			}
		}
	});
}

let getQuoteChar = (type: any) => {
	if (!type || type === "both") {
		return "both";
	} else if (type === "single") {
		return "'";
	} else {
		return "\"";
	}
};

let getStartQuote = (line: string, type: string) => {
	if (type === "both") {
		let double = line.toString().indexOf("\"");
		let single = line.toString().indexOf("'");
		if (double >= 0) {
			return double;
		} else {
			return single;
		}
	} else {
		return line.toString().indexOf(type);
	}
};

let getEndQuote = (line: string, type: string) => {
	if (type === "both") {
		let double = line.toString().lastIndexOf("\"");
		let single = line.toString().lastIndexOf("'");
		if (double >= 0) {
			return double;
		} else {
			return single;
		}
	} else {
		return line.toString().lastIndexOf(type);
	}
};

export function deactivate() { }