#!/usr/bin/env python3
"""Collect URLs visible in a Google site: search for morrishk.net.

Read-only: fetches Google result pages, parses links, then performs plain GET
checks against each collected URL.  Writes nothing outside --output-dir.

Deliberately stdlib-only (urllib + html.parser) so it runs on any Python 3.9+
without installing packages.
"""

from __future__ import annotations

import argparse
import csv
import gzip
import html as html_lib
import json
import re
import socket
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import zlib
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable, Iterator

QUERY = "site:https://www.morrishk.net/"
SEARCH_BASE = "https://www.google.com.hk/search"
DEFAULT_QUERY_URL = SEARCH_BASE + "?q=site%3Ahttps%3A%2F%2Fwww.morrishk.net%2F&newwindow=1"
ALLOWED_HOSTS = ("www.morrishk.net", "morrishk.net")
DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)
CSV_COLUMNS = [
    "url",
    "title",
    "snippet",
    "page_number",
    "http_status",
    "final_url",
    "canonical_url",
    "robots_meta",
    "content_type",
    "check_status",
]
PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT_DIR = PROJECT_ROOT / "reports" / "seo" / "google-indexed-urls"

VOID_TAGS = {
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
    "meta", "param", "source", "track", "wbr",
}
SKIP_TEXT_TAGS = {"script", "style", "noscript", "template"}
SNIPPET_CLASS_TOKENS = {
    "vwic3b", "acopre", "iszzvec", "iszzvec", "lyandd", "st", "s", "kb0abc",
}
AD_CLASS_TOKENS = {
    "ueierd", "commercial-unit-desktop-top", "ads-ad", "cu-container", "mnr-c",
}
AD_IDS = {"tads", "bottomads", "tadsb"}
NO_RESULTS_MARKERS = (
    "did not match any documents",
    "no results found",
    "找不到和您查询的",
    "没有找到和您查询",
)
CONSENT_MARKERS = ("before you continue to google", "consent.google.com")
CAPTCHA_MARKERS = (
    "/sorry/index",
    "unusual traffic",
    "recaptcha/api",
    "g-recaptcha",
    "captcha-form",
)
JS_REQUIRED_MARKERS = ("httpservice/retry/enablejs", "please click")
GOOGLE_HOST_RE = re.compile(r"(?:[a-z0-9-]+\.)*google\.[a-z.]+$")
WHITESPACE_RE = re.compile(r"\s+")
TITLE_LIMIT = 300
SNIPPET_LIMIT = 600


class StructureChangedError(RuntimeError):
    """Fetched a page that yields no results and no 'no results' marker."""


class CaptchaError(RuntimeError):
    """Google served a CAPTCHA / sorry page."""


class ConsentError(RuntimeError):
    """Google served a consent interstitial."""


class JavascriptRequiredError(RuntimeError):
    """Google served the 'enable JavaScript' shell instead of results."""


# --------------------------------------------------------------------------
# Minimal tolerant DOM
# --------------------------------------------------------------------------


class Node:
    __slots__ = ("tag", "attrs", "children", "parent")

    def __init__(self, tag: str, attrs: dict[str, str], parent: "Node | None" = None):
        self.tag = tag
        self.attrs = attrs
        self.children: list["Node | str"] = []
        self.parent = parent

    def iter_nodes(self) -> Iterator["Node"]:
        stack = [self]
        while stack:
            node = stack.pop()
            yield node
            for child in reversed(node.children):
                if isinstance(child, Node):
                    stack.append(child)

    def ancestors(self) -> Iterator["Node"]:
        node = self.parent
        while node is not None:
            yield node
            node = node.parent

    def class_tokens(self) -> set[str]:
        return set(self.attrs.get("class", "").lower().split())


