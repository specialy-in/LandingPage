
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load env manually (assuming running from server dir, .env.local is in parent)
const envPath = path.resolve(process.cwd(), '../.env.local');
let apiKey = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/GEMINI_API_KEY=(.*)/);
    if (match) apiKey = match[1].trim();
} catch (e) {
    console.error('❌ Could not read .env.local');
}

if (!apiKey) {
    console.error('❌ No API Key found in .env.local');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        // We need to use the model manager if available, or just try to get a model
        // The SDK might not expose listModels directly on genAI instance in older versions?
        // Actually typically it's specific.
        // Let's rely on the error message which said "Call ListModels".

        // Use REST API directly for listing if SDK is ambiguous
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            console.log('✅ Available Models:');
            data.models.forEach((m: any) => {
                console.log(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`);
            });
        } else {
            console.log('❌ Failed to list models:', data);
        }

    } catch (error) {
        console.error('❌ Error listing models:', error);
    }
}

listModels();
