chrome.runtime.onInstalled.addListener(() => {
    // reset apiKey and chatHistory if extension is installed or updated
    // or when the browser is updated
    chrome.storage.sync.set({ chatSettings: '' });
    chrome.storage.sync.set({ chatHistory: '' });
});
