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
        const newPassword= formData.get("password");
        const key        = generateRandomKey(32);

        // Encrypt using background service worker
        chrome.runtime.sendMessage(
            { type: 'wolfram-encrypt', input: newPassword, key },
            response => {
                if (response?.encrypted) {
                    savedPasswordsList.innerHTML +=
                      `<li data-label="${newPlabel}">
                         ${newPlabel}
                         <button class="show-button">Show</button>
                         <button class="delete-button">Delete</button>
                       </li>`;
                       response.encrypted.replace(/\n/g, '');
                    console.log('Encrypted:', response.encrypted.replace(/\n/g, ''));
                    chrome.storage.local.get(['passwords'], result => {
                        const saved = result.passwords || {};
                        saved[newPlabel] = { encrypted: response.encrypted.replace(/\n/g, ''), key };
                        chrome.storage.local.set({ passwords: saved });
                    });
                } else {
                    console.error('Encryption error:', response?.error);
                }
            }
        );
        myForm.reset();
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
