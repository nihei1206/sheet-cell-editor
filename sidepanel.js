// Flag to temporarily ignore updates from content.js during a save operation
// This prevents the feedback loop where:
// 1. Save writes text to formula bar
// 2. content.js detects the change and sends it back
// 3. Editor gets repopulated with the text we just saved
let ignoreUpdatesUntil = 0;

// Write text to a cell
document.getElementById('saveBtn').addEventListener('click', async () => {
    const text = document.getElementById('editor').value;

    // Ignore incoming updates for 1500ms to let the save + cell navigation complete
    ignoreUpdatesUntil = Date.now() + 1500;

    // Write text to clipboard as a backup (user can Cmd+V if something goes wrong)
    try {
        await navigator.clipboard.writeText(text);
    } catch (err) {
        console.warn("[Sheet Cell Editor] Clipboard write failed:", err);
    }

    // Send save request to background.js, which will forward to content.js
    chrome.runtime.sendMessage({ type: 'SAVE_TO_CELL', text: text }, (response) => {
        if (chrome.runtime.lastError) {
            console.warn("[Sheet Cell Editor] Save message failed:", chrome.runtime.lastError.message);
            return;
        }
        console.log("[Sheet Cell Editor] Save message sent successfully");
    });

    // Clear the editor immediately after saving
    // content.js will repopulate it with the next cell's content after the ignore window
    document.getElementById('editor').value = '';
});

// Receive messages from background.js and update the editor
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'UPDATE_SIDEPANEL') {
        // Skip updates during the ignore window (right after saving)
        if (Date.now() < ignoreUpdatesUntil) {
            return;
        }

        const editor = document.getElementById('editor');
        if (editor) {
            if (editor.value !== message.text) {
                editor.value = message.text;
            }
        }
    }
});

// Get the latest text from the background when the side panel is opened
chrome.runtime.sendMessage({ type: 'GET_CACHED_CELL' }, (response) => {
    if (response && response.text !== undefined) {
        const editor = document.getElementById('editor');
        if (editor && editor.value !== response.text) {
            editor.value = response.text;
        }
    }
});