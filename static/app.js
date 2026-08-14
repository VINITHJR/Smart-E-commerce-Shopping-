// Clean Fashion App JavaScript
let personImageFile = null;
let costumeImageFile = null;
let resultImageData = null;
let isSearching = false;
let trendingKeywords = [];
const UNSPLASH_ACCESS_KEY = "cbhT3gr3zWqw2OJxBfvtUoEw_Kr6Hga6YpsYKuia6SQ";

// Tab switching
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        const tab = button.dataset.tab;
        
        // Update buttons
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Update panels
        document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
        document.getElementById(tab + 'Tab').classList.add('active');
        
        // Load trending if trending tab is clicked
        if (tab === 'trending') {
            loadTrendingKeywords(); // Reload from database and fetch trending images
        }
        
        // Scroll to top
        window.scrollTo(0, 0);
    });
});

// Search functionality
function handleEnter(event) {
    if (event.key === 'Enter') {
        searchProducts();
    }
}

document.getElementById('searchInput').addEventListener('keypress', handleEnter);
document.getElementById('searchBtn').addEventListener('click', searchProducts);

async function searchProducts() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.trim();

    if (!searchTerm) {
        alert('Please enter a search term!');
        return;
    }

    if (isSearching) return;

    isSearching = true;
    const searchBtn = document.getElementById('searchBtn');
    searchBtn.disabled = true;
    searchBtn.textContent = 'Searching...';

    document.getElementById('resultsSection').innerHTML = `
        <div class="loading-state">
            <div class="spinner-large"></div>
            <h3>Searching fashion sites...</h3>
            <p>Looking for "${searchTerm}"...</p>
        </div>
    `;

    try {
        const response = await fetch('http://localhost:5000/api/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ search_term: searchTerm })
        });
        
        if (!response.ok) throw new Error('Search failed');
        
        const products = await response.json();
        displayResults(products, false); // false = search results
        
    } catch (error) {
        console.error('Search failed:', error);
        document.getElementById('resultsSection').innerHTML = `
            <div class="empty-state">
                <h3>❌ Search Failed</h3>
                <p>Unable to fetch results. Make sure backend is running on port 5000.</p>
            </div>
        `;
    }
    
    isSearching = false;
    searchBtn.disabled = false;
    searchBtn.textContent = 'Search';
}

