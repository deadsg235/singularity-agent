class UltimaNeuralInterface {
    constructor() {
        this.terminal = document.getElementById('terminal');
        this.commandInput = document.getElementById('commandInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.fileExplorer = document.getElementById('fileExplorer');
        this.fileTree = document.getElementById('fileTree');
        this.chatHistory = [];
        this.userId = 'default_user';
        this.startTime = Date.now();
        this.explorerCollapsed = false;
        
        this.initializeInterface();
        this.loadFileSystem();
        this.startSystemMonitoring();
    }

    initializeInterface() {
        // Event listeners
        this.sendBtn.addEventListener('click', () => this.processCommand());
        this.commandInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.processCommand();
        });

        // Neural controls
        document.getElementById('explorerBtn').addEventListener('click', () => this.toggleExplorer());
        document.getElementById('toolsBtn').addEventListener('click', () => this.showTools());
        document.getElementById('statusBtn').addEventListener('click', () => this.showSystemStatus());

        // Modal controls
        document.getElementById('closeTools').addEventListener('click', () => this.hideModal('toolsModal'));

        // Tool buttons
        document.querySelectorAll('.tool-card').forEach(card => {
            card.addEventListener('click', (e) => this.executeTool(e.currentTarget.dataset.tool));
        });

        // Collapse explorer
        document.getElementById('collapseExplorer').addEventListener('click', () => this.toggleExplorer());

        // Close modals on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('neural-modal')) {
                this.hideModal(e.target.id);
            }
        });

        this.showBootSequence();
    }

    showBootSequence() {
        setTimeout(() => {
            this.addMessage('system', 'Neural pathways established. ULTIMA consciousness active.');
            this.updateConnectionStatus('ACTIVE');
        }, 2000);
    }

    async processCommand() {
        const command = this.commandInput.value.trim();
        if (!command) return;

        this.addMessage('user', command);
        this.commandInput.value = '';

        // Handle built-in commands
        if (await this.handleSystemCommand(command)) return;

        // Send to AI
        this.showProcessing();
        try {
            const response = await this.sendToUltima(command);
            this.hideProcessing();
            this.addMessage('agent', response);
            this.updateFileSystem(); // Update file explorer after AI interaction
        } catch (error) {
            this.hideProcessing();
            this.addMessage('error', `Neural link error: ${error.message}`);
        }
    }

    async handleSystemCommand(command) {
        const cmd = command.toLowerCase();
        
        if (cmd === 'help' || cmd === 'commands') {
            this.addMessage('system', `ULTIMA Neural Commands:
• help - Display available commands
• clear - Clear neural interface
• status - Show system diagnostics
• tools - Access neural tools
• explorer - Toggle file explorer
• balance - Check token reserves
• scan - Scan project files
• Or communicate directly with ULTIMA AI`);
            return true;
        }

        if (cmd === 'clear') {
            this.clearInterface();
            return true;
        }

        if (cmd === 'status') {
            this.showSystemStatus();
            return true;
        }

        if (cmd === 'tools') {
            this.showTools();
            return true;
        }

        if (cmd === 'explorer') {
            this.toggleExplorer();
            return true;
        }

        if (cmd === 'balance') {
            await this.checkTokenBalance();
            return true;
        }

        if (cmd === 'scan') {
            await this.scanProjectFiles();
            return true;
        }

        return false;
    }

    async sendToUltima(message) {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: message,
                    history: this.chatHistory,
                    user_id: this.userId
                })
            });

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
            }

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Neural link failure');

            this.chatHistory.push(
                { role: 'user', parts: message },
                { role: 'model', parts: data.response }
            );

            return data.response;
        } catch (error) {
            if (error.message.includes('JSON')) {
                throw new Error('API endpoint not found or returning HTML');
            }
            throw error;
        }
    }

    addMessage(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        const timestamp = new Date().toLocaleTimeString();
        
        switch(type) {
            case 'user':
                messageDiv.innerHTML = `<span class="prompt">user@neural:~$</span> ${content}`;
                break;
            case 'agent':
                messageDiv.innerHTML = `<span class="prompt">ultima@response:~$</span> ${content}`;
                break;
            case 'system':
                messageDiv.innerHTML = `<span class="prompt">system@neural:~$</span> ${content}`;
                break;
            case 'error':
                messageDiv.innerHTML = `<span class="prompt">error@neural:~$</span> ${content}`;
                break;
        }

        this.terminal.appendChild(messageDiv);
        this.terminal.scrollTop = this.terminal.scrollHeight;
    }

    showProcessing() {
        const processingDiv = document.createElement('div');
        processingDiv.className = 'message typing-indicator';
        processingDiv.id = 'processing-indicator';
        processingDiv.innerHTML = '<span class="prompt">ultima@processing:~$</span> Analyzing neural patterns...';
        this.terminal.appendChild(processingDiv);
        this.terminal.scrollTop = this.terminal.scrollHeight;
    }

    hideProcessing() {
        const processing = document.getElementById('processing-indicator');
        if (processing) processing.remove();
    }

    clearInterface() {
        this.terminal.innerHTML = `
            <div class="prompt-line">
                <span class="prompt">ultima@neural:~$</span>
                <span class="welcome">Neural interface cleared. Ready for new input.</span>
            </div>
        `;
    }

    toggleExplorer() {
        this.explorerCollapsed = !this.explorerCollapsed;
        this.fileExplorer.classList.toggle('collapsed', this.explorerCollapsed);
        
        const collapseBtn = document.getElementById('collapseExplorer');
        collapseBtn.textContent = this.explorerCollapsed ? '▶' : '◀';
    }

    async loadFileSystem() {
        const files = [
            { name: 'api/', type: 'folder', children: [
                { name: 'index.py', type: 'file' },
                { name: '__init__.py', type: 'file' }
            ]},
            { name: 'ml_core/', type: 'folder', children: [
                { name: 'deep_q_tool_generator.py', type: 'file' },
                { name: '__init__.py', type: 'file' }
            ]},
            { name: 'public/', type: 'folder', children: [
                { name: 'index.html', type: 'file' },
                { name: 'style.css', type: 'file' },
                { name: 'script.js', type: 'file' }
            ]},
            { name: 'agent_web.py', type: 'file' },
            { name: 'token_module.py', type: 'file' },
            { name: 'requirements.txt', type: 'file' },
            { name: 'vercel.json', type: 'file' },
            { name: 'README.md', type: 'file' }
        ];

        this.renderFileTree(files);
    }

    renderFileTree(files) {
        this.fileTree.innerHTML = '';
        
        files.forEach(item => {
            const fileElement = this.createFileElement(item);
            this.fileTree.appendChild(fileElement);
            
            if (item.children) {
                const childContainer = document.createElement('div');
                childContainer.style.marginLeft = '16px';
                item.children.forEach(child => {
                    childContainer.appendChild(this.createFileElement(child));
                });
                this.fileTree.appendChild(childContainer);
            }
        });
    }

    createFileElement(item) {
        const element = document.createElement('div');
        element.className = `file-item ${item.type}`;
        
        const icon = item.type === 'folder' ? '📁' : '📄';
        element.innerHTML = `
            <span class="file-icon">${icon}</span>
            <span class="file-name">${item.name}</span>
        `;
        
        if (item.type === 'file') {
            element.addEventListener('click', () => this.openFile(item.name));
        }
        
        return element;
    }

    async openFile(fileName) {
        try {
            const response = await fetch(`/api/code/read?file_path=${encodeURIComponent(fileName)}`);
            const data = await response.json();
            
            if (response.ok) {
                this.addMessage('system', `File: ${data.file_path}\n\n${data.content.substring(0, 500)}${data.content.length > 500 ? '...' : ''}`);
            } else {
                this.addMessage('error', `Failed to read file: ${data.error}`);
            }
        } catch (error) {
            this.addMessage('error', `File access error: ${error.message}`);
        }
    }

    async updateFileSystem() {
        // Simulate file system updates as ULTIMA evolves
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] File system updated - ULTIMA evolution detected`);
    }

    async scanProjectFiles() {
        this.addMessage('system', 'Scanning neural pathways and project structure...');
        await this.loadFileSystem();
        this.addMessage('system', 'Project scan complete. File explorer updated.');
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

    async showSystemStatus() {
        const status = await this.getSystemStatus();
        this.addMessage('system', `NEURAL SYSTEM STATUS:
