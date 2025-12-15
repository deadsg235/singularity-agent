class UltimaTerminal {
    constructor() {
        this.terminal = document.getElementById('terminal');
        this.commandInput = document.getElementById('commandInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.chatHistory = [];
        this.userId = 'default_user';
        this.startTime = Date.now();
        
        this.initializeEventListeners();
        this.startUptime();
        this.checkStatus();
        this.showWelcome();
    }

    initializeEventListeners() {
        this.sendBtn.addEventListener('click', () => this.handleCommand());
        this.commandInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleCommand();
        });

        // Terminal controls
        document.getElementById('clearBtn').addEventListener('click', () => this.clearTerminal());
        document.getElementById('toolsBtn').addEventListener('click', () => this.showTools());
        document.getElementById('statusBtn').addEventListener('click', () => this.showStatus());

        // Modal controls
        document.getElementById('closeTools').addEventListener('click', () => this.hideModal('toolsModal'));
        document.getElementById('closeStatus').addEventListener('click', () => this.hideModal('statusModal'));

        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleTool(e.target.dataset.tool));
        });

        // Close modals on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideModal(e.target.id);
            }
        });
    }

    showWelcome() {
        setTimeout(() => {
            this.addMessage('system', 'Ultima AI initialized successfully. Ready for commands.');
        }, 1500);
    }

    async handleCommand() {
        const command = this.commandInput.value.trim();
        if (!command) return;

        this.addMessage('user', command);
        this.commandInput.value = '';

        // Handle built-in commands
        if (await this.handleBuiltinCommand(command)) return;

        // Send to AI
        this.showTyping();
        try {
            const response = await this.sendToAI(command);
            this.hideTyping();
            this.addMessage('agent', response);
        } catch (error) {
            this.hideTyping();
            this.addMessage('error', `Connection error: ${error.message}`);
        }
    }

    async handleBuiltinCommand(command) {
        const cmd = command.toLowerCase();
        
        if (cmd === 'help') {
            this.addMessage('system', `Available commands:
• help - Show this help
• clear - Clear terminal
• status - Show system status  
• tools - Open tools panel
• balance - Check token balance
• Or just chat with Ultima AI!`);
            return true;
        }

        if (cmd === 'clear') {
            this.clearTerminal();
            return true;
        }

        if (cmd === 'status') {
            this.showStatus();
            return true;
        }

        if (cmd === 'tools') {
            this.showTools();
            return true;
        }

        if (cmd === 'balance') {
            await this.checkBalance();
            return true;
        }

        return false;
    }

    async sendToAI(message) {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                history: this.chatHistory,
                user_id: this.userId
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unknown error');

        this.chatHistory.push(
            { role: 'user', parts: message },
            { role: 'model', parts: data.response }
        );

        return data.response;
    }

    addMessage(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        const timestamp = new Date().toLocaleTimeString();
        
        switch(type) {
            case 'user':
                messageDiv.innerHTML = `<span class="prompt-symbol">user@terminal:~$</span> ${content}`;
                break;
            case 'agent':
                messageDiv.innerHTML = `<span class="prompt-symbol">ultima@response:~$</span> ${content}`;
                break;
            case 'system':
                messageDiv.innerHTML = `<span class="prompt-symbol">system@info:~$</span> ${content}`;
                break;
            case 'error':
                messageDiv.innerHTML = `<span class="prompt-symbol">error@terminal:~$</span> ${content}`;
                break;
        }

        this.terminal.appendChild(messageDiv);
        this.terminal.scrollTop = this.terminal.scrollHeight;
    }

    showTyping() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = '<span class="prompt-symbol">ultima@processing:~$</span> ▋';
        this.terminal.appendChild(typingDiv);
        this.terminal.scrollTop = this.terminal.scrollHeight;
    }

    hideTyping() {
        const typing = document.getElementById('typing-indicator');
        if (typing) typing.remove();
    }

    clearTerminal() {
        this.terminal.innerHTML = `
            <div class="welcome-message">
                <span class="prompt-symbol">ultima@terminal:~$</span> 
                <span class="welcome-text">Terminal cleared. Ready for new commands.</span>
            </div>
        `;
    }

    showModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    hideModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    showTools() {
        this.showModal('toolsModal');
    }

    showStatus() {
        this.showModal('statusModal');
        this.updateStatus();
    }

    async updateStatus() {
        try {
            const response = await fetch('/api/health');
            const data = await response.json();
            document.getElementById('connectionStatus').textContent = 
                response.ok ? 'Connected' : 'Disconnected';
        } catch {
            document.getElementById('connectionStatus').textContent = 'Disconnected';
        }

        await this.updateTokenBalance();
    }

    async updateTokenBalance() {
        try {
            const response = await fetch(`/api/token/balance?user_id=${this.userId}`);
            const data = await response.json();
            const balance = response.ok ? data.balance : 'Error';
            document.getElementById('tokenBalance').textContent = balance;
        } catch {
            document.getElementById('tokenBalance').textContent = 'Error';
        }
    }

    async checkBalance() {
        try {
            const response = await fetch(`/api/token/balance?user_id=${this.userId}`);
            const data = await response.json();
            if (response.ok) {
                this.addMessage('system', `Token balance: ${data.balance} ULTIMA`);
            } else {
                this.addMessage('error', `Error checking balance: ${data.error}`);
            }
        } catch (error) {
            this.addMessage('error', `Connection error: ${error.message}`);
        }
    }

    async checkStatus() {
        try {
            const response = await fetch('/api/health');
            if (response.ok) {
                this.addMessage('system', 'Connection to Ultima AI established ✓');
            }
        } catch {
            this.addMessage('error', 'Failed to connect to Ultima AI');
        }
    }

    startUptime() {
        setInterval(() => {
            const uptime = Date.now() - this.startTime;
            const hours = Math.floor(uptime / 3600000);
            const minutes = Math.floor((uptime % 3600000) / 60000);
            const seconds = Math.floor((uptime % 60000) / 1000);
            document.getElementById('uptime').textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    async handleTool(tool) {
        this.hideModal('toolsModal');
        
        switch(tool) {
            case 'code-read':
                await this.readCode();
                break;
            case 'code-suggest':
                await this.suggestCode();
                break;
            case 'tool-generate':
                await this.generateTool();
                break;
            case 'prompt-view':
                await this.viewPrompt();
                break;
            case 'prompt-suggest':
                await this.suggestPrompt();
                break;
            case 'balance':
                await this.checkBalance();
                break;
        }
    }

    async readCode() {
        const filePath = prompt('Enter file path (e.g., api/index.py):');
        if (!filePath) return;

        try {
            const response = await fetch(`/api/code/read?file_path=${encodeURIComponent(filePath)}`);
            const data = await response.json();
            if (response.ok) {
                this.addMessage('system', `File: ${data.file_path}\n\n${data.content}`);
            } else {
                this.addMessage('error', `Error reading file: ${data.error}`);
            }
        } catch (error) {
            this.addMessage('error', `Connection error: ${error.message}`);
        }
    }

    async suggestCode() {
        const filePath = prompt('Enter file path:');
        if (!filePath) return;
        
        const description = prompt('Describe the change:');
        if (!description) return;

        this.showTyping();
        try {
            const response = await fetch('/api/code/suggest_change', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    file_path: filePath,
                    change_description: description,
                    user_id: this.userId
                })
            });

            const data = await response.json();
            this.hideTyping();
            
            if (response.ok) {
                this.addMessage('system', `Code suggestion for ${data.file_path}:\n\n${data.suggested_code}`);
            } else {
                this.addMessage('error', `Error: ${data.error}`);
            }
        } catch (error) {
            this.hideTyping();
            this.addMessage('error', `Connection error: ${error.message}`);
        }
    }

    async generateTool() {
        const description = prompt('Describe the tool you want to generate:');
        if (!description) return;

        this.showTyping();
        try {
            const response = await fetch('/api/tool/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    task_description: description,
                    user_id: this.userId
                })
            });

            const data = await response.json();
            this.hideTyping();
            
            if (response.ok) {
                this.addMessage('system', `Generated tool:\n\n${data.suggested_tool_code}`);
            } else {
                this.addMessage('error', `Error: ${data.error}`);
            }
        } catch (error) {
            this.hideTyping();
            this.addMessage('error', `Connection error: ${error.message}`);
        }
    }

    async viewPrompt() {
        try {
            const response = await fetch('/api/prompt/get');
            const data = await response.json();
            if (response.ok) {
                this.addMessage('system', `Current system prompt:\n\n${data.system_prompt}`);
            } else {
                this.addMessage('error', `Error: ${data.error}`);
            }
        } catch (error) {
            this.addMessage('error', `Connection error: ${error.message}`);
        }
    }

    async suggestPrompt() {
        this.showTyping();
        try {
            const response = await fetch(`/api/prompt/suggest?user_id=${this.userId}`);
            const data = await response.json();
            this.hideTyping();
            
            if (response.ok) {
                this.addMessage('system', `Suggested prompt:\n\n${data.suggested_prompt}`);
            } else {
                this.addMessage('error', `Error: ${data.error}`);
            }
        } catch (error) {
            this.hideTyping();
            this.addMessage('error', `Connection error: ${error.message}`);
        }
    }
}

// Initialize terminal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new UltimaTerminal();
});