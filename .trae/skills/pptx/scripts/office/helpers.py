"""Shared helpers for Office Open XML (OOXML) package manipulation."""
import os
import posixpath
import zipfile
from pathlib import Path

SLIDE_REL_TYPE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide"

OOXML_FAMILY = {
    ".docx": "docx",
    ".dotx": "docx",
    ".pptx": "pptx",
    ".potx": "pptx",
    ".xlsx": "xlsx",
    ".xlsm": "xlsx",
    ".xltx": "xlsx",
    ".xltm": "xlsx",
}


def opc_target(target: str, source_part: str, target_mode: str = "") -> str | None:
    """Resolve an OPC relationship target to an absolute part name.

    Args:
        target: The Target attribute from a Relationship element.
        source_part: The absolute part name of the source file
                     (e.g., "ppt/presentation.xml").
        target_mode: The TargetMode attribute ("External" or empty).

    Returns:
        The resolved absolute part name, or None if the target is external.
    """
    if target_mode == "External":
        return None
    source_dir = posixpath.dirname(source_part)
    resolved = posixpath.normpath(posixpath.join(source_dir, target))
    return resolved if not resolved.startswith("..") and not resolved.startswith("/") else None


def rels_source_part(rels_path: Path, unpacked_dir: Path) -> str:
    """Get the source part name for a .rels file.

    Args:
        rels_path: Path to the .rels file.
        unpacked_dir: Root directory of the unpacked package.

    Returns:
        The absolute part name of the source file.
    """
    rel_path = rels_path.relative_to(unpacked_dir)
    rel_str = rel_path.as_posix()
    # e.g., "ppt/slides/_rels/slide1.xml.rels" -> "ppt/slides/slide1.xml"
    if "/_rels/" in rel_str:
        dir_part, file_part = rel_str.rsplit("/_rels/", 1)
        if file_part.endswith(".rels"):
            return f"{dir_part}/{file_part[:-5]}"
    # e.g., "ppt/_rels/presentation.xml.rels" -> "ppt/presentation.xml"
    if rel_str.endswith(".rels"):
        # Handle _rels at the same level
        parts = rel_str.rsplit("/_rels/", 1)
        if len(parts) == 2:
            return f"{parts[0]}/{parts[1][:-5]}"
    return rel_str


def rezip(unpacked_dir: Path, output_path: Path) -> None:
    """Re-zip an unpacked OOXML directory into a package file.

    Args:
        unpacked_dir: Directory containing the unpacked OOXML package.
        output_path: Path to write the output .zip file.
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)
    if output_path.exists():
        output_path.unlink()
    with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(str(unpacked_dir)):
            for file in files:
                file_path = Path(root) / file
                arcname = file_path.relative_to(unpacked_dir).as_posix()
                zf.write(str(file_path), arcname)


def safe_extract(zf: zipfile.ZipFile, output_dir: Path) -> None:
    """Safely extract a zip file, preventing path traversal attacks.

    Args:
        zf: A zipfile.ZipFile instance.
        output_dir: Directory to extract to.
    """
    output_dir = output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    for member in zf.infolist():
        member_path = (output_dir / member.filename).resolve()
        if not str(member_path).startswith(str(output_dir)):
            raise ValueError(f"Path traversal detected: {member.filename}")
        if member.is_dir():
            member_path.mkdir(parents=True, exist_ok=True)
        else:
            member_path.parent.mkdir(parents=True, exist_ok=True)
            with zf.open(member) as source, open(member_path, "wb") as target:
                target.write(source.read())