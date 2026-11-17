import json
import sys
import tempfile
import threading
import time
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import google_indexed_urls as g  # noqa: E402


def socket_timeout():
    import socket

    return socket.timeout("timed out")


MODERN_RESULT = """
<html><body>
<div class="g">
  <a href="/url?q=https://www.morrishk.net/products/1/a.html&amp;sa=U&amp;ved=x"><h3>Part A</h3></a>
  <div class="VwiC3b">Snippet A</div>
</div>
<div class="g">
  <h3><a href="https://morrishk.net/products/2/b.html">Part B</a></h3>
  <span class="aCOpRe">Snippet B</span>
</div>
<div class="uEierd">
  <a href="https://www.morrishk.net/ads.html"><h3>Sponsored</h3></a>
</div>
<a href="https://www.google.com/webmasters/tools/home"><h3>Google promo</h3></a>
<a href="https://example.com/out"><h3>External</h3></a>
<a href="https://cdn.morrishk.net/x.html"><h3>Subdomain</h3></a>
<a id="pnnext" href="/search?q=site:x&amp;start=10">Next</a>
</body></html>
"""


class ParseTests(unittest.TestCase):
    def test_parses_modern_and_legacy_layouts(self):
        page = g.parse_page(MODERN_RESULT, 1)
        urls = [o.url for o in page.occurrences]
        self.assertIn("https://www.morrishk.net/products/1/a.html", urls)
        self.assertIn("https://morrishk.net/products/2/b.html", urls)
        titles = {o.url: o.title for o in page.occurrences}
        self.assertEqual(titles["https://www.morrishk.net/products/1/a.html"], "Part A")
        self.assertEqual(titles["https://morrishk.net/products/2/b.html"], "Part B")
        snippets = {o.url: o.snippet for o in page.occurrences}
        self.assertEqual(snippets["https://www.morrishk.net/products/1/a.html"], "Snippet A")
        self.assertEqual(snippets["https://morrishk.net/products/2/b.html"], "Snippet B")

    def test_filters_ads_external_google_and_subdomains(self):
        page = g.parse_page(MODERN_RESULT, 1)
        urls = {o.url for o in page.occurrences}
        self.assertEqual(
            urls,
            {"https://www.morrishk.net/products/1/a.html", "https://morrishk.net/products/2/b.html"},
        )

    def test_unwraps_legacy_google_url_wrappers(self):
        cases = {
            "https://www.google.com/url?q=https%3A%2F%2Fwww.morrishk.net%2Fx.html&sa=U": "https://www.morrishk.net/x.html",
            "https://www.google.com.hk/url?url=https://morrishk.net/y.html": "https://morrishk.net/y.html",
            "/url?q=https://www.morrishk.net/z.html&sa=U": "https://www.morrishk.net/z.html",
        }
        for raw, expected in cases.items():
            self.assertEqual(g.unwrap_google_href(raw, g.SEARCH_BASE), expected)

    def test_unwrap_rejects_non_results(self):
        self.assertIsNone(g.unwrap_google_href("", g.SEARCH_BASE))
        self.assertIsNone(g.unwrap_google_href("#frag", g.SEARCH_BASE))
        self.assertIsNone(g.unwrap_google_href("javascript:void(0)", g.SEARCH_BASE))
        self.assertIsNone(g.unwrap_google_href("/search?q=more", g.SEARCH_BASE))
        self.assertIsNone(
            g.unwrap_google_href("https://www.google.com/url?q=https://www.google.com/x", g.SEARCH_BASE)
        )

    def test_detects_goto_placeholder(self):
        html = '<div class="g"><a href="/goto?url=CAESabc&amp;gsessionid=s"><h3>T</h3></a></div>'
        page = g.parse_page(html, 2)
        self.assertEqual(len(page.occurrences), 1)
        occ = page.occurrences[0]
        self.assertTrue(occ.needs_resolution)
        self.assertEqual(occ.url, "")
        self.assertTrue(occ.raw_url.startswith("https://www.google.com.hk/goto?url="))
        self.assertEqual(occ.page_number, 2)

    def test_deduplicates_within_page_but_keeps_first(self):
        html = (
            '<div class="g"><a href="https://www.morrishk.net/a.html"><h3>One</h3></a></div>'
            '<div class="g"><a href="https://www.morrishk.net/a.html"><h3>Duplicate</h3></a></div>'
        )
        page = g.parse_page(html, 1)
        self.assertEqual(len(page.occurrences), 1)
        self.assertEqual(page.occurrences[0].title, "One")

    def test_deduplicates_across_pages_and_keeps_pages(self):
        html = '<div class="g"><a href="https://www.morrishk.net/a.html"><h3>A</h3></a></div>'
        pages = [g.parse_page(html, 1), g.parse_page(html, 2)]
        merged = g.merge_occurrences(pages)
        self.assertEqual(len(merged), 1)
        self.assertEqual(merged[0]["occurrences"], 2)
        self.assertEqual(merged[0]["pages"], [1, 2])

    def test_detects_next_page(self):
        self.assertEqual(g.parse_page(MODERN_RESULT, 1).next_start, 10)
        no_next = '<div class="g"><a href="https://www.morrishk.net/a.html"><h3>A</h3></a></div>'
        self.assertIsNone(g.parse_page(no_next, 1).next_start)

    def test_no_results_marker_does_not_raise(self):
        page = g.parse_page("<html><body>Your search did not match any documents.</body></html>", 1)
        self.assertEqual(page.occurrences, [])
        self.assertTrue(page.has_no_results_marker)

    def test_structure_change_raises_in_run(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "page.html"
            source.write_text("<html><body><div>totally new layout</div></body></html>", encoding="utf-8")
            code = g.run(
                g.build_parser().parse_args(
                    ["--input-html", str(source), "--output-dir", str(Path(tmp) / "out"), "--skip-http-check"]
                )
            )
            self.assertEqual(code, 3)

    def test_captcha_and_javascript_shells_raise(self):
        with self.assertRaises(g.CaptchaError):
            g.parse_page('<html><body><a href="/sorry/index">x</a></body></html>', 1)
        with self.assertRaises(g.JavascriptRequiredError):
            g.parse_page('<html><body><a href="/httpservice/retry/enablejs">x</a></body></html>', 1)


class GotoResolutionTests(unittest.TestCase):
    def test_resolves_placeholders_and_drops_bad_targets(self):
        pages = [
            g.PageResult(
                1,
                [
                    g.Occurrence("", "https://www.google.com.hk/goto?url=ok", "T1", "S1", 1, True),
                    g.Occurrence("", "https://www.google.com.hk/goto?url=bad", "T2", "S2", 1, True),
                ],
            )
        ]
        mapping = {
            "https://www.google.com.hk/goto?url=ok": "https://www.morrishk.net/p.html",
            "https://www.google.com.hk/goto?url=bad": "https://example.com/nope",
        }
        original = g.resolve_goto_url
        g.resolve_goto_url = lambda url, timeout, ua: mapping.get(url)
        try:
            failures, kept = g.resolve_goto_occurrences(pages, 1, "ua", 1)
        finally:
            g.resolve_goto_url = original
        self.assertEqual(kept, 1)
        self.assertEqual(pages[0].occurrences[0].url, "https://www.morrishk.net/p.html")
        self.assertEqual(len(failures), 1)
        self.assertEqual(failures[0]["stage"], "resolve_goto")


class _Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_GET(self):
        if self.path == "/r1":
            self.send_response(301)
            self.send_header("Location", "/r2")
            self.end_headers()
        elif self.path == "/r2":
            self.send_response(302)
            self.send_header("Location", "/final")
            self.end_headers()
        elif self.path == "/final":
            body = (
                "<html><head><title>Final Page</title>"
                '<link rel="canonical" href="/canonical.html">'
                '<meta name="robots" content="noindex,follow"></head><body>ok</body></html>'
            ).encode()
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("X-Robots-Tag", "noarchive")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        elif self.path == "/missing":
            self.send_response(404)
            self.end_headers()
        elif self.path == "/boom":
            self.send_response(500)
            self.end_headers()
        elif self.path == "/slow":
            time.sleep(2)
            self.send_response(200)
            self.end_headers()
        elif self.path == "/plain":
            body = b"hello"
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_response(404)
            self.end_headers()


class HttpCheckTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), _Handler)
        cls.base = f"http://127.0.0.1:{cls.server.server_address[1]}"
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()

    def test_redirect_chain_canonical_robots_and_x_robots(self):
        result = g.check_url(self.base + "/r1", timeout=3, user_agent="test")
        self.assertEqual(result["check_status"], "ok")
        self.assertEqual(result["http_status"], 200)
        self.assertEqual(result["final_url"], self.base + "/final")
        self.assertEqual(len(result["redirect_chain"]), 2)
        self.assertEqual(result["title"], "Final Page")
        self.assertEqual(result["canonical_url"], self.base + "/canonical.html")
        self.assertEqual(result["robots_meta"], "noindex,follow")
        self.assertEqual(result["x_robots_tag"], "noarchive")

    def test_http_errors_are_reported_not_raised(self):
        missing = g.check_url(self.base + "/missing", timeout=3, user_agent="test")
        self.assertEqual(missing["check_status"], "http_error")
        self.assertEqual(missing["http_status"], 404)
        boom = g.check_url(self.base + "/boom", timeout=3, user_agent="test")
        self.assertEqual(boom["check_status"], "http_error")
        self.assertEqual(boom["http_status"], 500)

    def test_timeout_and_connection_error(self):
        slow = g.check_url(self.base + "/slow", timeout=0.3, user_agent="test")
        self.assertEqual(slow["check_status"], "timeout")
        import urllib.error

        refused = urllib.error.URLError(ConnectionRefusedError(10061, "refused"))
        self.assertEqual(g._classify_exception(refused), "connection_error")
        self.assertEqual(g._classify_exception(socket_timeout()), "timeout")

    def test_non_html_body_skips_metadata(self):
        plain = g.check_url(self.base + "/plain", timeout=3, user_agent="test")
        self.assertEqual(plain["check_status"], "ok")
        self.assertEqual(plain["title"], "")


