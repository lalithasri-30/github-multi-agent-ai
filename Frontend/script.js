// backend.js
class GitHubAIAssistant {


   
    constructor() {
        this.currentRepo = null;
        this.chatHistory = [];
        this.isAnalyzing = false;
        this.isLoggedIn = false;
        this.activeSection = 'chat';
        
        // DOM Elements
        this.loadingScreen = document.getElementById('loading-screen');
        this.loginPage = document.getElementById('login-page');
        this.appPage = document.getElementById('app-page');
        
        // Initialize when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => this.init());
    }
    
    init() {
        console.log('GitHub AI Assistant initialized');
        
        // Show loading then login page
        setTimeout(() => {
            this.loadingScreen.style.display = 'none';
            this.loginPage.style.display = 'block';
        }, 2000);
        
        this.setupEventListeners();
        this.setupDemoData();
        
        // Add CSS for static sidebar
        this.addStaticSidebarCSS();
    }
    
    addStaticSidebarCSS() {
        const style = document.createElement('style');
        style.textContent = `
            /* Fix for static sidebar */
            .sidebar {
                position: sticky;
                top: 0;
                height: 100vh;
                overflow-y: auto;
                z-index: 100;
            }
            
            .main-content {
                overflow: hidden;
            }
            
            .content-section {
                height: 100%;
                overflow: hidden;
                display: none;
                flex-direction: column;
            }
            
            .content-section.active {
                display: flex;
            }
            
            .chat-container {
                flex: 1;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }
            
            .chat-messages {
                flex: 1;
                overflow-y: auto;
                min-height: 0;
            }
            
            .chat-welcome {
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            /* Chat message improvements */
            .message {
                animation: fadeInUp 0.3s ease;
                margin-bottom: 20px;
            }
            
            .user-message {
                align-self: flex-end;
            }
            
            .ai-message {
                align-self: flex-start;
            }
            
            .message-content {
                max-width: 80%;
                word-wrap: break-word;
            }
            
            .user-message .message-content {
                margin-left: auto;
            }
            
            .ai-message .message-content {
                margin-right: auto;
            }
            
            /* Markdown formatting */
            .message-text h1, .message-text h2, .message-text h3 {
                margin: 15px 0 10px 0;
                color: var(--light-1);
            }
            
            .message-text h1 {
                font-size: 1.5em;
            }
            
            .message-text h2 {
                font-size: 1.3em;
            }
            
            .message-text h3 {
                font-size: 1.1em;
            }
            
            .message-text ul, .message-text ol {
                margin: 10px 0 10px 20px;
            }
            
            .message-text li {
                margin: 5px 0;
            }
            
            .message-text code {
                background: rgba(139, 92, 246, 0.1);
                padding: 2px 6px;
                border-radius: 4px;
                font-family: 'JetBrains Mono', monospace;
                font-size: 0.9em;
            }
            
            .message-text pre {
                background: rgba(10, 10, 15, 0.8);
                border: 1px solid rgba(139, 92, 246, 0.2);
                border-radius: 8px;
                padding: 15px;
                overflow-x: auto;
                margin: 10px 0;
            }
            
            /* Scrollbar improvements */
            .chat-messages::-webkit-scrollbar {
                width: 8px;
            }
            
            .chat-messages::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.1);
            }
            
            .chat-messages::-webkit-scrollbar-thumb {
                background: rgba(139, 92, 246, 0.3);
                border-radius: 4px;
            }
            
            .chat-messages::-webkit-scrollbar-thumb:hover {
                background: rgba(139, 92, 246, 0.5);
            }
            
            /* Hide welcome section when messages exist */
            .chat-messages:not(:empty) + .chat-welcome {
                display: none;
            }
            
            /* Welcome section only visible when empty */
            .chat-container:has(.chat-messages:empty) .chat-welcome {
                display: flex;
            }
            
            .chat-container:has(.chat-messages:not(:empty)) .chat-welcome {
                display: none;
            }
        `;
        document.head.appendChild(style);
    }
    
