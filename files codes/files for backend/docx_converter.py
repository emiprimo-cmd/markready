import mammoth
from markdownify import markdownify as md

def convert_docx(filepath: str) -> str:
    """Convert DOCX to markdown using mammoth."""
    with open(filepath, "rb") as f:
        result = mammoth.convert_to_html(f)
    # Convert HTML output to clean markdown
    markdown = md(result.value, heading_style="ATX")
    return markdown
