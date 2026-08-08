"""Validators for Office Open XML (OOXML) documents."""
import posixpath
import re
import zipfile
from pathlib import Path
from typing import Optional

import defusedxml.ElementTree as ET
from defusedxml.common import DefusedXmlException


class DOCXSchemaValidator:
    """Validates DOCX XML files against OOXML schema constraints."""

    WORD_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
    RELS_NS = "http://schemas.openxmlformats.org/package/2006/relationships"

    def __init__(
        self,
        unpacked_dir: Path,
        original_file: Optional[Path] = None,
        verbose: bool = False,
    ):
        self.unpacked_dir = unpacked_dir
        self.original_file = original_file
        self.verbose = verbose
        self.errors: list[str] = []

    def repair(self) -> int:
        """Auto-repair common issues. Returns number of repairs made."""
        repairs = 0
        # Repair paraId/durableId values in document.xml
        doc_path = self.unpacked_dir / "word" / "document.xml"
        if doc_path.exists():
            try:
                content = doc_path.read_text(encoding="utf-8")
                # Fix hex paraId values that exceed 32-bit signed range
                def _fix_hex_id(match):
                    val = int(match.group(1), 16)
                    if val > 0x7FFFFFFF:
                        val = val & 0x7FFFFFFF
                        return match.group(0).replace(match.group(1), f"{val:08X}")
                    return match.group(0)
                new_content, count = re.subn(
                    r'w:paraId="([0-9A-Fa-f]{8})"', _fix_hex_id, content
                )
                if count:
                    doc_path.write_text(new_content, encoding="utf-8")
                    repairs += count
                # Fix durableId
                new_content2, count2 = re.subn(
                    r'w:durableId="([0-9A-Fa-f]{8})"', _fix_hex_id, new_content
                )
                if count2:
                    doc_path.write_text(new_content2, encoding="utf-8")
                    repairs += count2
            except Exception:
                pass
        # Fix missing xml:space="preserve" on w:t elements
        if doc_path.exists():
            try:
                content = doc_path.read_text(encoding="utf-8")
                # Add xml:space="preserve" to w:t elements that have leading/trailing whitespace
                pattern = re.compile(
                    r'(<w:t[^>]*?)(>)(\s+[^<]*?|[^<]*?\s+)(</w:t>)',
                    re.DOTALL,
                )
                def _add_space_preserve(m):
                    tag = m.group(1)
                    if 'xml:space' not in tag:
                        return f'{tag} xml:space="preserve"{m.group(2)}{m.group(3)}{m.group(4)}'
                    return m.group(0)
                new_content, count = pattern.subn(_add_space_preserve, content)
                if count:
                    doc_path.write_text(new_content, encoding="utf-8")
                    repairs += count
            except Exception:
                pass
        return repairs

    def validate(self) -> bool:
        """Validate the document. Returns True if all checks pass."""
        self.errors = []
        doc_path = self.unpacked_dir / "word" / "document.xml"
        if not doc_path.exists():
            if self.verbose:
                print("Note: word/document.xml not found; skipping DOCX checks")
            return True
        try:
            tree = ET.parse(doc_path)
            root = tree.getroot()
        except (ET.ParseError, DefusedXmlException) as e:
            self._err(f"XML parse error in document.xml: {e}")
            return False
        # Check content types
        ct_path = self.unpacked_dir / "[Content_Types].xml"
        if ct_path.exists():
            try:
                ct_tree = ET.parse(ct_path)
                ct_root = ct_tree.getroot()
                overrides = {
                    o.get("{http://schemas.openxmlformats.org/package/2006/content-types}PartName", "")
                    for o in ct_root
                }
            except Exception:
                overrides = set()
        else:
            overrides = set()
        # Check relationships
        rels_path = self.unpacked_dir / "word" / "_rels" / "document.xml.rels"
        if rels_path.exists():
            try:
                rels_tree = ET.parse(rels_path)
                rels_root = rels_tree.getroot()
                for rel in rels_root:
                    target = rel.get("Target", "")
                    rel_type = rel.get(
                        "{http://schemas.openxmlformats.org/package/2006/relationships}Type",
                        rel.get("Type", ""),
                    )
                    if target and not target.startswith("http"):
                        # Check target exists
                        target_path = self.unpacked_dir / "word" / target
                        if not target_path.exists():
                            self._err(f"Missing target: word/{target} (type: {rel_type})")
            except Exception:
                pass
        if self.errors:
            for err in self.errors:
                print(f"  DOCX: {err}")
            return False
        if self.verbose:
            print("  DOCX: All checks passed")
        return True

    def _err(self, msg: str) -> None:
        self.errors.append(msg)