    setupEventListeners() {
        // Login functions
        document.getElementById('github-login')?.addEventListener('click', () => this.login('GitHub'));
        document.getElementById('email-login')?.addEventListener('click', () => this.handleEmailLogin());
        
        // Show password toggle
        document.querySelector('.show-password')?.addEventListener('click', (e) => this.togglePasswordVisibility(e));
        
        // Logout
        document.getElementById('logout')?.addEventListener('click', () => this.handleLogout());
        
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleNavigation(e));
        });
        
        // Action dropdown items
        document.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleActionClick(e));
        });
        
        // Welcome actions - FIXED: Use proper event delegation
        document.querySelector('.welcome-actions')?.addEventListener('click', (e) => {
            const button = e.target.closest('.welcome-action');
            if (button) {
                const action = button.getAttribute('data-action');
                this.performAction(action);
            }
        });
        
        // Quick actions - FIXED: Use proper event delegation
        document.querySelector('.quick-actions')?.addEventListener('click', (e) => {
            const button = e.target.closest('.quick-action');
            if (button) {
                const action = button.getAttribute('data-action');
                this.performAction(action);
            }
        });
        
        // Chat functions
        document.getElementById('send-message')?.addEventListener('click', () => this.sendMessage());
        document.getElementById('message-input')?.addEventListener('keypress', (e) => this.handleMessageKeypress(e));
        document.getElementById('message-input')?.addEventListener('input', (e) => this.autoResizeTextarea(e.target));
        document.getElementById('clear-chat')?.addEventListener('click', () => this.clearChat());
        
        // URL analysis
        document.getElementById('analyze-url')?.addEventListener('click', () => this.analyzeRepositoryUrl());
        document.getElementById('repo-url')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.analyzeRepositoryUrl();
        });
        
        // Settings button
        document.getElementById('settings-chat')?.addEventListener('click', () => this.showSettings());
        
        // Refresh button
        document.querySelector('.btn-refresh')?.addEventListener('click', () => this.refreshDashboard());
        
        // Voice input (simulated)
        document.getElementById('voice-input')?.addEventListener('click', () => this.simulateVoiceInput());
        
        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleToolClick(e));
        });
        
        // Theme toggle
        document.querySelector('.toggle-switch input')?.addEventListener('change', (e) => this.toggleTheme(e));
    }
    
    setupDemoData() {
        // Initialize charts if on dashboard
        if (this.activeSection === 'dashboard') {
            setTimeout(() => this.initCharts(), 500);
        }
    }
    
    // Login Functions
    handleEmailLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
            this.showNotification('Please enter email and password', 'error');
            return;
        }
        
        this.login('Email');
    }
    
    login(method) {
        console.log('Logging in with:', method);
        this.showNotification(`Authenticating with ${method}...`, 'info');
        
        // Simulate API call
        setTimeout(() => {
            this.loginPage.style.display = 'none';
            this.appPage.style.display = 'flex';
            this.isLoggedIn = true;
            
            this.updateUserInfo(method);
            this.showNotification('Successfully logged in! Welcome to GitHub AI Assistant', 'success');
            
            if (this.activeSection === 'dashboard') {
                this.initCharts();
            }
        }, 1500);
    }
    
    updateUserInfo(method) {
        const username = document.getElementById('username');
        const userEmail = document.getElementById('user-email');
        const email = document.getElementById('email').value;
        
        if (method === 'GitHub') {
            username.textContent = 'GitHub User';
            userEmail.textContent = 'github@example.com';
        } else {
            const name = email.split('@')[0] || 'Demo User';
            username.textContent = name.charAt(0).toUpperCase() + name.slice(1);
            userEmail.textContent = email;
        }
    }
    
    togglePasswordVisibility(e) {
        const passwordInput = document.getElementById('password');
        const eyeIcon = e.target.closest('button').querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            eyeIcon.classList.remove('fa-eye');
            eyeIcon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            eyeIcon.classList.remove('fa-eye-slash');
            eyeIcon.classList.add('fa-eye');
        }
    }
    
    // Logout
    handleLogout() {
        this.showNotification('Logging out...', 'info');
        
        setTimeout(() => {
            this.appPage.style.display = 'none';
            this.loginPage.style.display = 'block';
            this.isLoggedIn = false;
            this.clearChat();
            this.showNotification('Logged out successfully', 'success');
        }, 1000);
    }
    
    // Navigation
    handleNavigation(e) {
        e.preventDefault();
        const href = e.currentTarget.getAttribute('href');
        const target = href ? href.substring(1) : 'chat';
        
        // Update active nav
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        e.currentTarget.classList.add('active');
        
        // Update active section
        this.activeSection = target;
        
        // Show target section
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
            if (section.id === `${target}-section`) {
                section.classList.add('active');
                
                if (target === 'dashboard') {
                    setTimeout(() => this.initCharts(), 100);
                }
            }
        });
    }
    
    // Action Handlers
    handleActionClick(e) {
        e.preventDefault();
        const action = e.currentTarget.getAttribute('data-action');
        this.performAction(action);
    }
    
    performAction(action) {
        const actionNames = {
            'analyze': 'Analyze Repository',
            'code-review': 'Code Review',
            'summarize': 'Summarize',
            'insights': 'Insights',
            'suggestions': 'Suggestions',
            'pr-generation': 'PR Generation',
            'scan': 'Scan Repository',
            'pr': 'Create Pull Request',
            'review': 'Code Review'
        };
        
        const actionName = actionNames[action] || action;
        this.showNotification(`Starting ${actionName}...`, 'info');
        
        // Hide welcome section
        this.hideWelcomeSection();
        
        // Add user message
        if (this.currentRepo) {
            this.addUserMessage(`${actionName} for ${this.currentRepo}`);
        } else {
            this.addUserMessage(`${actionName}`);
        }
        
        // Show typing indicator
        this.showTyping();
        
        // Simulate AI processing
        setTimeout(() => {
            this.removeTyping();
            const response = this.getActionResponse(action, this.currentRepo);
            this.addAIMessage(response);
            this.addToChatHistory(action, response);
            
            if (action === 'analyze' && this.currentRepo) {
                this.updateDashboardWithRepoData(this.currentRepo);
            }
        }, 2000);
    }
    
    hideWelcomeSection() {
        const welcomeSection = document.querySelector('.chat-welcome');
        if (welcomeSection) {
            welcomeSection.style.display = 'none';
        }
    }
    
    // URL Analysis
    analyzeRepositoryUrl() {
        const urlInput = document.getElementById('repo-url');
        const url = urlInput.value.trim();
        
        if (!url) {
            this.showNotification('Please enter a GitHub repository URL', 'warning');
            return;
        }
        
        if (!this.isValidGitHubUrl(url)) {
            this.showNotification('Please enter a valid GitHub repository URL', 'error');
            return;
        }
        
        this.isAnalyzing = true;
        urlInput.disabled = true;
        const analyzeBtn = document.getElementById('analyze-url');
        analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        this.showNotification('Analyzing repository...', 'info');
        
        const repoInfo = this.extractRepoInfo(url);
        this.currentRepo = repoInfo.fullName;
        
        this.hideWelcomeSection();
        this.addUserMessage(`Analyzing repository: ${url}`);
        this.showTyping();
        
        setTimeout(() => {
            this.removeTyping();
            this.isAnalyzing = false;
            urlInput.disabled = false;
            analyzeBtn.innerHTML = '<i class="fas fa-arrow-right"></i>';
            
            const analysis = this.generateRepoAnalysis(repoInfo);
            this.addAIMessage(analysis);
            this.addToChatHistory('url-analysis', analysis);
            
            this.updateDashboardWithRepoData(repoInfo.fullName);
            this.showNotification(`Analysis complete for ${repoInfo.fullName}`, 'success');
        }, 3000);
    }
    
    isValidGitHubUrl(url) {
        const githubRegex = /^https?:\/\/github\.com\/[^\/]+\/[^\/]+(\/)?$/;
        return githubRegex.test(url);
    }
    
    extractRepoInfo(url) {
        const parts = url.replace(/https?:\/\//, '').split('/');
        const owner = parts[1];
        const repo = parts[2]?.replace(/\.git$/, '') || '';
        
        return {
            url: url,
            owner: owner,
            repo: repo,
            fullName: `${owner}/${repo}`
        };
    }
    
    generateRepoAnalysis(repoInfo) {
        return `## 📊 Repository Analysis: ${repoInfo.fullName}

**✅ Repository Status:** Active and Maintained  
**⭐ Stars:** 1,245  
**🍴 Forks:** 156  
**📈 Last Updated:** 2 days ago  

### **Code Analysis Summary:**
- **Overall Score:** 87/100
- **Test Coverage:** 92%
- **Code Quality:** 8.5/10
- **Security Score:** 9/10

### **Top Languages:**
- JavaScript: 65%
- TypeScript: 20%
- CSS/SCSS: 10%
- Other: 5%

### **Key Findings:**
1. **Excellent test coverage** across all modules
2. **Well-documented** with comprehensive README
3. **Good security practices** implemented
4. **Modular architecture** with clear separation of concerns

### **Recommendations:**
1. Consider adding end-to-end testing
2. Implement CI/CD with GitHub Actions
3. Add performance monitoring
4. Consider migrating to TypeScript for type safety

### **Quick Actions Available:**
- Run detailed code review
- Generate performance report
- Create security audit
- Setup CI/CD pipeline`;
    }
    
    // Chat Functions
    sendMessage() {
        const messageInput = document.getElementById('message-input');
        const text = messageInput.value.trim();
        if (!text) return;
        
        this.hideWelcomeSection();
        this.addUserMessage(text);
        messageInput.value = '';
        this.autoResizeTextarea(messageInput);
        
        if (this.isUrl(text)) {
            this.handleUrlInMessage(text);
        } else {
            this.showTyping();
            
            setTimeout(() => {
                this.removeTyping();
                this.addAIMessage(this.getAIResponse(text));
            }, 1500);
        }
    }
    
    isUrl(text) {
        const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
        return urlRegex.test(text) && text.includes('github');
    }
    
    handleUrlInMessage(url) {
        this.showTyping();
        
        setTimeout(() => {
            this.removeTyping();
            
            if (this.isValidGitHubUrl(url)) {
                const repoInfo = this.extractRepoInfo(url);
                this.currentRepo = repoInfo.fullName;
                const response = `I've detected a GitHub repository URL: **${repoInfo.fullName}**

I can help you with:
- **Code analysis** and review
- **Repository insights** and metrics
- **Pull request** generation
- **Security audit**

Use the Actions dropdown or ask me specific questions about this repository!`;
                this.addAIMessage(response);
            } else {
                this.addAIMessage(`That looks like a URL, but it doesn't appear to be a valid GitHub repository. Please provide a GitHub repository URL like: \`https://github.com/username/repository\``);
            }
        }, 1000);
    }
    
    handleMessageKeypress(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
        }
    }
    
    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
    
    // Message Functions
    addMessage(text, isUser = false) {
        const chatMessages = document.getElementById('chat-messages');
        
        // Hide welcome section when first message is added
        if (chatMessages.children.length === 0) {
            this.hideWelcomeSection();
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas ${isUser ? 'fa-user' : 'fa-robot'}"></i>
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="sender">${isUser ? 'You' : 'GitHub AI Assistant'}</span>
                    <span class="time">${time}</span>
                </div>
                <div class="message-text">${this.formatMessage(text)}</div>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        this.chatHistory.push({
            text: text,
            isUser: isUser,
            timestamp: new Date().toISOString()
        });
    }
    
    formatMessage(text) {
        // Convert markdown to HTML
        return text
            .replace(/^## (.*$)/gm, '<h3>$1</h3>')
            .replace(/^### (.*$)/gm, '<h4>$1</h4>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/- (.*?)(?=\n|$)/g, '<li>$1</li>')
            .replace(/(\d+\.) (.*?)(?=\n|$)/g, '<li>$2</li>')
            .replace(/\n/g, '<br>');
    }
    
    addUserMessage(text) {
        this.addMessage(text, true);
    }
    
    addAIMessage(text) {
        this.addMessage(text, false);
    }
    
    clearChat() {
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.innerHTML = '';
        this.chatHistory = [];
        
        // Show welcome section again
        const welcomeSection = document.querySelector('.chat-welcome');
        if (welcomeSection) {
            welcomeSection.style.display = 'flex';
        }
        
        this.showNotification('Chat cleared', 'info');
    }
    
    // Typing indicator
    showTyping() {
        const chatMessages = document.getElementById('chat-messages');
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai-message';
        typingDiv.id = 'typing-indicator';
        
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="sender">GitHub AI Assistant</span>
                </div>
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    removeTyping() {
        const typing = document.getElementById('typing-indicator');
        if (typing) typing.remove();
    }
    
    // Chat history
    addToChatHistory(action, response) {
        this.chatHistory.push({
            action: action,
            response: response,
            repo: this.currentRepo,
            timestamp: new Date().toISOString()
        });
        
        this.updateRecentChats(action);
    }
    
    updateRecentChats(action) {
        const chatList = document.querySelector('.chat-list');
        const actionNames = {
            'analyze': 'Repository Analysis',
            'code-review': 'Code Review',
            'summarize': 'Documentation Summary',
            'insights': 'Repository Insights',
            'suggestions': 'AI Suggestions',
            'pr-generation': 'PR Generation',
            'url-analysis': 'URL Analysis'
        };
        
        const actionName = actionNames[action] || 'New Chat';
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';
        chatItem.innerHTML = `
            <div class="chat-icon">
                <i class="fas fa-${this.getActionIcon(action)}"></i>
            </div>
            <div class="chat-info">
                <h4>${actionName}</h4>
                <p>${this.currentRepo || 'New analysis'}</p>
            </div>
            <span class="chat-time">${time}</span>
        `;
        
        chatList.insertBefore(chatItem, chatList.firstChild);
        
        if (chatList.children.length > 5) {
            chatList.removeChild(chatList.lastChild);
        }
    }
    
    getActionIcon(action) {
        const icons = {
            'analyze': 'search',
            'code-review': 'code',
            'summarize': 'file-alt',
            'insights': 'chart-pie',
            'suggestions': 'lightbulb',
            'pr-generation': 'code-branch',
            'url-analysis': 'link'
        };
        return icons[action] || 'comment';
    }
    
    // Notification System
    showNotification(message, type = 'info', duration = 3000) {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-circle',
            'warning': 'fa-exclamation-triangle',
            'info': 'fa-info-circle'
        };
        
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${icons[type]}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(notification);
        
        const autoRemove = setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px)';
            setTimeout(() => notification.remove(), 300);
        }, duration);
        
        notification.querySelector('.notification-close').addEventListener('click', () => {
            clearTimeout(autoRemove);
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px)';
            setTimeout(() => notification.remove(), 300);
        });
    }
    
    // AI Responses
    getAIResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        
        if (lowerMessage.includes('bug') || lowerMessage.includes('error') || lowerMessage.includes('fix')) {
            return `## 🐛 Debugging Assistance

For the issue you're experiencing, here's my recommended approach:

### **Debugging Steps:**
1. **Check console logs** for error messages
2. **Validate input data** and parameters
3. **Test edge cases** that might cause failures
4. **Use debugging tools** like Chrome DevTools or VS Code debugger

### **Common Solutions:**
- Ensure all dependencies are correctly installed
- Check for typos in variable names
- Verify API endpoints are accessible
- Review recent changes for breaking modifications

### **Pro Tips:**
- Add more detailed logging
- Write unit tests for edge cases
- Use try-catch blocks for error handling
- Implement input validation

Share the specific error message for more targeted help!`;
        }
        
        if (lowerMessage.includes('performance') || lowerMessage.includes('slow') || lowerMessage.includes('optimize')) {
            return `## ⚡ Performance Optimization

Here are my recommendations to improve your application's performance:

### **Immediate Wins:**
1. **Implement caching** for API responses and database queries
2. **Optimize images** with compression and proper formats
3. **Minify and bundle** JavaScript/CSS files
4. **Enable Gzip compression** on your server

### **Code-Level Optimizations:**
- Use pagination for large data sets
- Implement lazy loading for images and components
- Optimize database queries with proper indexing
- Reduce HTTP requests by combining files`;
        }
        
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
            return `## 👋 Hello!

Welcome to GitHub AI Assistant! I'm here to help you with:

### **What I can do:**
- Analyze GitHub repositories from URLs
- Review code and suggest improvements
- Generate insights and metrics
- Create pull requests automatically
- Perform security audits

### **How to get started:**
1. Enter a GitHub URL in the input field above
2. Use the **Quick Actions** buttons
3. Ask me specific questions about your code

Try pasting a GitHub repository URL to begin!`;
        }
        
        // Default response
        return `I've analyzed your query. Here are my insights:

**Based on your question about "${userMessage}"**, I recommend:

1. **Review the documentation** for the specific technology
2. **Check for existing issues** or discussions
3. **Consider edge cases** that might affect the implementation
4. **Test thoroughly** before deploying to production

Would you like me to analyze a specific GitHub repository or help with a particular piece of code?`;
    }
    
    getActionResponse(action, repo = null) {
        const repoText = repo ? ` for **${repo}**` : '';
        
        const responses = {
            'analyze': `## 🔍 Repository Analysis${repoText}

### **Analysis Summary:**
✅ **Overall Score:** 85/100  
✅ **Code Quality:** 8/10  
✅ **Test Coverage:** 78%  
✅ **Security Score:** 7.5/10  

### **Key Findings:**
1. **Well-structured codebase** with clear separation of concerns
2. **Good test coverage** but lacking integration tests
3. **Security practices** could be improved
4. **Documentation** needs more examples

### **Recommendations:**
1. Add integration tests for critical workflows
2. Implement automated security scanning
3. Improve API documentation with examples
4. Add performance monitoring`,

            'review': `## 📝 Code Review${repoText}

### **Strengths Identified:**
✅ **Clean, readable code** with consistent formatting  
✅ **Good error handling** in critical sections  
✅ **Modular architecture** with reusable components  

### **Areas for Improvement:**
1. **Input Validation:** Add validation for all user inputs
2. **Error Messages:** Improve error messages for debugging
3. **Code Duplication:** Extract repeated logic into utilities
4. **Performance:** Optimize database queries

### **Specific Suggestions:**
- Implement input validation middleware
- Add rate limiting to authentication endpoints
- Use memoization for expensive calculations
- Add proper loading and error states to UI components`,

            'insights': `## 📊 Repository Insights${repoText}

### **Activity Metrics:**
📈 **This Month:** 42 commits, 15 PRs, 8 issues  
👥 **Contributors:** 8 active, 3 new this month  
🕐 **Last Activity:** 2 hours ago  

### **Code Metrics:**
- **Total Lines:** 15,842 (65% JavaScript, 20% TypeScript)
- **Files:** 342 source files
- **Test Coverage:** 78% overall
- **Complexity:** Medium (avg. cyclomatic complexity: 4.2)

### **Performance Indicators:**
- **Build Time:** 2.3 minutes
- **Test Suite:** 45 seconds
- **Bundle Size:** 1.8 MB (gzipped: 450 KB)`
        };
        
        return responses[action] || `Action "${action}" completed successfully! You can use this feature to analyze code, get insights, or perform code reviews.`;
    }
    
    // Dashboard Functions
    initCharts() {
        console.log('Initializing charts...');
        
        // Activity Chart
        const activityCtx = document.getElementById('activity-chart');
        if (activityCtx) {
            new Chart(activityCtx, {
                type: 'line',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'Commits',
                        data: [12, 19, 8, 15, 22, 18, 24],
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        tension: 0.4,
                        fill: true,
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                color: '#94a3b8'
                            }
                        }
                    }
                }
            });
        }
        
        // Language Chart
        const languageCtx = document.getElementById('language-chart');
        if (languageCtx) {
            new Chart(languageCtx, {
                type: 'doughnut',
                data: {
                    labels: ['JavaScript', 'TypeScript', 'CSS', 'Python', 'Other'],
                    datasets: [{
                        data: [40, 25, 15, 10, 10],
                        backgroundColor: [
                            '#8b5cf6',
                            '#3b82f6',
                            '#10b981',
                            '#f59e0b',
                            '#94a3b8'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
    }
    
    updateDashboardWithRepoData(repoName) {
        const repoSelect = document.querySelector('.repo-select');
        if (repoSelect) {
            const option = document.createElement('option');
            option.value = repoName;
            option.textContent = `${repoName} (main)`;
            repoSelect.appendChild(option);
            repoSelect.value = repoName;
        }
        
        this.showNotification(`Dashboard updated for ${repoName}`, 'success');
    }
    
    refreshDashboard() {
        this.showNotification('Refreshing dashboard data...', 'info');
        
        setTimeout(() => {
            document.querySelectorAll('.stat-card h3').forEach(stat => {
                const current = parseInt(stat.textContent.replace(/,/g, ''));
                const change = Math.floor(Math.random() * 20) - 10;
                const newValue = Math.max(0, current + change);
                stat.textContent = newValue.toLocaleString();
            });
            
            this.showNotification('Dashboard refreshed successfully', 'success');
        }, 1000);
    }
    
    // Tool Functions
    handleToolClick(e) {
        const tool = e.currentTarget.querySelector('i').className;
        
        if (tool.includes('paperclip')) {
            this.simulateFileUpload();
        } else if (tool.includes('code')) {
            this.insertCodeSnippet();
        } else if (tool.includes('link')) {
            this.promptForUrl();
        }
    }
    
    simulateFileUpload() {
        this.showNotification('File upload feature coming soon!', 'info');
    }
    
    insertCodeSnippet() {
        const messageInput = document.getElementById('message-input');
        const snippet = `// Sample code snippet
function analyzeRepository(repoUrl) {
    try {
        const repoInfo = extractRepoInfo(repoUrl);
        const analysis = await runAnalysis(repoInfo);
        return generateReport(analysis);
    } catch (error) {
        console.error('Analysis failed:', error);
        throw new Error('Repository analysis failed');
    }
}`;
        
        messageInput.value = snippet;
        messageInput.focus();
        this.autoResizeTextarea(messageInput);
        this.showNotification('Code snippet inserted', 'success');
    }
    
    promptForUrl() {
        const url = prompt('Enter a GitHub repository URL:');
        if (url) {
            const messageInput = document.getElementById('message-input');
            messageInput.value = url;
            this.autoResizeTextarea(messageInput);
        }
    }
    
    simulateVoiceInput() {
        this.showNotification('Voice input feature coming soon!', 'info');
    }
    
    showSettings() {
        this.showNotification('Settings panel coming soon!', 'info');
    }
    
    toggleTheme(e) {
        if (e.target.checked) {
            document.body.classList.add('dark-theme');
            this.showNotification('Dark mode enabled', 'success');
        } else {
            document.body.classList.remove('dark-theme');
            this.showNotification('Light mode enabled', 'success');
        }
    }
}

// Initialize the application
const githubAI = new GitHubAIAssistant();