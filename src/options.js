document.getElementById('saveButton').addEventListener('click', () => {
    const apiKey = document.getElementById('apiKey').value;
    chrome.storage.sync.set({ apiKey }, () => {
        alert('API key saved!');
    });
});

chrome.storage.sync.get('apiKey', ({ apiKey }) => {
    if (apiKey) {
        document.getElementById('apiKey').value = apiKey;
    }
});
