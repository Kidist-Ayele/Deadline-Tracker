// AI Chat Bot with Gemini Integration
class ChatBot {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.isTyping = false;
        
        // DOM elements
        this.chatToggle = document.getElementById('chat-toggle');
        this.chatInterface = document.getElementById('chat-interface');
        this.chatClose = document.getElementById('chat-close');
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.chatSend = document.getElementById('chat-send');
        this.suggestionBtns = document.querySelectorAll('.suggestion-btn');
        
        this.initializeEventListeners();
        this.loadChatHistory();
    }
    
    initializeEventListeners() {
        // Toggle chat
        this.chatToggle.addEventListener('click', () => this.toggleChat());
        
        // Close chat
        this.chatClose.addEventListener('click', () => this.closeChat());
        
        // Send message
        this.chatSend.addEventListener('click', () => this.sendMessage());
        
        // Enter key in input
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Suggestion buttons
        this.suggestionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const suggestion = btn.getAttribute('data-suggestion');
                this.chatInput.value = suggestion;
                this.sendMessage();
            });
        });
        
        // Click outside to close
        document.addEventListener('click', (e) => {
            if (!this.chatInterface.contains(e.target) && 
                !this.chatToggle.contains(e.target) && 
                this.isOpen) {
                this.closeChat();
            }
        });
    }
    
    toggleChat() {
        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }
    
    openChat() {
        this.isOpen = true;
        this.chatInterface.classList.add('show');
        this.chatInput.focus();
        this.scrollToBottom();
        
        // Add welcome message if first time
        if (this.messages.length === 0) {
            this.addBotMessage(this.getWelcomeMessage());
        }
    }
    
    closeChat() {
        this.isOpen = false;
        this.chatInterface.classList.remove('show');
        this.saveChatHistory();
    }
    
    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message || this.isTyping) return;
        
        // Add user message
        this.addUserMessage(message);
        this.chatInput.value = '';
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Get AI response
            const response = await this.getAIResponse(message);
            this.hideTypingIndicator();
            this.addBotMessage(response);
        } catch (error) {
            this.hideTypingIndicator();
            this.addBotMessage("I'm sorry, I'm having trouble connecting right now. Please try again later.");
            console.error('Chat error:', error);
        }
    }
    
    addUserMessage(text) {
        const message = {
            type: 'user',
            text: text,
            timestamp: new Date()
        };
        
        this.messages.push(message);
        this.displayMessage(message);
        this.scrollToBottom();
    }
    
    addBotMessage(text) {
        const message = {
            type: 'bot',
            text: text,
            timestamp: new Date()
        };
        
        this.messages.push(message);
        this.displayMessage(message);
        this.scrollToBottom();
    }
    
    displayMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.type}-message`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = message.type === 'bot' ? '🤖' : '👤';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        const text = document.createElement('div');
        text.className = 'message-text';
        text.innerHTML = message.text;
        
        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = this.formatTime(message.timestamp);
        
        content.appendChild(text);
        content.appendChild(time);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        
        this.chatMessages.appendChild(messageDiv);
    }
    
    showTypingIndicator() {
        this.isTyping = true;
        this.chatSend.disabled = true;
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator-message';
        typingDiv.id = 'typing-indicator';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = '🤖';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing-indicator';
        typingIndicator.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        
        content.appendChild(typingIndicator);
        typingDiv.appendChild(avatar);
        typingDiv.appendChild(content);
        
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        this.isTyping = false;
        this.chatSend.disabled = false;
        
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    async getAIResponse(userMessage) {
        // Check if Gemini API is configured
        if (typeof GEMINI_CONFIG !== 'undefined' && GEMINI_CONFIG.API_KEY) {
            try {
                return await getGeminiResponse(userMessage);
            } catch (error) {
                console.error('Gemini API failed, falling back to smart responses:', error);
                return this.generateSmartResponse(userMessage);
            }
        }
        
        // Use smart response system as fallback
        return this.generateSmartResponse(userMessage);
    }
    
    generateSmartResponse(userMessage) {
        // First, try to provide detailed topic explanations
        const topicResponse = this.generateTopicResponse(userMessage);
        if (topicResponse) {
            return topicResponse;
        }
        
        // Then fall back to general responses
        const message = userMessage.toLowerCase();
        
        // Assignment organization
        if (message.includes('organiz') || message.includes('organize')) {
            return `📋 <strong>Assignment Organization Tips:</strong><br><br>
            • <strong>Use the Eisenhower Matrix:</strong> Urgent vs Important<br>
            • <strong>Break down large projects</strong> into smaller tasks<br>
            • <strong>Set realistic deadlines</strong> with buffer time<br>
            • <strong>Group similar assignments</strong> to work efficiently<br>
            • <strong>Use your Deadline Tracker</strong> to visualize priorities<br><br>
            Would you like me to help you create a study schedule?`;
        }
        
        // Time management
        if (message.includes('time') || message.includes('deadline') || message.includes('schedule')) {
            return `⏰ <strong>Time Management Strategies:</strong><br><br>
            • <strong>Pomodoro Technique:</strong> 25 min work + 5 min break<br>
            • <strong>Time blocking:</strong> Dedicate specific hours to tasks<br>
            • <strong>Buffer time:</strong> Add 20% extra time for unexpected issues<br>
            • <strong>Priority order:</strong> Do hardest tasks when you're most alert<br>
            • <strong>Review weekly:</strong> Adjust your schedule based on progress<br><br>
            I can help you create a personalized study plan!`;
        }
        
        // Motivation
        if (message.includes('motivat') || message.includes('motivation') || message.includes('stuck')) {
            return `🚀 <strong>Staying Motivated:</strong><br><br>
            • <strong>Celebrate small wins</strong> - every completed task counts!<br>
            • <strong>Visualize success</strong> - imagine how good you'll feel when done<br>
            • <strong>Break it down</strong> - large projects feel less overwhelming<br>
            • <strong>Find your why</strong> - connect tasks to your bigger goals<br>
            • <strong>Reward yourself</strong> - treat yourself after completing milestones<br><br>
            What's your biggest challenge right now?`;
        }
        
        // Study strategies
        if (message.includes('study') || message.includes('learn') || message.includes('research')) {
            return `📚 <strong>Effective Study Strategies:</strong><br><br>
            • <strong>Active recall:</strong> Test yourself instead of just re-reading<br>
            • <strong>Spaced repetition:</strong> Review material at increasing intervals<br>
            • <strong>Mind mapping:</strong> Visualize connections between concepts<br>
            • <strong>Teach others:</strong> Explain concepts to reinforce learning<br>
            • <strong>Environment matters:</strong> Find your optimal study space<br><br>
            Which subject are you working on? I can give you specific tips!`;
        }
        
        // Writing help
        if (message.includes('write') || message.includes('essay') || message.includes('paper')) {
            return `✍️ <strong>Writing Assignment Tips:</strong><br><br>
            • <strong>Start with an outline:</strong> Plan your structure first<br>
            • <strong>Free write first:</strong> Get ideas down, edit later<br>
            • <strong>Use the 5-paragraph structure:</strong> Intro, 3 body paragraphs, conclusion<br>
            • <strong>Cite sources properly:</strong> Keep track as you research<br>
            • <strong>Read aloud:</strong> Catch errors and improve flow<br><br>
            What type of writing assignment are you working on?`;
        }
        
        // Problem solving
        if (message.includes('problem') || message.includes('difficult') || message.includes('help')) {
            return `🔧 <strong>Problem-Solving Approach:</strong><br><br>
            • <strong>Understand the problem:</strong> What exactly is being asked?<br>
            • <strong>Break it down:</strong> What are the smaller parts?<br>
            • <strong>Look for patterns:</strong> Similar problems you've solved?<br>
            • <strong>Try different approaches:</strong> Don't get stuck on one method<br>
            • <strong>Ask for help:</strong> Teachers, classmates, or online resources<br><br>
            Can you describe the specific problem you're facing?`;
        }
        
        // Topic discussion and concept understanding
        if (message.includes('explain') || message.includes('what is') || message.includes('how does') || message.includes('concept') || message.includes('topic')) {
            return `🧠 <strong>I'd love to help you understand this topic!</strong><br><br>
            To give you the best explanation, please tell me:<br>
            • <strong>What subject</strong> are you studying? (Math, Science, History, etc.)<br>
            • <strong>What specific concept</strong> do you want me to explain?<br>
            • <strong>What level</strong> are you at? (High school, College, etc.)<br><br>
            For example: "Explain photosynthesis in biology" or "What is calculus in math?"<br><br>
            I can break down complex topics, provide examples, and help you understand step-by-step!`;
        }
        
        // Math and problem solving
        if (message.includes('math') || message.includes('calculate') || message.includes('equation') || message.includes('formula') || message.includes('solve')) {
            return `🔢 <strong>Math Problem Solver!</strong><br><br>
            I can help you with:<br>
            • <strong>Step-by-step solutions</strong> to math problems<br>
            • <strong>Concept explanations</strong> with examples<br>
            • <strong>Formula applications</strong> and when to use them<br>
            • <strong>Problem-solving strategies</strong> for different types<br><br>
            Please share your math problem or question, and I'll walk you through the solution!<br><br>
            Example: "Solve 2x + 5 = 13" or "Explain quadratic equations"`;
        }
        
        // Science topics
        if (message.includes('science') || message.includes('physics') || message.includes('chemistry') || message.includes('biology') || message.includes('experiment')) {
            return `🔬 <strong>Science Topic Helper!</strong><br><br>
            I can assist with:<br>
            • <strong>Scientific concepts</strong> and theories<br>
            • <strong>Lab procedures</strong> and safety<br>
            • <strong>Data analysis</strong> and interpretation<br>
            • <strong>Research methods</strong> and hypothesis testing<br><br>
            What science topic are you studying? I can explain concepts, help with experiments, and clarify theories!<br><br>
            Example: "Explain photosynthesis" or "How do chemical reactions work?"`;
        }
        
        // History and social studies
        if (message.includes('history') || message.includes('social studies') || message.includes('geography') || message.includes('politics') || message.includes('culture')) {
            return `📚 <strong>History & Social Studies Guide!</strong><br><br>
            I can help with:<br>
            • <strong>Historical events</strong> and their significance<br>
            • <strong>Geographic concepts</strong> and maps<br>
            • <strong>Political systems</strong> and governance<br>
            • <strong>Cultural analysis</strong> and comparisons<br><br>
            What historical period or social topic are you studying? I can provide context, explain causes and effects, and help you analyze!<br><br>
            Example: "Explain the Industrial Revolution" or "What caused World War II?"`;
        }
        
        // Literature and language
        if (message.includes('literature') || message.includes('book') || message.includes('poem') || message.includes('story') || message.includes('language') || message.includes('grammar')) {
            return `📖 <strong>Literature & Language Assistant!</strong><br><br>
            I can help with:<br>
            • <strong>Literary analysis</strong> and interpretation<br>
            • <strong>Writing techniques</strong> and styles<br>
            • <strong>Grammar rules</strong> and usage<br>
            • <strong>Text comprehension</strong> and critical thinking<br><br>
            What book, poem, or language concept are you working on? I can help analyze themes, explain symbolism, and improve your writing!<br><br>
            Example: "Analyze the theme of love in Romeo and Juliet" or "Explain passive voice in grammar"`;
        }
        
        // Programming and technology
        if (message.includes('programming') || message.includes('code') || message.includes('computer') || message.includes('algorithm') || message.includes('software')) {
            return `💻 <strong>Programming & Tech Helper!</strong><br><br>
            I can assist with:<br>
            • <strong>Code explanations</strong> and debugging<br>
            • <strong>Algorithm concepts</strong> and logic<br>
            • <strong>Programming languages</strong> and syntax<br>
            • <strong>Problem-solving approaches</strong> in coding<br><br>
            What programming concept or problem are you working on? I can explain algorithms, help debug code, and teach programming concepts!<br><br>
            Example: "Explain loops in Python" or "Help debug this JavaScript code"`;
        }
        
        // General help
        if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
            return `Hello! 👋 I'm your comprehensive AI study partner, here to help you succeed!<br><br>
            <strong>I can help you with:</strong><br>
            • 📋 Assignment planning & organization<br>
            • ⏰ Time management & scheduling<br>
            • 🚀 Motivation & productivity<br>
            • 📚 Study strategies & techniques<br>
            • ✍️ Writing & research help<br>
            • 🧠 <strong>Topic discussions & concept explanations</strong><br>
            • 🔢 <strong>Math problem solving step-by-step</strong><br>
            • 🔬 <strong>Science concepts & experiments</strong><br>
            • 📖 <strong>Literature analysis & interpretation</strong><br>
            • 💻 <strong>Programming & technology help</strong><br><br>
            <strong>What would you like to work on today?</strong> Try asking me to explain any topic or solve any problem!`;
        }
        
        // Default response - encourage topic discussion
        return `🧠 <strong>I'd love to help you understand this topic or solve this problem!</strong><br><br>
        I can assist with:<br>
        • <strong>Topic discussions</strong> - explain any concept step-by-step<br>
        • <strong>Problem solving</strong> - walk through solutions together<br>
        • <strong>Concept clarification</strong> - break down complex ideas<br>
        • <strong>Study strategies</strong> - help you learn more effectively<br><br>
        <strong>Try asking me:</strong><br>
        • "Explain photosynthesis in biology"<br>
        • "Solve this math problem: 3x + 7 = 22"<br>
        • "What is the Industrial Revolution?"<br>
        • "Help me understand Shakespeare's themes"<br><br>
        What specific topic or problem would you like to discuss?`;
    }
    
    generateTopicResponse(userMessage) {
        const message = userMessage.toLowerCase();
        
        // Math Problem Solving
        if (message.includes('solve') && (message.includes('math') || message.includes('equation') || message.includes('='))) {
            return this.solveMathProblem(userMessage);
        }
        
        // Science Topics
        if (message.includes('photosynthesis')) {
            return `🌱 <strong>Photosynthesis Explained!</strong><br><br>
            <strong>What is Photosynthesis?</strong><br>
            Photosynthesis is the process where plants convert sunlight, water, and carbon dioxide into glucose (sugar) and oxygen.<br><br>
            
            <strong>Step-by-Step Process:</strong><br>
            1️⃣ <strong>Light Absorption:</strong> Chlorophyll in leaves captures sunlight<br>
            2️⃣ <strong>Water Splitting:</strong> Water molecules are broken down into hydrogen and oxygen<br>
            3️⃣ <strong>Carbon Fixation:</strong> CO₂ combines with hydrogen to form glucose<br>
            4️⃣ <strong>Oxygen Release:</strong> Oxygen is released as a byproduct<br><br>
            
            <strong>Chemical Equation:</strong><br>
            6CO₂ + 6H₂O + Light Energy → C₆H₁₂O₆ + 6O₂<br><br>
            
            <strong>Why is it Important?</strong><br>
            • Provides food for plants and animals<br>
            • Produces oxygen for breathing<br>
            • Forms the base of the food chain<br><br>
            
            <strong>Study Tips:</strong><br>
            • Draw the process step-by-step<br>
            • Remember the chemical equation<br>
            • Understand the role of chlorophyll<br><br>
            
            Would you like me to explain any specific part in more detail?`;
        }
        
        // Math Problems
        if (message.includes('2x + 5 = 13') || message.includes('solve 2x + 5 = 13')) {
            return `🔢 <strong>Solving: 2x + 5 = 13</strong><br><br>
            <strong>Step-by-Step Solution:</strong><br><br>
            
            <strong>Step 1:</strong> Isolate the variable term<br>
            2x + 5 = 13<br>
            2x + 5 - 5 = 13 - 5 ← Subtract 5 from both sides<br>
            2x = 8<br><br>
            
            <strong>Step 2:</strong> Solve for x<br>
            2x = 8<br>
            2x ÷ 2 = 8 ÷ 2 ← Divide both sides by 2<br>
            x = 4<br><br>
            
            <strong>Answer:</strong> x = 4<br><br>
            
            <strong>Verification:</strong><br>
            Let's check: 2(4) + 5 = 8 + 5 = 13 ✓<br><br>
            
            <strong>Key Concepts:</strong><br>
            • <strong>Balance:</strong> Whatever you do to one side, do to the other<br>
            • <strong>Inverse Operations:</strong> Addition ↔ Subtraction, Multiplication ↔ Division<br>
            • <strong>Goal:</strong> Get x by itself on one side<br><br>
            
            <strong>Practice:</strong> Try solving 3x - 7 = 8!`;
        }
        
        // History Topics
        if (message.includes('industrial revolution')) {
            return `🏭 <strong>The Industrial Revolution Explained!</strong><br><br>
            <strong>What was the Industrial Revolution?</strong><br>
            A period of major industrialization and innovation from the late 18th to early 19th century that transformed society from agricultural to industrial.<br><br>
            
            <strong>Key Changes:</strong><br>
            🔧 <strong>Technology:</strong> Steam engine, power loom, spinning jenny<br>
            🏭 <strong>Industry:</strong> Factories replaced home-based production<br>
            🚂 <strong>Transportation:</strong> Steam locomotives and better roads<br>
            🏙️ <strong>Urbanization:</strong> People moved from farms to cities<br><br>
            
            <strong>Major Inventions:</strong><br>
            • <strong>1769:</strong> James Watt's improved steam engine<br>
            • <strong>1764:</strong> Spinning jenny for textile production<br>
            • <strong>1807:</strong> First commercial steamboat<br>
            • <strong>1825:</strong> First public railway<br><br>
            
            <strong>Social Impact:</strong><br>
            • <strong>Working Conditions:</strong> Long hours, poor safety<br>
            • <strong>Child Labor:</strong> Children worked in dangerous factories<br>
            • <strong>Class System:</strong> New industrial middle class emerged<br>
            • <strong>Living Standards:</strong> Eventually improved for most people<br><br>
            
            <strong>Why it Matters:</strong><br>
            • Shaped modern industrial society<br>
            • Led to labor rights movements<br>
            • Created modern capitalism<br>
            • Changed how people live and work<br><br>
            
            <strong>Study Tips:</strong><br>
            • Focus on key inventions and their impact<br>
            • Understand the social consequences<br>
            • Connect to modern developments<br><br>
            
            Would you like me to explain any specific aspect in more detail?`;
        }
        
        // Literature Analysis
        if (message.includes('shakespeare') || message.includes('romeo and juliet')) {
            return `📖 <strong>Shakespeare's Romeo and Juliet Analysis!</strong><br><br>
            <strong>Main Themes:</strong><br>
            💕 <strong>Love vs. Hate:</strong> Passionate love vs. family feud<br>
            ⏰ <strong>Fate vs. Free Will:</strong> Are the lovers doomed from the start?<br>
            🚫 <strong>Youth vs. Age:</strong> Impulsive young love vs. cautious elders<br>
            ⚖️ <strong>Light vs. Dark:</strong> Love as light, death as darkness<br><br>
            
            <strong>Key Characters:</strong><br>
            • <strong>Romeo:</strong> Passionate, impulsive, romantic Montague<br>
            • <strong>Juliet:</strong> Young, intelligent, determined Capulet<br>
            • <strong>Mercutio:</strong> Witty friend who represents reason<br>
            • <strong>Friar Lawrence:</strong> Well-meaning but flawed advisor<br><br>
            
            <strong>Literary Devices:</strong><br>
            • <strong>Dramatic Irony:</strong> Audience knows more than characters<br>
            • <strong>Foreshadowing:</strong> Death imagery throughout<br>
            • <strong>Metaphors:</strong> Love as light, death as sleep<br>
            • <strong>Soliloquies:</strong> Characters speaking their thoughts<br><br>
            <strong>Famous Quotes:</strong><br>
            • "But soft, what light through yonder window breaks?"<br>
            • "Romeo, Romeo, wherefore art thou Romeo?"<br>
            • "A plague on both your houses!"<br><br>
            
            <strong>Study Tips:</strong><br>
            • Read with modern translations<br>
            • Watch performances to understand emotion<br>
            • Focus on themes and character development<br><br>
            
            What specific aspect would you like me to explain further?`;
        }
        
        // Programming Help
        if (message.includes('python') || message.includes('loops')) {
            return `🐍 <strong>Python Loops Explained!</strong><br><br>
            <strong>What are Loops?</strong><br>
            Loops allow you to repeat code multiple times without writing it repeatedly.<br><br>
            
            <strong>Types of Loops:</strong><br><br>
            🔄 <strong>For Loop:</strong><br>
            <code>for item in sequence:</code><br>
            <code>    print(item)</code><br><br>
            
            <strong>Example:</strong><br>
            <code>fruits = ["apple", "banana", "orange"]</code><br>
            <code>for fruit in fruits:</code><br>
            <code>    print(fruit)</code><br><br>
            
            ⚡ <strong>While Loop:</strong><br>
            <code>while condition:</code><br>
            <code>    # code to repeat</code><br><br>
            
            <strong>Example:</strong><br>
            <code>count = 0</code><br>
            <code>while count < 5:</code><br>
            <code>    print(count)</code><br>
            <code>    count += 1</code><br><br>
            
            <strong>Loop Control:</strong><br>
            • <strong>break:</strong> Exit the loop early<br>
            • <strong>continue:</strong> Skip to next iteration<br>
            • <strong>else:</strong> Execute when loop finishes normally<br><br>
            
            <strong>Practice Exercise:</strong><br>
            Write a loop that prints even numbers from 2 to 10!<br><br>
            
            Would you like me to explain any specific loop concept or show more examples?`;
        }
        
        return null; // No specific topic response found
    }
    
    solveMathProblem(userMessage) {
        // Extract math problem from message
        const mathMatch = userMessage.match(/(\d+)x\s*([+\-])\s*(\d+)\s*=\s*(\d+)/);
        if (mathMatch) {
            const [, coefficient, operator, constant, result] = mathMatch;
            const a = parseInt(coefficient);
            const b = parseInt(constant);
            const c = parseInt(result);
            
            let x;
            if (operator === '+') {
                x = (c - b) / a;
            } else {
                x = (c + b) / a;
            }
            
            return `🔢 <strong>Solving: ${a}x ${operator} ${b} = ${c}</strong><br><br>
            <strong>Step-by-Step Solution:</strong><br><br>
            
            <strong>Step 1:</strong> Isolate the variable term<br>
            ${a}x ${operator} ${b} = ${c}<br>
            ${a}x ${operator} ${b} ${operator === '+' ? '-' : '+'} ${b} = ${c} ${operator === '+' ? '-' : '+'} ${b}<br>
            ${a}x = ${operator === '+' ? c - b : c + b}<br><br>
            
            <strong>Step 2:</strong> Solve for x<br>
            ${a}x = ${operator === '+' ? c - b : c + b}<br>
            ${a}x ÷ ${a} = ${operator === '+' ? c - b : c + b} ÷ ${a}<br>
            x = ${x}<br><br>
            
            <strong>Answer:</strong> x = ${x}<br><br>
            
            <strong>Verification:</strong><br>
            Let's check: ${a}(${x}) ${operator} ${b} = ${a * x} ${operator} ${b} = ${operator === '+' ? a * x + b : a * x - b} ✓<br><br>
            
            <strong>Key Concepts:</strong><br>
            • <strong>Balance:</strong> Whatever you do to one side, do to the other<br>
            • <strong>Inverse Operations:</strong> Addition ↔ Subtraction, Multiplication ↔ Division<br>
            • <strong>Goal:</strong> Get x by itself on one side<br><br>
            
            <strong>Practice:</strong> Try solving ${a + 1}x ${operator === '+' ? '-' : '+'} ${b + 2} = ${c + 3}!`;
        }
        
        return null; // Couldn't parse the math problem
    }
    
    getWelcomeMessage() {
        return `Welcome back! 👋 I'm your comprehensive AI study partner, here to help you succeed!<br><br>
        <strong>I can help you with:</strong><br>
        • 📋 Assignment planning & organization<br>
        • ⏰ Time management & scheduling<br>
        • 🚀 Motivation & productivity<br>
        • 📚 Study strategies & techniques<br>
        • ✍️ Writing & research guidance<br>
        • 🧠 <strong>Topic discussions & concept explanations</strong><br>
        • 🔢 <strong>Math problem solving step-by-step</strong><br>
        • 🔬 <strong>Science concepts & experiments</strong><br>
        • 📖 <strong>Literature analysis & interpretation</strong><br>
        • 💻 <strong>Programming & technology help</strong><br><br>
        <strong>Try asking me:</strong><br>
        • "Explain photosynthesis in biology"<br>
        • "Solve this math problem: 3x + 7 = 22"<br>
        • "What is the Industrial Revolution?"<br>
        • "Help me understand Shakespeare's themes"<br><br>
        <strong>Quick tips:</strong> Use the suggestion buttons below or ask me anything about your studies!`;
    }
    
    formatTime(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return timestamp.toLocaleDateString();
    }
    
    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }
    
    saveChatHistory() {
        try {
            localStorage.setItem('chatbot_history', JSON.stringify(this.messages));
        } catch (error) {
            console.error('Failed to save chat history:', error);
        }
    }
    
    loadChatHistory() {
        try {
            const saved = localStorage.getItem('chatbot_history');
            if (saved) {
                this.messages = JSON.parse(saved);
                this.messages.forEach(message => this.displayMessage(message));
            }
        } catch (error) {
            console.error('Failed to load chat history:', error);
        }
    }
}

// Initialize chatbot when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.chatBot = new ChatBot();
});

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatBot;
}
