// background.js for Chrome Extension
// Handles API requests to Wolfram Cloud to bypass CORS

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'wolfram-encrypt') {
        const { password, key } = request;
        fetch('https://www.wolframcloud.com/obj/silversharkan/aesencrypt?input=' + encodeURIComponent(password) + '&key=' + encodeURIComponent(key))
            .then(response => response.text())
            .then(encrypted => {
                sendResponse({ encrypted });
            })
            .catch(error => {
                sendResponse({ error: error.message });
            });
        return true; // Indicates async response
    }
    if (request.type === 'wolfram-decrypt') {
        const { encrypted, key } = request;
        fetch('https://www.wolframcloud.com/obj/silversharkan/aesdecrypt?input=' + encodeURIComponent(encrypted) + '&key=' + encodeURIComponent(key))
            .then(response => response.text())
            .then(decrypted => {
                sendResponse({ decrypted });
            })
            .catch(error => {
                sendResponse({ error: error.message });
            });
        return true;
    }
});
