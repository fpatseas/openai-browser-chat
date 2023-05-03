document.getElementById('saveButton').addEventListener('click', () => {
    const apiKey = document.getElementById('apiKey').value;
    chrome.storage.sync.set({ apiKey }, () => {
        alert('API key saved!');
    });
});

chrome.storage.sync.get('apiKey', ({ apiKey }) => {
    if (apiKey) {
        document.getElementById('apiKey').value = apiKey;
    }
});

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
}

document.getElementById("chatTab").addEventListener("click", () => {
    selectTab("chatTab");
});

document.getElementById("settingsTab").addEventListener("click", () => {
    selectTab("settingsTab");
});

document.getElementById("chatInput").addEventListener("input", (e) => {
    e.target.style.height = e.target.scrollHeight + "px";
});

document.getElementById("chatButton").addEventListener('click', (e) => {
    chrome.storage.sync.get('apiKey', async ({ apiKey }) => {
        if (!apiKey) {
            console.error('No API key found');
            return;
        }

        try {
            e.target.classList.add("loading");
            const input = document.getElementById("chatInput");
            await addSpeechBubble(input.value, false);
            const correctedValue = await callOpenaiApi(input.value, apiKey);
            await addSpeechBubble(correctedValue, true, () => e.target.classList.remove("loading"));
        } catch (error) {
            console.error(error);
        }
    });
});

const addSpeechBubble = async (content, appendContent, callback) => {
    const chatMessage = document.createElement('div');
    chatMessage.classList.add('chat-message');

    const bubble = document.createElement('div');
    bubble.classList.add('speech-bubble');

    if (appendContent) {
        await appendMessage(bubble, content, callback);

        document.getElementById("chatBody").scrollTo({
            top: this.scrollHeight,
            behavior: 'smooth'
        });
    }
    else {
        bubble.innerHTML = content;
    }
    chatMessage.appendChild(bubble);
    document.getElementById("chatBody").appendChild(chatMessage);
};

const appendMessage = async (input, message, callback) => {
    input.innerHTML = '';

    // Typing effect
    for (let i = 0; i < message.length; i++) {
        const typingSpeed = getRandomTypingSpeed(10, 70);
        await new Promise(resolve => setTimeout(resolve, typingSpeed));
        input.innerHTML += message.charAt(i);
    }
    if (callback) {
        callback();
    }
}

const getRandomTypingSpeed = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const openaiEndpoint = 'https://api.openai.com/v1/edits';

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