class _DomBuilder(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.root = Node("#document", {})
        self.stack: list[Node] = [self.root]

    def handle_starttag(self, tag, attrs):
        node = Node(tag.lower(), {k.lower(): (v or "") for k, v in attrs}, self.stack[-1])
        self.stack[-1].children.append(node)
        if node.tag not in VOID_TAGS:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        node = Node(tag.lower(), {k.lower(): (v or "") for k, v in attrs}, self.stack[-1])
        self.stack[-1].children.append(node)

    def handle_endtag(self, tag):
        tag = tag.lower()
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == tag:
                del self.stack[index:]
                return

    def handle_data(self, data):
        if data:
            self.stack[-1].children.append(data)


def parse_html(text: str) -> Node:
    builder = _DomBuilder()
    builder.feed(text)
    builder.close()
    return builder.root


def node_text(node: Node | str, exclude: Node | None = None) -> str:
    if isinstance(node, str):
        return node
    if node is exclude:
        return ""
    parts: list[str] = []
    stack: list[Node | str] = [node]
    while stack:
        item = stack.pop()
        if isinstance(item, str):
            parts.append(item)
            continue
        if item is exclude or item.tag in SKIP_TEXT_TAGS:
            continue
        stack.extend(reversed(item.children))
    return WHITESPACE_RE.sub(" ", "".join(parts)).strip()


def first_descendant(root: Node, tag: str) -> Node | None:
    for node in root.iter_nodes():
        if node.tag == tag and node is not root:
            return node
    return None


def has_class_token(node: Node, tokens: set[str]) -> bool:
    return bool(node.class_tokens() & tokens)


# --------------------------------------------------------------------------
# URL handling
# --------------------------------------------------------------------------


def is_google_host(host: str) -> bool:
    host = (host or "").lower().rstrip(".")
    return bool(GOOGLE_HOST_RE.fullmatch(host))


def unwrap_google_href(href: str, base_url: str) -> str | None:
    """Return the target URL behind a Google redirect, or None if not a result."""
    if not href:
        return None
    href = html_lib.unescape(href.strip())
    lowered = href.lower()
    if not href or href.startswith("#") or lowered.startswith(("javascript:", "mailto:", "tel:", "data:")):
        return None
    absolute = urllib.parse.urljoin(base_url, href)
    parts = urllib.parse.urlsplit(absolute)
    if is_google_host(parts.hostname or ""):
        if parts.path.rstrip("/") == "/url":
            params = urllib.parse.parse_qs(parts.query)
            target = (params.get("q") or params.get("url") or [""])[0]
            if not target:
                return None
            target = html_lib.unescape(target)
            if target.startswith("//"):
                target = "https:" + target
            elif not target.startswith(("http://", "https://")):
                return None
            if is_google_host(urllib.parse.urlsplit(target).hostname or ""):
                return None
            return target
        return None
    if parts.scheme not in ("http", "https"):
        return None
    return absolute


def is_allowed_host(url: str, allowed_hosts: Iterable[str] = ALLOWED_HOSTS) -> bool:
    host = (urllib.parse.urlsplit(url).hostname or "").lower().rstrip(".")
    return host in {item.lower() for item in allowed_hosts}


def is_goto_url(url: str) -> bool:
    parts = urllib.parse.urlsplit(url)
    return is_google_host(parts.hostname or "") and parts.path.rstrip("/") == "/goto"


def dedupe_key(url: str) -> str:
    """Host/scheme lowercased, path/query preserved verbatim, fragment dropped."""
    parts = urllib.parse.urlsplit(url)
    return urllib.parse.urlunsplit(
        (parts.scheme.lower(), parts.netloc.lower(), parts.path, parts.query, "")
    )


# --------------------------------------------------------------------------
# Page parsing
# --------------------------------------------------------------------------


@dataclass
class Occurrence:
    url: str
    raw_url: str
    title: str
    snippet: str
    page_number: int
    needs_resolution: bool = False


@dataclass
class PageResult:
    page_number: int
    occurrences: list[Occurrence] = field(default_factory=list)
    next_start: int | None = None
    has_no_results_marker: bool = False


def _is_inside_ad(anchor: Node) -> bool:
    for node in [anchor, *anchor.ancestors()]:
        if has_class_token(node, AD_CLASS_TOKENS):
            return True
        if node.attrs.get("id", "").lower() in AD_IDS:
            return True
        if "data-text-ad" in node.attrs:
            return True
    return False


def _find_snippet(anchor: Node, title_node: Node) -> str:
    parents = [anchor, *anchor.ancestors()]
    for depth, parent in enumerate(parents[:8]):
        if parent.tag in ("#document", "html", "body"):
            break
        for node in parent.iter_nodes():
            if node is parent or node.tag == "h3":
                continue
            if has_class_token(node, SNIPPET_CLASS_TOKENS):
                text = node_text(node, exclude=title_node)
                if text:
                    return text[:SNIPPET_LIMIT]
        if depth >= 2:
            break
    return ""


def _extract_pair(anchor: Node) -> tuple[Node, Node] | None:
    """Return (title_node, href_node) for either <a><h3> or <h3><a>."""
    if "href" not in anchor.attrs:
        return None
    nested_h3 = next((n for n in anchor.iter_nodes() if n.tag == "h3"), None)
    if nested_h3 is not None:
        return nested_h3, anchor
    parent = anchor.parent
    if parent is not None and parent.tag == "h3":
        return parent, anchor
    return None


def _detect_next_start(doc: Node) -> int | None:
    for node in doc.iter_nodes():
        if node.tag == "link" and "next" in node.attrs.get("rel", "").lower().split():
            href = node.attrs.get("href", "")
        elif node.tag == "a":
            href = node.attrs.get("href", "")
            if not href:
                continue
            is_next = (
                node.attrs.get("id", "").lower() == "pnnext"
                or "next" in node.attrs.get("aria-label", "").lower()
                or node_text(node).lower() in ("next", "下一页", "下一頁")
            )
            if not is_next:
                continue
        else:
            continue
        query = urllib.parse.parse_qs(urllib.parse.urlsplit(html_lib.unescape(href)).query)
        raw_start = (query.get("start") or [""])[0]
        if raw_start.isdigit():
            return int(raw_start)
    return None


def parse_page(
    page_html: str,
    page_number: int,
    base_url: str = SEARCH_BASE,
    allowed_hosts: Iterable[str] = ALLOWED_HOSTS,
) -> PageResult:
    lowered = page_html.lower()
    if any(marker in lowered for marker in CAPTCHA_MARKERS):
        raise CaptchaError("Google returned a CAPTCHA / unusual-traffic page")
    if any(marker in lowered for marker in CONSENT_MARKERS):
        raise ConsentError("Google returned a consent interstitial")
    if any(marker in lowered for marker in JS_REQUIRED_MARKERS):
        raise JavascriptRequiredError("Google returned the enable-JavaScript shell instead of results")

    doc = parse_html(page_html)
    result = PageResult(page_number=page_number)
    result.has_no_results_marker = any(marker in lowered for marker in NO_RESULTS_MARKERS)
    result.next_start = _detect_next_start(doc)

    seen_on_page: set[str] = set()
    for anchor in doc.iter_nodes():
        if anchor.tag != "a":
            continue
        pair = _extract_pair(anchor)
        if pair is None:
            continue
        title_node, href_node = pair
        if _is_inside_ad(anchor):
            continue
        href = href_node.attrs.get("href", "")
        absolute = urllib.parse.urljoin(base_url, html_lib.unescape(href.strip()))
        if is_goto_url(absolute):
            key = "goto:" + absolute
            if key in seen_on_page:
                continue
            seen_on_page.add(key)
            result.occurrences.append(
                Occurrence(
                    url="",
                    raw_url=absolute,
                    title=node_text(title_node)[:TITLE_LIMIT],
                    snippet=_find_snippet(anchor, title_node),
                    page_number=page_number,
                    needs_resolution=True,
                )
            )
            continue
        target = unwrap_google_href(href, base_url)
        if target is None or not is_allowed_host(target, allowed_hosts):
            continue
        key = dedupe_key(target)
        if key in seen_on_page:
            continue
        seen_on_page.add(key)
        result.occurrences.append(
            Occurrence(
                url=target,
                raw_url=href,
                title=node_text(title_node)[:TITLE_LIMIT],
                snippet=_find_snippet(anchor, title_node),
                page_number=page_number,
            )
        )
    return result


# --------------------------------------------------------------------------
# Fetching Google
# --------------------------------------------------------------------------


def build_search_url(start: int, num: int = 10) -> str:
    params = urllib.parse.urlencode(
        {"q": QUERY, "newwindow": "1", "start": str(start), "num": str(num), "hl": "en"}
    )
    return f"{SEARCH_BASE}?{params}"


def _decode_body(raw: bytes, headers: dict[str, str]) -> str:
    encoding = (headers.get("content-encoding") or "").lower()
    if encoding == "gzip":
        raw = gzip.decompress(raw)
    elif encoding == "deflate":
        raw = zlib.decompress(raw)
    charset = "utf-8"
    match = re.search(r"charset=([\w-]+)", headers.get("content-type", ""), re.I)
    if match:
        charset = match.group(1)
    return raw.decode(charset, errors="replace")


def fetch_url(url: str, timeout: float, user_agent: str) -> tuple[int, str, str]:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": user_agent,
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "identity",
        },
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        body = response.read()
        headers = {k.lower(): v for k, v in response.headers.items()}
        return response.status, response.geturl(), _decode_body(body, headers)


