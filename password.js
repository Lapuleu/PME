function generateRandomKey(length = 32) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}
document.addEventListener('DOMContentLoaded', function() {
    const myForm = document.getElementById('new-pswd-form');
    const savedPasswordsList = document.getElementById('saved-passwords');
    chrome.storage.local.get(['passwords'], result => {
        let saved = result.passwords || {};
        for (const label in saved) {
            savedPasswordsList.innerHTML += `<li data-label="${label}">${label} <button class="show-button">Show</button><button class="delete-button">Delete</button></li>`;
        }
    });
    myForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const formData = new FormData(myForm);
        const newPlabel = formData.get("pLabel");
        const newPassword = formData.get("password");
        const key = generateRandomKey(32);
        // Use Chrome extension background script for AES encryption
        chrome.runtime.sendMessage(
            { type: 'wolfram-encrypt', input: newPassword, key: key },
            response => {
                if (response && response.encrypted) {
                    savedPasswordsList.innerHTML += `<li data-label="${newPlabel}">${newPlabel} <button class="show-button">Show</button><button class="delete-button">Delete</button></li>`;
                    // Save to chrome.storage.local
                    chrome.storage.local.get(['passwords'], result => {
                        let saved = result.passwords || {};
                        console.log('encrypted value:', response.encrypted);
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
                console.log('Decrypting label:', label);
                console.log('Encrypted value:', entry.encrypted);
                console.log('Key:', entry.key);
                chrome.runtime.sendMessage(
                    { type: 'wolfram-decrypt', input: entry.encrypted, key: entry.key },
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