import * as assert from 'assert';
import { withRandomFileEditor } from './testUtils';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	let baseCase = "\"$\"";
	test('Base case', () => {
		return withRandomFileEditor(baseCase, 'ts', async (editor, doc) => {
			await delay(500);
			await editor.insertSnippet(new vscode.SnippetString("{"), new vscode.Position(0, 2));
			await delay(1000);
			assert.equal(doc.getText(), "`${}`");
		});
	});

	let spacesBeforeContents = "\"     $\"";
	test('Spaces before', () => {
		return withRandomFileEditor(spacesBeforeContents, 'ts', async (editor, doc) => {
			await editor.insertSnippet(new vscode.SnippetString("{"), new vscode.Position(0, 7));
			await delay(500);
			assert.equal(doc.getText(), "`     ${}`");
		});
	});

	let spacesAfterContents = "\"$    \"";
	test('Spaces after', () => {
		return withRandomFileEditor(spacesAfterContents, 'ts', async (editor, doc) => {
			await editor.insertSnippet(new vscode.SnippetString("{"), new vscode.Position(0, 2));
			await delay(500);
			assert.equal(doc.getText(), "`${}    `");
		});
	});

	let wordsBeforeContents = "\"hello$\"";
	test('Words before', () => {
		return withRandomFileEditor(wordsBeforeContents, 'ts', async (editor, doc) => {
			await editor.insertSnippet(new vscode.SnippetString("{"), new vscode.Position(0, 7));
			await delay(500);
			assert.equal(doc.getText(), "`hello${}`");
		});
	});

	let wordsAfterContents = "\"$hello\"";
	test('Words after', () => {
		return withRandomFileEditor(wordsAfterContents, 'ts', async (editor, doc) => {
			await editor.insertSnippet(new vscode.SnippetString("{"), new vscode.Position(0, 2));
			await delay(500);
			assert.equal(doc.getText(), "`${}hello`");
		});
	});
	let notString = "$";
	test('Not a string', () => {
		return withRandomFileEditor(notString, 'ts', async (editor, doc) => {
			await editor.insertSnippet(new vscode.SnippetString("{"), new vscode.Position(0, 1));
			await delay(500);
			assert.equal(doc.getText(), "${");
		});
	});
	let inTemplateString = "\"const foo = `${var}${var2 ? `prefix ${var2}` : ''}`\"";
	test('In template string', () => {
		return withRandomFileEditor(inTemplateString, 'ts', async (editor, doc) => {
			await editor.insertSnippet(new vscode.SnippetString("${"), new vscode.Position(0, 50));
			await delay(500);
			assert.notEqual(doc.getText(), "const foo = `${var}${var2 ? `prefix ${var2}` : `${}`}`");
		});
	});
	let isEscaped = "\\$";
	test('Has escape char', () => {
		return withRandomFileEditor(isEscaped, 'ts', async (editor, doc) => {
			await editor.insertSnippet(new vscode.SnippetString("{"), new vscode.Position(0, 3));
			await delay(500);
			assert.strictEqual(doc.getText(), "\\${");
		});
	});
});
export function delay(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}