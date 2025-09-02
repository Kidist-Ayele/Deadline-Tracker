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
    
    // Gemini API endpoint (when you're ready to integrate)
    API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    
    // Model configuration
    MODEL: 'gemini-pro',
    
    // Safety settings
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
    
    // Generation config
    GENERATION_CONFIG: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
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
                
                Student question: ${prompt}`
            }]
        }],
        generationConfig: GEMINI_CONFIG.GENERATION_CONFIG,
        safetySettings: GEMINI_CONFIG.SAFETY_SETTINGS
    };
    
    try {
        const response = await fetch(`${GEMINI_CONFIG.API_URL}?key=${GEMINI_CONFIG.API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }
        
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
        
    } catch (error) {
        console.error('Gemini API error:', error);
        throw error;
    }
}

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GEMINI_CONFIG, getGeminiResponse };
}