def collect_online(
    max_pages: int,
    timeout: float,
    delay: float,
    user_agent: str,
) -> tuple[list[PageResult], list[dict]]:
    pages: list[PageResult] = []
    failures: list[dict] = []
    seen_starts: set[int] = set()
    start = 0
    for page_number in range(1, max_pages + 1):
        url = build_search_url(start)
        try:
            status, final_url, body = fetch_url(url, timeout, user_agent)
        except (urllib.error.URLError, socket.timeout, ssl.SSLError, OSError) as exc:
            failures.append(
                {"stage": "fetch_search_page", "page": page_number, "url": url, "error": repr(exc)}
            )
            break
        if status != 200:
            failures.append(
                {
                    "stage": "fetch_search_page",
                    "page": page_number,
                    "url": url,
                    "status": status,
                    "error": "non-200 search response",
                }
            )
            break
        try:
            page = parse_page(body, page_number, base_url=final_url or url)
        except (CaptchaError, ConsentError, JavascriptRequiredError) as exc:
            failures.append(
                {"stage": "parse_search_page", "page": page_number, "url": url, "error": str(exc)}
            )
            raise
        if not page.occurrences and not page.has_no_results_marker:
            raise StructureChangedError(
                f"page {page_number} produced 0 results and no 'no results' marker "
                f"({len(body)} bytes, {url})"
            )
        pages.append(page)
        if not page.occurrences or page.next_start is None:
            break
        if page.next_start in seen_starts or page.next_start <= start:
            break
        seen_starts.add(page.next_start)
        start = page.next_start
        time.sleep(delay)
    return pages, failures


