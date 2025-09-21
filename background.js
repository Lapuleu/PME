// background.js for Chrome Extension
// Handles API requests to Wolfram Cloud to bypass CORS

chrome.runtime.onMessage.addListener((request, sendResponse) => {
    if (request.type === 'wolfram-encrypt') {
        const { input, key } = request;
        fetch('https://www.wolframcloud.com/obj/silversharkan/aesencrypt?key=' + encodeURIComponent(key) + '&input=' + encodeURIComponent(input))
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
        const { input, key } = request;
        fetch('https://www.wolframcloud.com/obj/silversharkan/aesdecrypt?key=' + encodeURIComponent(key) + '&input=' + encodeURIComponent(input))
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
