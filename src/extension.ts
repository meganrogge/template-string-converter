import * as vscode from "vscode";

type QuoteType = "both" | "single" | "double";
type QuoteChar = "both" | `'` | `"`;
////////////////////////////////////////////
export function activate(context: vscode.ExtensionContext) {
  vscode.workspace.onDidChangeTextDocument(async (e) => {
    let configuration = vscode.workspace.getConfiguration();
    let quoteType = configuration.get<QuoteType>(
      "template-string-converter.quoteType"
    );
    let enabled = configuration.get<{}>("template-string-converter.enabled");
    let changes = e.contentChanges[0];
    let validLanguages = configuration.get<string[]>(
      "template-string-converter.validLanguages"
    );
    if (
      enabled &&
      quoteType &&
      changes &&
      validLanguages?.includes(e.document.languageId)
    ) {
      try {
        let lineNumber = changes.range.start.line;
        let currentChar = changes.range.start.character;
        let lineText = e.document.lineAt(lineNumber).text;

        let startPosition = new vscode.Position(lineNumber, currentChar - 1);
        let endPosition = new vscode.Position(lineNumber, currentChar);

        let startQuoteIndex = getStartQuote(
          lineText.substring(0, currentChar),
          getQuoteChar(quoteType)
        );
        let endQuoteIndex =
          getEndQuote(
            lineText.substring(currentChar + 1, lineText.length),
            getQuoteChar(quoteType)
          ) +
          currentChar +
          1;

        let openingQuotePosition = new vscode.Position(
          lineNumber,
          startQuoteIndex
        );
        let endQuotePosition = new vscode.Position(lineNumber, endQuoteIndex);

        let priorChar = e.document.getText(
          new vscode.Range(startPosition, endPosition)
        );
        let nextChar = e.document.getText(
          new vscode.Range(
            startPosition.translate(undefined, 2),
            endPosition.translate(undefined, 2)
          )
        );
        let nextTwoChars = e.document.getText(
          new vscode.Range(
            startPosition.translate(undefined, 2),
            endPosition.translate(undefined, 3)
          )
        );
        if (
          notAComment(lineText, currentChar, startQuoteIndex, endQuoteIndex) &&
          !withinBackticks(lineText, currentChar) &&
          lineText.charAt(startQuoteIndex) === lineText.charAt(endQuoteIndex)
        ) {
          if (changes.text === "{}" && priorChar === "$") {
            let edit = new vscode.WorkspaceEdit();
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
              vscode.window.activeTextEditor.selection = new vscode.Selection(
                lineNumber,
                currentChar + 1,
                lineNumber,
                currentChar + 1
              );
            }
          } else if (changes.text === "$" && nextTwoChars === "{}") {
            let edit = new vscode.WorkspaceEdit();
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
              vscode.window.activeTextEditor.selection = new vscode.Selection(
                lineNumber,
                currentChar + 2,
                lineNumber,
                currentChar + 2
              );
            }
          } else if (changes.text === "{" && priorChar === "$") {
            let edit = new vscode.WorkspaceEdit();
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
              vscode.window.activeTextEditor.selection = new vscode.Selection(
                lineNumber,
                currentChar + 1,
                lineNumber,
                currentChar + 1
              );
            }
          } else if (changes.text === "$" && nextChar === "{") {
            let edit = new vscode.WorkspaceEdit();
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
            if (vscode.window.activeTextEditor) {
              vscode.window.activeTextEditor.selection = new vscode.Selection(
                lineNumber,
                currentChar + 2,
                lineNumber,
                currentChar + 2
              );
            }
          }
        }
      } catch (e) {}
    }
  });
}

let notAComment = (
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

let withinBackticks = (line: string, currentCharIndex: number) => {
  return (
    line.substring(0, currentCharIndex).includes("`") &&
    line.substring(currentCharIndex + 1, line.length).includes("`")
  );
};

let getQuoteChar = (type: QuoteType): QuoteChar => {
  if (!type || type === "both") {
    return "both";
  } else if (type === "single") {
    return "'";
  } else {
    return '"';
  }
};

let getStartQuote = (line: string, quoteChar: QuoteChar): number => {
  if (quoteChar === "both") {
    let double = line.toString().lastIndexOf('"');
    let single = line.toString().lastIndexOf("'");
    if (double >= 0) {
      return double;
    } else {
      return single;
    }
  } else {
    return line.toString().lastIndexOf(quoteChar);
  }
};

let getEndQuote = (line: string, quoteChar: QuoteChar): number => {
  if (quoteChar === "both") {
    let double = line.toString().indexOf('"');
    let single = line.toString().indexOf("'");
    if (double >= 0) {
      return double;
    } else if (single >= 0) {
      return single;
    } else {
      return -1;
    }
  } else {
    return line.toString().indexOf(quoteChar);
  }
};

export function deactivate() {}
