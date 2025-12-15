document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chatBox');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const viewPromptBtn = document.getElementById('viewPromptBtn');
    const suggestPromptBtn = document.getElementById('suggestPromptBtn');
    const readCodeBtn = document.getElementById('readCodeBtn');
    const suggestCodeChangeBtn = document.getElementById('suggestCodeChangeBtn');
    const checkBalanceBtn = document.getElementById('checkBalanceBtn');

    let chatHistory = []; // Stores messages in the format expected by the backend
    const USER_ID = 'default_user'; // Hardcoded user ID for demo purposes

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
                body: JSON.stringify({ message: message, history: chatHistory, user_id: USER_ID })
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
            const response = await fetch(`/api/prompt/suggest?user_id=${USER_ID}`);
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

    async function suggestCodeChange() {
        const filePath = prompt('Enter the path to the code file you want to change (e.g., api/index.py):');
        if (!filePath) return;

        const changeDescription = prompt('Describe the code change you want (e.g., "add logging to this function", "refactor this loop"):');
        if (!changeDescription) return;

        suggestCodeChangeBtn.disabled = true;
        suggestCodeChangeBtn.textContent = 'Suggesting...';

        try {
            const response = await fetch('/api/code/suggest_change', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ file_path: filePath, change_description: changeDescription, user_id: USER_ID })
            });

            const data = await response.json();
            if (response.ok) {
                alert(`Suggested change for ${data.file_path}:\n\n${data.suggested_code}\n\n(Remember: This is a suggestion for manual review and application.)`);
            } else {
                alert(`Error suggesting code change: ${data.error || 'Something went wrong.'}`);
            }
        } catch (error) {
            console.error('Error suggesting code change:', error);
            alert('Error connecting to the API to suggest code change.');
        } finally {
            suggestCodeChangeBtn.disabled = false;
            suggestCodeChangeBtn.textContent = 'Suggest Code Change';
        }
    }

    async function checkTokenBalance() {
        try {
            const response = await fetch(`/api/token/balance?user_id=${USER_ID}`);
            const data = await response.json();
            if (response.ok) {
                alert(`Your current Ultima Token balance: ${data.balance}`);
            } else {
                alert(`Error checking balance: ${data.error || 'Something went wrong.'}`);
            }
        } catch (error) {
            console.error('Error checking token balance:', error);
            alert('Error connecting to the API to check token balance.');
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
    suggestCodeChangeBtn.addEventListener('click', suggestCodeChange);
    checkBalanceBtn.addEventListener('click', checkTokenBalance);
});
