
const https = require('https');
const fs = require('fs');
const path = require('path');

// Read API Key
let apiKey = '';
try {
    const envPath = path.resolve(__dirname, '../.env.local');
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/GEMINI_API_KEY=(.*)/);
    if (match) apiKey = match[1].trim();
} catch (e) {
    console.error('Cannot read .env.local');
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.models) {
                console.log('Available Models:');
                json.models.forEach(m => console.log(m.name));
            } else {
                console.log('Error:', json);
            }
        } catch (e) {
            console.error('Parse error', e);
        }
    });
}).on('error', (e) => {
    console.error(e);
});