# --------------------------------------------------------------------------
# HTTP checks
# --------------------------------------------------------------------------


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


_CHECK_OPENER = urllib.request.build_opener(_NoRedirect)


def resolve_goto_url(goto_url: str, timeout: float, user_agent: str) -> str | None:
    """Follow Google's /goto redirect once and return the real target URL."""
    request = urllib.request.Request(
        goto_url,
        headers={
            "User-Agent": user_agent,
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "en-US,en;q=0.9",
        },
    )
    try:
        with _CHECK_OPENER.open(request, timeout=timeout) as response:
            return response.geturl()
    except urllib.error.HTTPError as exc:
        location = (exc.headers or {}).get("location", "")
        if 300 <= exc.code < 400 and location:
            return urllib.parse.urljoin(goto_url, location)
        return None
    except (urllib.error.URLError, socket.timeout, ssl.SSLError, OSError):
        return None


def resolve_goto_occurrences(
    pages: list["PageResult"], timeout: float, user_agent: str, workers: int
) -> tuple[list[dict], int]:
    """Replace /goto placeholders with real URLs; return (failures, kept_count)."""
    pending = sorted(
        {
            occurrence.raw_url
            for page in pages
            for occurrence in page.occurrences
            if occurrence.needs_resolution
        }
    )
    resolved: dict[str, str | None] = {}
    if pending:
        with ThreadPoolExecutor(max_workers=max(1, workers)) as pool:
            for url, target in zip(pending, pool.map(lambda u: resolve_goto_url(u, timeout, user_agent), pending)):
                resolved[url] = target

    failures: list[dict] = []
    kept = 0
    for page in pages:
        survivors: list[Occurrence] = []
        for occurrence in page.occurrences:
            if not occurrence.needs_resolution:
                survivors.append(occurrence)
                kept += 1
                continue
            target = resolved.get(occurrence.raw_url)
            if not target or not target.startswith(("http://", "https://")) or not is_allowed_host(target):
                failures.append(
                    {
                        "stage": "resolve_goto",
                        "page": page.page_number,
                        "raw_url": occurrence.raw_url,
                        "title": occurrence.title,
                        "error": "unresolved or non-morrishk target",
                    }
                )
                continue
            occurrence.url = target
            occurrence.needs_resolution = False
            survivors.append(occurrence)
            kept += 1
        page.occurrences = survivors
    return failures, kept


