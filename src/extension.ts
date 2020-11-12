import * as vscode from "vscode";

type QuoteType = "both" | "single" | "double";
type QuoteChar = "both" | `'` | `"`;

export function activate(context: vscode.ExtensionContext) {
  vscode.workspace.onDidChangeTextDocument(async (e) => {

    const configuration = vscode.workspace.getConfiguration();
    const quoteType = configuration.get<QuoteType>("template-string-converter.quoteType");
    const enabled = configuration.get<{}>("template-string-converter.enabled");
    const changes = e.contentChanges[0];
    const validLanguages = configuration.get<string[]>("template-string-converter.validLanguages");
    const addBracketsToProps = configuration.get<{}>("template-string-converter.addBracketsToProps");
    const removeBackticks = configuration.get<{}>("template-string-converter.autoRemoveTemplateString");
    const autoClosingBrackets = configuration.get<{}>("editor.autoClosingBrackets");

    if (
      enabled &&
      quoteType &&
      changes &&
      validLanguages?.includes(e.document.languageId)
    ) {
      try {
        for (const selection of vscode.window.activeTextEditor!.selections) {
          const lineNumber = selection.start.line;
          const currentChar = changes.range.start.character;
          const lineText = e.document.lineAt(lineNumber).text;

          const startPosition = new vscode.Position(lineNumber, currentChar - 1);
          const endPosition = new vscode.Position(lineNumber, currentChar);

          const startQuoteIndex = getStartQuote(
            lineText.substring(0, currentChar),
            getQuoteChar(quoteType)
          );
          const endQuoteIndex =
            getEndQuote(
              lineText.substring(currentChar + 1, lineText.length),
              getQuoteChar(quoteType)
            ) +
            currentChar +
            1;

          const openingQuotePosition = new vscode.Position(
            lineNumber,
            startQuoteIndex
          );
          const endQuotePosition = new vscode.Position(lineNumber, endQuoteIndex);

          const priorChar = e.document.getText(
            new vscode.Range(startPosition, endPosition)
          );

          if (
            notAComment(lineText, currentChar, startQuoteIndex, endQuoteIndex) &&
            lineText.charAt(startQuoteIndex) === lineText.charAt(endQuoteIndex)
          ) {

            const regex = new RegExp(/<.*=(("|')[^`]*(\${}|\${)[^`]*("|')).*>.*(<\/.*>)?/gm);
            const matches = lineText.match(regex);

            if (
              withinBackticks(lineText, currentChar, lineNumber, e.document) &&
              !lineText.slice(startQuoteIndex + 1, endQuoteIndex).match(/\$\{/) &&
              removeBackticks
            ) {
              const edit = new vscode.WorkspaceEdit();

              edit.replace(
                e.document.uri,
                new vscode.Range(
                  openingQuotePosition,
                  openingQuotePosition.translate(undefined, 1)
                ),
                quoteType === 'single' ? '\'' : '"',
              );

              edit.replace(
                e.document.uri,
                new vscode.Range(
                  endQuotePosition,
                  endQuotePosition.translate(undefined, 1)
                ),
                quoteType === 'single' ? '\'' : '"',
              );

              await vscode.workspace.applyEdit(edit);
              return;
            }
            if (
              matches !== null &&
              addBracketsToProps
            ) {
              if (changes.text === "{" && priorChar === "$") {
                const edit = new vscode.WorkspaceEdit();
                edit.replace(
                  e.document.uri,
                  new vscode.Range(
                    openingQuotePosition,
                    openingQuotePosition.translate(undefined, 1)
                  ),
                  "{"
                );
                edit.replace(
                  e.document.uri,
                  new vscode.Range(
                    endQuotePosition,
                    endQuotePosition.translate(undefined, 1)
                  ),
                  "}"
                );
                edit.insert(
                  e.document.uri,
                  new vscode.Position(lineNumber, currentChar + 1),
                  '}'
                );
                edit.insert(
                  e.document.uri,
                  new vscode.Position(lineNumber, endQuoteIndex),
                  "`"
                );
                edit.insert(
                  e.document.uri,
                  new vscode.Position(lineNumber, startQuoteIndex + 1),
                  "`"
                );
                await vscode.workspace.applyEdit(edit);
                if (vscode.window.activeTextEditor) {
                  vscode.window.activeTextEditor.selections.push(new vscode.Selection(
                    lineNumber,
                    currentChar + 2,
                    lineNumber,
                    currentChar + 2
                  ));
                }
                return;
              } else if (changes.text === "{}" && priorChar === "$") {
                const edit = new vscode.WorkspaceEdit();
                edit.replace(
                  e.document.uri,
                  new vscode.Range(
                    openingQuotePosition,
                    openingQuotePosition.translate(undefined, 1)
                  ),
                  "{"
                );
                edit.replace(
                  e.document.uri,
                  new vscode.Range(
                    endQuotePosition,
                    endQuotePosition.translate(undefined, 1)
                  ),
                  "}"
                );
                edit.insert(
                  e.document.uri,
                  new vscode.Position(lineNumber, endQuoteIndex),
                  "`"
                );
                edit.insert(
                  e.document.uri,
                  new vscode.Position(lineNumber, startQuoteIndex + 1),
                  "`"
                );
                await vscode.workspace.applyEdit(edit);
                if (vscode.window.activeTextEditor) {
                  vscode.window.activeTextEditor.selections.push(new vscode.Selection(
                    lineNumber,
                    currentChar + 2,
                    lineNumber,
                    currentChar + 2
                  ));
                }
                return;
              }
            } else if (
              !withinBackticks(lineText, currentChar, lineNumber, e.document)
            ) {
              if (changes.text === "{}" && priorChar === "$") {
                const edit = new vscode.WorkspaceEdit();
                edit.replace(
                  e.document.uri,
                  new vscode.Range(
                    openingQuotePosition,
                    openingQuotePosition.translate(undefined, 1)
                  ),
                  "`"
                );
                edit.replace(
                  e.document.uri,
                  new vscode.Range(
                    endQuotePosition,
                    endQuotePosition.translate(undefined, 1)
                  ),
                  "`"
                );
                await vscode.workspace.applyEdit(edit);
                if (vscode.window.activeTextEditor) {
                  vscode.window.activeTextEditor.selections.push(new vscode.Selection(
                    lineNumber,
                    currentChar + 1,
                    lineNumber,
                    currentChar + 1
                  ));
                }
              } else if (
                changes.text === "{" &&
                priorChar === "$" &&
                autoClosingBrackets !== 'never'
              ) {
                const edit = new vscode.WorkspaceEdit();
                edit.replace(
                  e.document.uri,
                  new vscode.Range(
                    openingQuotePosition,
                    openingQuotePosition.translate(undefined, 1)
                  ),
                  "`"
                );
                edit.insert(
                  e.document.uri,
                  endPosition.translate(undefined, 1),
                  "}"
                );
                edit.replace(
                  e.document.uri,
                  new vscode.Range(
                    endQuotePosition,
                    endQuotePosition.translate(undefined, 1)
                  ),
                  "`"
                );
                await vscode.workspace.applyEdit(edit);
                if (vscode.window.activeTextEditor) {
                  vscode.window.activeTextEditor.selections.push(new vscode.Selection(
                    lineNumber,
                    currentChar + 1,
                    lineNumber,
                    currentChar + 1
                  ));
                }
              } else if (
                autoClosingBrackets === 'never' &&
                priorChar === '$' &&
                changes.text === '{'
              ) {
                const edit = new vscode.WorkspaceEdit();
                edit.replace(
                  e.document.uri,
                  new vscode.Range(
                    openingQuotePosition,
                    openingQuotePosition.translate(undefined, 1)
                  ),
                  "`"
                );
                edit.replace(
                  e.document.uri,
                  new vscode.Range(
                    endQuotePosition,
                    endQuotePosition.translate(undefined, 1)
                  ),
                  "`"
                );
                await vscode.workspace.applyEdit(edit);
                if (vscode.window.activeTextEditor) {
                  vscode.window.activeTextEditor.selections.push(new vscode.Selection(
                    lineNumber,
                    currentChar + 1,
                    lineNumber,
                    currentChar + 1
                  ));
                }
              }
            }
          }
        }
      } catch { }
    }
  });
}

const notAComment = (
  line: string,
  charIndex: number,
  startQuoteIndex: number,
  endquoteIndex: number
) => {
  if (line.substring(0, charIndex).includes("//")) {
    return (
      line.substring(0, charIndex).indexOf("//") > startQuoteIndex &&
      line.substring(0, charIndex).indexOf("//") < endquoteIndex
    );
  } else {
    return true;
  }
};

const withinBackticks = (line: string, currentCharIndex: number, cursorLine: number, document: vscode.TextDocument) => {
  const withinLine =
    line.substring(0, currentCharIndex).includes("`") &&
    line.substring(currentCharIndex, line.length).includes("`")
    ;
  if (withinLine) {
    return withinLine;
  } else {
    const lineIndex = cursorLine;
    const currentLine = document.lineAt(lineIndex).text;
    return hasStartBacktick(lineIndex, currentLine, document) && hasEndBacktick(lineIndex, currentLine, document);
  }
};

const hasStartBacktick = (lineIndex: number, currentLine: string, document: vscode.TextDocument) => {
  while (lineIndex > 0) {
    const backTick = currentLine.indexOf("`");
    const semiColon = currentLine.indexOf(";");
    const comma = currentLine.indexOf(",");
    if (backTick >= 0 && semiColon >= 0 && semiColon < backTick) {
      return true;
    } else if (backTick >= 0 && semiColon >= 0 && semiColon > backTick) {
      return false;
    } else if (backTick >= 0 && comma >= 0 && comma < backTick) {
      return true;
    } else if (backTick >= 0 && comma >= 0 && comma > backTick) {
      return false;
    } else if (backTick >= 0) {
      return true;
    } else if (semiColon >= 0 || comma >= 0) {
      return false;
    }
    lineIndex -= 1;
    currentLine = document.lineAt(lineIndex).text;
  }
  return false;
};

const hasEndBacktick = (lineIndex: number, currentLine: string, document: vscode.TextDocument) => {
  while (lineIndex < document.lineCount) {
    const backTick = currentLine.indexOf("`");
    const semiColon = currentLine.indexOf(";");
    const comma = currentLine.indexOf(",");
    if (backTick >= 0 && semiColon >= 0 && semiColon > backTick) {
      return true;
    } else if (backTick >= 0 && semiColon >= 0 && semiColon < backTick) {
      return false;
    } else if (backTick >= 0 && comma >= 0 && comma > backTick) {
      return true;
    } else if (backTick >= 0 && comma >= 0 && comma < backTick) {
      return false;
    } else if (backTick >= 0) {
      return true;
    } else if (semiColon >= 0) {
      return false;
    } else if (comma >= 0) {
      return false;
    }
    lineIndex += 1;
    currentLine = document.lineAt(lineIndex).text;
  }
  return false;
};

const getQuoteChar = (type: QuoteType): QuoteChar => {
  if (!type || type === "both") {
    return "both";
  } else if (type === "single") {
    return "'";
  } else {
    return '"';
  }
};

const getStartQuote = (line: string, quoteChar: QuoteChar): number => {
  if (quoteChar === "both") {
    const double = line.toString().lastIndexOf('"');
    const single = line.toString().lastIndexOf("'");
    const back = line.toString().lastIndexOf("`");
    if (double >= 0) {
      return double;
    } else if (single >= 0) {
      return single;
    } else {
      return back;
    }
  } else {
    return line.toString().lastIndexOf('`') !== -1 ? line.toString().lastIndexOf('`') : line.toString().lastIndexOf(quoteChar);
  }
};
const getEndQuote = (line: string, quoteChar: QuoteChar): number => {
  if (quoteChar === "both") {
    const double = line.toString().indexOf('"');
    const single = line.toString().indexOf("'");
    const back = line.toString().indexOf("`");
    if (double >= 0) {
      return double;
    } else if (single >= 0) {
      return single;
    } else if (back >= 0) {
      return back;
    } else {
      return -1;
    }
  } else {
    return line.toString().indexOf('`') !== -1 ? line.toString().indexOf('`') : line.toString().indexOf(quoteChar);
  }
};

export function deactivate() { }