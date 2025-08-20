# Blakely Cinematics Website Update Guide

This guide shows you how to use the update system to keep your website dashboard current and track progress systematically.

## 🚀 Quick Start

The update system consists of two main files:
- **`scripts/update-website.js`** - Contains all update functions
- **`data/website-status.json`** - Stores current website data

## 📊 Basic Update Functions

### 1. Update SEO Score
```javascript
// Update SEO score for the entire website (0-100)
updateSeoScore(80);
// Result: Dashboard shows 80% SEO score
```

### 2. Update Performance Score
```javascript
// Update performance score (0-100)
updatePerformanceScore(90);
// Result: Dashboard shows 90% performance score
```

### 3. Update Metrics
```javascript
// Update any website metric
updateMetric('pagesComplete', 11);
updateMetric('contentItems', 100);
updateMetric('debugStatements', 5);

// Multiple metrics at once
updateMetric('seoScore', 85);
updateMetric('performanceScore', 88);
```

### 4. Add TODO Items
```javascript
// Add a new TODO with automatic priority detection
addTodoItem('index.html', 'Add Google Analytics tracking code');

// High priority items (auto-detected by keywords)
addTodoItem('contact form', 'Fix critical form validation bug');

// The system automatically:
// - Assigns priority (high/medium/low) based on keywords
// - Generates unique ID
// - Updates todo count
// - Logs the addition
```

### 5. Mark Tasks Complete
```javascript
// Mark a TODO as completed (you'll get the ID when you add the TODO)
markTaskComplete('portfolio_s3_images');

// This automatically:
// - Updates the task status to 'completed'
// - Adds completion timestamp
// - Logs the completion
```

### 6. Update Page Status
```javascript
// Update individual page status and SEO score
updatePageStatus('gallery', 'complete', 85);
updatePageStatus('services', 'needs content review', 70);

// Page status options: 'complete', 'in progress', 'needs review', 'pending'
```

### 7. Update Feature Status
```javascript
// Update feature completion status
updateFeatureStatus('contactForm', 'complete', 'high');
updateFeatureStatus('portfolioGallery', '95% complete', 'high');
updateFeatureStatus('seoOptimization', 'in progress', 'medium');
```

## 🎯 Real-World Examples

### Scenario 1: After Content Updates
```javascript
// You just uploaded portfolio images to S3 and updated the HTML
markTaskComplete('portfolio_s3_images');
updateFeatureStatus('portfolioGallery', 'complete', 'high');
updatePageStatus('gallery', 'complete', 80);
updateMetric('contentItems', 110);
addToUpdateLog('✅ Portfolio images uploaded and integrated');
```

### Scenario 2: After SEO Improvements
```javascript
// You added meta descriptions and structured data
updateSeoScore(85);
updateFeatureStatus('seoOptimization', 'complete', 'medium');
addTodoItem('index.html', 'Add sitemap.xml', 'low');
addToUpdateLog('📊 SEO optimization completed - meta tags and structured data added');
```

### Scenario 3: After Form Integration
```javascript
// You connected the contact form to Formspree
markTaskComplete('contact_form_backend');
updateFeatureStatus('contactForm', 'complete', 'high');
updateMetric('performanceScore', 88);
addToUpdateLog('🔗 Contact form connected to Formspree backend');
```

### Scenario 4: Production Cleanup
```javascript
// You cleaned up debug code and console logs
markTaskComplete('remove_console_logs');
updateMetric('debugStatements', 0);
addToUpdateLog('🧹 Production cleanup - removed all console.log statements');
```

### Scenario 5: Deployment Preparation
```javascript
// Website is ready for deployment
updateFeatureStatus('deployment', 'ready', 'high');
addTodoItem('deployment', 'Deploy to Netlify', 'high');
updateMetric('seoScore', 90);
updateMetric('performanceScore', 92);
addToUpdateLog('🚀 Website ready for deployment to Netlify');
```

## 📋 Page Management

### Update Multiple Pages
```javascript
// Update several pages at once
const pages = ['index', 'services', 'gallery', 'vip', 'admin'];
pages.forEach(page => {
    updatePageStatus(page, 'complete', 75);
});
addToUpdateLog('📄 All main pages reviewed and marked complete');
```

### Track Content Areas
```javascript
// Update content completion status
updateMetric('contentAreas', {
    heroSection: 'complete',
    services: 'complete',
    portfolio: 'needs S3 images',
    testimonials: 'complete',
    contact: 'complete'
});
```

## 🔄 Automated Workflows

### Weekly Progress Review
```javascript
function weeklyReview() {
    const status = getWebsiteStatus();
    
    // Check completion status
    if (status.seoScore < 80) {
        addToUpdateLog('⚠️ SEO score below target - needs improvement');
    }
    
    if (status.performanceScore < 85) {
        addToUpdateLog('⚠️ Performance score needs optimization');
    }
    
    // Count open TODOs
    const openTodos = status.todos.filter(t => t.status === 'pending').length;
    if (openTodos > 10) {
        addToUpdateLog(`📋 High TODO count: ${openTodos} open items`);
    }
    
    addToUpdateLog('📊 Weekly review completed');
}
```

