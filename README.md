# Template String Converter

This Visual Studio Code extension converts a string to a template string when `"${"` is typed.

![typing a dollar sign then open curly brace within a string converts the quotes to backticks](https://raw.githubusercontent.com/meganrogge/template-string-converter/master/images/demo.gif)

## Settings

| Name                                 | Description                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `template-string-converter.enable`         | Switches the extension on/off                                                                                                                                                                                        |
| `template-string-converter.validLanguages` | Languages the extension should apply to                                                                                                                                                |
| `template-string-converter.quoteType`   | single (`''`), double (`""`), or both                                                                                                                  |
| `template-string-converter.convertOutermostQuotes`    | In the case of nested quotes, converts the outermost ones to backticks
| `template-string-converter.autoRemoveTemplateString` | When `$` or `{` is deleted, replace backticks with quotes ![typing a dollar sign and open curly brace converts the quotes to backticks. deleting the $ sign causes the backticks to be replaced with quotes](https://raw.githubusercontent.com/meganrogge/template-string-converter/master/images/auto-remove.gif)
| `template-string-converter.convertWithinTemplateString`          | Within a template string, converts strings to template strings when `${` is typed                 |
| `template-string-converter.addBracketsToProps`          | Adds brackets to the template string for JSX properties ![typing a dollar sign then open curly brace with addBracketsToProps set to true converts the quotes to backticks and adds brackets around the property](https://raw.githubusercontent.com/meganrogge/template-string-converter/master/images/jsx-props.gif)
