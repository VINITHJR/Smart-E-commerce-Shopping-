#!/bin/bash

echo "========================================"
echo "Starting Fashion Scraper + Virtual Try-On"
echo "========================================"
echo ""
echo "Starting Fashion Scraper Backend (Port 5000)..."
gnome-terminal -- bash -c "python fashion_scraper/backend.py; exec bash" &
sleep 2
echo ""
echo "Starting Virtual Try-On Backend (Port 5001)..."
gnome-terminal -- bash -c "python app.py; exec bash" &
sleep 3
echo ""
echo "========================================"
echo "Both servers are starting!"
echo ""
echo "Open your browser and go to:"
echo "http://localhost:5001/integrated"
echo "========================================"

