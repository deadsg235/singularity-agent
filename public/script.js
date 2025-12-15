class UltimaTerminal {
    constructor() {
        this.terminal = document.getElementById('terminal');
        this.commandInput = document.getElementById('commandInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.chatHistory = [];
        this.userId = 'default_user';
        this.startTime = Date.now();
        
        this.init();
    }

    init() {
        this.sendBtn.addEventListener('click', () => this.handleCommand());
        this.commandInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleCommand();
        });

        // Controls
        document.getElementById('explorerBtn').addEventListener('click', () => this.toggleExplorer());
        document.getElementById('toolsBtn').addEventListener('click', () => this.showTools());
        document.getElementById('statusBtn').addEventListener('click', () => this.showStatus());
        document.getElementById('closeTools').addEventListener('click', () => this.hideModal('toolsModal'));

        // Tool buttons
        document.querySelectorAll('.tool-card').forEach(card => {
            card.addEventListener('click', () => this.handleTool(card.dataset.tool));
        });

        this.startMonitoring();
        this.loadFiles();
        this.checkHealth();
    }

    async handleCommand() {
        const command = this.commandInput.value.trim();
        if (!command) return;

        this.addMessage('user', command);
        this.commandInput.value = '';

        // Built-in commands
        if (await this.handleBuiltinCommand(command)) return;

        // Send to AI
        this.showTyping();
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: command,
                    history: this.chatHistory,
                    user_id: this.userId
                })
            });

            const data = await response.json();
            this.hideTyping();

            if (response.ok) {
                this.addMessage('agent', data.response);
                this.chatHistory.push(
                    { role: 'user', parts: command },
                    { role: 'model', parts: data.response }
                );
            } else {
                this.addMessage('error', data.error || 'Unknown error');
            }
        } catch (error) {
            this.hideTyping();
            this.addMessage('error', `Connection error: ${error.message}`);
        }
    }

    async handleBuiltinCommand(command) {
        const cmd = command.toLowerCase();
        
        if (cmd === 'help') {
            this.addMessage('system', `ULTIMA Commands:
• help - Show commands
• clear - Clear terminal
• status - System status
• tools - Open tools
• balance - Token balance
• files - List files
• health - API health`);
            return true;
        }

        if (cmd === 'clear') {
            this.clearTerminal();
            return true;
        }

        if (cmd === 'status') {
            await this.showSystemStatus();
            return true;
        }

        if (cmd === 'balance') {
            await this.checkBalance();
            return true;
        }

        if (cmd === 'files') {
            await this.listFiles();
            return true;
        }

        if (cmd === 'health') {
            await this.checkHealth();
            return true;
        }

        return false;
    }

    addMessage(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        const prompts = {
            user: 'user@neural:~$',
            agent: 'ultima@response:~$',
            system: 'system@info:~$',
            error: 'error@neural:~$'
        };

        messageDiv.innerHTML = `<span class="prompt">${prompts[type]}</span> ${content}`;
        this.terminal.appendChild(messageDiv);
        this.terminal.scrollTop = this.terminal.scrollHeight;
    }

    showTyping() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = '<span class="prompt">ultima@processing:~$</span> ▋';
        this.terminal.appendChild(typingDiv);
        this.terminal.scrollTop = this.terminal.scrollHeight;
    }

    hideTyping() {
        const typing = document.getElementById('typing-indicator');
        if (typing) typing.remove();
    }

    clearTerminal() {
        this.terminal.innerHTML = `
            <div class="prompt-line">
                <span class="prompt">ultima@neural:~$</span>
                <span class="welcome">Terminal cleared. Ready for commands.</span>
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

    async showStatus() {
        await this.showSystemStatus();
    }

    async showSystemStatus() {
        try {
            const [healthRes, balanceRes] = await Promise.all([
                fetch('/api/health'),
                fetch(`/api/token/balance?user_id=${this.userId}`)
            ]);

            const health = await healthRes.json();
            const balance = await balanceRes.json();

            this.addMessage('system', `SYSTEM STATUS:
• Service: ${health.service || 'Unknown'}
• Status: ${health.status || 'Unknown'}
• Model: ${health.model || 'Unknown'}
• Groq: ${health.groq_configured ? 'Configured' : 'Not configured'}
• Tokens: ${balance.balance || 0}
• Uptime: ${this.getUptime()}`);

        } catch (error) {
            this.addMessage('error', `Status check failed: ${error.message}`);
        }
    }

    async checkBalance() {
        try {
            const response = await fetch(`/api/token/balance?user_id=${this.userId}`);
            const data = await response.json();
            
            if (response.ok) {
                this.addMessage('system', `Token balance: ${data.balance} ULTIMA`);
                this.updateTokenDisplay(data.balance);
            } else {
                this.addMessage('error', `Balance check failed: ${data.error}`);
            }
        } catch (error) {
            this.addMessage('error', `Connection error: ${error.message}`);
        }
    }

    async listFiles() {
        try {
            const response = await fetch('/api/files');
            const data = await response.json();
            
            if (response.ok) {
                const fileList = data.files.map(f => f.name).join('\n• ');
                this.addMessage('system', `Available files:\n• ${fileList}`);
            } else {
                this.addMessage('error', `File list failed: ${data.error}`);
            }
        } catch (error) {
            this.addMessage('error', `Connection error: ${error.message}`);
        }
    }

    async checkHealth() {
        try {
            const response = await fetch('/api/health');
            const data = await response.json();
            
            if (response.ok) {
                const status = data.groq_configured ? 'ONLINE' : 'DEGRADED';
                this.addMessage('system', `Health check: ${status}`);
                this.updateConnectionStatus(status);
            } else {
                this.addMessage('error', 'Health check failed');
                this.updateConnectionStatus('OFFLINE');
            }
        } catch (error) {
            this.addMessage('error', `Health check error: ${error.message}`);
            this.updateConnectionStatus('OFFLINE');
        }
    }

    async handleTool(tool) {
        this.hideModal('toolsModal');
        
        switch(tool) {
            case 'code-read':
                await this.readCodeTool();
                break;
            case 'code-suggest':
                await this.suggestCodeTool();
                break;
            case 'tool-generate':
                await this.generateToolTool();
                break;
            case 'balance':
                await this.checkBalance();
                break;
        }
    }

    async readCodeTool() {
        const filePath = prompt('Enter file path (e.g., api/index.py):');
        if (!filePath) return;

        try {
            const response = await fetch(`/api/code/read?file_path=${encodeURIComponent(filePath)}`);
            const data = await response.json();
            
            if (response.ok) {
                this.addMessage('system', `File: ${data.file_path}\n\n${data.content.substring(0, 1000)}${data.content.length > 1000 ? '...' : ''}`);
            } else {
                this.addMessage('error', `Read failed: ${data.error}`);
            }
        } catch (error) {
            this.addMessage('error', `Connection error: ${error.message}`);
        }
    }

    async suggestCodeTool() {
        const fileContent = prompt('Enter code to analyze:');
        if (!fileContent) return;
        
        const description = prompt('Describe the change needed:');
        if (!description) return;

        this.showTyping();
        try {
            const response = await fetch('/api/code/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    file_content: fileContent,
                    description: description,
                    user_id: this.userId
                })
            });

            const data = await response.json();
            this.hideTyping();
            
            if (response.ok) {
                this.addMessage('system', `Code suggestion:\n\n${data.suggestion}`);
            } else {
                this.addMessage('error', `Suggestion failed: ${data.error}`);
            }
        } catch (error) {
            this.hideTyping();
            this.addMessage('error', `Connection error: ${error.message}`);
        }
    }

    async generateToolTool() {
        const description = prompt('Describe the tool to generate:');
        if (!description) return;

        this.showTyping();
        try {
            const response = await fetch('/api/tool/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description: description,
                    user_id: this.userId
                })
            });

            const data = await response.json();
            this.hideTyping();
            
            if (response.ok) {
                this.addMessage('system', `Generated tool:\n\n${data.code}`);
            } else {
                this.addMessage('error', `Generation failed: ${data.error}`);
            }
        } catch (error) {
            this.hideTyping();
            this.addMessage('error', `Connection error: ${error.message}`);
        }
    }

    toggleExplorer() {
        const explorer = document.getElementById('fileExplorer');
        explorer.classList.toggle('collapsed');
    }

    async loadFiles() {
        try {
            const response = await fetch('/api/files');
            const data = await response.json();
            
            if (response.ok) {
                const fileTree = document.getElementById('fileTree');
                fileTree.innerHTML = '';
                
                data.files.forEach(file => {
                    const fileElement = document.createElement('div');
                    fileElement.className = 'file-item file';
                    fileElement.innerHTML = `<span class="file-icon">📄</span><span class="file-name">${file.name}</span>`;
                    fileElement.addEventListener('click', () => this.openFile(file.name));
                    fileTree.appendChild(fileElement);
                });
            }
        } catch (error) {
            console.error('Failed to load files:', error);
        }
    }

    async openFile(fileName) {
        try {
            const response = await fetch(`/api/code/read?file_path=${encodeURIComponent(fileName)}`);
            const data = await response.json();
            
            if (response.ok) {
                this.addMessage('system', `File: ${data.file_path}\n\n${data.content.substring(0, 500)}${data.content.length > 500 ? '...' : ''}`);
            } else {
                this.addMessage('error', `Failed to read ${fileName}: ${data.error}`);
            }
        } catch (error) {
            this.addMessage('error', `Connection error: ${error.message}`);
        }
    }

    updateTokenDisplay(balance) {
        const tokenElement = document.getElementById('tokenCount');
        if (tokenElement) tokenElement.textContent = balance;
    }

    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) statusElement.textContent = status;
    }

    getUptime() {
        const uptime = Date.now() - this.startTime;
        const hours = Math.floor(uptime / 3600000);
        const minutes = Math.floor((uptime % 3600000) / 60000);
        const seconds = Math.floor((uptime % 60000) / 1000);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    startMonitoring() {
        setInterval(() => {
            document.getElementById('uptime').textContent = this.getUptime();
        }, 1000);

        setInterval(() => {
            this.checkHealth();
            this.checkBalance();
        }, 30000);
    }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    new UltimaTerminal();
});