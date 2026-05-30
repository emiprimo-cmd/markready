import pymupdf4llm

def convert_pdf(filepath: str) -> str:
    """Convert PDF to markdown optimized for LLMs using pymupdf4llm."""
    markdown = pymupdf4llm.to_markdown(filepath)
    return markdown