class PPTXSchemaValidator:
    """Validates PPTX XML files against OOXML schema constraints."""

    SLIDE_NS = "http://schemas.openxmlformats.org/presentationml/2006/main"
    DRAWING_NS = "http://schemas.openxmlformats.org/drawingml/2006/main"
    RELS_NS = "http://schemas.openxmlformats.org/package/2006/relationships"

    def __init__(
        self,
        unpacked_dir: Path,
        original_file: Optional[Path] = None,
        verbose: bool = False,
    ):
        self.unpacked_dir = unpacked_dir
        self.original_file = original_file
        self.verbose = verbose
        self.errors: list[str] = []

    def repair(self) -> int:
        """Auto-repair common issues. Returns number of repairs made."""
        return 0  # No auto-repairs for PPTX yet

    def validate(self) -> bool:
        """Validate the presentation. Returns True if all checks pass."""
        self.errors = []
        pres_path = self.unpacked_dir / "ppt" / "presentation.xml"
        if not pres_path.exists():
            if self.verbose:
                print("Note: ppt/presentation.xml not found; skipping PPTX checks")
            return True
        try:
            tree = ET.parse(pres_path)
            root = tree.getroot()
        except (ET.ParseError, DefusedXmlException) as e:
            self._err(f"XML parse error in presentation.xml: {e}")
            return False
        # Check sldIdLst references
        ns = {
            "p": self.SLIDE_NS,
            "r": self.RELS_NS,
        }
        sld_id_lst = root.find(".//p:sldIdLst", ns)
        if sld_id_lst is not None:
            sld_ids = sld_id_lst.findall("p:sldId", ns)
            # Read presentation.xml.rels to verify rIds
            rels_path = self.unpacked_dir / "ppt" / "_rels" / "presentation.xml.rels"
            valid_rids = set()
            if rels_path.exists():
                try:
                    rels_tree = ET.parse(rels_path)
                    for rel in rels_tree.getroot():
                        rid = rel.get("Id", "")
                        if rid:
                            valid_rids.add(rid)
                except Exception:
                    pass
            for sld_id in sld_ids:
                rid = sld_id.get(
                    "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id",
                    sld_id.get("r:id", ""),
                )
                if rid and rid not in valid_rids:
                    self._err(f"Slide {sld_id.get('id', '?')} references unknown rId: {rid}")
        # Check slide files exist
        slides_dir = self.unpacked_dir / "ppt" / "slides"
        if slides_dir.exists():
            for slide_file in slides_dir.glob("slide*.xml"):
                try:
                    ET.parse(slide_file)
                except (ET.ParseError, DefusedXmlException) as e:
                    self._err(f"XML parse error in {slide_file.name}: {e}")
        # Check content types
        ct_path = self.unpacked_dir / "[Content_Types].xml"
        if ct_path.exists():
            try:
                ct_tree = ET.parse(ct_path)
                ct_root = ct_tree.getroot()
                ct_ns = "http://schemas.openxmlformats.org/package/2006/content-types"
                overrides = {}
                for elem in ct_root:
                    if elem.tag == f"{{{ct_ns}}}Override":
                        part = elem.get("PartName", "").lstrip("/")
                        ct = elem.get("ContentType", "")
                        overrides[part] = ct
                # Check slide content types
                if slides_dir.exists():
                    for slide_file in slides_dir.glob("slide*.xml"):
                        part = f"ppt/slides/{slide_file.name}"
                        if part not in overrides:
                            if self.verbose:
                                print(f"  Note: {part} missing from [Content_Types].xml")
            except Exception:
                pass
        if self.errors:
            for err in self.errors:
                print(f"  PPTX: {err}")
            return False
        if self.verbose:
            print("  PPTX: All checks passed")
        return True

    def _err(self, msg: str) -> None:
        self.errors.append(msg)


class RedliningValidator:
    """Validates tracked changes (redlining) in DOCX documents."""

    WORD_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"

    def __init__(
        self,
        unpacked_dir: Path,
        original_file: Path,
        verbose: bool = False,
    ):
        self.unpacked_dir = unpacked_dir
        self.original_file = original_file
        self.verbose = verbose
        self.errors: list[str] = []

    def repair(self) -> int:
        """No auto-repairs for redlining."""
        return 0

    def validate(self) -> bool:
        """Check that all content changes are tracked with <w:ins>/<w:del>."""
        self.errors = []
        doc_path = self.unpacked_dir / "word" / "document.xml"
        if not doc_path.exists():
            if self.verbose:
                print("Note: word/document.xml not found; skipping redlining check")
            return True
        if not self.original_file or not self.original_file.exists():
            self._err("Original file not available for redlining comparison")
            return False
        try:
            current_tree = ET.parse(doc_path)
            current_root = current_tree.getroot()
        except (ET.ParseError, DefusedXmlException) as e:
            self._err(f"Cannot parse current document: {e}")
            return False
        # Extract text from current document
        current_text = self._extract_text(current_root)
        # Extract text from original document
        try:
            with zipfile.ZipFile(self.original_file) as zf:
                if "word/document.xml" not in zf.namelist():
                    self._err("Original file has no word/document.xml")
                    return False
                orig_xml = zf.read("word/document.xml")
                orig_root = ET.fromstring(orig_xml)
                orig_text = self._extract_text(orig_root)
        except Exception as e:
            self._err(f"Cannot read original document: {e}")
            return False
        # Check for tracked changes
        tracked = {f"{{{self.WORD_NS}}}ins", f"{{{self.WORD_NS}}}del"}
        has_tracked = any(elem.tag in tracked for elem in current_root.iter())
        if not has_tracked and current_text != orig_text:
            self._err(
                "Content differs from original but no tracked changes (<w:ins>/<w:del>) found. "
                "All changes must be tracked."
            )
        if self.errors:
            for err in self.errors:
                print(f"  Redlining: {err}")
            return False
        if self.verbose:
            print("  Redlining: All checks passed")
        return True

    def _extract_text(self, root) -> str:
        """Extract text content from a DOCX XML root element."""
        text_parts = []
        t_tag = f"{{{self.WORD_NS}}}t"
        for elem in root.iter(t_tag):
            if elem.text:
                text_parts.append(elem.text)
        return "".join(text_parts)

    def _err(self, msg: str) -> None:
        self.errors.append(msg)