# 🎨 Fashion Scraper + Virtual Try-On Application

A modern web application that combines fashion product scraping with AI-powered virtual try-on capabilities. Search for fashion items across multiple e-commerce sites, view trending fashion based on your search history, and try on clothes virtually using AI image generation.

## ✨ Features

### 🔍 Fashion Scraper
- **Multi-site Search**: Search across Amazon Fashion, Flipkart, and Snapdeal
- **Smart Caching**: SQLite database caches search results for faster retrieval
- **Product Details**: Get product images, prices, ratings, and direct links
- **Value Scoring**: Products are ranked by value score (rating/price ratio)

### 🔥 Trending Fashion
- **Search History Based**: Shows trending fashion based on your recent searches
- **Unsplash Integration**: Fetches beautiful fashion images from Unsplash API
- **Multiple Categories**: View trending items from all your recent search terms
- **Interactive**: Click any trending image to use it for virtual try-on

### 👗 Virtual Try-On
- **AI-Powered**: Uses Google Gemini AI to generate realistic virtual try-on images
- **Easy Upload**: Upload your photo and select a fashion item
- **High Quality**: Generates photorealistic results with proper lighting and shadows
- **Download**: Save your virtual try-on results

## 🚀 Quick Start

### Prerequisites

1. **Python 3.8+** installed
2. **Chrome/Chromium** browser (required for Selenium web scraping)
3. **API Keys**:
   - Google Gemini API key (for virtual try-on)
   - Unsplash API key (for trending fashion images)

### Installation

1. **Clone or download the project**

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**:
   Create a `.env` file in the project root:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Update Unsplash API key** (optional):
   Edit `static/app.js` and update the `UNSPLASH_ACCESS_KEY` constant:
   ```javascript
   const UNSPLASH_ACCESS_KEY = "your_unsplash_key_here";
   ```

### Running the Application

#### Option 1: Single Command (Recommended) 🎯

Run both servers with one command:

```bash
python app.py
```

This will start:
- **Fashion Scraper Backend** on `http://localhost:5000`
- **Virtual Try-On Backend** on `http://localhost:5001`

Then open your browser and go to:
```
http://localhost:5001/integrated
```

#### Option 2: Separate Commands

If you prefer to run servers separately:

**Terminal 1** (Fashion Scraper):
```bash
python fashion_scraper/backend.py
```

**Terminal 2** (Virtual Try-On):
```bash
python virtual_try_on.py
```

Then open: `http://localhost:5001/integrated`

## 📁 Project Structure

```
PythonProject8/
├── app.py                      # Main launcher (runs both servers)
├── virtual_try_on.py           # Virtual try-on Flask server
├── fashion_scraper/
│   ├── backend.py              # Fashion scraper Flask server
│   └── db_cache.py             # SQLite database cache
├── templates/
│   ├── integrated.html         # Main integrated frontend
│   └── index.html              # Basic virtual try-on page
├── static/
│   ├── app.js                  # Main frontend JavaScript
│   ├── app.css                 # Main stylesheet
│   └── ...                     # Other static files
├── outputs/                    # Generated virtual try-on images
├── fashion_cache.db            # SQLite database (auto-created)
├── requirements.txt            # Python dependencies
└── README.md                   # This file
```

## 🎯 How to Use

### 1. Search for Fashion Items

1. Go to the **"🔍 Search Products"** tab
2. Enter a search term (e.g., "kurta", "summer dress", "jeans")
3. Click **"Search"** or press Enter
4. Browse results from multiple e-commerce sites
5. Click **"🛒 View Product"** to open the product page

### 2. View Trending Fashion

1. Go to the **"🔥 Trending Products"** tab
2. View trending fashion images based on your recent searches
3. Use the dropdown to filter by specific search terms
4. Use the search box to find trending items for any fashion term
5. Click any image to use it for virtual try-on

### 3. Virtual Try-On

1. Go to the **"👗 Virtual Try-On"** tab
2. **Upload your photo**: Click "Upload Your Photo" and select an image
3. **Select fashion item**: 
   - Choose from search results (click on product image)
   - Choose from trending fashion (click on trending image)
   - Or upload a custom fashion item image
4. Click **"Generate"** to create your virtual try-on
5. Wait for the AI to process (usually 10-30 seconds)
6. Download your result using the **"Download"** button

## 🔧 API Endpoints

### Fashion Scraper API (Port 5000)

- `GET /api/search?q=<search_term>` - Search for products
- `GET /api/trending` - Get trending keywords and recent products
- `POST /api/trending/search` - Search products in cache
- `GET /api/cache/stats` - Get cache statistics
- `POST /api/cache/clear` - Clear the cache

### Virtual Try-On API (Port 5001)

- `GET /` - Basic virtual try-on page
- `GET /integrated` - Main integrated application
- `POST /generate` - Generate virtual try-on image

## 💾 Database

The application uses SQLite to cache search results:

- **Database file**: `fashion_cache.db` (auto-created)
- **Cache expiry**: 24 hours
- **Tables**:
  - `searches`: Stores search terms and timestamps
  - `products`: Stores product details linked to searches

### Cache Benefits

- **Faster searches**: Previously searched terms return instantly
- **Search history**: All your searches are saved
- **Trending data**: Recent searches power the trending section

## 🛠️ Troubleshooting

### Port Already in Use

If port 5000 or 5001 is already in use:

1. **Find the process**:
   ```bash
   # Windows
   netstat -ano | findstr :5000
   
   # Linux/Mac
   lsof -i :5000
   ```

2. **Kill the process** or change ports in the respective files

### Chrome/Chromium Not Found

If you get Selenium errors:

1. Install Chrome or Chromium browser
2. The app uses `webdriver_manager` to auto-download ChromeDriver
3. Make sure Chrome is in your system PATH

### API Key Errors

- **Gemini API**: Make sure `GEMINI_API_KEY` is set in `.env` file
- **Unsplash API**: Update the key in `static/app.js` if needed

### CSS/JS Not Loading

- Make sure you're accessing through Flask (`http://localhost:5001/integrated`)
- Don't open HTML files directly in the browser
- Check browser console for errors

### Database Issues

If the database gets corrupted:

1. Delete `fashion_cache.db`
2. Restart the application (it will create a new database)

## 📝 Environment Variables

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

## 🎨 Technologies Used

- **Backend**: Flask (Python)
- **Frontend**: HTML, CSS, JavaScript
- **Web Scraping**: Selenium, BeautifulSoup
- **AI**: Google Gemini API
- **Database**: SQLite
- **Image API**: Unsplash API
- **Styling**: Modern CSS with gradients and animations

## 📄 License

This project is for educational purposes.

## 🤝 Contributing

Feel free to submit issues, fork the repository, and create pull requests.

## 📧 Support

For issues or questions, please check the troubleshooting section or create an issue in the repository.

---

**Enjoy exploring fashion and trying on clothes virtually!** 👗✨