def _classify_exception(exc: BaseException) -> str:
    if isinstance(exc, (socket.timeout, TimeoutError)):
        return "timeout"
    if isinstance(exc, ssl.SSLError):
        return "ssl_error"
    if isinstance(exc, urllib.error.URLError):
        reason = exc.reason
        if isinstance(reason, (socket.timeout, TimeoutError)):
            return "timeout"
        if isinstance(reason, ssl.SSLError):
            return "ssl_error"
        return "connection_error"
    return "unknown_error"


def _page_metadata(final_url: str, body: str) -> dict[str, str]:
    doc = parse_html(body)
    title = ""
    canonical = ""
    robots_meta = ""
    for node in doc.iter_nodes():
        if node.tag == "title" and not title:
            title = node_text(node)[:TITLE_LIMIT]
        elif node.tag == "link" and not canonical:
            if "canonical" in node.attrs.get("rel", "").lower().split():
                canonical = urllib.parse.urljoin(final_url, node.attrs.get("href", "").strip())
        elif node.tag == "meta":
            if node.attrs.get("name", "").lower() in ("robots", "googlebot"):
                content = node.attrs.get("content", "").strip()
                if content:
                    robots_meta = f"{robots_meta}; {content}" if robots_meta else content
    return {"title": title, "canonical_url": canonical, "robots_meta": robots_meta}


