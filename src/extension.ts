import * as vscode from "vscode";

type QuoteType = "both" | "single" | "double";
type QuoteChar = "both" | `'` | `"` | '`';
type Position = "start" | "end";

export function activate(context: vscode.ExtensionContext) {
  let previousDocument: DocumentCopy | undefined = undefined;
  vscode.workspace.onDidChangeTextDocument(async (e) => {
    const configuration = vscode.workspace.getConfiguration();
    const quoteType = configuration.get<QuoteType>("template-string-converter.quoteType");
    const enabled = configuration.get<boolean>("template-string-converter.enabled");
    const changes = e.contentChanges[0];
    const validLanguages = configuration.get<string[]>("template-string-converter.validLanguages");
    const addBracketsToProps = configuration.get<boolean>("template-string-converter.addBracketsToProps");
    const removeBackticks = configuration.get<boolean>("template-string-converter.autoRemoveTemplateString");
    const autoClosingBrackets = configuration.get<{}>("editor.autoClosingBrackets");
    const convertOutermostQuotes = configuration.get<boolean>("template-string-converter.convertOutermostQuotes");
    const convertWithinTemplateString = configuration.get<boolean>("template-string-converter.convertWithinTemplateString");
    const filesExcluded = configuration.get<{[key: string]: boolean}>("template-string-converter.filesExcluded")
    if (
      enabled &&
      quoteType &&
      changes &&
      validLanguages?.includes(e.document.languageId) &&
      includeFile(e.document.fileName, filesExcluded)
    ) {
      try {
        let selections: vscode.Selection[] = [];
        if (!vscode.window.activeTextEditor || vscode.window.activeTextEditor.selections.length === 0) {
          return;
        }
        for (const selection of vscode.window.activeTextEditor.selections) {
          const lineNumber = selection.start.line;
          const currentChar = changes.range.start.character;
          const lineText = e.document.lineAt(lineNumber).text;

          if (currentChar < 1) {
            return;
          }

          const startPosition = new vscode.Position(lineNumber, currentChar - 1);
          const endPosition = new vscode.Position(lineNumber, currentChar);

          const startQuoteIndex = getQuoteIndex(lineText.substring(0, currentChar), getQuoteChar(quoteType), 'start', convertOutermostQuotes);
          if (startQuoteIndex < 0) {
            return;
          }

          const endQuoteIndex = currentChar + 1 + getQuoteIndex(lineText.substring(currentChar + 1, lineText.length), getQuoteChar(quoteType), 'end', convertOutermostQuotes);

          const startQuotePosition = new vscode.Position(lineNumber, startQuoteIndex);
          const endQuotePosition = new vscode.Position(lineNumber, endQuoteIndex);

          const priorChar = e.document.getText(new vscode.Range(startPosition, endPosition));
          const nextChar = e.document.getText(new vscode.Range(startPosition.translate(0, 2), endPosition.translate(0, 2)));
          const nextTwoChars = e.document.getText(new vscode.Range(startPosition.translate(0, 2), endPosition.translate(0, 3)));

          if (
            notAComment(lineText, currentChar, startQuoteIndex, endQuoteIndex) &&
            lineText.charAt(startQuoteIndex) === lineText.charAt(endQuoteIndex)
          ) {

            const regex = new RegExp(/<\/?(?:[\w.:-]+\s*(?:\s+(?:[\w.:$-]+(?:=(?:"(?:\\[^]|[^\\"])*"|'(?:\\[^]|[^\\'])*'|[^\s{'">=]+|\{(?:\{(?:\{[^{}]*\}|[^{}])*\}|[^{}])+\}))?|\{\s*\.{3}\s*[a-z_$][\w$]*(?:\.[a-z_$][\w$]*)*\s*\}))*\s*\/?)?>/gm);

            // keep the search reasonable
            const startLine = lineNumber > 20 ? lineNumber - 20 : 0;
            const endLine = e.document.lineCount - lineNumber > 20 ? lineNumber + 20 : e.document.lineCount;
            const multiLineText = e.document.getText(new vscode.Range(startLine, 0, endLine, 200));
            let matches = multiLineText.match(regex);
            if (lineText.includes(';') || lineText.includes(",") || lineText.substring(0, currentChar).includes(":")) {
              // treat as a single line
              matches = null;
            }
            if (!!previousDocument) {
              const current = getTemplateStringInfo(lineText, currentChar, lineNumber, e.document, convertWithinTemplateString ?? true);
              const backtickPositions = current.positions;
              const notTemplateStringWithinBackticks = current.withinBackticks && !current.inTemplateString;
              const usedToBeTemplateString = getTemplateStringInfo(previousDocument.lines[lineNumber].text, currentChar, lineNumber, previousDocument, convertWithinTemplateString ?? true).inTemplateString;
              if (notTemplateStringWithinBackticks
                && usedToBeTemplateString
                && removeBackticks
                && !changes.text
                && !!backtickPositions
              ) {
                const edit = new vscode.WorkspaceEdit();
                edit.replace(
                  e.document.uri,
                  new vscode.Range(
                    backtickPositions.startBacktickPosition,
                    backtickPositions.startBacktickPosition.translate(undefined, 1)
                  ),
                  quoteType === 'single' ? '\'' : '"',
                );
                edit.replace(
                  e.document.uri,
                  new vscode.Range(
                    backtickPositions.endBacktickPosition,
                    backtickPositions.endBacktickPosition.translate(undefined, 1)
                  ),
                  quoteType === 'single' ? '\'' : '"',
                );
                await vscode.workspace.applyEdit(edit);
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                  return;
                }
                editor.selection = new vscode.Selection(new vscode.Position(lineNumber, currentChar), new vscode.Position(lineNumber, currentChar));
                return;
              }
            }
            if (matches !== null && addBracketsToProps) {
              if (changes.text === "{" && priorChar === "$") {
                const edit = new vscode.WorkspaceEdit();
                edit.replace(
                  e.document.uri,
                  new vscode.Range(
                    startQuotePosition,
                    startQuotePosition.translate(undefined, 1)
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
                selections.push(new vscode.Selection(
                  lineNumber,
                  currentChar + 2,
                  lineNumber,
                  currentChar + 2
                ));
              } else if (changes.text === "{}" && priorChar === "$") {
                const edit = new vscode.WorkspaceEdit();
                edit.replace(
                  e.document.uri,
                  new vscode.Range(
                    startQuotePosition,
                    startQuotePosition.translate(undefined, 1)
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
                selections.push(new vscode.Selection(
                  lineNumber,
                  currentChar + 2,
                  lineNumber,
                  currentChar + 2
                ));
              }
            } else if (
              !getTemplateStringInfo(lineText, currentChar, lineNumber, e.document, convertWithinTemplateString ?? true).withinBackticks
            ) {
              if (changes.text === "{}" && priorChar === "$" && (currentChar < 2 || (lineText.charAt(currentChar - 2) !== "\\"))) {
                const edit = new vscode.WorkspaceEdit();
                edit.replace(
                  e.document.uri,
                  new vscode.Range(
                    startQuotePosition,
                    startQuotePosition.translate(undefined, 1)
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
                selections.push(new vscode.Selection(
                  lineNumber,
                  currentChar + 1,
                  lineNumber,
                  currentChar + 1
                ));
              } else if (changes.text === "{" && priorChar === "$" && autoClosingBrackets !== 'never' && (currentChar < 2 || (lineText.charAt(currentChar - 2) !== "\\"))) {
                const edit = new vscode.WorkspaceEdit();
                edit.replace(
                  e.document.uri,
                  new vscode.Range(
                    startQuotePosition,
                    startQuotePosition.translate(undefined, 1)
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
                selections.push(new vscode.Selection(
                  lineNumber,
                  currentChar + 1,
                  lineNumber,
                  currentChar + 1
                ));
              } else if (autoClosingBrackets === 'never' && priorChar === '$' && changes.text === '{' && (currentChar < 2 || (lineText.charAt(currentChar - 2) !== "\\"))) {
                const edit = new vscode.WorkspaceEdit();
                edit.replace(
                  e.document.uri,
                  new vscode.Range(
                    startQuotePosition,
                    startQuotePosition.translate(undefined, 1)
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
                selections.push(new vscode.Selection(
                  lineNumber,
                  currentChar + 1,
                  lineNumber,
                  currentChar + 1
                ));
              } else if (changes.text === '$' && nextTwoChars === '{}' && (currentChar < 1 || (lineText.charAt(currentChar - 1) !== "\\"))) {
                const edit = new vscode.WorkspaceEdit();
                edit.replace(
                  e.document.uri,
                  new vscode.Range(
                    startQuotePosition,
                    startQuotePosition.translate(undefined, 1)
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
                selections.push(new vscode.Selection(
                  lineNumber,
                  currentChar + 2,
                  lineNumber,
                  currentChar + 2
                ));
              } else if (changes.text === '$' && nextChar === '{' && autoClosingBrackets !== 'never' && (currentChar < 1 || (lineText.charAt(currentChar - 1) !== "\\"))) {
                const edit = new vscode.WorkspaceEdit();
                edit.replace(
                  e.document.uri,
                  new vscode.Range(
                    startQuotePosition,
                    startQuotePosition.translate(undefined, 1)
                  ),
                  "`"
                );
                edit.insert(
                  e.document.uri,
                  endPosition.translate(undefined, 2),
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
                selections.push(new vscode.Selection(
                  lineNumber,
                  currentChar + 2,
                  lineNumber,
                  currentChar + 2
                ));
              }
            }
          }
        }

        if (vscode.window.activeTextEditor && selections.length > 0) {
          vscode.window.activeTextEditor.selections = selections;
        }
        if (removeBackticks) {
          previousDocument = { lines: [], lineCount: e.document.lineCount };
          for (let i = 0; i < e.document.lineCount; i++) {
            const line = e.document.lineAt(i);
            previousDocument.lines.push(line);
          }
        }
      } catch { }
    }
  });
}

const notAComment = (line: string, charIndex: number, startQuoteIndex: number, endquoteIndex: number) => {
  if (line.substring(0, charIndex).includes("//")) {
    return line.substring(0, charIndex).indexOf("//") > startQuoteIndex && line.substring(0, charIndex).indexOf("//") < endquoteIndex;
  } else {
    return true;
  }
};

function getTemplateStringInfo(line: string, currentCharIndex: number, cursorLine: number, document: vscode.TextDocument | DocumentCopy, convertWithinTemplateString: boolean): { withinBackticks: boolean, inTemplateString: boolean, positions?: { startBacktickPosition: vscode.Position, endBacktickPosition: vscode.Position } } {
  const withinLine = line.substring(0, currentCharIndex).includes("`") && line.substring(currentCharIndex, line.length).includes("`");
  if (withinLine) {
    const startIndex = line.substring(0, currentCharIndex).indexOf("`");
    const endIndex = currentCharIndex + line.substring(currentCharIndex, line.length).indexOf("`");
    const startBracketIndex = line.substring(startIndex).indexOf('${');
    const endBracketIndex = line.substring(startBracketIndex + 1, endIndex).indexOf("}");
    const withinBackticks = startIndex >= 0 && endIndex > 0;
    const inTemplateString = (withinBackticks && startBracketIndex > 0 && endBracketIndex > 0 && endIndex > endBracketIndex);
    if (!convertWithinTemplateString) {
      return { withinBackticks, inTemplateString, positions: { startBacktickPosition: new vscode.Position(cursorLine, startIndex), endBacktickPosition: new vscode.Position(cursorLine, endIndex) } };
    } else if (convertWithinTemplateString && withinBackticks) {
      return { withinBackticks: startBracketIndex > 0, inTemplateString };
    }
    return { withinBackticks: true, inTemplateString };
  } else {
    const lineIndex = cursorLine;
    const currentLine = 'lines' in document ? document.lines[lineIndex].text : document.lineAt(lineIndex).text;
    const startOfLine = currentLine.substring(0, currentCharIndex);
    const endOfLine = currentLine.substring(currentCharIndex, line.length);
    //TODO
    return { withinBackticks: hasBacktick(lineIndex, startOfLine, document, 'start') && hasBacktick(lineIndex, endOfLine, document, 'end'), inTemplateString: false };
  }
};

const hasBacktick = (lineIndex: number, currentLine: string, document: vscode.TextDocument | DocumentCopy, position: Position) => {
  if (position = 'start') {
    lineIndex -= 1;
  }
  while (position === 'start' ? lineIndex >= 0 : lineIndex < document.lineCount) {
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
    if (lineIndex > -1) {
      currentLine = 'lines' in document ? document.lines[lineIndex].text : document.lineAt(lineIndex).text;
    }
    position === 'start' ? lineIndex -= 1 : lineIndex += 1;;
  }
  return false;
};

function includeFile(fileName: string, exclusions?: { [key: string]: boolean }): boolean {
  if (!exclusions) {
    return true;
  }
  for (const [key, value] of Object.entries(exclusions))
    if (value) {
      if (fileName.match(key)) {
        return false;
      }
    }
  return true;
}

const getQuoteChar = (type: QuoteType): QuoteChar => {
  if (!type || type === "both") {
    return "both";
  } else if (type === "single") {
    return "'";
  } else {
    return '"';
  }
};

const getQuoteIndex = (line: string, quoteChar: QuoteChar, position: Position, convertOutermostQuotes?: boolean): number => {
  const findFirstIndex = (position === 'start' && convertOutermostQuotes) || (position === 'end' && !convertOutermostQuotes);
  if (quoteChar === "both") {
    const double = findFirstIndex ? line.toString().indexOf('"') : line.toString().lastIndexOf('"');
    const single = findFirstIndex ? line.toString().indexOf("'") : line.toString().lastIndexOf("'");
    const back = findFirstIndex ? line.toString().indexOf('`') : line.toString().lastIndexOf("`");
    if (double >= 0 && single >= 0) {
      // nested quotes
      return findFirstIndex ? Math.min(double, single) : Math.max(double, single);
    } else if (double >= 0) {
      return double;
    } else if (single >= 0) {
      return single;
    } else {
      return back;
    }
  } else {
    if (findFirstIndex) {
      return line.toString().indexOf('`') !== -1 ? line.toString().indexOf('`') : line.toString().indexOf(quoteChar);
    } else {
      return line.toString().lastIndexOf('`') !== -1 ? line.toString().lastIndexOf('`') : line.toString().lastIndexOf(quoteChar);
    }
  }
};

export function deactivate() { }

// vscode.TextDocuments maintain reference to their original objects
// so have to do this shallow copy
interface DocumentCopy {
  lines: vscode.TextLine[];
  lineCount: number;
}