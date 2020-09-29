# template-string-converter

This extension addresses [this request](https://github.com/microsoft/vscode/issues/56704) to convert Javascript/Typescript quotes to backticks when `${` has been entered within a string.

## Features

Autocorrect from quotes to backticks within javascript and typescript files
![typing a dollar sign then open curly brace within a string converts the quotes to backticks](https://raw.githubusercontent.com/microsoft/vscode-docs/vnext/release-notes/images/1_50/template-string-converter-extension.gif)

## Extension Settings

* `template-string-converter.enable`: enable/disable this extension
* `template-string-converter.quoteType`: both, single, or double 
