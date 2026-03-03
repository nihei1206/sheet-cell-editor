// Set up the side panel to open when the action icon is clicked
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => console.error(error));

// Hold the latest cell content
let cachedCellText = "";

// Relay and process messages from content.js or sidepanel.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CELL_UPDATED') {
        // When new text is received from content.js, update the cache
        cachedCellText = message.text;

        // If the side panel is open, forward the message directly
        chrome.runtime.sendMessage({ type: 'UPDATE_SIDEPANEL', text: cachedCellText }, (response) => {
            // If the side panel is closed and a receive error occurs, ignore it
            if (chrome.runtime.lastError) {
                // do nothing
            }
        });
    } else if (message.type === 'GET_CACHED_CELL') {
        // If sidepanel.js requests the latest text when opened, return the cache
        sendResponse({ text: cachedCellText });
    } else if (message.type === 'SAVE_TO_CELL') {
        // Forward save request from sidepanel to the content script in the active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].url && tabs[0].url.includes("docs.google.com/spreadsheets")) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    type: 'WRITE_TO_CELL',
                    text: message.text
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.warn("[Sheet Cell Editor] Could not reach content script:", chrome.runtime.lastError.message);
                    }
                });
            }
        });
    }
    // Return true for async sendResponse in GET_CACHED_CELL
    return true;
});