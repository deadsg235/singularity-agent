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

    const projectFilesBtn = document.getElementById('projectFilesBtn');
    
    // Modal Elements
    const projectFilesModal = document.getElementById('projectFilesModal');
    const closeModalButton = projectFilesModal.querySelector('.close-button');
    const modalSystemPrompt = document.getElementById('modalSystemPrompt');
    const projectFilesList = document.getElementById('projectFilesList');
    const suggestToolBtn = document.getElementById('suggestToolBtn');

    // Hardcoded list of key project files for the modal
    const KEY_PROJECT_FILES = [
        'api/index.py',
        'agent_web.py',
        'token_module.py',
        'ml_core/deep_q_tool_generator.py',
        'public/index.html',
        'public/style.css',
        'public/script.js',
        'requirements.txt',
        'vercel.json'
    ];

    // New function for suggesting tools
    async function suggestNewTool() {
        const taskDescription = prompt('Describe the new tool you want the agent to generate (e.g., "A Python function to calculate Fibonacci numbers"):');
        if (!taskDescription) return;

        suggestToolBtn.disabled = true;
        suggestToolBtn.textContent = 'Suggesting Tool...';

        try {
            const response = await fetch('/api/tool/suggest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ task_description: taskDescription, user_id: USER_ID })
            });

            const data = await response.json();
            if (response.ok) {
                alert(`Suggested Tool Code:\n\n${data.suggested_tool_code}\n\n(Remember: This is a suggestion for manual review and application.)`);
            } else {
                alert(`Error suggesting tool: ${data.error || 'Something went wrong.'}`);
            }
        } catch (error) {
            console.error('Error suggesting tool:', error);
            alert('Error connecting to the API to suggest tool.');
        } finally {
            suggestToolBtn.disabled = false;
            suggestToolBtn.textContent = 'Suggest New Tool';
        }
    }

    // Function to open the Project Files modal
    async function openProjectFilesModal() {
        projectFilesModal.style.display = 'block';

        // Fetch and display system prompt
        try {
            const response = await fetch('/api/prompt/get');
            const data = await response.json();
            if (response.ok) {
                modalSystemPrompt.textContent = data.system_prompt;
            } else {
                modalSystemPrompt.textContent = `Error: ${data.error || 'Could not fetch system prompt.'}`;
            }
        } catch (error) {
            modalSystemPrompt.textContent = 'Error fetching system prompt.';
            console.error('Error fetching system prompt for modal:', error);
        }

        // Populate project files list
        projectFilesList.innerHTML = ''; // Clear previous list
        KEY_PROJECT_FILES.forEach(filePath => {
            const listItem = document.createElement('li');
            listItem.textContent = filePath;
            listItem.onclick = () => readCodeFile(filePath); // Make file clickable
            projectFilesList.appendChild(listItem);
        });
    }

    // Function to close the Project Files modal
    function closeProjectFilesModal() {
        projectFilesModal.style.display = 'none';
    }

    // Event Listeners
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });
    viewPromptBtn.addEventListener('click', viewSystemPrompt);
    suggestPromptBtn.addEventListener('click', suggestNewPrompt);
    readCodeBtn.addEventListener('click', () => readCodeFile(null)); // Pass null so it prompts
    suggestCodeChangeBtn.addEventListener('click', suggestCodeChange);
    checkBalanceBtn.addEventListener('click', checkTokenBalance);
    projectFilesBtn.addEventListener('click', openProjectFilesModal);
    closeModalButton.addEventListener('click', closeProjectFilesModal);
    suggestToolBtn.addEventListener('click', suggestNewTool);

    // Close modal if user clicks outside of it
    window.addEventListener('click', (event) => {
        if (event.target == projectFilesModal) {
            closeProjectFilesModal();
        }
    });
});

