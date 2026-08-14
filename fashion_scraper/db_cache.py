import sqlite3
import json
import os
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from loguru import logger

# Cache expiration time (24 hours)
CACHE_EXPIRY_HOURS = 24


class SearchCache:
    """SQLite-based cache for fashion search results"""
    
    def __init__(self, db_path: str = "fashion_cache.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize the database and create tables if they don't exist"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create searches table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS searches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                search_term TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create products table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                search_id INTEGER NOT NULL,
                url TEXT NOT NULL,
                product_link TEXT,
                category TEXT,
                site TEXT,
                price REAL,
                rating REAL,
                value_score REAL,
                FOREIGN KEY (search_id) REFERENCES searches(id) ON DELETE CASCADE
            )
        """)
        
        # Create index for faster lookups
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_search_term ON searches(search_term)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_search_id ON products(search_id)
        """)
        
        conn.commit()
        conn.close()
        logger.info(f"✅ Database initialized at {self.db_path}")
    
    def get_cached_results(self, search_term: str) -> Optional[List[Dict]]:
        """
        Retrieve cached results for a search term if they exist and are not expired.
        Returns None if no cache exists or cache is expired.
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Normalize search term (lowercase, strip)
        normalized_term = search_term.lower().strip()
        
        # Check if search exists and is not expired (get most recent one)
        cursor.execute("""
            SELECT id, created_at 
            FROM searches 
            WHERE LOWER(TRIM(search_term)) = ?
            ORDER BY created_at DESC
            LIMIT 1
        """, (normalized_term,))
        
        result = cursor.fetchone()
        
        if not result:
            conn.close()
            return None
        
        search_id, created_at_str = result
        
        # Check if cache is expired
        created_at = datetime.fromisoformat(created_at_str)
        expiry_time = created_at + timedelta(hours=CACHE_EXPIRY_HOURS)
        
        if datetime.now() > expiry_time:
            logger.info(f"⏰ Cache expired for '{search_term}', will re-scrape")
            # Delete expired cache
            cursor.execute("DELETE FROM searches WHERE id = ?", (search_id,))
            conn.commit()
            conn.close()
            return None
        
        # Retrieve products for this search
        cursor.execute("""
            SELECT url, product_link, category, site, price, rating, value_score
            FROM products
            WHERE search_id = ?
            ORDER BY value_score DESC
        """, (search_id,))
        
        products = []
        for row in cursor.fetchall():
            products.append({
                "url": row[0],
                "product_link": row[1],
                "category": row[2],
                "site": row[3],
                "price": row[4],
                "rating": row[5],
                "value_score": row[6]
            })
        
        conn.close()
        
        if products:
            logger.info(f"💾 Cache hit for '{search_term}': {len(products)} products")
            return products
        
        return None
    
    def save_results(self, search_term: str, products: List[Dict]):
        """
        Save search results to the database cache.
        Always creates a new search entry to preserve search history.
        """
        if not products:
            return
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Always insert new search to preserve history
            cursor.execute("""
                INSERT INTO searches (search_term) 
                VALUES (?)
            """, (search_term,))
            search_id = cursor.lastrowid
            
            # Insert products
            for product in products:
                cursor.execute("""
                    INSERT INTO products 
                    (search_id, url, product_link, category, site, price, rating, value_score)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    search_id,
                    product.get('url', ''),
                    product.get('product_link', ''),
                    product.get('category', ''),
                    product.get('site', ''),
                    product.get('price'),
                    product.get('rating'),
                    product.get('value_score', 0)
                ))
            
            conn.commit()
            logger.info(f"💾 Cached {len(products)} products for '{search_term}'")
            
        except Exception as e:
            logger.error(f"❌ Error saving cache: {e}")
            conn.rollback()
        finally:
            conn.close()
    
    def clear_expired_cache(self):
        """Remove all expired cache entries"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        expiry_time = datetime.now() - timedelta(hours=CACHE_EXPIRY_HOURS)
        
        cursor.execute("""
            DELETE FROM searches 
            WHERE created_at < ?
        """, (expiry_time.isoformat(),))
        
        deleted_count = cursor.rowcount
        conn.commit()
        conn.close()
        
        if deleted_count > 0:
            logger.info(f"🧹 Cleaned up {deleted_count} expired cache entries")
        
        return deleted_count
    
    def get_cache_stats(self) -> Dict:
        """Get statistics about the cache"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM searches")
        total_searches = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM products")
        total_products = cursor.fetchone()[0]
        
        # Get all unique search terms from recent searches (last 20 searches)
        cursor.execute("""
            SELECT DISTINCT search_term, MAX(created_at) as last_searched
            FROM searches
            GROUP BY search_term
            ORDER BY last_searched DESC
            LIMIT 20
        """)
        
        recent_searches = [
            {"term": row[0], "product_count": 0}  # We'll update product_count separately
            for row in cursor.fetchall()
        ]
        
        # Get product counts for each search term
        for search in recent_searches:
            cursor.execute("""
                SELECT COUNT(*) 
                FROM products p
                JOIN searches s ON p.search_id = s.id
                WHERE s.search_term = ?
            """, (search['term'],))
            search['product_count'] = cursor.fetchone()[0]
        
        conn.close()
        
        return {
            "total_searches": total_searches,
            "total_products": total_products,
            "recent_searches": recent_searches
        }
    
    def get_recent_products(self, limit: int = 50) -> List[Dict]:
        """Get products from recent searches"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get products from most recent searches
        cursor.execute("""
            SELECT 
                p.url, p.product_link, p.category, p.site, p.price, p.rating, p.value_score,
                s.search_term, s.created_at
            FROM products p
            JOIN searches s ON p.search_id = s.id
            ORDER BY s.created_at DESC, p.value_score DESC
            LIMIT ?
        """, (limit,))
        
        products = []
        for row in cursor.fetchall():
            products.append({
                "url": row[0],
                "product_link": row[1],
                "category": row[2],
                "site": row[3],
                "price": row[4],
                "rating": row[5],
                "value_score": row[6],
                "search_term": row[7],
                "created_at": row[8]
            })
        
        conn.close()
        return products
    
    def search_products_in_cache(self, search_term: str) -> List[Dict]:
        """Search for products in cache by category or search term"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        normalized_term = f"%{search_term.lower().strip()}%"
        
        cursor.execute("""
            SELECT 
                p.url, p.product_link, p.category, p.site, p.price, p.rating, p.value_score,
                s.search_term, s.created_at
            FROM products p
            JOIN searches s ON p.search_id = s.id
            WHERE LOWER(p.category) LIKE ? OR LOWER(s.search_term) LIKE ?
            ORDER BY s.created_at DESC, p.value_score DESC
            LIMIT 50
        """, (normalized_term, normalized_term))
        
        products = []
        for row in cursor.fetchall():
            products.append({
                "url": row[0],
                "product_link": row[1],
                "category": row[2],
                "site": row[3],
                "price": row[4],
                "rating": row[5],
                "value_score": row[6],
                "search_term": row[7],
                "created_at": row[8]
            })
        
        conn.close()
        return products