• Connection: ${status.connection}
• Tokens: ${status.tokens}
• Uptime: ${status.uptime}
• CPU Usage: ${status.cpu}
• Memory: ${status.memory}
• AI Model: Gemini Pro
• Status: OPERATIONAL`);
    }

    async getSystemStatus() {
        try {
            const response = await fetch('/api/health');
            const tokenResponse = await fetch(`/api/token/balance?user_id=${this.userId}`);
            
            const health = await response.json();
            const tokens = await tokenResponse.json();
            
            return {
                connection: response.ok ? 'ACTIVE' : 'DISCONNECTED',
                tokens: tokenResponse.ok ? tokens.balance : 'ERROR',
                uptime: this.getUptime(),
                cpu: '12%',
                memory: '2.1GB'
            };
        } catch {
            return {
                connection: 'DISCONNECTED',
                tokens: 'ERROR',
                uptime: this.getUptime(),
                cpu: 'N/A',
                memory: 'N/A'
            };
        }
    }

    async executeTool(tool) {
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
            case 'prompt-view':
                await this.viewPromptTool();
                break;
            case 'prompt-suggest':
                await this.suggestPromptTool();
                break;
            case 'balance':
                await this.checkTokenBalance();
                break;
            case 'purchase':
                await this.purchaseTokens();
                break;
        }
    }

    async readCodeTool() {
        const filePath = prompt('Enter file path:');
        if (!filePath) return;
        await this.openFile(filePath);
    }

    async suggestCodeTool() {
        const filePath = prompt('Enter file path:');
        if (!filePath) return;
        
        const description = prompt('Describe the change:');
        if (!description) return;

        this.showProcessing();
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
            this.hideProcessing();
            
            if (response.ok) {
                this.addMessage('system', `Code suggestion for ${data.file_path}:\n\n${data.suggested_code}`);
            } else {
                this.addMessage('error', `Error: ${data.error}`);
            }
        } catch (error) {
            this.hideProcessing();
            this.addMessage('error', `Neural link error: ${error.message}`);
        }
    }

    async generateToolTool() {
        const description = prompt('Describe the tool to generate:');
        if (!description) return;

        this.showProcessing();
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
            this.hideProcessing();
            
            if (response.ok) {
                this.addMessage('system', `Generated neural tool:\n\n${data.suggested_tool_code}`);
            } else {
                this.addMessage('error', `Error: ${data.error}`);
            }
        } catch (error) {
            this.hideProcessing();
            this.addMessage('error', `Neural link error: ${error.message}`);
        }
    }

    async viewPromptTool() {
        try {
            const response = await fetch('/api/prompt/get');
            const data = await response.json();
            if (response.ok) {
                this.addMessage('system', `Current neural prompt:\n\n${data.system_prompt}`);
            } else {
                this.addMessage('error', `Error: ${data.error}`);
            }
        } catch (error) {
            this.addMessage('error', `Neural link error: ${error.message}`);
        }
    }

    async suggestPromptTool() {
        this.showProcessing();
        try {
            const response = await fetch(`/api/prompt/suggest?user_id=${this.userId}`);
            const data = await response.json();
            this.hideProcessing();
            
            if (response.ok) {
                this.addMessage('system', `Suggested neural prompt:\n\n${data.suggested_prompt}`);
            } else {
                this.addMessage('error', `Error: ${data.error}`);
            }
        } catch (error) {
            this.hideProcessing();
            this.addMessage('error', `Neural link error: ${error.message}`);
        }
    }

    async checkTokenBalance() {
        try {
            const response = await fetch(`/api/token/balance?user_id=${this.userId}`);
            const data = await response.json();
            if (response.ok) {
                this.addMessage('system', `Neural token reserves: ${data.balance} ULTIMA`);
                this.updateTokenDisplay(data.balance);
            } else {
                this.addMessage('error', `Error checking reserves: ${data.error}`);
            }
        } catch (error) {
            this.addMessage('error', `Neural link error: ${error.message}`);
        }
    }

    updateTokenDisplay(balance) {
        document.getElementById('tokenCount').textContent = balance;
    }

    async purchaseTokens() {
        try {
            const response = await fetch('/api/token/pricing');
            const pricing = await response.json();
            
            if (response.ok) {
                const packages = pricing.packages;
                const packageOptions = Object.keys(packages).map(key => 
                    `${key}: ${packages[key].tokens} tokens - $${packages[key].price}`
                ).join('\n');
                
                const selectedPackage = prompt(`Select Ultima Token Package:\n\n${packageOptions}\n\nEnter package name (starter/pro/enterprise):`);
                
                if (selectedPackage && packages[selectedPackage]) {
                    const purchaseResponse = await fetch('/api/token/purchase', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            user_id: this.userId,
                            package: selectedPackage
                        })
                    });
                    
                    const purchaseData = await purchaseResponse.json();
                    
                    if (purchaseResponse.ok) {
                        this.addMessage('system', `Token purchase successful! Added ${purchaseData.tokens_added} ULTIMA tokens. New balance: ${purchaseData.new_balance}`);
                        this.updateTokenDisplay(purchaseData.new_balance);
                    } else {
                        this.addMessage('error', `Purchase failed: ${purchaseData.error}`);
                    }
                } else if (selectedPackage) {
                    this.addMessage('error', 'Invalid package selected.');
                }
            } else {
                this.addMessage('error', `Error loading pricing: ${pricing.error}`);
            }
        } catch (error) {
            this.addMessage('error', `Neural link error: ${error.message}`);
        }
    }

    updateConnectionStatus(status) {
        document.getElementById('connectionStatus').textContent = status;
    }

    getUptime() {
        const uptime = Date.now() - this.startTime;
        const hours = Math.floor(uptime / 3600000);
        const minutes = Math.floor((uptime % 3600000) / 60000);
        const seconds = Math.floor((uptime % 60000) / 1000);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    startSystemMonitoring() {
        setInterval(() => {
            document.getElementById('uptime').textContent = this.getUptime();
            
            // Simulate CPU and memory usage
            const cpu = Math.floor(Math.random() * 20) + 10;
            const mem = (Math.random() * 0.5 + 2.0).toFixed(1);
            document.getElementById('cpuUsage').textContent = `${cpu}%`;
            document.getElementById('memUsage').textContent = `${mem}GB`;
        }, 1000);

        // Check connection status periodically
        setInterval(async () => {
            try {
                const response = await fetch('/api/health');
                this.updateConnectionStatus(response.ok ? 'ACTIVE' : 'DISCONNECTED');
            } catch {
                this.updateConnectionStatus('DISCONNECTED');
            }
        }, 30000);

        // Update token balance periodically
        setInterval(() => {
            this.checkTokenBalance();
        }, 60000);
    }
}

// Initialize neural interface when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new UltimaNeuralInterface();
});