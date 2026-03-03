// セルからテキストを読み込む
document.getElementById('loadBtn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.url.includes("docs.google.com/spreadsheets")) {
        alert("Googleスプレッドシートのタブを開いてください。");
        return;
    }

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: readFromSheets
    }, (results) => {
        if (results && results[0] && results[0].result !== null) {
            document.getElementById('editor').value = results[0].result;
        }
    });
});

// セルへテキストを書き込む
document.getElementById('saveBtn').addEventListener('click', async () => {
    const text = document.getElementById('editor').value;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.url.includes("docs.google.com/spreadsheets")) return;

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: writeToSheets,
        args: [text]
    });
});

// --- 以下はスプレッドシートの画面（Content Script環境）で実行される関数 ---

function readFromSheets() {
    // スプレッドシートの数式バーの要素を取得
    const formulaBar = document.getElementById('t-formula-bar-input');
    return formulaBar ? formulaBar.innerText : "";
}

function writeToSheets(text) {
    const formulaBar = document.getElementById('t-formula-bar-input');
    if (formulaBar) {
        // 数式バーにフォーカスを当てる
        formulaBar.focus();

        // テキストをセット（改行を保持するためにinnerTextを使用）
        formulaBar.innerText = text;

        // スプレッドシートのシステムに変更を認識させるためのイベント発火
        formulaBar.dispatchEvent(new Event('input', { bubbles: true }));

        // Enterキーを押して確定させる挙動をシミュレート
        formulaBar.dispatchEvent(new KeyboardEvent('keydown', {
            bubbles: true, cancelable: true, keyCode: 13, key: 'Enter'
        }));
    } else {
        alert("数式バーが見つかりません。セルが選択されているか確認してください。");
    }
}