(function () {

    const openaiEndpoint = 'https://api.openai.com/v1/edits';

    const storageKeys = {
        chatHistory: 'chatHistory',
        chatSettings: 'chatSettings'
    };

    const chatSettings = {
        apiKey: '',
        model: 'text-davinci-edit-001',
        instruction: 'Fix the spelling mistakes', // The instruction that tells the model how to edit the prompt.
        editsToGenerate: 1, // How many edits to generate for the input and instruction.
        temperature: 0.8 // What sampling temperature to use, between 0 (focused) and 2 (random).
    };

    // Let's get ready to rumble
    const initOptions = async () => {

        // load saved apiKey
        await getStorageData(storageKeys.chatSettings, async (savedChatSettings) => {
            if (!savedChatSettings) {
                savedChatSettings = chatSettings;
            }
            for (const key in savedChatSettings) {
                if (savedChatSettings.hasOwnProperty(key)) {
                    document.getElementById(key).value = savedChatSettings[key] ?? '';
                }
            }
        });

        // load saved chat history
        await getStorageData(storageKeys.chatHistory, async (savedChatHistory) => {
            if (savedChatHistory) {
                const chatBody = document.getElementById("chatBody");
                chatBody.innerHTML = '';

                for (const message of savedChatHistory) {
                    await addSpeechBubble(message);
                }
            }
        });

        await addEventListeners();
    };

    const addEventListeners = async () => {

        // handle settings saveButton click
        document.getElementById('saveButton').addEventListener('click', async () => {
            var newChatSettings = {};

            for (const key in chatSettings) {
                newChatSettings[key] = document.getElementById(key).value;
            }

            await setStorageData({ [storageKeys.chatSettings]: newChatSettings }, () => {
                alert('Chat settings saved!');
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
        chatButton.addEventListener('click', async () => {

            if (chatButton.classList.contains("loading")) {
                return;
            }

            await getStorageData(storageKeys.chatSettings, async (savedChatSettings) => {
                if (!savedChatSettings || savedChatSettings.apiKey == '') {
                    alert('No API key found');
                    return;
                }

                const input = document.getElementById("chatInput");

                if (input.value == '') {
                    alert('Please enter a message before submitting');
                    return;
                }

                try {
                    // show loading
                    chatButton.classList.add("loading");

                    // add user input as speech bubble
                    await addSpeechBubble(input.value, false, true);

                    // reset chatInput
                    const prompt = input.value;
                    input.value = '';
                    input.removeAttribute("style");

                    // get response
                    const processedResponse = await callOpenaiApi(prompt, savedChatSettings);

                    // add api response as speech bubble
                    await addSpeechBubble(
                        processedResponse,
                        true,
                        true,
                        () => chatButton.classList.remove("loading")
                    );
                } catch (error) {
                    console.error(error);
                }
                finally {
                    setTimeout(function () {
                        chatButton.classList.remove("loading");
                    }, 5000);
                }
            });
        });
    };

    // Save messages in browser storage to maintain the state when the user switches tabs
    const addMessageToChatHistory = async (newMessage) => {
        await getStorageData(storageKeys.chatHistory, async (savedChatHistory) => {
            if (!savedChatHistory) {
                savedChatHistory = [];
            }

            // Add the new message to chatHistory
            savedChatHistory.push(newMessage);

            // Save the updated chatHistory
            await setStorageData({ [storageKeys.chatHistory]: savedChatHistory }, () => {
                console.log('Updated chat history saved');
            });
        });
    };

    const getStorageData = (key, callback) =>
        new Promise((resolve, reject) =>
            chrome.storage.sync.get(key, result => {
                if (chrome.runtime.lastError) {
                    reject(Error(chrome.runtime.lastError.message));
                } else {
                    resolve(result[key]);
                    if (typeof callback === 'function') {
                        callback(result[key]);
                    }
                }
            })
        );

    const setStorageData = (data, callback) =>
        new Promise((resolve, reject) =>
            chrome.storage.sync.set(data, () => {
                if (chrome.runtime.lastError) {
                    reject(Error(chrome.runtime.lastError.message));
                } else {
                    resolve();
                    if (typeof callback === 'function') {
                        callback();
                    }
                }
            })
        );

    // Tab switching handler
    const selectTab = (tabId) => {
        const tabs = document.querySelectorAll(".tab");
        tabs.forEach((tab) => {
            tab.classList.remove("selected");
        });

        document.getElementById(tabId).classList.add("selected");

        const chatContent = document.getElementById("chatContent");
        const settingsContent = document.getElementById("settingsContent");
        const chatForm = document.getElementById("chatForm");
        const saveButton = document.getElementById("saveButton");

        if (tabId === "chatTab") {
            chatContent.classList.remove("hidden");
            settingsContent.classList.add("hidden");
            chatForm.classList.remove("hidden");
            saveButton.classList.add("hidden");
        } else {
            chatContent.classList.add("hidden");
            settingsContent.classList.remove("hidden");
            chatForm.classList.add("hidden");
            saveButton.classList.remove("hidden");
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

        chatMessage.appendChild(bubble);
        document.getElementById("chatBody").appendChild(chatMessage);

        if (addToHistory) {
            await addMessageToChatHistory(content);
        }

        if (useTypingEffect) {
            await appendMessage(bubble, content, callback);

            return;
        }

        bubble.innerHTML = content;

        const mainContainer = document.getElementById("mainContainer");
        mainContainer.scrollTop = mainContainer.scrollHeight;
    };

    // Print out a chat message with random delay between letters
    const appendMessage = async (input, message, callback) => {
        input.innerHTML = '';

        // Helper for randomness
        const getRandomTypingSpeed = (min, max) => {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        };

        const mainContainer = document.getElementById("mainContainer");

        // Typing effect
        for (let i = 0; i < message.length; i++) {
            const typingSpeed = getRandomTypingSpeed(10, 70);
            await new Promise(resolve => setTimeout(resolve, typingSpeed));
            input.innerHTML += message.charAt(i);
            mainContainer.scrollTop = mainContainer.scrollHeight;
        }

        if (callback) {
            callback();
        }
    };

    // OpenAI API Client
    const callOpenaiApi = async (prompt, chatSettings) => {
        try {
            const response = await fetch(openaiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${chatSettings.apiKey}`
                },
                body: JSON.stringify({
                    model: chatSettings.model,
                    input: prompt,
                    n: parseInt(chatSettings.editsToGenerate),
                    temperature: parseFloat(chatSettings.temperature),
                    instruction: chatSettings.instruction
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

    // Initialize the extension
    window.addEventListener('load', initOptions);

})();