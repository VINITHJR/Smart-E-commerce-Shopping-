# 🚀 How to Run the Fashion Scraper + Virtual Try-On App

## 📋 Prerequisites
Make sure you have all dependencies installed:
```bash
pip install -r requirements.txt
```

## 🎯 You Need to Run 2 Backend Servers:

### 1️⃣ **Fashion Scraper Backend** (Port 5000)
This handles the product scraping from fashion sites.

**Run this command:**
```bash
python fashion_scraper/backend.py
```

Or:
```bash
cd fashion_scraper
python backend.py
```

**Expected output:**
```
✅ Database initialized at fashion_cache.db
 * Running on http://0.0.0.0:5000
```

---

### 2️⃣ **Virtual Try-On Backend** (Port 5001)
This handles the AI image generation and serves the frontend.

**Run this command:**
```bash
python app.py
```

**Expected output:**
```
 * Running on http://127.0.0.1:5001
```

---

## 🌐 Access the Application

Once both servers are running, open your browser and go to:

### **Main Application (Integrated Page):**
```
http://localhost:5001/integrated
```

### **Alternative Pages:**
- Basic Virtual Try-On: `http://localhost:5001/`
- Fashion Scraper Only: Open `static/fashion-scraper.html` directly in browser

---

## ⚡ Quick Start (Windows)

Open **2 separate terminal windows**:

**Terminal 1:**
```bash
python fashion_scraper/backend.py
```

**Terminal 2:**
```bash
python app.py
```

Then open: `http://localhost:5001/integrated`

---

## 🔍 Troubleshooting

- **Port 5000 already in use?** → Stop other services or change port in `fashion_scraper/backend.py`
- **Port 5001 already in use?** → Stop other services or change port in `app.py`
- **CSS/JS not loading?** → Make sure you're accessing through Flask (`http://localhost:5001/integrated`) not opening HTML directly
- **Scraping not working?** → Make sure Chrome/Chromium is installed (Selenium requirement)

---

## 📝 Environment Variables

Make sure you have a `.env` file with:
```
GEMINI_API_KEY=your_api_key_here
```

This is required for the virtual try-on feature.

