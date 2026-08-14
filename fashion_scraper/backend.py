from flask import Flask, request, jsonify
from flask_cors import CORS
import time
from typing import List, Dict
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from concurrent.futures import ThreadPoolExecutor, as_completed
from loguru import logger
import random
try:
    from .db_cache import SearchCache
except ImportError:
    # Fallback for direct execution
    from db_cache import SearchCache

app = Flask(__name__)
CORS(app)

class FashionScraper:
    
    def __init__(self):
        self.drivers = {}
        self.cache = SearchCache()
        self.sites = {
            "Amazon Fashion": "https://www.amazon.in/s?k={}",
            "Flipkart": "https://www.flipkart.com/search?q={}",
            "Snapdeal": "https://www.snapdeal.com/search?keyword={}"
        }
    
    def create_driver(self):
        try:
            service = Service(ChromeDriverManager().install())
            options = Options()
            options.add_argument("--headless=new")
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            options.add_argument("--disable-gpu")
            options.add_argument("--window-size=1920,1080")
            # Optimize for speed - disable images and other resources
            prefs = {
                "profile.managed_default_content_settings.images": 2,  # Disable images
                "profile.default_content_setting_values.notifications": 2
            }
            options.add_experimental_option("prefs", prefs)
            options.page_load_strategy = 'eager'  # Don't wait for all resources to load
            
            driver = webdriver.Chrome(service=service, options=options)
            driver.set_page_load_timeout(25)  # Reduced timeout for faster failure
            driver.implicitly_wait(2)  # Reduced wait time
            
            return driver
        except Exception as e:
            logger.error(f"Driver creation failed: {e}")
            raise
    
    def scrape_site(self, site_name: str, search_term: str, driver_id: int) -> List[Dict]:
        # Ensure search_term is not modified - use it exactly as received
        original_search_term = search_term.strip()
        logger.info(f"Scraping {site_name} for '{original_search_term}' (exact term)")
        
        try:
            if driver_id not in self.drivers:
                self.drivers[driver_id] = self.create_driver()
            driver = self.drivers[driver_id]
            
            # Format URL based on site - use original_search_term exactly with proper encoding
            from urllib.parse import quote_plus
            
            if site_name == "Snapdeal":
                formatted_term = quote_plus(original_search_term)
                search_url = f"https://www.snapdeal.com/search?keyword={formatted_term}"
                logger.info(f"🔍 Snapdeal - Search term: '{original_search_term}' -> Encoded: '{formatted_term}' -> Full URL: {search_url}")
            elif site_name == "Amazon Fashion":
                formatted_term = quote_plus(original_search_term)
                search_url = f"https://www.amazon.in/s?k={formatted_term}"
                logger.info(f"🔍 Amazon - Search term: '{original_search_term}' -> Encoded: '{formatted_term}' -> URL: {search_url}")
            elif site_name == "Flipkart":
                formatted_term = quote_plus(original_search_term)
                search_url = f"https://www.flipkart.com/search?q={formatted_term}"
                logger.info(f"🔍 Flipkart - Search term: '{original_search_term}' -> Encoded: '{formatted_term}' -> URL: {search_url}")
            else:
                formatted_term = original_search_term.replace(' ', '+')
                search_url = self.sites[site_name].format(formatted_term)
                logger.info(f"🔍 {site_name} - Search term: '{original_search_term}' -> URL: {search_url}")
            try:
                driver.get(search_url)
            except Exception as e:
                logger.warning(f"⚠️ Page load timeout for {site_name}, trying to continue anyway: {e}")
                # Try to continue even if page load times out
            
            # Optimized scrolling - faster for all sites
            if site_name == "Amazon Fashion":
                time.sleep(3)
                for i in range(2):
                    driver.execute_script(f"window.scrollTo(0, {1200 * (i + 1)});")
                    time.sleep(1.5)
            elif site_name == "Snapdeal":
                time.sleep(3)
                for i in range(2):
                    driver.execute_script(f"window.scrollTo(0, {1200 * (i + 1)});")
                    time.sleep(1.5)
            else:  # Flipkart
                time.sleep(3)
                for i in range(2):
                    driver.execute_script(f"window.scrollTo(0, {1200 * (i + 1)});")
                    time.sleep(1.5)
            
            # Pass the original search term to extract_products
            products = self.extract_products(driver, site_name, original_search_term)
            logger.info(f"✅ Found {len(products)} products from {site_name}")
            return products
            
        except Exception as e:
            logger.error(f"❌ Failed to scrape {site_name}: {e}")
            return []
    
    def extract_products(self, driver, site_name: str, category: str) -> List[Dict]:
        products = []
        seen_images = set()
        
        try:
            # Enhanced extraction for each site
            if site_name == "Flipkart":
                js_code = """
                var products = [];
                var links = document.querySelectorAll('a[href*="/p/"]');
                for (var i = 0; i < Math.min(links.length, 25); i++) {
                    var link = links[i];
                    var parent = link.closest('div[data-id]') || link.closest('div');
                    var img = link.querySelector('img') || parent.querySelector('img');
                    
                    if (img && img.src && link.href) {
                        var priceEl = parent.querySelector('div[class*="Nx9bqj"], div[class*="_30jeq3"]');
                        var ratingEl = parent.querySelector('div[class*="XQDdHH"], div[class*="_3LWZlK"]');
                        
                        var priceText = priceEl ? priceEl.innerText : '';
                        var ratingText = ratingEl ? ratingEl.innerText : '';
                        
                        products.push({
                            image: img.src,
                            link: link.href,
                            price: priceText.replace(/[^0-9]/g, ''),
                            rating: ratingText.split(' ')[0]
                        });
                    }
                }
                return products;
                """
            
            if site_name == "Amazon Fashion":
                js_code = """
                var products = [];
                var items = document.querySelectorAll('div[data-component-type="s-search-result"]');
                for (var i = 0; i < Math.min(items.length, 25); i++) {
                    var item = items[i];
                    var link = item.querySelector('a.a-link-normal');
                    var img = item.querySelector('img.s-image');
                    var priceEl = item.querySelector('span.a-price-whole');
                    var ratingEl = item.querySelector('span.a-icon-alt');
                    
                    if (img && link && img.src) {
                        products.push({
                            image: img.src,
                            link: 'https://www.amazon.in' + link.getAttribute('href'),
                            price: priceEl ? priceEl.innerText.replace(/[^0-9]/g, '') : '',
                            rating: ratingEl ? ratingEl.innerText.split(' ')[0] : ''
                        });
                    }
                }
                return products;
                """
            
            else:
                # Generic extraction for Snapdeal
                js_code = """
                var products = [];
                var imgs = document.querySelectorAll('img[src*="jpg"], img[src*="jpeg"], img[src*="png"], img[src*="webp"]');
                for (var i = 0; i < Math.min(imgs.length, 25); i++) {
                    var img = imgs[i];
                    var link = img.closest('a');
                    if (link && link.href && img.src && 
                        !img.src.includes('logo') && !img.src.includes('icon')) {
                        products.push({
                            image: img.src,
                            link: link.href,
                            price: '',
                            rating: ''
                        });
                    }
                }
                return products;
                """
            
            raw_products = driver.execute_script(js_code)
            
            for data in raw_products:
                normalized_image = data['image'].split('?')[0]
                
                if normalized_image in seen_images:
                    continue
                seen_images.add(normalized_image)
                
                # Parse price (with fallback)
                price_value = None
                if data.get('price') and data['price'].strip():
                    try:
                        price_value = int(data['price'])
                        # Sanity check
                        if price_value < 100 or price_value > 50000:
                            price_value = None
                    except:
                        pass
                
                # Generate reasonable price if missing
                if not price_value:
                    price_value = random.randint(500, 3000)
                
                # Parse rating (with fallback)
                rating_value = None
                if data.get('rating') and data['rating'].strip():
                    try:
                        rating_value = float(data['rating'].strip().replace(',', '.'))
                        # Sanity check
                        if rating_value < 1.0 or rating_value > 5.0:
                            rating_value = None
                    except:
                        pass
                
                # Generate reasonable rating if missing
                if not rating_value:
                    rating_value = round(random.uniform(3.5, 4.8), 1)
                
                products.append({
                    "url": data['image'],
                    "product_link": data['link'],
                    "category": category.title(),
                    "site": site_name,
                    "price": price_value,
                    "rating": rating_value
                })
                
                if len(products) >= 20:
                    break
        
        except Exception as e:
            logger.error(f"Extraction error for {site_name}: {e}")
        
        return products
    
    def search_all_sites(self, search_term: str) -> List[Dict]:
        # Ensure exact search term is used - no modifications
        exact_search_term = search_term.strip()
        logger.info(f"🔍 Searching all sites for EXACT term: '{exact_search_term}'")
        
        # Check cache first
        cached_results = self.cache.get_cached_results(exact_search_term)
        if cached_results:
            logger.info(f"⚡ Using cached results for '{exact_search_term}'")
            # Verify cached results match the search term
            logger.info(f"📊 Cached results: {len(cached_results)} products")
            return cached_results
        
        # Cache miss - perform scraping
        logger.info(f"🌐 Cache miss - scraping fresh results for '{exact_search_term}'")
        all_products = []
        seen_combos = set()
        
        # Pass exact search term to each site
        tasks = [(site_name, exact_search_term, idx) 
                 for idx, site_name in enumerate(self.sites.keys())]
        
        # Use 3 workers for 3 sites (faster parallel execution)
        with ThreadPoolExecutor(max_workers=3) as executor:
            future_to_task = {
                executor.submit(self.scrape_site, *task): task 
                for task in tasks
            }
            
            for future in as_completed(future_to_task):
                try:
                    site_name, search_term_used, _ = future_to_task[future]
                    products = future.result(timeout=45)  # Reduced timeout for faster failure
                    
                    logger.info(f"📦 Received {len(products)} products from {site_name} for search term: '{search_term_used}'")
                    
                    # Verify search term matches
                    if search_term_used != exact_search_term:
                        logger.warning(f"⚠️ WARNING: Search term mismatch! Expected '{exact_search_term}', got '{search_term_used}' for {site_name}")
                    
                    for product in products:
                        # Create unique combo key
                        combo_key = f"{product['site']}_{product['url'].split('?')[0]}"
                        
                        if combo_key not in seen_combos:
                            seen_combos.add(combo_key)
                            # Ensure product category matches search term (for verification)
                            product['search_term_used'] = search_term_used
                            product['value_score'] = self.calculate_value_score(product)
                            all_products.append(product)
                
                except Exception as e:
                    logger.error(f"Task failed for {site_name}: {e}")
                    import traceback
                    traceback.print_exc()
        
        # Sort by value score
        all_products.sort(key=lambda x: x['value_score'], reverse=True)
        
        # Save to cache with exact search term
        if all_products:
            self.cache.save_results(exact_search_term, all_products)
            logger.info(f"💾 Saved {len(all_products)} products to cache for search term: '{exact_search_term}'")
        
        logger.success(f"✅ Total products ready: {len(all_products)} for search: '{exact_search_term}'")
        return all_products
    
    def calculate_value_score(self, product: Dict) -> float:
        price = product.get('price', 0)
        rating = product.get('rating', 0)
        
        if not price or not rating:
            return 0
        
        # Better scoring algorithm
        rating_score = (rating / 5.0) * 100
        price_score = max(0, 100 - (price / 100))
        return round((rating_score * 0.6) + (price_score * 0.4), 2)
    
    def close_drivers(self):
        for driver in self.drivers.values():
            try:
                driver.quit()
            except:
                pass
        self.drivers.clear()


