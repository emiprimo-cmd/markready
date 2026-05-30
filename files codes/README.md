# MarkReady

**Convert your documents to AI-ready markdown — save tokens, get better answers.**

MarkReady converts PDF, Word (.docx), and PowerPoint (.pptx) files into clean markdown format, optimized for use with AI tools like ChatGPT, Claude, and others.

---

## Why markdown?

When you upload a PDF directly to an AI tool, it reads a lot of unnecessary formatting, headers, footers, and noise — consuming extra tokens and sometimes misreading the content. Markdown is a clean, lightweight format that AI tools read more efficiently, giving you better results at a lower cost.

---

## Features

- Drag & drop interface — no technical knowledge required
- Supports PDF, DOCX, and PPTX
- Preview the markdown output before downloading
- Single file → downloads as `.md`
- Multiple files → downloads as a `.zip`
- Files are never stored on any server

---

## Requirements

Before running MarkReady, make sure you have the following installed:

- [Python 3.10 or higher](https://www.python.org/downloads/)
- [VS Code](https://code.visualstudio.com/) with the **Live Server** extension (optional, for frontend preview)

---

## Installation

### 1. Download or clone this project

Download the project folder to your computer.

### 2. Install Python dependencies

Open a terminal, navigate to the `backend` folder, and run:

```
pip install -r requirements.txt
```

This installs all the necessary libraries automatically.

### 3. Start the backend server

From the `backend` folder, run:

```
python -m uvicorn main:app --reload
```

You should see:
```
INFO: Uvicorn running on http://127.0.0.1:8000
```

Keep this terminal open while using MarkReady.

### 4. Open the frontend

Open the `frontend/index.html` file in your browser. If you have VS Code with Live Server, right-click the file and select **Open with Live Server**.

---

## How to use

1. Drag and drop your files into the upload area (or click **browse**)
2. Click **Convert & Download**
3. Your markdown file(s) will download automatically

---

## Supported formats

| Format | Extension |
|--------|-----------|
| PDF | `.pdf` |
| Word | `.docx` |
| PowerPoint | `.pptx` |

> **Note:** The older Word format `.doc` is not supported. To convert a `.doc` file, open it in Word and save it as `.docx` (File → Save As → Word Document).

---

## Project structure

```
markready/
├── frontend/
│   ├── index.html      # Main interface
│   ├── style.css       # Styles
│   └── app.js          # Frontend logic
├── backend/
│   ├── main.py         # API server (FastAPI)
│   ├── requirements.txt
│   └── converters/
│       ├── pdf_converter.py
│       ├── docx_converter.py
│       └── pptx_converter.py
└── README.md
```

---

## Built by

**Emiliano D. Primo, PhD** — Microbiologist, protein biochemist, and science communicator.  
Founder of [Science, In Brief](https://emiprimo-cmd.github.io/science-in-brief/index.html) — peer-reviewed science, explained clearly.  
[LinkedIn](https://www.linkedin.com/in/emiliano-primo)

---

## License

Free to use for personal and research purposes.
