function attachEventListeners(input) {
    input.addEventListener('keyup', debounce(handleKeyUp, 400));
    input.addEventListener('change', handleKeyUp);
    input.addEventListener('paste', handleKeyUp);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function handleKeyUp(event) {
    const input = event.target;
    chrome.storage.sync.get('apiKey', ({ apiKey }) => {
        if (!apiKey) return;
        // Call OpenAI API for English correction here and update the input's value
    });
}

document.querySelectorAll('input, textarea').forEach(attachEventListeners);


///////////////////////////////////////////////////////////
fetch('YOUR_SERVER_PROXY_URL', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
        prompt: input.value,
        model: 'text-davinci-002',
        max_tokens: 10
    })
})
    .then(response => response.json())
    .then(data => {
        if (data.choices && data.choices.length > 0) {
            input.value = data.choices[0].text;
        }
    })
    .catch(error => console.error(error));



/////////////////////////////////////////////
const openaiEndpoint = 'https://api.openai.com/v1/engines/davinci-codex/completions';

const callOpenaiApi = async (prompt, apiKey) => {
    try {
        const response = await fetch(openaiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                prompt: prompt,
                max_tokens: 50,
                n: 1,
                stop: null,
                temperature: 0.8
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

const prompt = 'Translate the following English text to French: "Hello, how are you?"';
const apiKey = 'your_openai_api_key';

callOpenaiApi(prompt, apiKey).then(response => {
    console.log(response);
});