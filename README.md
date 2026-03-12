# Template String Converter

[![Marketplace](https://img.shields.io/visual-studio-marketplace/v/meganrogge.template-string-converter.svg?label=VS%20Code%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=meganrogge.template-string-converter)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/meganrogge.template-string-converter.svg)](https://marketplace.visualstudio.com/items?itemName=meganrogge.template-string-converter)
[![License](https://img.shields.io/github/license/meganrogge/template-string-converter)](LICENSE.txt)

**Template String Converter** is a powerful yet lightweight VS Code extension that streamlines your JavaScript and TypeScript development. It automatically converts regular strings (single or double quotes) into template strings (backticks) the moment you start typing a dynamic expression—`${`.

No more manual quote swapping while building dynamic strings!

---

## 🚀 Features

- **Automated Conversion**: Instantly transforms `'...'` or `"..."` to `` `...` `` when you type `${`.
- **Intelligent Context**: Works within JSX attributes, standard strings, and even nested templates.
- **Auto-Cleanup**: Optionally reverts backticks to regular quotes if you delete the `${` sequence.
- **Language Support**: Out-the-box support for JavaScript, TypeScript, JSX, TSX, and Svelte.
- **Highly Configurable**: Control precisely which quotes to convert and in which languages.

---

## 📦 Installation

1. Open **Visual Studio Code**.
2. Go to the **Extensions** view (`Ctrl+Shift+X` or `Cmd+Shift+X`).
3. Search for `Template String Converter`.
4. Click **Install**.

---

## 📖 Usage Examples

### JavaScript / TypeScript
**Before typing `${`:**
```typescript
const greeting = "Hello, world";
```
**While typing `${name}`:**
```typescript
const greeting = `Hello, ${name}`; // Quotes automatically changed to backticks!
```

### JSX / TSX
**Before typing `${`:**
```jsx
<div className="container"></div>
```
**While typing `${active ? 'active' : ''}`:**
```jsx
<div className={`container ${active ? 'active' : ''}`}></div>
```

> [!TIP]
> Enable `addBracketsToProps` for JSX to automatically wrap your template strings in `{}` when working with props.

---

## ⚙️ Settings

You can customize the extension behavior in your VS Code settings (`settings.json`):

| Setting | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `template-string-converter.enabled` | `boolean` | `true` | Enable/disable the extension entirely. |
| `template-string-converter.quoteType` | `string` | `"both"` | Which quotes to convert: `"single"`, `"double"`, or `"both"`. |
| `template-string-converter.autoRemoveTemplateString` | `boolean` | `false` | Reverts backticks to quotes if `${` is removed. |
| `template-string-converter.addBracketsToProps` | `boolean` | `false` | Automatically adds `{}` around template strings in JSX props. |
| `template-string-converter.convertOutermostQuotes` | `boolean` | `false` | For nested strings, converts the outermost quotes to backticks. |
| `template-string-converter.convertWithinTemplateString` | `boolean` | `true` | Enables conversion inside already existing template strings. |
| `template-string-converter.validLanguages` | `array` | `[...]` | Languages where the extension is active. |

---

## 📸 Demos

### Basic Conversion
![Basic Demo](https://raw.githubusercontent.com/meganrogge/template-string-converter/master/images/demo.gif)

### Auto-Remove on Deletion
![Auto Remove](https://raw.githubusercontent.com/meganrogge/template-string-converter/master/images/auto-remove.gif)

### JSX Property Wrapping
![JSX Props](https://raw.githubusercontent.com/meganrogge/template-string-converter/master/images/jsx-props.gif)

---

## 🛠️ Contributing

Contributions are welcome! If you'd like to help improve Template String Converter:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/meganrogge/template-string-converter.git
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Launch the extension**:
   Press `F5` in VS Code to open a "Extension Development Host" window with your changes active.
4. **Submit a PR**:
   Ensure your code passes the linter with `npm run lint`.

---

## 🐞 Known Issues / Limitations

- The extension requires the `${` characters to be typed sequentially inside an existing string.
- Complex nested string scenarios may require specific setting adjustments (like `convertOutermostQuotes`).

If you find a bug, please [file an issue](https://github.com/meganrogge/template-string-converter/issues).

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE.txt) file for details.

Developed with ❤️ by [Megan Rogge](https://github.com/meganrogge).