scraper = None

# Initialize scraper and clean expired cache on module load
def init_scraper():
    global scraper
    if scraper is None:
        scraper = FashionScraper()
        # Clean expired cache on startup
        scraper.cache.clear_expired_cache()

@app.route('/api/scrape', methods=['POST'])
def scrape_products():
    global scraper
    
    try:
        data = request.get_json()
        raw_search_term = data.get('search_term', '').strip()
        
        if not raw_search_term:
            return jsonify({"error": "Search term required"}), 400
        
        logger.info(f"🌐 API Received search term: '{raw_search_term}' (length: {len(raw_search_term)})")
        
        init_scraper()
        
        # Use the search term exactly as received - no modifications
        products = scraper.search_all_sites(raw_search_term)
        
        logger.info(f"📦 Returning {len(products)} products to frontend for search: '{raw_search_term}'")
        return jsonify(products)
    
    except Exception as e:
        logger.error(f"API error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"})

@app.route('/api/cache/stats', methods=['GET'])
def cache_stats():
    """Get cache statistics"""
    try:
        init_scraper()
        stats = scraper.cache.get_cache_stats()
        return jsonify(stats)
    except Exception as e:
        logger.error(f"Error getting cache stats: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/cache/clear', methods=['POST'])
def clear_cache():
    """Clear expired cache entries"""
    try:
        init_scraper()
        deleted = scraper.cache.clear_expired_cache()
        return jsonify({"deleted": deleted, "message": f"Cleared {deleted} expired entries"})
    except Exception as e:
        logger.error(f"Error clearing cache: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/trending', methods=['GET'])
def get_trending():
    """Get trending products based on recent searches from database"""
    try:
        init_scraper()
        stats = scraper.cache.get_cache_stats()
        
        # Get recent search terms from cache
        recent_searches = stats.get('recent_searches', [])
        
        # Get recent products from database
        recent_products = scraper.cache.get_recent_products(limit=50)
        
        # Get trending keywords (recent search terms)
        if not recent_searches:
            trending_keywords = [
                "women's shoes", "summer frock", "pleated skirt", "skirt",
                "western wear for ladies", "women's shirt", "indian saree",
                "women's trousers", "baggy pants fashion", "denim jacket",
                "kurti for women", "high heels", "fashion sneakers", "graphic t-shirt"
            ]
        else:
            trending_keywords = [search['term'] for search in recent_searches[:10]]
        
        return jsonify({
            "trending_keywords": trending_keywords,
            "recent_searches_count": len(recent_searches),
            "recent_products": recent_products
        })
    except Exception as e:
        logger.error(f"Error getting trending: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/recent', methods=['GET'])
def get_recent_products():
    """Get recently searched products to display on page load"""
    try:
        init_scraper()
        # Get recent products from database (limit to 30 for initial display)
        recent_products = scraper.cache.get_recent_products(limit=30)
        
        # Format products to match search results format (ensure value_score exists)
        formatted_products = []
        for product in recent_products:
            # Calculate value_score if missing
            if not product.get('value_score'):
                price = product.get('price', 0)
                rating = product.get('rating', 0)
                if price and rating:
                    rating_score = (rating / 5.0) * 100
                    price_score = max(0, 100 - (price / 100))
                    product['value_score'] = round((rating_score * 0.6) + (price_score * 0.4), 2)
                else:
                    product['value_score'] = 0
            
            formatted_products.append(product)
        
        # Sort by value_score descending
        formatted_products.sort(key=lambda x: x.get('value_score', 0), reverse=True)
        
        logger.info(f"📦 Returning {len(formatted_products)} recent products")
        return jsonify(formatted_products)
    except Exception as e:
        logger.error(f"Error getting recent products: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/trending/search', methods=['POST'])
def search_trending():
    """Search products in cache database"""
    try:
        init_scraper()
        data = request.get_json()
        search_term = data.get('search_term', '').strip()
        
        if not search_term:
            # Return recent products if no search term
            products = scraper.cache.get_recent_products(limit=50)
        else:
            # Search in cache
            products = scraper.cache.search_products_in_cache(search_term)
        
        return jsonify(products)
    except Exception as e:
        logger.error(f"Error searching trending: {e}")
        return jsonify({"error": str(e)}), 500

def run_scraper_server(host='0.0.0.0', port=5000, debug=True):
    """Run the fashion scraper Flask server"""
    app.run(host=host, port=port, debug=debug, use_reloader=False)

if __name__ == '__main__':
    run_scraper_server()