document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chatBox');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const viewPromptBtn = document.getElementById('viewPromptBtn');
    const suggestPromptBtn = document.getElementById('suggestPromptBtn');
    const readCodeBtn = document.getElementById('readCodeBtn');

    let chatHistory = []; // Stores messages in the format expected by the backend

    function appendMessage(sender, message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        if (sender === 'user') {
            messageElement.classList.add('user-message');
            messageElement.innerHTML = `<p><strong>You:</strong> ${message}</p>`;
        } else {
            messageElement.classList.add('agent-message');
            messageElement.innerHTML = `<p><strong>Agent:</strong> ${message}</p>`;
        }
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to the latest message
    }

    async function sendMessage() {
        const message = userInput.value.trim();
        if (message === '') return;

        appendMessage('user', message);
        chatHistory.push({ "role": "user", "parts": message });
        userInput.value = '';

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: message, history: chatHistory })
            });

            const data = await response.json();
            if (response.ok) {
                appendMessage('agent', data.response);
                chatHistory.push({ "role": "model", "parts": data.response });
            } else {
                appendMessage('agent', `Error: ${data.error || 'Something went wrong.'}`);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            appendMessage('agent', 'Error connecting to the agent. Please try again.');
        }
    }

    async function viewSystemPrompt() {
        try {
            const response = await fetch('/api/prompt/get');
            const data = await response.json();
            if (response.ok) {
                alert(`Current System Prompt:\n\n${data.system_prompt}`);
            } else {
                alert(`Error viewing prompt: ${data.error || 'Something went wrong.'}`);
            }
        } catch (error) {
            console.error('Error viewing prompt:', error);
            alert('Error connecting to the API to view prompt.');
        }
    }

    async function suggestNewPrompt() {
        suggestPromptBtn.disabled = true; // Prevent multiple clicks
        suggestPromptBtn.textContent = 'Suggesting...';
        try {
            const response = await fetch('/api/prompt/suggest');
            const data = await response.json();
            if (response.ok) {
                const suggestedPrompt = data.suggested_prompt;
                if (confirm(`Suggested new system prompt:\n\n"${suggestedPrompt}"\n\nDo you want to apply this? (This would require redeploying with the new prompt as an environment variable)`)) {
                    alert('To apply, you would update the ULTIMA_AGENT_SYSTEM_PROMPT environment variable on Vercel and redeploy.');
                } else {
                    alert('Suggestion not applied.');
                }
            } else {
                alert(`Error suggesting prompt: ${data.error || 'Something went wrong.'}`);
            }
        } catch (error) {
            console.error('Error suggesting prompt:', error);
            alert('Error connecting to the API to suggest prompt.');
        } finally {
            suggestPromptBtn.disabled = false;
            suggestPromptBtn.textContent = 'Suggest New Prompt';
        }
    }

    async function readCodeFile() {
        const filePath = prompt('Enter the path to the code file you want to read (e.g., api/index.py):');
        if (!filePath) return;

        try {
            const response = await fetch(`/api/code/read?file_path=${encodeURIComponent(filePath)}`);
            const data = await response.json();
            if (response.ok) {
                alert(`Content of ${data.file_path}:\n\n${data.content}`);
            } else {
                alert(`Error reading file: ${data.error || 'Something went wrong.'}`);
            }
        } catch (error) {
            console.error('Error reading code file:', error);
            alert('Error connecting to the API to read code file.');
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });
    viewPromptBtn.addEventListener('click', viewSystemPrompt);
    suggestPromptBtn.addEventListener('click', suggestNewPrompt);
    readCodeBtn.addEventListener('click', readCodeFile);
});
