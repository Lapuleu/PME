// Replace these with your actual CloudDeploy endpoints
const ENCRYPT_URL = "https://www.wolframcloud.com/obj/silversharkan/aesencrypt";
const DECRYPT_URL = "https://www.wolframcloud.com/obj/silversharkan/aesdecrypt";

async function callWolfram(endpoint, payload) {
  const resp = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
      // Optionally add an API key header here:
      // "X-API-Key": "<your-secret-token>"
    },
    body: JSON.stringify(payload)
  });

  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return await resp.text(); // Wolfram returns plain text
}

// Listen for messages from popup/content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "wolfram-encrypt") {
    const { input, key } = request;
    callWolfram(ENCRYPT_URL, { key, input })
      .then(encrypted => sendResponse({ encrypted }))
      .catch(error   => sendResponse({ error: error.message }));
    return true; // keep sendResponse async
  }

  if (request.type === "wolfram-decrypt") {
    const { input, key } = request;
    callWolfram(DECRYPT_URL, { key, input })
      .then(decrypted => sendResponse({ decrypted }))
      .catch(error   => sendResponse({ error: error.message }));
    return true;
  }
});