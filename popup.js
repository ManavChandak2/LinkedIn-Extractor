// Bitscale webhook URL
const WEBHOOK_URL = 'https://api.bitscale.ai/api/source/webhook/pull/c879c768-1728-4eb0-9fc1-d74712cc8a2f';

document.getElementById('extractBtn').addEventListener('click', async () => {
  const accountId = document.getElementById('accountId').value.trim();
  const contactId = document.getElementById('contactId').value.trim();
  const email = document.getElementById('email').value.trim();
  const statusDiv = document.getElementById('status');
  const fetchedDataDiv = document.getElementById('fetchedData');
  const dataContainer = document.getElementById('dataContainer');
  const extractBtn = document.getElementById('extractBtn');
  
  // Validate inputs
  if (!accountId || !contactId) {
    showStatus('Please enter both Account ID and Contact ID', 'error');
    return;
  }
  
  // Disable button and show loading
  extractBtn.disabled = true;
  extractBtn.textContent = 'Extracting...';
  showStatus('Extracting LinkedIn data...', 'info');
  fetchedDataDiv.style.display = 'none';
  
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Check if we're on LinkedIn
    if (!tab.url.includes('linkedin.com')) {
      throw new Error('Please open a LinkedIn profile page');
    }
    
    // Extract data from the page
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractData' });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to extract data');
    }
    
    // Prepare payload for Bitscale API
    const payload = {
      linkedinUrl: response.linkedinUrl,
      name: response.name,
      recentCompany: response.recentCompany,
      companyWebsite: response.companyWebsite,
      accountId: accountId,
      contactId: contactId,
      timestamp: new Date().toISOString()
    };
    
    // Add email if provided
    if (email) {
      payload.email = email;
    }
    
    // Display fetched data
    displayFetchedData(payload);
    
    // Send to webhook
    showStatus('Sending to Bitscale webhook...', 'info');
    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    if (!webhookResponse.ok) {
      throw new Error(`Webhook returned ${webhookResponse.status}: ${webhookResponse.statusText}`);
    }
    
    showStatus('✓ Data extracted and sent successfully!', 'success');
    
  } catch (error) {
    showStatus(`Error: ${error.message}`, 'error');
  } finally {
    extractBtn.disabled = false;
    extractBtn.textContent = 'Extract & Send';
  }
});

function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';
}

function displayFetchedData(data) {
  const dataContainer = document.getElementById('dataContainer');
  const fetchedDataDiv = document.getElementById('fetchedData');
  
  dataContainer.innerHTML = `
    <div class="data-item">
      <div class="data-label">LinkedIn URL:</div>
      <div class="data-value">${data.linkedinUrl || 'Not found'}</div>
    </div>
    <div class="data-item">
      <div class="data-label">Name:</div>
      <div class="data-value">${data.name || 'Not found'}</div>
    </div>
    <div class="data-item">
      <div class="data-label">Recent Company:</div>
      <div class="data-value">${data.recentCompany || 'Not found'}</div>
    </div>
    <div class="data-item">
      <div class="data-label">Company Website:</div>
      <div class="data-value">${data.companyWebsite || 'Not found'}</div>
    </div>
    ${data.email ? `<div class="data-item">
      <div class="data-label">Email:</div>
      <div class="data-value">${data.email}</div>
    </div>` : ''}
    <div class="data-item">
      <div class="data-label">Account ID:</div>
      <div class="data-value">${data.accountId}</div>
    </div>
    <div class="data-item">
      <div class="data-label">Contact ID:</div>
      <div class="data-value">${data.contactId}</div>
    </div>
  `;
  
  fetchedDataDiv.style.display = 'block';
}