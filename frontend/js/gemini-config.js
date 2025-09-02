// Gemini API Configuration
// To use the actual Gemini API, you'll need to:
// 1. Get an API key from Google AI Studio (https://makersuite.google.com/app/apikey)
// 2. Replace 'YOUR_GEMINI_API_KEY' with your actual API key
// 3. Uncomment the GEMINI_API_KEY line below

const GEMINI_CONFIG = {
    // Uncomment and replace with your actual Gemini API key
    // API_KEY: 'YOUR_GEMINI_API_KEY',
    
    // For now, we'll use the smart response system
    USE_SMART_RESPONSES: true,
    
    // Gemini API endpoint (latest version)
    API_URL: 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent',
    
    // Model configuration
    MODEL: 'gemini-1.5-flash',
    
    // Safety settings (updated for latest API)
    SAFETY_SETTINGS: [
        {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
    ],
    
    // Generation config (updated for latest API)
    GENERATION_CONFIG: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
        candidateCount: 1,
        stopSequences: []
    }
};

// Function to get Gemini API response (when ready to integrate)
async function getGeminiResponse(prompt) {
    if (!GEMINI_CONFIG.API_KEY) {
        throw new Error('Gemini API key not configured. Please add your API key to gemini-config.js');
    }
    
    const requestBody = {
        contents: [{
            parts: [{
                text: `You are an AI assignment assistant helping students with their homework, projects, and studies. 
                Provide helpful, educational, and motivating responses. Keep responses concise but informative.
                Always respond in a friendly, encouraging tone. Use emojis and formatting to make responses engaging.
                
                Student question: ${prompt}`
            }]
        }],
        generationConfig: GEMINI_CONFIG.GENERATION_CONFIG,
        safetySettings: GEMINI_CONFIG.SAFETY_SETTINGS
    };
    
    try {
        console.log('Sending request to Gemini API:', requestBody);
        
        const response = await fetch(`${GEMINI_CONFIG.API_URL}?key=${GEMINI_CONFIG.API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('Gemini API response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API error response:', errorText);
            throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Gemini API response data:', data);
        
        if (data.candidates && data.candidates.length > 0 && 
            data.candidates[0].content && data.candidates[0].content.parts && 
            data.candidates[0].content.parts.length > 0) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('Invalid response format from Gemini API');
        }
        
    } catch (error) {
        console.error('Gemini API error:', error);
        throw error;
    }
}

// Test Gemini API connection
async function testGeminiConnection() {
    if (!GEMINI_CONFIG.API_KEY) {
        console.log('❌ Gemini API key not configured');
        return false;
    }
    
    try {
        console.log('🧪 Testing Gemini API connection...');
        const testResponse = await getGeminiResponse('Hello! Can you help me with my studies?');
        console.log('✅ Gemini API test successful:', testResponse);
        return true;
    } catch (error) {
        console.error('❌ Gemini API test failed:', error);
        return false;
    }
}

// Enable Gemini API (call this function when you have your API key)
function enableGeminiAPI(apiKey) {
    GEMINI_CONFIG.API_KEY = apiKey;
    GEMINI_CONFIG.USE_SMART_RESPONSES = false;
    console.log('🚀 Gemini API enabled with key:', apiKey.substring(0, 10) + '...');
}

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GEMINI_CONFIG, getGeminiResponse, testGeminiConnection, enableGeminiAPI };
}
