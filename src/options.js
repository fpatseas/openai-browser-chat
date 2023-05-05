(function () {

    const openaiEndpoint = 'https://api.openai.com/v1/edits';

    // Let's get ready to rumble
    const initOptions = () => {

        // load saved apiKey
        chrome.storage.sync.get('apiKey', ({ apiKey }) => {
            if (apiKey) {
                document.getElementById('apiKey').value = apiKey;
            }
        });

        // load saved chat history
        chrome.storage.sync.get('chatHistory', async ({ chatHistory }) => {
            if (chatHistory) {
                const chatBody = document.getElementById("chatBody");
                chatBody.innerHTML = '';

                for (const message of chatHistory) {
                    await addSpeechBubble(message);
                }
            }
        });

        addEventListeners();
    };

    const addEventListeners = () => {

        // handle settings saveButton click
        document.getElementById('saveButton').addEventListener('click', () => {
            const apiKey = document.getElementById('apiKey').value;
            chrome.storage.sync.set({ apiKey }, () => {
                alert('API key saved!');
            });
        });

        // handle tab switching
        document.getElementById("chatTab").addEventListener("click", () => {
            selectTab("chatTab");
        });

        document.getElementById("settingsTab").addEventListener("click", () => {
            selectTab("settingsTab");
        });

        // handle textarea auto expand
        document.getElementById("chatInput").addEventListener("input", (e) => {
            e.target.style.height = e.target.scrollHeight + "px";
        });

        // handle chatButton click
        const chatButton = document.getElementById("chatButton");
        chatButton.addEventListener('click', () => {
            chrome.storage.sync.get('apiKey', async ({ apiKey }) => {
                if (!apiKey) {
                    console.error('No API key found');
                    return;
                }
                debugger;
                const input = document.getElementById("chatInput");

                try {
                    chatButton.classList.add("loading");
                    await addSpeechBubble(input.value, addToHistory = true);
                    const processedResponse = await callOpenaiApi(input.value, apiKey);
                    await addSpeechBubble(
                        processedResponse,
                        useTypingEffect = true,
                        addToHistory = true,
                        () => chatButton.classList.remove("loading")
                    );
                } catch (error) {
                    console.error(error);
                }
                finally {
                    input.value = '';
                }
            });
        });
    };

    // Save messages in browser storage to maintain the state when the user switches tabs
    const addMessageToChatHistory = (newMessage) => {
        chrome.storage.sync.get('chatHistory', ({ chatHistory }) => {

            if (!chatHistory) {
                chatHistory = [];
            }

            // Add the new message to chatHistory
            chatHistory.push(newMessage);

            // Save the updated chatHistory
            chrome.storage.sync.set({ chatHistory }, () => {
                console.log('Updated chat history saved');
            });
        });
    };

    // Tab switching handler
    const selectTab = (tabId) => {
        const tabs = document.querySelectorAll(".tab");
        tabs.forEach((tab) => {
            tab.classList.remove("selected");
        });

        document.getElementById(tabId).classList.add("selected");

        const chatContent = document.getElementById("chatContent");
        const settingsContent = document.getElementById("settingsContent");
        const footer = document.querySelector("footer");

        if (tabId === "chatTab") {
            chatContent.classList.remove("hidden");
            settingsContent.classList.add("hidden");
            footer.classList.remove("hidden");
        } else {
            chatContent.classList.add("hidden");
            settingsContent.classList.remove("hidden");
            footer.classList.add("hidden");
        }
    };

    // Add a new message to the chat
    const addSpeechBubble = async (
        content,
        useTypingEffect = false,
        addToHistory = false,
        callback = null
    ) => {
        const chatMessage = document.createElement('div');
        chatMessage.classList.add('chat-message');

        const bubble = document.createElement('div');
        bubble.classList.add('speech-bubble');

        if (addToHistory) {
            addMessageToChatHistory(content);
        }

        if (useTypingEffect) {
            await appendMessage(bubble, content, callback);

            document.getElementById("chatBody").scrollTo({
                top: this.scrollHeight,
                behavior: 'smooth'
            });

            return;
        }

        bubble.innerHTML = content;
        chatMessage.appendChild(bubble);
        document.getElementById("chatBody").appendChild(chatMessage);
    };

    // Print out a chat message with random delay between letters
    const appendMessage = async (input, message, callback) => {
        input.innerHTML = '';

        // Helper for randomness
        const getRandomTypingSpeed = (min, max) => {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        };

        // Typing effect
        for (let i = 0; i < message.length; i++) {
            const typingSpeed = getRandomTypingSpeed(10, 70);
            await new Promise(resolve => setTimeout(resolve, typingSpeed));
            input.innerHTML += message.charAt(i);
        }

        chatMessage.appendChild(bubble);
        document.getElementById("chatBody").appendChild(chatMessage);

        if (callback) {
            callback();
        }
    };

    // OpenAI API Client
    const callOpenaiApi = async (prompt, apiKey) => {
        try {
            const response = await fetch(openaiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'text-davinci-edit-001',
                    input: prompt,
                    n: 1,
                    temperature: 0.8,
                    top_p: 1,
                    instruction: 'Fix the grammar and spelling, and if it\'s not English, please translate it'
                })
            });

            const data = await response.json();

            if (data.choices && data.choices.length > 0) {
                return data.choices[0].text;
            } else {
                throw new Error('No response from the API');
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Initialize the widget
    window.addEventListener('load', initOptions);

})();