function generateRandomKey(length = 32) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    const myForm = document.getElementById('new-pswd-form');
    const savedPasswordsList = document.getElementById('saved-passwords');

    // Load saved passwords on startup
    chrome.storage.local.get(['passwords'], result => {
        const saved = result.passwords || {};
        for (const label in saved) {
            savedPasswordsList.innerHTML +=
              `<li data-label="${label}">
                 ${label}
                 <button class="show-button">Show</button>
                 <button class="delete-button">Delete</button>
               </li>`;
        }
    });

    // Add a new password
    myForm.addEventListener('submit', e => {
        e.preventDefault();
        const formData   = new FormData(myForm);
        const newPlabel  = formData.get("pLabel");
        let newPassword= formData.get("password");
        let key        = generateRandomKey(32);
        if (!newPlabel || !newPassword) return alert('Label and Password are required');

        // Check for duplicate labels
        if (savedPasswordsList.querySelector(`li[data-label="${newPlabel}"]`)) {
            return alert('Label already exists. Please choose a different label.');
        }

        // Encrypt using background service worker
        chrome.runtime.sendMessage(
            { type: 'wolfram-encrypt', input: newPassword, key },
            response => {
                if (response?.encrypted) {
                    let re = response.encrypted;

                    // Step 1: Parse the JSON string to get the actual value
                    try {
                        re = JSON.stringify(JSON.parse(re));
                    } catch (e) {
                        // If it's not valid JSON, just use the original string
                    }
                    re = re.replace(/\\+/g, '');      // Remove all backslashes
                    re = re.replace(/\\n|\\r|\\t/g, ''); // Remove escaped newlines, returns, tabs
                    re = re.replace(/\\\"/g, '"');    // Optionally, unescape quotes

                    console.log('Cleaned Encrypted:', re);
                    savedPasswordsList.innerHTML +=
                      `<li data-label="${newPlabel}">
                         ${newPlabel}
                         <button class="show-button">Show</button>
                         <button class="delete-button">Delete</button>
                       </li>`;
                    console.log('Encrypted:', re);
                    chrome.storage.local.get(['passwords'], result => {
                        const saved = result.passwords || {};
                        saved[newPlabel] = { encrypted: re, key };
                        chrome.storage.local.set({ passwords: saved });
                    });
                } else {
                    console.error('Encryption error:', response?.error);
                }
            }
        );
        myForm.reset();
        newPassword = null;
        key = null;
    });

    // Delete or Hide password
    savedPasswordsList.addEventListener('click', e => {
        const listItem = e.target.closest('li');
        const label    = listItem?.getAttribute('data-label');
        if (!label) return;

        if (e.target.classList.contains('delete-button')) {
            chrome.storage.local.get(['passwords'], result => {
                const saved = result.passwords || {};
                delete saved[label];
                chrome.storage.local.set({ passwords: saved }, () => listItem.remove());
            });
        }

        if (e.target.classList.contains('hide-button')) {
            listItem.innerHTML =
              `${label}
               <button class="show-button">Show</button>
               <button class="delete-button">Delete</button>`;
        }
    });

    // Show (decrypt) password
    savedPasswordsList.addEventListener('click', e => {
        if (!e.target.classList.contains('show-button')) return;

        const listItem = e.target.closest('li');
        const label    = listItem.getAttribute('data-label');

        chrome.storage.local.get(['passwords'], result => {
            const entry = (result.passwords || {})[label];
            if (!entry) return console.error('Label not found');

            chrome.runtime.sendMessage(
                { type: 'wolfram-decrypt', input: entry.encrypted, key: entry.key },
                response => {
                    if (response?.decrypted) {
                        listItem.innerHTML =
                          `${label}: ${response.decrypted}
                           <button class="hide-button">Hide</button>
                           <button class="delete-button">Delete</button>`;
                        listItem.setAttribute('data-label', label);
                    } else {
                        console.error('Decryption error:', response?.error);
                    }
                }
            );
        });
    });
});
