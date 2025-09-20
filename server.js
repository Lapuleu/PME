const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/sha256hash', async (req, res) => {
    const input = req.query.input;
    if (!input) {
        return res.status(400).send('Missing input');
    }
    try {
        const wolframUrl = 'https://www.wolframcloud.com/obj/silversharkan/sha256hash?input=' + encodeURIComponent(input);
        const response = await fetch(wolframUrl);
        const hash = await response.text();
        res.set('Access-Control-Allow-Origin', '*');
        res.send(hash);
    } catch (err) {
        res.status(500).send('Error contacting Wolfram API');
    }
});

app.listen(PORT, () => {
    console.log(`Proxy server running at http://localhost:${PORT}`);
});