class OutputTests(unittest.TestCase):
    def test_csv_columns_are_exact(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "out.csv"
            entries = [
                {"url": "https://www.morrishk.net/a.html", "title": "A", "snippet": "S", "pages": [1]}
            ]
            checks = {
                "https://www.morrishk.net/a.html": {
                    "http_status": 200,
                    "final_url": "https://www.morrishk.net/a.html",
                    "canonical_url": "",
                    "robots_meta": "",
                    "content_type": "text/html",
                    "check_status": "ok",
                }
            }
            g.write_csv(path, entries, checks)
            header = path.read_text(encoding="utf-8").splitlines()[0]
            self.assertEqual(header, ",".join(g.CSV_COLUMNS))
            self.assertEqual(
                g.CSV_COLUMNS,
                [
                    "url", "title", "snippet", "page_number", "http_status",
                    "final_url", "canonical_url", "robots_meta", "content_type", "check_status",
                ],
            )

    def test_load_capture_handles_double_encoded_json(self):
        payload = {
            "page": 2,
            "items": [
                {"title": "T", "href": "https://www.morrishk.net/a.html", "raw": "/url?q=x", "snippet": "S"},
                {"title": "Promo", "href": "https://www.google.com/x", "raw": "", "snippet": ""},
            ],
        }
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "cap.json"
            path.write_text(json.dumps(json.dumps(payload)), encoding="utf-8")
            page = g.load_capture(path)
        self.assertEqual(page.page_number, 2)
        self.assertEqual(len(page.occurrences), 1)
        self.assertEqual(page.occurrences[0].url, "https://www.morrishk.net/a.html")


if __name__ == "__main__":
    unittest.main(verbosity=2)
