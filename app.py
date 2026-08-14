"""
Main application launcher that runs both backend servers:
- Fashion Scraper Backend (Port 5000)
- Virtual Try-On Backend (Port 5001)
"""
import threading
import time
import sys
import os

# Add fashion_scraper to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def run_fashion_scraper_backend():
    """Run the fashion scraper backend on port 5000"""
    try:
        # Import and run the fashion scraper backend
        from fashion_scraper.backend import run_scraper_server
        print("=" * 60)
        print("🚀 Starting Fashion Scraper Backend...")
        print("📍 Running on: http://localhost:5000")
        print("=" * 60)
        run_scraper_server(host='0.0.0.0', port=5000, debug=False)
    except Exception as e:
        print(f"❌ Error starting Fashion Scraper Backend: {e}")
        import traceback
        traceback.print_exc()

def run_virtual_try_on_backend():
    """Run the virtual try-on backend on port 5001"""
    try:
        # Import and run the virtual try-on backend
        from virtual_try_on import run_virtual_try_on_server
        print("=" * 60)
        print("🚀 Starting Virtual Try-On Backend...")
        print("📍 Running on: http://localhost:5001")
        print("📍 Integrated Page: http://localhost:5001/integrated")
        print("=" * 60)
        run_virtual_try_on_server(port=5001, debug=False)
    except Exception as e:
        print(f"❌ Error starting Virtual Try-On Backend: {e}")
        import traceback
        traceback.print_exc()

def main():
    """Main function to start both servers"""
    print("\n" + "=" * 60)
    print("🎨 Fashion Scraper + Virtual Try-On Application")
    print("=" * 60)
    print("\nStarting both backend servers...\n")
    
    # Start Fashion Scraper Backend in a separate thread
    scraper_thread = threading.Thread(
        target=run_fashion_scraper_backend,
        daemon=True,
        name="FashionScraperBackend"
    )
    scraper_thread.start()
    
    # Give the scraper backend a moment to start
    time.sleep(2)
    
    # Start Virtual Try-On Backend in a separate thread
    tryon_thread = threading.Thread(
        target=run_virtual_try_on_backend,
        daemon=True,
        name="VirtualTryOnBackend"
    )
    tryon_thread.start()
    
    # Give the try-on backend a moment to start
    time.sleep(2)
    
    print("\n" + "=" * 60)
    print("✅ Both servers are running!")
    print("=" * 60)
    print("\n📍 Access Points:")
    print("   • Main Application: http://localhost:5001/integrated")
    print("   • Fashion Scraper API: http://localhost:5000")
    print("   • Virtual Try-On API: http://localhost:5001")
    print("\n" + "=" * 60)
    print("Press Ctrl+C to stop both servers")
    print("=" * 60 + "\n")
    
    # Keep the main thread alive
    try:
        while True:
            time.sleep(1)
            # Check if threads are still alive
            if not scraper_thread.is_alive():
                print("⚠️  Fashion Scraper Backend thread stopped!")
            if not tryon_thread.is_alive():
                print("⚠️  Virtual Try-On Backend thread stopped!")
    except KeyboardInterrupt:
        print("\n\n" + "=" * 60)
        print("🛑 Shutting down servers...")
        print("=" * 60)
        sys.exit(0)

if __name__ == '__main__':
    main()
