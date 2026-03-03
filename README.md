# Sheet Cell Editor

*[日本語の README はこちら](README_ja.md)*

A Chrome extension that provides a side panel editor for comfortably writing and editing long text in Google Sheets cells.

## Disclaimer
This software is provided "as is", without warranty of any kind. Use it at your own risk. The author is not responsible for any data loss, damages, or specific issues that may arise from using this extension.

## Features
- **Side Panel Integration:** Opens conveniently in the Chrome side panel alongside your Google Spreadsheet.
- **Easy Loading and Saving:** Quickly load the content of the currently selected cell into the editor, and save your edits back with a click.
- **Synchronized Editing:** Connects seamlessly with the formula bar to read and write text, ensuring compatibility with the active cell in Google Sheets.

## Installation
Currently, the extension can be installed as an unpacked extension in Developer Mode.

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle switch in the top right corner.
4. Click on **Load unpacked** and select the directory containing the extension files.

## Usage
1. Open a Google Spreadsheet where you have edit access.
2. Click on the extension icon in the Chrome toolbar. The **Sheet Cell Editor** will open in the side panel.
3. Select a cell in your spreadsheet.
4. The text from the selected cell will automatically load into the editor.
5. Make your edits in the spacious text area.
6. Click **Save to cell** to push the changes back to the active cell.

## Technical Details
This extension uses Chrome Extension Manifest V3 and relies on the `sidePanel`, `activeTab`, and `scripting` permissions to interact with Google Sheets.

- **`manifest.json`**: Extension configuration.
- **`background.js`**: Service worker that manages messages between the content script and side panel.
- **`content.js`**: Content script injected into Google Sheets to interact with the DOM, specifically the formula bar (`#t-formula-bar-input`).
- **`sidepanel.html` / `sidepanel.js`**: UI and logic for the editor side panel.

## Troubleshooting
- **Cannot write to cell:** Ensure a cell is selected and ready for input before clicking "Save to cell". The extension works by manipulating the formula bar.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
