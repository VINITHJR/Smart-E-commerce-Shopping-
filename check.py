import os

print("Checking project structure...")
print()

required_files = {
    'app.py': 'Flask application',
    'requirements.txt': 'Dependencies',
    '.env': 'Environment variables',
    'templates/index.html': 'HTML template',
    'static/style.css': 'CSS styling',
    'static/script.js': 'JavaScript'
}

all_good = True

for file_path, description in required_files.items():
    if os.path.exists(file_path):
        print(f"✓ {file_path} - {description}")
    else:
        print(f"✗ MISSING: {file_path} - {description}")
        all_good = False

print()

if not all_good:
    print("ERROR: Some files are missing!")
    print("\nMake sure your folder structure looks like this:")
    print("""
dress-changer/
├── app.py
├── requirements.txt
├── .env
├── check_structure.py
├── templates/
│   └── index.html
├── static/
│   ├── style.css
│   └── script.js
└── outputs/ (will be auto-created)
    """)
else:
    print("✓ All files are in place!")
    print("\nNow check your .env file has your API key:")
    print("GEMINI_API_KEY=your_actual_key_here")