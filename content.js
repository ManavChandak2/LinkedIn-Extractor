// Content script to extract LinkedIn profile information
function extractLinkedInData() {
  try {
    // Get current URL
    const linkedinUrl = window.location.href;
    
    // Extract name - try multiple selectors
    let name = '';
    const nameSelectors = [
      'h1.text-heading-xlarge',
      'h1.inline.t-24.v-align-middle.break-words',
      '.pv-text-details__left-panel h1'
    ];
    
    for (const selector of nameSelectors) {
      const nameEl = document.querySelector(selector);
      if (nameEl) {
        name = nameEl.textContent.trim();
        break;
      }
    }
    
    // Extract recent company
    let recentCompany = '';
    const companySelectors = [
      '.text-body-medium.break-words',
      '.pv-text-details__left-panel .text-body-medium',
      'div.inline-show-more-text--is-collapsed span[aria-hidden="true"]'
    ];
    
    for (const selector of companySelectors) {
      const companyEl = document.querySelector(selector);
      if (companyEl && companyEl.textContent.includes('at')) {
        const text = companyEl.textContent;
        const match = text.match(/at\s+(.+?)(?:\s*·|\s*$)/);
        if (match) {
          recentCompany = match[1].trim();
          break;
        }
      }
    }
    
    // If not found, try experience section
    if (!recentCompany) {
      const expSection = document.querySelector('#experience');
      if (expSection) {
        const firstCompany = expSection.parentElement.querySelector('ul li .display-flex.flex-column span[aria-hidden="true"]');
        if (firstCompany) {
          recentCompany = firstCompany.textContent.trim();
        }
      }
    }
    
    // Extract company website - this is tricky on LinkedIn
    // We'll try to get it from the company link or leave it empty
    let companyWebsite = '';
    const companyLinks = document.querySelectorAll('a[href*="/company/"]');
    if (companyLinks.length > 0) {
      const companyLink = companyLinks[0].href;
      companyWebsite = companyLink; // Will be the LinkedIn company page
    }
    
    return {
      linkedinUrl,
      name,
      recentCompany,
      companyWebsite,
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractData') {
    const data = extractLinkedInData();
    sendResponse(data);
  }
  return true;
});