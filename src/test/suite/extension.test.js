import * as assert from 'assert';
import { withRandomFileEditor } from './testUtils';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');
	let contents = "\"$\"";
	test('Base case', () => {
		return withRandomFileEditor(contents, 'js', async (editor, doc) => {
			await editor.insertSnippet(new vscode.SnippetString("{"), new vscode.Position(0, 2));
			await delay(500);
			assert.equal(doc.getText(), "`${}`");
		});
	});

	let spacesBeforeContents = "\"     $\"";
	test('Spaces before', () => {
		return withRandomFileEditor(spacesBeforeContents, 'js', async (editor, doc) => {
			await editor.insertSnippet(new vscode.SnippetString("{"), new vscode.Position(0, 7));
			await delay(500);
			assert.equal(doc.getText(), "`     ${}`");
		});
	});

	let spacesAfterContents = "\"$    \"";
	test('Spaces after', () => {
		return withRandomFileEditor(spacesAfterContents, 'js', async (editor, doc) => {
			await editor.insertSnippet(new vscode.SnippetString("{"), new vscode.Position(0, 2));
			await delay(500);
			assert.equal(doc.getText(), "`${}    `");
		});
	});

	let wordsBeforeContents = "\"hello$\"";
	test('Words before', () => {
		return withRandomFileEditor(wordsBeforeContents, 'js', async (editor, doc) => {
			await editor.insertSnippet(new vscode.SnippetString("{"), new vscode.Position(0, 7));
			await delay(500);
			assert.equal(doc.getText(), "`hello${}`");
		});
	});

	let wordsAfterContents = "\"$hello\"";
	test('Words after', () => {
		return withRandomFileEditor(wordsAfterContents, 'js', async (editor, doc) => {
			await editor.insertSnippet(new vscode.SnippetString("{"), new vscode.Position(0, 2));
			await delay(500);
			assert.equal(doc.getText(), "`${}hello`");
		});
	});

	let insertInReverse = "\"{\"";
	test('Insert in reverse', () => {
		return withRandomFileEditor(insertInReverse, 'js', async (editor, doc) => {
			await editor.insertSnippet(new vscode.SnippetString("$"), new vscode.Position(0, 1));
			await delay(500);
			assert.equal(doc.getText(), "`${}`");
		});
	});
	
	let properBacktick = "`$`";
	test('Proper backtick not modified', () => {
		return withRandomFileEditor(properBacktick, 'js', async (editor, doc) => {
			await editor.insertSnippet(new vscode.SnippetString("{"), new vscode.Position(0, 2));
			await delay(500);
			assert.equal(doc.getText(), "`${`");
		});
	});
	let notString = "$";
	test('Not a string', () => {
		return withRandomFileEditor(notString, 'js', async (editor, doc) => {
			await editor.insertSnippet(new vscode.SnippetString("{"), new vscode.Position(0, 1));
			await delay(500);
			assert.equal(doc.getText(), "${");
		});
	});
});
export function delay(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}