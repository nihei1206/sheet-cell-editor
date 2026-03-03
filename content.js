let lastText = null;
let lastCellId = null;
let observerInterval = null;
let extensionInvalidated = false;

function getActiveCellId() {
    // Google Sheets shows the active cell reference (e.g. "A1") in the Name Box
    const nameBox = document.getElementById('t-name-box');
    if (nameBox) {
        return nameBox.querySelector('input')?.value || nameBox.innerText || '';
    }
    return '';
}

function checkFormulaBar() {
    // If extension context was already invalidated, don't even try
    if (extensionInvalidated) return;

    // Get the .cell-input element that actually contains the text
    let formulaBar = document.querySelector('#t-formula-bar-input .cell-input');

    // If .cell-input is not found, get the parent as a fallback
    if (!formulaBar) {
        formulaBar = document.getElementById('t-formula-bar-input');
    }

    if (formulaBar) {
        // Using innerText can sometimes make it easier to get line breaks
        let currentText = formulaBar.innerText;

        // Clean up zero-width spaces that Google Sheets sometimes uses for empty cells
        currentText = currentText.replace(/[\u200B-\u200D\uFEFF]/g, '');

        // Remove unnecessary trailing line breaks (from <br>)
        if (currentText.endsWith('\n')) {
            currentText = currentText.slice(0, -1);
        }

        // Prevent just line break codes etc. from remaining when completely empty
        if (currentText === '\n' || currentText === '<br>') {
            currentText = '';
        }

        // Check if the active cell position has changed (detects clicking on a new cell)
        const currentCellId = getActiveCellId();
        const cellChanged = currentCellId !== lastCellId;
        const textChanged = currentText !== lastText;

        if (textChanged || cellChanged) {
            lastText = currentText;
            lastCellId = currentCellId;
            sendUpdate(currentText);
        }
    }
}

function sendUpdate(text) {
    try {
        // If extension is completely reloaded, chrome.runtime might be gone or throw when accessed
        if (!chrome.runtime || !chrome.runtime.sendMessage) {
            throw new Error("Extension context invalidated.");
        }

        chrome.runtime.sendMessage({ type: 'CELL_UPDATED', text: text }, (response) => {
            // Check for standard "reloaded" or "no receiving end" errors
            if (chrome.runtime.lastError) {
                const errMsg = chrome.runtime.lastError.message;
                // It's normal for the sidepanel to not be open (no receiving end)
                if (errMsg.includes("Could not establish connection")) {
                    return;
                }
                console.debug("[Sheet Cell Editor] Background communication note:", errMsg);
            }
        });
    } catch (e) {
        // Extension context invalidated - stop polling to prevent error spam
        extensionInvalidated = true;
        if (observerInterval) {
            clearInterval(observerInterval);
            observerInterval = null;
        }
        console.log("[Sheet Cell Editor] Extension was updated. Please refresh this tab to reconnect.");
    }
}

// ------ WRITE TO CELL: Receives text from sidepanel via background.js ------

function writeToCell(text) {
    console.log("[Sheet Cell Editor] writeToCell called with text:", text.substring(0, 50) + "...");

    // Get the formula bar's cell input
    const formulaBar = document.getElementById('t-formula-bar-input');
    const cellInput = formulaBar ? (formulaBar.querySelector('.cell-input') || formulaBar) : null;

    if (!cellInput) {
        console.warn("[Sheet Cell Editor] Formula bar not found. Cannot write to cell.");
        return;
    }

    // Focus the formula bar's cell input
    cellInput.focus();

    // Small delay to let Sheets register the focus
    setTimeout(() => {
        // Select all existing content so we overwrite it
        document.execCommand('selectAll', false, null);

        // Use insertText to replace the content — this is the most reliable single method
        document.execCommand('insertText', false, text);

        console.log("[Sheet Cell Editor] Text injected. Committing with Enter...");

        // Commit the cell by pressing Enter after a short delay
        setTimeout(() => {
            cellInput.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true
            }));
        }, 100);
    }, 50);
}

// Listen for messages from background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'WRITE_TO_CELL') {
        console.log("[Sheet Cell Editor] Received WRITE_TO_CELL message");
        writeToCell(message.text);
        sendResponse({ success: true });
    }
});

// ------ INIT ------

function initObserver() {
    console.log("[Sheet Cell Editor] content.js initialized. Looking for formula bar...");
    const formulaBar = document.getElementById('t-formula-bar-input');
    if (!formulaBar) {
        // If the element is not there yet, wait and retry
        console.log("[Sheet Cell Editor] target element not found yet, retrying in 1s...");
        setTimeout(initObserver, 1000);
        return;
    }

    console.log("[Sheet Cell Editor] DOM elements found, setting up polling and event listeners.");

    // Instead of monitoring the entire div#t-formula-bar-input,
    // if there is a .cell-input where keystrokes are actually reflected, include that in the monitoring
    const cellInput = document.querySelector('#t-formula-bar-input .cell-input');

    // Since the Google Sheets formula bar is rewritten asynchronously after canvas events,
    // periodic checking (polling) is the most reliable
    observerInterval = setInterval(checkFormulaBar, 300);

    // Use input events as well to reflect changes immediately during text input
    formulaBar.addEventListener('input', checkFormulaBar);
    formulaBar.addEventListener('keyup', checkFormulaBar);
    if (cellInput) {
        cellInput.addEventListener('input', checkFormulaBar);
        cellInput.addEventListener('keyup', checkFormulaBar);
    }

    // Initial state check
    checkFormulaBar();
}

// Google Sheets load dynamically, so wait a bit after load before initializing
setTimeout(initObserver, 1000);
