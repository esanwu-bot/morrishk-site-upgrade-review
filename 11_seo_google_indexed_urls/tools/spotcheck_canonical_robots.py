#!/usr/bin/env python3
"""Read-only canonical / robots spot check for a small sample of listed URLs.

Fetches each URL once with GET, then records:
- HTTP status, final URL after redirects, Content-Type
- all <link rel="canonical"> values (resolved against the final URL)
- all <meta name="robots"> and <meta name="googlebot"> contents
- all X-Robots-Tag response header values
- a hash of the response body for traceability

Absent values are reported as "not_present"; fields that could not be
inspected because the fetch/parse failed are reported as "not_verified".
Empty values are never treated as "no restriction".
"""

from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import socket
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone, timedelta
from html.parser import HTMLParser
from pathlib import Path

DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)
LOCAL_TZ = timezone(timedelta(hours=8))


class HeadParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.canonical_hrefs: list[str] = []
        self.meta_robots: list[str] = []
        self.meta_googlebot: list[str] = []
        self.title_parts: list[str] = []
        self._in_title = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {k.lower(): (v if v is not None else "") for k, v in attrs}
        if tag.lower() == "link":
            rel = values.get("rel", "").lower().split()
            if "canonical" in rel:
                self.canonical_hrefs.append(values.get("href", ""))
        elif tag.lower() == "meta":
            name = values.get("name", "").strip().lower()
            content = values.get("content", "")
            if name == "robots":
                self.meta_robots.append(content)
            elif name == "googlebot":
                self.meta_googlebot.append(content)
        elif tag.lower() == "title":
            self._in_title = True

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "title":
            self._in_title = False

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title_parts.append(data)


def now_local() -> str:
    return datetime.now(LOCAL_TZ).isoformat(timespec="seconds")


def presence(values: list[str], fetch_ok: bool) -> str:
    if not fetch_ok:
        return "not_verified"
    if not values:
        return "not_present"
    if len(values) > 1:
        return "present_multiple"
    return "present"


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):  # type: ignore[override]
        return None


REDIRECT_STATUSES = {301, 302, 303, 307, 308}
MAX_REDIRECTS = 10


def _open_final(url: str, timeout: float, user_agent: str) -> tuple[object, list[dict]]:
    opener = urllib.request.build_opener(NoRedirect)
    current = url
    chain: list[dict] = []
    for hop in range(1, MAX_REDIRECTS + 1):
        request = urllib.request.Request(
            current, headers={"User-Agent": user_agent, "Accept": "text/html,*/*"}
        )
        try:
            response = opener.open(request, timeout=timeout)
        except urllib.error.HTTPError as exc:
            if exc.code not in REDIRECT_STATUSES:
                raise
            location = exc.headers.get("Location")
            resolved = urllib.parse.urljoin(current, location.strip()) if location else None
            chain.append(
                {
                    "hop": hop,
                    "url": current,
                    "status": exc.code,
                    "location_header": location,
                    "resolved_location": resolved,
                }
            )
            exc.close()
            if not resolved:
                raise ValueError(f"redirect without usable Location at hop {hop}: {current}")
            current = resolved
            continue
        return response, chain
    raise RuntimeError(f"too_many_redirects (> {MAX_REDIRECTS})")


def fetch(url: str, timeout: float, user_agent: str) -> dict:
    checked_at = now_local()
    result: dict = {
        "requested_url": url,
        "checked_at": checked_at,
        "fetch_ok": False,
        "error": None,
        "redirect_chain": [],
    }
    try:
        response, chain = _open_final(url, timeout, user_agent)
        with response:  # type: ignore[union-attr]
            raw = response.read()
            encoding = (response.headers.get("Content-Encoding") or "").lower()
            if "gzip" in encoding:
                raw = gzip.decompress(raw)
            final_url = response.geturl()
            result.update(
                {
                    "fetch_ok": True,
                    "http_status": response.status,
                    "final_url": final_url,
                    "redirect_chain": chain,
                    "redirect_count": len(chain),
                    "redirect_statuses": [item["status"] for item in chain],
                    "content_type": response.headers.get("Content-Type", ""),
                    "x_robots_tag": response.headers.get_all("X-Robots-Tag") or [],
                    "html_body_sha256": hashlib.sha256(raw).hexdigest(),
                    "html_body_bytes": len(raw),
                }
            )
            parser = HeadParser()
            parser.feed(raw.decode("utf-8", errors="replace"))
            resolved = []
            for href in parser.canonical_hrefs:
                resolved.append(
                    {
                        "raw_href": href,
                        "resolved_url": urllib.parse.urljoin(final_url, href.strip()) if href.strip() else None,
                    }
                )
            result.update(
                {
                    "html_title": "".join(parser.title_parts).strip(),
                    "canonical": resolved,
                    "meta_robots": parser.meta_robots,
                    "meta_googlebot": parser.meta_googlebot,
                }
            )
    except (urllib.error.URLError, socket.timeout, TimeoutError, OSError) as exc:
        result["error"] = f"{type(exc).__name__}: {exc}"
        result["final_url"] = None
    except Exception as exc:  # parser / decompression failures must be visible
        result["error"] = f"{type(exc).__name__}: {exc}"
        result["final_url"] = None

    ok = result["fetch_ok"]
    result["presence"] = {
        "canonical": presence([item["raw_href"] for item in result.get("canonical", [])], ok),
        "meta_robots": presence(result.get("meta_robots", []), ok),
        "meta_googlebot": presence(result.get("meta_googlebot", []), ok),
        "x_robots_tag": presence(result.get("x_robots_tag", []), ok),
    }
    result["empty_value_note"] = (
        "Empty arrays mean the tag/header was not present in the fetched response; "
        "they do not mean the crawler is allowed. HTTP 200 alone does not prove indexability."
    )
    return result


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Read-only canonical/robots spot check")
    parser.add_argument("urls", nargs="+", help="URLs to check")
    parser.add_argument("--timeout", type=float, default=30.0)
    parser.add_argument("--user-agent", default=DEFAULT_USER_AGENT)
    parser.add_argument("--output", default="canonical_robots_spotcheck.json")
    args = parser.parse_args(argv)

    results = [fetch(url, args.timeout, args.user_agent) for url in args.urls]
    payload = {
        "checked_at": now_local(),
        "method": {
            "request": "one read-only GET per URL; redirects are followed manually, and every hop "
            "(status + Location + resolved URL) is stored in redirect_chain",
            "parser": "Python html.parser; rel=canonical is matched case-insensitively; "
            "meta robots/googlebot contents are recorded verbatim",
            "x_robots_tag": "all response header values via HTTPMessage.get_all",
            "absence": "not_present = fetched successfully and tag/header absent; "
            "not_verified = fetch or parse failed",
        },
        "urls": results,
    }
    Path(args.output).write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for item in results:
        print(
            f"{item['requested_url']} -> {item.get('http_status')} {item.get('final_url')} "
            f"canonical={item['presence']['canonical']} robots={item['presence']['meta_robots']} "
            f"googlebot={item['presence']['meta_googlebot']} x_robots_tag={item['presence']['x_robots_tag']}"
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
