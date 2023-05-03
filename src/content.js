(function () {

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

    const addOpenAIInputClass = () => {
        const inputs = document.querySelectorAll('input[type="text"], textarea');
        inputs.forEach((input) => {
            input.classList.add('openai-input');

            const container = document.createElement('div');
            container.classList.add('openai-input-container');
            input.parentNode.insertBefore(container, input);
            container.appendChild(input);

            const button = document.createElement('button');
            button.classList.add('openai-input-btn');
            button.innerHTML = `<span class="icon">💬</span>
                <div class="loading-dots" style="display: none;">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                </div>`;
            input.parentNode.insertBefore(button, input.nextSibling);
            container.appendChild(button);

            button.addEventListener('click', () => {
                chrome.storage.sync.get('apiKey', async ({ apiKey }) => {
                    if (!apiKey) {
                        console.error('No API key found');
                        return;
                    }

                    try {
                        button.classList.add("loading");
                        const correctedValue = await callOpenaiApi(input.value, apiKey);
                        await appendMessage(input, correctedValue, () => button.classList.remove("loading"));
                    } catch (error) {
                        console.error(error);
                    }
                });
            });
        });
    }

    const appendMessage = async (input, message, callback) => {
        input.value = '';

        // Typing effect
        for (let i = 0; i < message.length; i++) {
            const typingSpeed = getRandomTypingSpeed(10, 70);
            await new Promise(resolve => setTimeout(resolve, typingSpeed));
            input.value += message.charAt(i);
        }
        if (callback) {
            callback();
        }
    }

    const getRandomTypingSpeed = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    window.addEventListener('load', addOpenAIInputClass);

})();