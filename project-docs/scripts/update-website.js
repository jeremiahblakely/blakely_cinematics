/**
 * Blakely Cinematics Website Update System
 * Programmatic dashboard and status tracking system
 */

class WebsiteUpdater {
    constructor() {
        this.dataFile = 'data/website-status.json';
        this.projectData = null;
        this.loadProjectData();
        console.log('🚀 Blakely Cinematics Website Update System initialized');
    }

    /**
     * Load current project data from JSON file
     */
    async loadProjectData() {
        try {
            const response = await fetch(this.dataFile);
            this.projectData = await response.json();
        } catch (error) {
            console.error('Failed to load project data:', error);
            this.projectData = this.getDefaultData();
        }
    }

    /**
     * Default data structure if file doesn't exist
     */
    getDefaultData() {
        return {
            lastUpdated: new Date().toISOString(),
            pagesComplete: 11,
            totalPages: 11,
            seoScore: 75,
            performanceScore: 80,
            contentItems: 85,
            websiteInfo: {
                name: "Blakely Cinematics",
                type: "Portfolio Website",
                technology: "HTML5, CSS3, JavaScript",
                purpose: "Professional cinematography portfolio and client management"
            },
            pages: {},
            features: {},
            qualityMetrics: {},
            contentAreas: {},
            analytics: {},
            todos: [],
            updateLog: []
        };
    }

    /**
     * Update SEO score (0-100)
     */
    updateSeoScore(score) {
        if (score < 0 || score > 100) {
            throw new Error('SEO score must be between 0 and 100');
        }
        this.projectData.seoScore = score;
        this.projectData.lastUpdated = new Date().toISOString();
        this.addToUpdateLog(`📊 SEO score updated to ${score}%`);
        this.saveData();
    }

    /**
     * Update performance score (0-100)
     */
    updatePerformanceScore(score) {
        if (score < 0 || score > 100) {
            throw new Error('Performance score must be between 0 and 100');
        }
        this.projectData.performanceScore = score;
        this.projectData.lastUpdated = new Date().toISOString();
        this.addToUpdateLog(`⚡ Performance score updated to ${score}%`);
        this.saveData();
    }

    /**
     * Update any website metric
     */
    updateMetric(metricName, value) {
        const oldValue = this.projectData[metricName];
        this.projectData[metricName] = value;
        this.projectData.lastUpdated = new Date().toISOString();
        
        if (oldValue !== undefined) {
            this.addToUpdateLog(`📊 Updated ${metricName}: ${oldValue} → ${value}`);
        } else {
            this.addToUpdateLog(`📊 Set ${metricName}: ${value}`);
        }
        this.saveData();
    }

    /**
     * Add a TODO item for website improvements
     */
    addTodoItem(page, description, priority = 'medium') {
        const todoId = description.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 30);

        // Auto-detect priority based on keywords
        const highPriorityKeywords = ['critical', 'urgent', 'security', 'broken', 'error', 'bug', 'crash'];
        const lowPriorityKeywords = ['future', 'nice to have', 'optional', 'enhancement', 'consider'];
        
        const lowerDesc = description.toLowerCase();
        if (highPriorityKeywords.some(keyword => lowerDesc.includes(keyword))) {
            priority = 'high';
        } else if (lowPriorityKeywords.some(keyword => lowerDesc.includes(keyword))) {
            priority = 'low';
        }

        const newTodo = {
            id: todoId,
            page: page,
            description: description,
            priority: priority,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        if (!this.projectData.todos) {
            this.projectData.todos = [];
        }

        this.projectData.todos.push(newTodo);
        this.projectData.lastUpdated = new Date().toISOString();
        this.addToUpdateLog(`📝 Added TODO: ${description} (${page})`);
        this.saveData();
        return todoId;
    }

    /**
     * Mark a TODO item as completed
     */
    markTaskComplete(todoId) {
        if (!this.projectData.todos) return false;

        const todo = this.projectData.todos.find(t => t.id === todoId);
        if (todo) {
            todo.status = 'completed';
            todo.completedAt = new Date().toISOString();
            this.projectData.lastUpdated = new Date().toISOString();
            this.addToUpdateLog(`✅ Completed: ${todo.description}`);
            this.saveData();
            return true;
        }
        return false;
    }

    /**
     * Update page status
     */
    updatePageStatus(pageName, status, seoScore = null) {
        if (!this.projectData.pages) {
            this.projectData.pages = {};
        }

        if (!this.projectData.pages[pageName]) {
            this.projectData.pages[pageName] = {};
        }

        this.projectData.pages[pageName].status = status;
        this.projectData.pages[pageName].lastModified = new Date().toISOString();
        
        if (seoScore !== null) {
            this.projectData.pages[pageName].seoScore = seoScore;
        }

        this.projectData.lastUpdated = new Date().toISOString();
        this.addToUpdateLog(`📄 ${pageName} page status: ${status}`);
        this.saveData();
    }

