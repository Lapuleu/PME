function generateRandomKey(length = 32) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}
document.addEventListener('DOMContentLoaded', function() {
    const myForm = document.getElementById('new-pswd-form');
    const savedPasswordsList = document.getElementById('saved-passwords');
    myForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const formData = new FormData(myForm);
        const newPlabel = formData.get("pLabel");
        const newPassword = formData.get("password");
        const key = generateRandomKey(32);
        // Use Chrome extension background script for AES encryption
        chrome.runtime.sendMessage(
            { type: 'wolfram-encrypt', password: newPassword, key: key },
            response => {
                if (response && response.encrypted) {
                    savedPasswordsList.innerHTML += `<li data-label="${newPlabel}">${newPlabel} <button class="show-button">Show</button><button class="delete-button">Delete</button></li>`;
                    // Save to chrome.storage.local
                    chrome.storage.local.get(['passwords'], result => {
                        let saved = result.passwords || {};
                        saved[newPlabel] = { encrypted: response.encrypted, key: key };
                        chrome.storage.local.set({ passwords: saved }, () => {
                            console.log(newPlabel + ": " + response.encrypted);
                        });
                    });
                } else {
                    console.error('Encryption error:', response && response.error);
                }
            }
        );
        myForm.reset();
    });
    savedPasswordsList.addEventListener('click', function(event) {
        if (event.target.classList.contains('delete-button')) {
            const listItem = event.target.closest('li');
            const label = listItem.getAttribute('data-label');
            // Remove from chrome.storage.local
            chrome.storage.local.get(['passwords'], result => {
                let saved = result.passwords || {};
                delete saved[label];
                chrome.storage.local.set({ passwords: saved }, () => {
                    listItem.remove();
                });
            });
        }
        if (event.target.classList.contains('hide-button')) {
            const listItem = event.target.closest('li');
            const label = listItem.getAttribute('data-label');
            listItem.innerHTML = `${label} <button class="show-button">Show</button><button class="delete-button">Delete</button>`;
        }
    });
    savedPasswordsList.addEventListener('click', function(event) {
        if (event.target.classList.contains('show-button')) {
            const listItem = event.target.closest('li');
            const label = listItem.getAttribute('data-label');
            // Retrieve encrypted and key from chrome.storage.local
            chrome.storage.local.get(['passwords'], result => {
                let saved = result.passwords || {};
                const entry = saved[label];
                if (!entry) {
                    console.error('Label not found');
                    return;
                }
                chrome.runtime.sendMessage(
                    { type: 'wolfram-decrypt', encrypted: entry.encrypted, key: entry.key },
                    response => {
                        if (response && response.decrypted) {
                            listItem.innerHTML = `${label}: ${response.decrypted} <button class="hide-button">Hide</button><button class="delete-button">Delete</button>`;
                            listItem.setAttribute('data-label', label);
                            console.log(label + ': ' + response.decrypted);
                        } else {
                            console.error('Decryption error:', response && response.error);
                        }
                    }
                );
            });
        }
    });
});