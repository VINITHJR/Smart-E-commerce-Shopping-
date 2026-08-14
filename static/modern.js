// Modern Fashion App JavaScript
let personImageFile = null;
let costumeImageFile = null;
let resultImageData = null;
let selectedCostumeUrl = null;
let isSearching = false;

// Tab switching with smooth animation
function switchTab(tab) {
    // Scroll to top immediately (instant, not smooth)
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(btn => btn.classList.remove('active'));
    contents.forEach(content => {
        content.style.opacity = '0';
        content.style.transform = 'translateY(20px)';
        setTimeout(() => content.classList.remove('active'), 300);
    });
    
    setTimeout(() => {
        if (tab === 'search') {
            document.getElementById('searchTab').classList.add('active');
            tabs[0].classList.add('active');
        } else {
            document.getElementById('tryonTab').classList.add('active');
            tabs[1].classList.add('active');
        }
        
        const activeContent = document.querySelector('.tab-content.active');
        if (activeContent) {
            setTimeout(() => {
                activeContent.style.opacity = '1';
                activeContent.style.transform = 'translateY(0)';
            }, 50);
        }
    }, 300);
}

// Search functionality with cache indicator
async function searchProducts() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.trim();

    if (!searchTerm) {
        showNotification('Please enter a search term!', 'warning');
        return;
    }

    if (isSearching) return;

    isSearching = true;
    const searchBtn = document.getElementById('searchBtn');
    searchBtn.disabled = true;
    searchBtn.innerHTML = '<span class="spinner"></span> Searching...';

    document.getElementById('resultsSection').innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <h3>🔍 Searching Fashion Sites...</h3>
            <p>Looking for "${searchTerm}" across all platforms...</p>
        </div>
    `;

    try {
        const startTime = Date.now();
        const response = await fetch('http://localhost:5000/api/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ search_term: searchTerm })
        });
        
        if (!response.ok) throw new Error('Search failed');
        
        const products = await response.json();
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        
        // Check if results came from cache (very fast response)
        const isCached = duration < 1;
        if (isCached) {
            showNotification(`⚡ Results loaded from cache! (${duration}s)`, 'success');
        } else {
            showNotification(`✅ Found ${products.length} products in ${duration}s`, 'success');
        }
        
        displayResults(products);
        
    } catch (error) {
        console.error('Search failed:', error);
        showNotification('❌ Search failed. Make sure backend is running on port 5000.', 'error');
        document.getElementById('resultsSection').innerHTML = `
            <div class="empty-state">
                <h3>❌ Search Failed</h3>
                <p>Unable to fetch results. Please check if the backend is running.</p>
            </div>
        `;
    }
    
    isSearching = false;
    searchBtn.disabled = false;
    searchBtn.textContent = '🔍 Search All Sites';
}

function handleEnter(event) {
    if (event.key === 'Enter') {
        searchProducts();
    }
}

function displayResults(products) {
    if (!products || products.length === 0) {
        document.getElementById('resultsSection').innerHTML = `
            <div class="empty-state">
                <h3>😔 No Results Found</h3>
                <p>Try a different search term</p>
            </div>
        `;
        return;
    }

    products.sort((a, b) => b.value_score - a.value_score);

    const resultsHtml = `
        <div class="results">
            ${products.map((product, index) => `
                <div class="product-card" onclick="selectCostume('${product.url.replace(/'/g, "\\'")}')">
                    <div class="try-on-badge">👗 Try On</div>
                    <img src="${product.url}" alt="${product.category}" class="product-image" 
                         onerror="this.src='https://via.placeholder.com/300x400/f0f0f0/999?text=Image+Not+Available'">
                    <div class="product-info">
                        <div class="product-category">${product.site} • ${product.category}</div>
                        <div class="product-details">
                            <div class="detail-item">
                                <div class="detail-label">Price</div>
                                <div class="detail-value">₹${product.price.toLocaleString()}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Rating</div>
                                <div class="detail-value">${product.rating}⭐</div>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    document.getElementById('resultsSection').innerHTML = resultsHtml;
    
    // Animate cards on load
    const cards = document.querySelectorAll('.product-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.4s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 50);
    });
}

// Select costume from search results
async function selectCostume(imageUrl) {
    selectedCostumeUrl = imageUrl;
    
    try {
        showNotification('📥 Loading costume image...', 'info');
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], 'costume.jpg', { type: 'image/jpeg' });
        costumeImageFile = file;
        
        const preview = document.getElementById('costumePreview');
        preview.innerHTML = `<img src="${imageUrl}" alt="Selected Costume">`;
        preview.classList.add('has-image', 'costume-locked');
        
        // Switch to try-on tab with animation
        switchTab('tryon');
        showNotification('✅ Costume selected! Upload your photo to try it on.', 'success');
        
    } catch (error) {
        console.error('Failed to load costume:', error);
        showNotification('❌ Failed to load costume image. Please try again.', 'error');
    }
}

// Preview person image
document.getElementById('personImage').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        personImageFile = file;
        const reader = new FileReader();
        reader.onload = function(event) {
            const preview = document.getElementById('personPreview');
            preview.innerHTML = `<img src="${event.target.result}" alt="Person">`;
            preview.classList.add('has-image');
        };
        reader.readAsDataURL(file);
    }
});

// Preview costume image (manual upload)
document.getElementById('costumeImage').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        costumeImageFile = file;
        const reader = new FileReader();
        reader.onload = function(event) {
            const preview = document.getElementById('costumePreview');
            preview.innerHTML = `<img src="${event.target.result}" alt="Costume">`;
            preview.classList.add('has-image');
            preview.classList.remove('costume-locked');
        };
        reader.readAsDataURL(file);
    }
});

// Click to upload
document.getElementById('personPreview').addEventListener('click', function() {
    document.getElementById('personImage').click();
});

document.getElementById('costumePreview').addEventListener('click', function() {
    document.getElementById('costumeImage').click();
});

// Generate virtual try-on
async function generateImage() {
    const errorDiv = document.getElementById('errorMessage');
    const resultSection = document.getElementById('resultSection');
    const generateBtn = document.getElementById('generateBtn');
    const btnText = document.getElementById('btnText');
    const spinner = document.getElementById('spinner');

    errorDiv.style.display = 'none';
    resultSection.style.display = 'none';

    if (!personImageFile || !costumeImageFile) {
        errorDiv.textContent = 'Please upload both images!';
        errorDiv.style.display = 'block';
        return;
    }

    generateBtn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';

    try {
        showNotification('🎨 Generating your virtual try-on... This may take a moment.', 'info');
        
        const formData = new FormData();
        formData.append('personImage', personImageFile);
        formData.append('costumeImage', costumeImageFile);

        const response = await fetch('http://localhost:5001/generate', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok && data.success) {
            resultImageData = data.image;
            document.getElementById('resultImage').src = data.image;
            resultSection.style.display = 'block';
            resultSection.scrollIntoView({ behavior: 'smooth' });
            showNotification('🎉 Virtual try-on generated successfully!', 'success');
        } else {
            throw new Error(data.error || 'Failed to generate image');
        }
    } catch (error) {
        errorDiv.textContent = `Error: ${error.message}. Make sure virtual try-on backend is running on port 5001.`;
        errorDiv.style.display = 'block';
        showNotification('❌ Generation failed. Please try again.', 'error');
    } finally {
        generateBtn.disabled = false;
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
    }
}

// Download result
function downloadImage() {
    if (!resultImageData) return;

    const link = document.createElement('a');
    link.href = resultImageData;
    link.download = `virtual_tryon_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('💾 Image downloaded!', 'success');
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 12px;
        color: white;
        font-weight: 600;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        backdrop-filter: blur(10px);
    `;

    const colors = {
        success: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
        error: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
        warning: 'linear-gradient(135deg, #ffa726 0%, #fb8c00 100%)',
        info: 'linear-gradient(135deg, #42a5f5 0%, #1e88e5 100%)'
    };

    notification.style.background = colors[type] || colors.info;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Focus on search on load
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('searchInput').focus();
    
    // Add smooth transitions to tab content
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.style.transition = 'opacity 0.3s, transform 0.3s';
    });
});