def check_url(
    url: str,
    timeout: float,
    user_agent: str,
    max_redirects: int = 5,
) -> dict:
    result = {
        "url": url,
        "http_status": None,
        "final_url": "",
        "redirect_chain": [],
        "content_type": "",
        "title": "",
        "canonical_url": "",
        "robots_meta": "",
        "x_robots_tag": "",
        "check_status": "",
        "error": "",
    }
    current = url
    try:
        for _ in range(max_redirects + 1):
            request = urllib.request.Request(
                current,
                headers={
                    "User-Agent": user_agent,
                    "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Accept-Encoding": "identity",
                },
            )
            try:
                with _CHECK_OPENER.open(request, timeout=timeout) as response:
                    headers = {k.lower(): v for k, v in response.headers.items()}
                    body = response.read(3_000_000)
                    result["http_status"] = response.status
                    result["final_url"] = response.geturl()
                    result["content_type"] = headers.get("content-type", "")
                    result["x_robots_tag"] = headers.get("x-robots-tag", "")
                    result["check_status"] = "ok"
                    if "html" in result["content_type"].lower() or body[:512].lstrip().lower().startswith(
                        (b"<!doctype", b"<html")
                    ):
                        meta = _page_metadata(result["final_url"], _decode_body(body, headers))
                        result.update(meta)
                    return result
            except urllib.error.HTTPError as exc:
                headers = {k.lower(): v for k, v in (exc.headers or {}).items()}
                location = headers.get("location", "")
                if 300 <= exc.code < 400 and location:
                    result["redirect_chain"].append({"status": exc.code, "location": location})
                    current = urllib.parse.urljoin(current, location)
                    continue
                result["http_status"] = exc.code
                result["final_url"] = current
                result["content_type"] = headers.get("content-type", "")
                result["x_robots_tag"] = headers.get("x-robots-tag", "")
                result["check_status"] = "http_error"
                result["error"] = f"HTTP {exc.code}"
                return result
        result["http_status"] = result["redirect_chain"][-1]["status"] if result["redirect_chain"] else None
        result["final_url"] = current
        result["check_status"] = "too_many_redirects"
        result["error"] = f"exceeded {max_redirects} redirects"
        return result
    except (urllib.error.URLError, socket.timeout, ssl.SSLError, OSError) as exc:
        result["final_url"] = current
        result["check_status"] = _classify_exception(exc)
        result["error"] = repr(exc)
        return result


def check_urls(urls: list[str], timeout: float, user_agent: str, workers: int) -> dict[str, dict]:
    results: dict[str, dict] = {}
    with ThreadPoolExecutor(max_workers=max(1, workers)) as pool:
        for url, outcome in zip(urls, pool.map(lambda u: check_url(u, timeout, user_agent), urls)):
            results[url] = outcome
    transient = {"timeout", "connection_error", "ssl_error", "too_many_redirects"}
    retry = [
        url
        for url, outcome in results.items()
        if outcome["check_status"] in transient
        or (outcome["check_status"] == "http_error" and (outcome["http_status"] or 0) >= 500)
    ]
    for url in retry:
        time.sleep(1.5)
        results[url] = check_url(url, timeout, user_agent)
    return results


# --------------------------------------------------------------------------
# Output
# --------------------------------------------------------------------------


def merge_occurrences(pages: list[PageResult]) -> list[dict]:
    merged: dict[str, dict] = {}
    for page in pages:
        for occ in page.occurrences:
            key = dedupe_key(occ.url)
            entry = merged.get(key)
            if entry is None:
                merged[key] = {
                    "url": occ.url,
                    "dedupe_key": key,
                    "title": occ.title,
                    "snippet": occ.snippet,
                    "pages": [occ.page_number],
                    "occurrences": 1,
                    "raw_urls": [occ.raw_url] if occ.raw_url != occ.url else [],
                }
                continue
            entry["occurrences"] += 1
            if occ.page_number not in entry["pages"]:
                entry["pages"].append(occ.page_number)
            if not entry["title"] and occ.title:
                entry["title"] = occ.title
            if not entry["snippet"] and occ.snippet:
                entry["snippet"] = occ.snippet
            if occ.raw_url != occ.url and occ.raw_url not in entry["raw_urls"]:
                entry["raw_urls"].append(occ.raw_url)
    return list(merged.values())