### Pre-Deployment Checklist
```javascript
function preDeploymentCheck() {
    const checklist = [
        'portfolio_s3_images',
        'contact_form_backend',
        'remove_console_logs',
        'social_media_links'
    ];
    
    checklist.forEach(todoId => {
        const isComplete = checkTaskStatus(todoId);
        if (!isComplete) {
            addToUpdateLog(`⚠️ Pre-deployment: ${todoId} still pending`);
        }
    });
    
    addToUpdateLog('🔍 Pre-deployment check completed');
}
```

## 🛠️ Advanced Usage

### Bulk Feature Updates
```javascript
// Update multiple features efficiently
const featureUpdates = {
    'responsiveDesign': 'complete',
    'heroSlider': 'complete',
    'portfolioGallery': '90% complete',
    'contactForm': 'frontend complete',
    'loadingScreen': 'complete'
};

Object.entries(featureUpdates).forEach(([feature, status]) => {
    updateFeatureStatus(feature, status, 'high');
});

addToUpdateLog('🔧 Bulk feature status update completed');
```

### Custom Priority Detection
```javascript
// Add TODOs with custom priority logic
function addCriticalTodo(page, description) {
    // Always mark as high priority
    const todoId = addTodoItem(page, `CRITICAL: ${description}`, 'high');
    addToUpdateLog(`🚨 Critical TODO added: ${description}`);
    return todoId;
}

// Usage:
addCriticalTodo('contact form', 'Security vulnerability in form validation');
```

## 📊 Status Tracking

### Get Current Status
```javascript
// View current website data
const status = getWebsiteStatus();
console.log(status);

// Generate formatted report
const report = generateStatusReport();
console.log(report);
```

### Monitor Progress
```javascript
// Get recent updates
const recentUpdates = websiteUpdater.getRecentUpdates(10);
recentUpdates.forEach(update => {
    console.log(`${update.timestamp}: ${update.message}`);
});

// Calculate overall completion
const overallCompletion = websiteUpdater.calculateCompletionPercentage();
console.log(`Overall website completion: ${overallCompletion}%`);
```

## 📝 Best Practices

1. **Update Regularly**: Make updates after each work session
2. **Be Specific**: Use descriptive messages for TODOs and logs
3. **Track Everything**: Document all changes, both big and small
4. **Review Weekly**: Use automated workflows to check progress
5. **Prioritize Tasks**: Use the priority system to focus on important items

## 🚨 Important Notes

- **Backup Your Data**: The system overwrites `website-status.json`
- **Validate Input**: SEO/Performance scores must be 0-100
- **Test Updates**: Verify dashboard reflects your changes
- **Monitor Health**: Watch for declining scores or increasing TODOs

## 📊 Data Structure

The system stores data in this format:
```json
{
  "lastUpdated": "2024-12-20T21:00:00.000Z",
  "pagesComplete": 11,
  "seoScore": 75,
  "performanceScore": 85,
  "todos": [...],
  "features": {...},
  "updateLog": [...]
}
```

## 🆘 Troubleshooting

**Problem**: Updates don't appear in dashboard
- **Solution**: Check that the JSON file is properly formatted
- **Check**: Verify the dashboard HTML is loading the correct data

**Problem**: Functions not found
- **Solution**: Make sure `update-website.js` is loaded
- **Check**: Console should show "🌐 Blakely Cinematics Website Update System loaded successfully!"

**Problem**: Invalid scores
- **Solution**: Ensure SEO/Performance scores are between 0-100
- **Fix**: The system will throw an error for invalid values

---

## 🎬 Website-Specific Examples

### Portfolio Management
```javascript
// After uploading new portfolio pieces
updateMetric('contentItems', 120);
updateFeatureStatus('portfolioGallery', 'complete', 'high');
addToUpdateLog('🎨 New portfolio pieces added - gallery now complete');
```

### Client Gallery Updates
```javascript
// After setting up VIP client access
updateFeatureStatus('vipGallerySystem', 'complete', 'high');
updatePageStatus('vip', 'complete', 70);
addToUpdateLog('🔐 VIP client gallery system fully operational');
```

### AWS S3 Integration
```javascript
// Track S3 deployment status
updateMetric('deployment', {
    s3BucketReady: true,
    heroImages: { '1080p': 13, '4k': 14 },
    portfolioImages: 25,
    clientImages: 0
});
addToUpdateLog('☁️ AWS S3 integration complete - all images deployed');
```

*Last Updated: December 20, 2024*
*For questions, check the console logs or review the update system code.*