    /**
     * Update feature completion status
     */
    updateFeatureStatus(featureName, status, priority = 'medium') {
        if (!this.projectData.features) {
            this.projectData.features = {};
        }

        this.projectData.features[featureName] = {
            status: status,
            priority: priority,
            lastUpdated: new Date().toISOString()
        };

        this.addToUpdateLog(`🔧 ${featureName}: ${status}`);
        this.saveData();
    }

    /**
     * Add entry to update log
     */
    addToUpdateLog(message, type = null) {
        if (!type) {
            // Auto-detect type from message
            if (message.includes('✅')) type = 'success';
            else if (message.includes('❌') || message.includes('🚨')) type = 'error';
            else if (message.includes('⚠️')) type = 'warning';
            else if (message.includes('📊') || message.includes('📈') || message.includes('⚡')) type = 'metric';
            else type = 'info';
        }

        const logEntry = {
            timestamp: new Date().toISOString(),
            message: message,
            type: type
        };

        if (!this.projectData.updateLog) {
            this.projectData.updateLog = [];
        }

        this.projectData.updateLog.push(logEntry);
        
        // Keep only last 50 entries
        if (this.projectData.updateLog.length > 50) {
            this.projectData.updateLog = this.projectData.updateLog.slice(-50);
        }

        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    /**
     * Get current website status
     */
    getWebsiteStatus() {
        return this.projectData;
    }

    /**
     * Get recent updates (default: last 10)
     */
    getRecentUpdates(count = 10) {
        if (!this.projectData.updateLog) return [];
        return this.projectData.updateLog.slice(-count).reverse();
    }

    /**
     * Generate formatted status report
     */
    generateStatusReport() {
        const data = this.projectData;
        const completionPercentage = this.calculateCompletionPercentage();
        
        return `
🌐 BLAKELY CINEMATICS WEBSITE STATUS REPORT
==========================================

📊 OVERVIEW:
- Pages: ${data.pagesComplete}/${data.totalPages} complete
- SEO Score: ${data.seoScore}%
- Performance: ${data.performanceScore}%
- Overall Progress: ${completionPercentage}%
- Content Items: ${data.contentItems}
- Open TODOs: ${data.todos ? data.todos.filter(t => t.status === 'pending').length : 0}

🔧 FEATURES STATUS:
${data.features ? Object.entries(data.features)
    .map(([name, info]) => `- ${name}: ${info.status}`)
    .join('\n') : 'No features tracked'}

📋 RECENT UPDATES:
${this.getRecentUpdates(5)
    .map(update => `- ${update.message}`)
    .join('\n')}

Last Updated: ${new Date(data.lastUpdated).toLocaleString()}
`;
    }

    /**
     * Calculate overall completion percentage
     */
    calculateCompletionPercentage() {
        // Weight different aspects
        const seoWeight = 0.2;
        const performanceWeight = 0.2;
        const pagesWeight = 0.4;
        const featuresWeight = 0.2;

        const seoScore = this.projectData.seoScore || 0;
        const perfScore = this.projectData.performanceScore || 0;
        const pagesScore = this.projectData.totalPages > 0 ? 
            (this.projectData.pagesComplete / this.projectData.totalPages) * 100 : 0;
        
        let featuresScore = 0;
        if (this.projectData.features && Object.keys(this.projectData.features).length > 0) {
            const completedFeatures = Object.values(this.projectData.features)
                .filter(f => f.status === 'complete' || f.status === 'deployed').length;
            featuresScore = (completedFeatures / Object.keys(this.projectData.features).length) * 100;
        }

        return Math.round(
            (seoScore * seoWeight) +
            (perfScore * performanceWeight) +
            (pagesScore * pagesWeight) +
            (featuresScore * featuresWeight)
        );
    }

    /**
     * Save data to JSON file (simulated - would need backend in real implementation)
     */
    saveData() {
        // In a real implementation, this would save to the actual JSON file
        // For now, we'll just log the data structure
        console.log('💾 Data saved:', this.projectData);
        
        // In browser environment, could save to localStorage
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('websiteStatus', JSON.stringify(this.projectData));
        }
    }
}

// Global functions for easy access
let websiteUpdater = new WebsiteUpdater();

// Convenience functions
function updateSeoScore(score) { return websiteUpdater.updateSeoScore(score); }
function updatePerformanceScore(score) { return websiteUpdater.updatePerformanceScore(score); }
function updateMetric(metric, value) { return websiteUpdater.updateMetric(metric, value); }
function addTodoItem(page, description, priority) { return websiteUpdater.addTodoItem(page, description, priority); }
function markTaskComplete(todoId) { return websiteUpdater.markTaskComplete(todoId); }
function updatePageStatus(page, status, seoScore) { return websiteUpdater.updatePageStatus(page, status, seoScore); }
function updateFeatureStatus(feature, status, priority) { return websiteUpdater.updateFeatureStatus(feature, status, priority); }
function addToUpdateLog(message, type) { return websiteUpdater.addToUpdateLog(message, type); }
function getWebsiteStatus() { return websiteUpdater.getWebsiteStatus(); }
function generateStatusReport() { return websiteUpdater.generateStatusReport(); }

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebsiteUpdater;
}

console.log('🌐 Blakely Cinematics Website Update System loaded successfully!');