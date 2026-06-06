from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import tempfile
import os

from converters.pdf_converter import convert_pdf
from converters.docx_converter import convert_docx
from converters.pptx_converter import convert_pptx

# Magic bytes for file validation
MAGIC_BYTES = {
    ".pdf":  b"%PDF",
    ".docx": b"PK\x03\x04",
    ".pptx": b"PK\x03\x04",
}

def validate_file_signature(contents: bytes, ext: str) -> bool:
    expected = MAGIC_BYTES.get(ext)
    if not expected:
        return False
    return contents.startswith(expected)

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="MarkReady API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://emiprimo-cmd.github.io",
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

app.add_middleware(SecurityHeadersMiddleware)

SUPPORTED = {
    ".pdf":  convert_pdf,
    ".docx": convert_docx,
    ".pptx": convert_pptx,
}

@app.api_route("/", methods=["GET", "HEAD"])
def root():
    return {"status": "MarkReady API is running"}

@app.post("/convert")
@limiter.limit("10/minute")
async def convert(request: Request, file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower()

    if ext not in SUPPORTED:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {ext}")

    MAX_SIZE = 20 * 1024 * 1024
    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 20MB.")
    if not validate_file_signature(contents, ext):
        raise HTTPException(status_code=400, detail="File content does not match its extension. Please upload a valid file.")

    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        markdown = SUPPORTED[ext](tmp_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")
    finally:
        os.unlink(tmp_path)

    return {"filename": file.filename, "markdown": markdown}