function displayResults(products, isRecentProducts = false) {
    if (!products || products.length === 0) {
        document.getElementById('resultsSection').innerHTML = `
            <div class="empty-state">
                <h3>😔 No Results Found</h3>
                <p>Try a different search term</p>
            </div>
        `;
        return;
    }

    // Sort by value score
    products.sort((a, b) => (b.value_score || 0) - (a.value_score || 0));

    // Add header for recent products
    const headerHtml = isRecentProducts ? `
        <div class="recent-products-header" style="background: rgba(255,255,255,0.9); border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; font-size: 1.5em; margin-bottom: 8px; margin-top: 0;">📦 Recently Searched Products</h2>
            <p style="color: #666; font-size: 0.95em; margin: 0;">Showing ${products.length} products from your recent searches</p>
        </div>
    ` : '';

    const resultsHtml = `
        ${headerHtml}
        <div class="results-grid">
            ${products.map(product => `
                <div class="product-card">
                    <img src="${product.url}" alt="${product.category}" class="product-image" 
                         onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'250\\' height=\\'250\\'%3E%3Crect fill=\\'%23f0f0f0\\' width=\\'250\\' height=\\'250\\'/%3E%3Ctext fill=\\'%23999\\' font-family=\\'sans-serif\\' font-size=\\'14\\' x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dominant-baseline=\\'middle\\'%3EImage Not Available%3C/text%3E%3C/svg%3E'"
                         onclick="selectCostume('${product.url.replace(/'/g, "\\'")}')"
                         style="cursor: pointer;">
                    <div class="product-info">
                        <div class="product-site">${product.site} • ${product.category}</div>
                        <div class="product-details">
                            <span class="product-price">₹${(product.price || 0).toLocaleString()}</span>
                            <span class="product-rating">${product.rating || 'N/A'}${product.rating ? '⭐' : ''}</span>
                        </div>
                        ${product.product_link ? `
                            <a href="${product.product_link}" target="_blank" class="product-link" onclick="event.stopPropagation();">
                                🛒 View Product
                            </a>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    document.getElementById('resultsSection').innerHTML = resultsHtml;
}

// Select costume from search
async function selectCostume(imageUrl) {
    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], 'costume.jpg', { type: 'image/jpeg' });
        costumeImageFile = file;
        
        const preview = document.getElementById('costumePreview');
        preview.innerHTML = `<img src="${imageUrl}" alt="Selected Costume">`;
        preview.classList.add('has-image');
        preview.innerHTML += '<div class="costume-selected-badge">✓ Selected</div>';
        
        // Switch to try-on tab
        document.querySelector('[data-tab="tryon"]').click();
        
    } catch (error) {
        console.error('Failed to load costume:', error);
        alert('Failed to load costume image. Please try again.');
    }
}

// Image upload handlers
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

document.getElementById('costumeImage').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        costumeImageFile = file;
        const reader = new FileReader();
        reader.onload = function(event) {
            const preview = document.getElementById('costumePreview');
            preview.innerHTML = `<img src="${event.target.result}" alt="Costume">`;
            preview.classList.add('has-image');
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
document.getElementById('generateBtn').addEventListener('click', generateImage);

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
        } else {
            throw new Error(data.error || 'Failed to generate image');
        }
    } catch (error) {
        errorDiv.textContent = `Error: ${error.message}. Make sure virtual try-on backend is running on port 5001.`;
        errorDiv.style.display = 'block';
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
}

// Trending Products Functions
let recentProducts = [];

async function loadTrendingKeywords() {
    try {
        const response = await fetch('http://localhost:5000/api/trending');
        if (!response.ok) throw new Error('Failed to fetch trending data');
        
        const data = await response.json();
        trendingKeywords = data.trending_keywords || [];
        
        // Update select dropdown
        const select = document.getElementById('trendingCategory');
        select.innerHTML = '<option value="">All Recent Searches</option>';
        
        trendingKeywords.forEach(keyword => {
            const option = document.createElement('option');
            option.value = keyword;
            option.textContent = keyword.charAt(0).toUpperCase() + keyword.slice(1);
            select.appendChild(option);
        });
        
        // Load trending fashion from Unsplash for all recent searches
        // Show images for all recent search terms combined
        if (trendingKeywords.length > 0) {
            // Load fashion for all recent keywords (combine them)
            await loadTrendingFashionForAllKeywords(trendingKeywords);
        } else {
            // Use default if no searches
            await loadTrendingFashion("fashion");
        }
    } catch (error) {
        console.error('Error loading trending keywords:', error);
        document.getElementById('trendingSection').innerHTML = `
            <div class="empty-state">
                <h3>❌ Error Loading Trending</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

function updateTrendingSelect() {
    const select = document.getElementById('trendingCategory');
    select.innerHTML = '<option value="">All Categories</option>';
    
    trendingKeywords.forEach(keyword => {
        const option = document.createElement('option');
        option.value = keyword;
        option.textContent = keyword.charAt(0).toUpperCase() + keyword.slice(1);
        select.appendChild(option);
    });
    
    if (trendingKeywords.length > 0) {
        select.value = trendingKeywords[0];
    }
}


async function fetchTrendingFashionFromAPI(query, numItems = 12) {
    try {
        const response = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${numItems}&orientation=portrait`,
            {
                headers: {
                    'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
                }
            }
        );
        
        if (!response.ok) throw new Error('Unsplash API error');
        
        const data = await response.json();
        const fashionItems = [];
        
        for (const photo of data.results || []) {
            fashionItems.push({
                image: photo.urls?.regular,
                title: photo.alt_description || query,
                photographer: photo.user?.name || "Unsplash"
            });
        }
        
        return fashionItems;
    } catch (error) {
        console.error('Error fetching from Unsplash:', error);
        return [];
    }
}

async function loadTrendingFashionForAllKeywords(keywords) {
    const trendingSection = document.getElementById('trendingSection');
    
    trendingSection.innerHTML = `
        <div class="loading-state">
            <div class="spinner-large"></div>
            <h3>Loading trending fashion...</h3>
            <p>Discovering trends from ${keywords.length} recent searches 🌍</p>
        </div>
    `;
    
    try {
        // Fetch fashion images for all recent keywords
        const allFashionItems = [];
        const itemsPerKeyword = Math.max(3, Math.floor(12 / keywords.length)); // Distribute items across keywords
        
        for (const keyword of keywords.slice(0, 10)) { // Limit to 10 keywords
            const items = await fetchTrendingFashionFromAPI(keyword, itemsPerKeyword);
            allFashionItems.push(...items);
        }
        
        // Shuffle to mix different categories
        allFashionItems.sort(() => Math.random() - 0.5);
        
        if (allFashionItems.length === 0) {
            trendingSection.innerHTML = `
                <div class="empty-state">
                    <h3>😔 No Fashion Found</h3>
                    <p>Try searching in the main tab first!</p>
                </div>
            `;
            return;
        }
        
        displayTrendingFashion(allFashionItems.slice(0, 12)); // Show up to 12 items
    } catch (error) {
        console.error('Error loading trending fashion:', error);
        trendingSection.innerHTML = `
            <div class="empty-state">
                <h3>❌ Error Loading Fashion</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

async function loadTrendingFashion(category) {
    const trendingSection = document.getElementById('trendingSection');
    
    if (!category || category.trim() === "") {
        category = "fashion";
    }
    
    trendingSection.innerHTML = `
        <div class="loading-state">
            <div class="spinner-large"></div>
            <h3>Loading trending fashion...</h3>
            <p>Discovering "${category}" trends from around the globe 🌍</p>
        </div>
    `;
    
    try {
        // Fetch trending fashion images from Unsplash API based on search term
        const fashionItems = await fetchTrendingFashionFromAPI(category, 12);
        
        if (fashionItems.length === 0) {
            trendingSection.innerHTML = `
                <div class="empty-state">
                    <h3>😔 No Fashion Found</h3>
                    <p>Try selecting another category or search in the main tab first!</p>
                </div>
            `;
            return;
        }
        
        displayTrendingFashion(fashionItems);
    } catch (error) {
        console.error('Error loading trending fashion:', error);
        trendingSection.innerHTML = `
            <div class="empty-state">
                <h3>❌ Error Loading Fashion</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

async function handleTrendingSearch() {
    const searchInput = document.getElementById('trendingSearchInput');
    const searchTerm = searchInput.value.trim();
    
    if (!searchTerm) {
        // If empty, load from selected category
        const category = document.getElementById('trendingCategory').value;
        await loadTrendingFashion(category || "fashion");
        return;
    }
    
    // Fetch trending fashion from Unsplash API based on search term
    await loadTrendingFashion(searchTerm);
}

function displayTrendingFashion(fashionItems) {
    const trendingSection = document.getElementById('trendingSection');
    
    if (!fashionItems || fashionItems.length === 0) {
        trendingSection.innerHTML = `
            <div class="empty-state">
                <h3>😔 No Fashion Found</h3>
                <p>Try selecting a different category</p>
            </div>
        `;
        return;
    }
    
    const fashionHtml = `
        <div class="trending-info">
            <p class="trending-count">✨ ${fashionItems.length} trending fashion styles from around the globe 🌍</p>
        </div>
        <div class="trending-fashion-grid">
            ${fashionItems.map(item => `
                <div class="trending-fashion-card">
                    <img src="${item.image}" alt="${item.title}" class="trending-fashion-image" 
                         onclick="selectCostume('${item.image.replace(/'/g, "\\'")}')"
                         onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'300\\' height=\\'400\\'%3E%3Crect fill=\\'%23f0f0f0\\' width=\\'300\\' height=\\'400\\'/%3E%3Ctext fill=\\'%23999\\' font-family=\\'sans-serif\\' font-size=\\'14\\' x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dominant-baseline=\\'middle\\'%3EImage Not Available%3C/text%3E%3C/svg%3E'">
                    <div class="trending-fashion-overlay">
                        <p class="trending-fashion-hint">👆 Click to try on</p>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    trendingSection.innerHTML = fashionHtml;
}

// Load recent products on page load
async function loadRecentProducts() {
    try {
        console.log('🔄 Loading recent products...');
        const response = await fetch('http://localhost:5000/api/recent');
        if (response.ok) {
            const products = await response.json();
            console.log(`📦 Received ${products ? products.length : 0} recent products`);
            if (products && products.length > 0) {
                displayResults(products, true); // true = recent products
                console.log('✅ Recent products displayed');
            } else {
                console.log('ℹ️ No recent products found');
                // Keep the welcome message if no recent products
                document.getElementById('resultsSection').innerHTML = `
                    <div class="empty-state">
                        <h3>👋 Welcome!</h3>
                        <p>Search for fashion items and click on them to try virtually</p>
                    </div>
                `;
            }
        } else {
            console.error('❌ Failed to load recent products: HTTP', response.status);
        }
    } catch (error) {
        console.error('❌ Failed to load recent products:', error);
        // Keep welcome message on error
        document.getElementById('resultsSection').innerHTML = `
            <div class="empty-state">
                <h3>👋 Welcome!</h3>
                <p>Search for fashion items and click on them to try virtually</p>
                <p style="color: #999; font-size: 0.9em; margin-top: 10px;">(Start searching to see your recent products here!)</p>
            </div>
        `;
    }
}

// Initialize trending on page load
document.addEventListener('DOMContentLoaded', () => {
    // Load recent products on page load for search tab
    loadRecentProducts();
    
    // Load trending keywords
    loadTrendingKeywords();
    
    // Trending search functionality
    const trendingSearchInput = document.getElementById('trendingSearchInput');
    const trendingSearchBtn = document.getElementById('trendingSearchBtn');
    const showAllBtn = document.getElementById('showAllTrending');
    
    trendingSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleTrendingSearch();
        }
    });
    
    trendingSearchBtn.addEventListener('click', handleTrendingSearch);
    
    showAllBtn.addEventListener('click', () => {
        trendingSearchInput.value = '';
        // Reload and show all recent searches
        loadTrendingKeywords();
    });
    
    // Refresh button
    document.getElementById('refreshTrending').addEventListener('click', () => {
        const category = document.getElementById('trendingCategory').value;
        loadTrendingFashion(category || "fashion");
    });
    
    // Category change
    document.getElementById('trendingCategory').addEventListener('change', () => {
        const category = document.getElementById('trendingCategory').value;
        loadTrendingFashion(category);
    });
    
    // Reload recent products when switching back to search tab
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.dataset.tab;
            if (tab === 'search') {
                // Check if results section is empty or showing welcome message
                const resultsSection = document.getElementById('resultsSection');
                const isEmpty = resultsSection.innerHTML.includes('Welcome') || 
                               resultsSection.innerHTML.includes('empty-state');
                if (isEmpty) {
                    loadRecentProducts();
                }
            }
        });
    });
});


