from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os

from converters.pdf_converter import convert_pdf
from converters.docx_converter import convert_docx
from converters.pptx_converter import convert_pptx

app = FastAPI(title="MarkReady API")

# Allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPPORTED = {
    ".pdf":  convert_pdf,
    ".docx": convert_docx,
    ".pptx": convert_pptx,
}

@app.get("/")
def root():
    return {"status": "MarkReady API is running"}

@app.post("/convert")
async def convert(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower()

    if ext not in SUPPORTED:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {ext}")

    # Save upload to a temp file
    contents = await file.read()
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        markdown = SUPPORTED[ext](tmp_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")
    finally:
        os.unlink(tmp_path)  # clean up temp file

    return {"filename": file.filename, "markdown": markdown}