def write_json(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_csv(path: Path, entries: list[dict], checks: dict[str, dict]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        for entry in entries:
            check = checks.get(entry["url"], {})
            writer.writerow(
                {
                    "url": entry["url"],
                    "title": entry["title"],
                    "snippet": entry["snippet"],
                    "page_number": entry["pages"][0],
                    "http_status": check.get("http_status") or "",
                    "final_url": check.get("final_url", ""),
                    "canonical_url": check.get("canonical_url", ""),
                    "robots_meta": check.get("robots_meta", ""),
                    "content_type": check.get("content_type", ""),
                    "check_status": check.get("check_status", "skipped"),
                }
            )


def utc_plus_8_now() -> str:
    return datetime.now(timezone(timedelta(hours=8))).isoformat(timespec="seconds")


def load_capture(path: Path) -> PageResult:
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, str):
        data = json.loads(data)
    page_number = int(data.get("page") or 1)
    page = PageResult(page_number=page_number)
    base = "https://www.google.com.hk/"
    seen: set[str] = set()
    for item in data.get("items", []):
        href = item.get("href") or item.get("raw") or ""
        raw = item.get("raw") or href
        absolute = urllib.parse.urljoin(base, html_lib.unescape(href.strip()))
        key = absolute if is_goto_url(absolute) else dedupe_key(absolute)
        if key in seen:
            continue
        seen.add(key)
        title = (item.get("title") or "").strip()[:TITLE_LIMIT]
        snippet = (item.get("snippet") or "").strip()[:SNIPPET_LIMIT]
        if is_goto_url(absolute):
            page.occurrences.append(
                Occurrence("", absolute, title, snippet, page_number, needs_resolution=True)
            )
            continue
        target = unwrap_google_href(href, base)
        if target and is_allowed_host(target):
            page.occurrences.append(Occurrence(target, raw, title, snippet, page_number))
    return page


def run(args: argparse.Namespace) -> int:
    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    started_at = utc_plus_8_now()
    failures: list[dict] = []
    warnings: list[str] = []

    if args.input_json:
        pages = []
        for raw_path in args.input_json:
            source = Path(raw_path)
            if not source.is_file():
                print(f"capture JSON not found: {source}", file=sys.stderr)
                return 1
            pages.append(load_capture(source))
        pages.sort(key=lambda page: page.page_number)
        mode = "browser_capture"
        requested_pages = len(pages)
    elif args.input_html:
        source = Path(args.input_html)
        if not source.is_file():
            print(f"input HTML not found: {source}", file=sys.stderr)
            return 1
        try:
            page = parse_page(source.read_text(encoding="utf-8", errors="replace"), 1)
        except (CaptchaError, ConsentError, JavascriptRequiredError, StructureChangedError) as exc:
            print(f"parse failed: {exc}", file=sys.stderr)
            return 3 if isinstance(exc, StructureChangedError) else 2
        if not page.occurrences and not page.has_no_results_marker:
            print("saved HTML contains no results and no 'no results' marker", file=sys.stderr)
            return 3
        pages = [page]
        mode = "local_html"
        requested_pages = 1
    else:
        try:
            pages, failures = collect_online(args.max_pages, args.timeout, args.delay, args.user_agent)
        except CaptchaError:
            print("Google returned a CAPTCHA / unusual-traffic page; stop (no bypass attempted).", file=sys.stderr)
            return 2
        except ConsentError:
            print("Google returned a consent interstitial; open the page in a browser first.", file=sys.stderr)
            return 2
        except JavascriptRequiredError:
            print(
                "Google served the enable-JavaScript shell, not HTML results. "
                "Capture the rendered page in a browser and rerun with --input-json/--input-html.",
                file=sys.stderr,
            )
            return 5
        except StructureChangedError as exc:
            print(f"structure change suspected: {exc}", file=sys.stderr)
            return 3
        mode = "online"
        requested_pages = args.max_pages

    pending = sum(1 for page in pages for occ in page.occurrences if occ.needs_resolution)
    if pending and args.skip_goto_resolve:
        warnings.append(f"{pending} Google /goto links left unresolved by --skip-goto-resolve")
        for page in pages:
            page.occurrences = [occ for occ in page.occurrences if not occ.needs_resolution]
    elif pending:
        resolve_failures, _ = resolve_goto_occurrences(pages, args.timeout, args.user_agent, args.workers)
        failures.extend(resolve_failures)

    entries = merge_occurrences(pages)
    checks: dict[str, dict] = {}
    if not args.skip_http_check:
        checks = check_urls([entry["url"] for entry in entries], args.timeout, args.user_agent, args.workers)
        for entry in entries:
            outcome = checks.get(entry["url"], {})
            if outcome.get("check_status") and outcome["check_status"] != "ok":
                warnings.append(
                    f"{entry['url']} -> {outcome['check_status']}"
                    + (f" (HTTP {outcome['http_status']})" if outcome.get("http_status") else "")
                )
    else:
        warnings.append("HTTP checks skipped by --skip-http-check")

    per_page = [{"page_number": page.page_number, "visible_results": len(page.occurrences)} for page in pages]
    total_occurrences = sum(item["visible_results"] for item in per_page)
    for entry in entries:
        entry.update(checks.get(entry["url"], {}))
        entry["check_status"] = entry.get("check_status") or ("skipped" if args.skip_http_check else "not_checked")

    payload = {
        "query_keyword": QUERY,
        "query_url": DEFAULT_QUERY_URL,
        "mode": mode,
        "started_at": started_at,
        "finished_at": utc_plus_8_now(),
        "requested_max_pages": requested_pages,
        "pages_fetched": len(pages),
        "per_page": per_page,
        "raw_result_count": total_occurrences,
        "deduped_url_count": len(entries),
        "allowed_hosts": list(ALLOWED_HOSTS),
        "urls": entries,
        "failures": failures,
        "warnings": warnings,
    }
    write_json(output_dir / "google_indexed_urls.json", payload)
    write_csv(output_dir / "google_indexed_urls.csv", entries, checks)

    print(f"mode: {mode}")
    print(f"pages fetched: {len(pages)} (requested max {requested_pages})")
    print("per page: " + ", ".join(f"p{item['page_number']}={item['visible_results']}" for item in per_page))
    print(f"raw occurrences: {total_occurrences}")
    print(f"deduped URLs: {len(entries)}")
    if checks:
        by_status: dict[str, int] = {}
        for outcome in checks.values():
            by_status[outcome["check_status"]] = by_status.get(outcome["check_status"], 0) + 1
        print("HTTP checks: " + ", ".join(f"{k}={v}" for k, v in sorted(by_status.items())))
    print(f"output: {output_dir}")
    if failures:
        print(f"failures: {len(failures)} (see JSON)")
        return 4
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Collect URLs visible in Google site:https://www.morrishk.net/ results (read-only)."
    )
    parser.add_argument("--max-pages", type=int, default=10, help="maximum result pages to fetch (default 10)")
    parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT_DIR), help="output directory")
    parser.add_argument("--input-html", default=None, help="parse a saved Google result page instead of fetching")
    parser.add_argument(
        "--input-json",
        nargs="+",
        default=None,
        help="one or more browser-captured result JSON files (title/raw/href/snippet/page)",
    )
    parser.add_argument(
        "--skip-goto-resolve",
        action="store_true",
        help="do not resolve Google /goto links (those results are dropped)",
    )
    parser.add_argument("--skip-http-check", action="store_true", help="do not issue GET requests to collected URLs")
    parser.add_argument("--timeout", type=float, default=15.0, help="per-request timeout seconds (default 15)")
    parser.add_argument("--delay", type=float, default=1.5, help="delay between Google result pages (default 1.5s)")
    parser.add_argument("--workers", type=int, default=5, help="parallel workers for URL checks (default 5)")
    parser.add_argument("--user-agent", default=DEFAULT_USER_AGENT, help="User-Agent header")
    return parser


def main(argv: list[str] | None = None) -> int:
    return run(build_parser().parse_args(argv))


if __name__ == "__main__":
    sys.exit(main())
