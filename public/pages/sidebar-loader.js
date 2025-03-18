/**
 * External sidebar loader script
 * This avoids inline scripts which would violate Content Security Policy
 */

(function() {
  // Create a script element to load the sidebar entry
  const script = document.createElement('script');
  script.type = 'module';
  
  // Use global chrome variable if available, otherwise use explicit path
  const scriptPath = typeof chrome !== 'undefined' && chrome.runtime ? 
    chrome.runtime.getURL('assets/sidebar_entry.js') : 
    '../assets/sidebar_entry.js';
  
  script.src = scriptPath;
  
  // Add error handling
  script.onerror = function(error) {
    console.error('Failed to load sidebar module:', error);
    document.getElementById('root').innerHTML = `
      <div class="error-container">
        <h1 style="color: #F7768E; font-size: 1.25rem; font-weight: bold;">Failed to load sidebar</h1>
        <p style="margin-top: 0.5rem; font-size: 0.875rem;">Please try refreshing the page.</p>
        <div style="margin-top: 1rem; padding: 0.5rem; background: #1A1B26; border-radius: 0.25rem; font-size: 0.75rem; overflow: auto;">
          Error loading sidebar script
        </div>
      </div>
    `;
  };
  
  // Add the script to the document
  document.head.appendChild(script);
})();