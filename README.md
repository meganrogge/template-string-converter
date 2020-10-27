# Template String Converter

This [extension](https://marketplace.visualstudio.com/items?itemName=meganrogge.template-string-converter)  addresses this [request](https://github.com/microsoft/vscode/issues/56704) to convert Javascript/Typescript quotes to backticks when `${` has been entered within a string.

## Features

Autocorrect from quotes to backticks within javascript and typescript files
![typing a dollar sign then open curly brace within a string converts the quotes to backticks](https://raw.githubusercontent.com/meganrogge/template-string-converter/master/demo.gif)

## Extension Settings

* `template-string-converter.enable`: enable/disable this extension
* `template-string-converter.validLanguages`: an array of valid languages to run the extension on
* `template-string-converter.quoteType`: both, single, or double 
* `template-string-converter.addBracketsToProps`: true/false as shown below ![typing a dollar sign then open curly brace with addBracketsToProps set to true converts the quotes to backticks and adds brackets around the property](https://raw.githubusercontent.com/meganrogge/template-string-converter/master/demo2.gif)