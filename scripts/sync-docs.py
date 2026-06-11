#!/usr/bin/env python3
"""
Sync docs.newapi.pro/zh/docs/* to web/docs-mirror/
Usage: python3 scripts/sync-docs.py [--out=web/docs-mirror]
"""

import os
import re
import sys
import time
import urllib.request
import urllib.error
import threading
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from html.parser import HTMLParser

BASE_URL = "https://docs.newapi.pro"
DOCS_PREFIX = "/zh/docs"
OUT_DIR = Path(__file__).parent.parent / "web" / "docs-mirror"

# Parse --out= arg
for arg in sys.argv[1:]:
    if arg.startswith("--out="):
        OUT_DIR = Path(arg[6:])

CONCURRENCY = 8
TIMEOUT = 20

downloaded_assets = set()
asset_lock = threading.Lock()


def fetch(url: str, retries: int = 3) -> bytes | None:
    for attempt in range(retries):
        try:
            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0 (compatible; docs-mirror/1.0)",
                    "Accept": "*/*",
                },
            )
            with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
                return resp.read()
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            print(f"  HTTP {e.code} for {url}, attempt {attempt+1}", flush=True)
        except Exception as e:
            print(f"  Error fetching {url}: {e}, attempt {attempt+1}", flush=True)
        if attempt < retries - 1:
            time.sleep(1)
    return None


def rewrite_html(html: str, page_path: str) -> str:
    """Minimal URL rewriting: only fix absolute URLs and image optimization paths.

    We NO LONGER rewrite /zh/docs/ → /docs/ or /_next/ → /docs/_next/.
    Pages are served at their original /zh/docs/... paths so that Next.js JS
    route definitions (which reference /zh/docs/...) match the browser URL,
    allowing React hydration to succeed and making interactive components work.

    Go handles:
      /_next/static/*  → web/docs-mirror/_next/static/...
      /_next/image     → web/docs-mirror/_next/static/media/...
      /zh/docs/*       → web/docs-mirror (files saved per DOCS_PREFIX strip below)
      /docs → /zh/docs redirect (for top-nav link compatibility)
    """
    import urllib.parse

    # Normalize absolute docs URLs to site-relative /zh/docs/ paths
    html = html.replace(f"https://docs.newapi.pro{DOCS_PREFIX}/", f"{DOCS_PREFIX}/")
    html = html.replace(f"https://docs.newapi.pro{DOCS_PREFIX}", DOCS_PREFIX)
    html = html.replace("https://www.newapi.ai/zh/docs/", f"{DOCS_PREFIX}/")
    html = html.replace("https://www.newapi.ai/zh/docs", DOCS_PREFIX)

    # Rewrite /_next/image?url=...&w=... → direct /_next/static/media/... path.
    # The /_next/static/* Go handler serves these without the image optimization API.
    def _rewrite_img(m: re.Match) -> str:
        encoded = m.group(1)
        decoded = urllib.parse.unquote(encoded)
        if decoded.startswith("/_next/static/media/"):
            return f'src="{decoded}"'
        return m.group(0)

    html = re.sub(
        r'src="/_next/image\?url=([^&"\']+)[^"\']*"',
        _rewrite_img,
        html,
    )

    return html


# Injected into <head> to intercept Next.js client-side navigation.
# Next.js calls history.pushState('/zh/docs/...') when navigating between pages.
# We force a full page load so Go serves the correct mirrored HTML instead of
# Next.js trying to fetch RSC payloads (/_next/data/...) that don't exist.
_FORCE_FULL_NAV_SCRIPT = (
    '<script>'
    '(function(){'
    'var _p=history.pushState.bind(history);'
    'history.pushState=function(s,t,u){'
    # Only intercept /zh/docs/... navigations; pass everything else through.
    'if(u&&typeof u==="string"&&u.startsWith("/zh/")){'
    'window.location.href=u;return;'
    '}_p(s,t,u);};'
    '})();'
    '</script>'
)


def save_html(path: str, content: bytes) -> None:
    """Save an HTML page to the mirror directory."""
    # Strip the /zh/docs prefix from the path
    if path.startswith(DOCS_PREFIX + "/"):
        rel = path[len(DOCS_PREFIX) + 1:]
    elif path == DOCS_PREFIX:
        rel = ""
    else:
        rel = path.lstrip("/")

    # Determine output file path
    if rel == "" or rel == "/":
        out_file = OUT_DIR / "index.html"
    elif rel.endswith("/"):
        out_file = OUT_DIR / rel / "index.html"
    else:
        # If no extension, treat as directory index
        if "." not in rel.split("/")[-1]:
            out_file = OUT_DIR / rel / "index.html"
        else:
            out_file = OUT_DIR / rel

    out_file.parent.mkdir(parents=True, exist_ok=True)
    html_str = content.decode("utf-8", errors="replace")
    html_str = rewrite_html(html_str, path)
    # Inject history.pushState override into <head> so it runs before Next.js init.
    html_str = html_str.replace("<head>", "<head>" + _FORCE_FULL_NAV_SCRIPT, 1)
    out_file.write_text(html_str, encoding="utf-8")


def save_asset(url_path: str, content: bytes) -> None:
    """Save a static asset (_next/static/..., /assets/...)."""
    # url_path is like /_next/static/chunks/abc.js or /assets/newapi.svg
    out_file = OUT_DIR / url_path.lstrip("/")
    out_file.parent.mkdir(parents=True, exist_ok=True)
    out_file.write_bytes(content)


class AssetExtractor(HTMLParser):
    """Extract /_next/static/*.css and /_next/static/*.js URLs from HTML."""

    def __init__(self):
        super().__init__()
        self.assets: list[str] = []

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if tag == "link":
            rel = attrs_dict.get("rel", "")
            href = attrs_dict.get("href", "")
            if "stylesheet" in rel and "/_next/static/" in href:
                self.assets.append(self._clean(href))
        elif tag == "script":
            src = attrs_dict.get("src", "")
            if "/_next/static/" in src:
                self.assets.append(self._clean(src))

    def _clean(self, url: str) -> str:
        # Strip query string / dpl param for the local path
        return url.split("?")[0] if "?" in url else url


def extract_assets(html: str) -> list[str]:
    parser = AssetExtractor()
    parser.feed(html)
    # Also find assets referenced in inline JSON/JS
    inline_refs = re.findall(r'"(/_next/static/[^"]+\.(?:js|css))"', html)
    inline_refs += re.findall(r"'(/_next/static/[^']+\.(?:js|css))'", html)
    all_assets = list({a.split("?")[0] for a in parser.assets + inline_refs})
    return all_assets


def extract_images(html: str) -> list[str]:
    """Extract image file paths from Next.js /_next/image?url=... references."""
    # Matches: src="/docs/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Ffoo.png&..."
    encoded = re.findall(r'/_next/image\?url=([^&"\'>\s]+)', html)
    paths = []
    for enc in encoded:
        try:
            import urllib.parse
            decoded = urllib.parse.unquote(enc)
            # Keep only /_next/static/media/... paths
            if decoded.startswith("/_next/static/media/"):
                paths.append(decoded.split("?")[0])
        except Exception:
            pass
    return list(set(paths))


def download_asset(asset_path: str) -> None:
    with asset_lock:
        if asset_path in downloaded_assets:
            return
        downloaded_assets.add(asset_path)

    out_file = OUT_DIR / asset_path.lstrip("/")
    if out_file.exists():
        return

    url = BASE_URL + asset_path
    data = fetch(url)
    if data:
        save_asset(asset_path, data)


def get_all_docs_paths() -> list[str]:
    """Fetch sitemap and return all /zh/docs/* paths."""
    print("Fetching sitemap...", flush=True)
    data = fetch(f"{BASE_URL}/sitemap.xml")
    if not data:
        print("Failed to fetch sitemap, using default paths")
        return [DOCS_PREFIX]

    xml = data.decode("utf-8", errors="replace")
    locs = re.findall(r"<loc>([^<]+)</loc>", xml)

    # The sitemap might point to www.newapi.ai or docs.newapi.pro
    paths = []
    for loc in locs:
        # Normalize: keep only /zh/docs/* paths, extract path part
        for domain in ["https://www.newapi.ai", "https://docs.newapi.pro"]:
            if loc.startswith(domain + DOCS_PREFIX):
                path = loc[len(domain):]
                paths.append(path)
                break

    # Deduplicate
    paths = list(dict.fromkeys(paths))
    return paths if paths else [DOCS_PREFIX]


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Output directory: {OUT_DIR}", flush=True)

    # 1. Get all docs paths from sitemap
    paths = get_all_docs_paths()
    print(f"Found {len(paths)} pages to download", flush=True)

    # 2. Download all HTML pages
    all_asset_paths: set[str] = set()

    def download_page(path: str) -> list[str]:
        url = BASE_URL + path
        data = fetch(url)
        if not data:
            print(f"  SKIP {path}", flush=True)
            return []
        save_html(path, data)
        html_str = data.decode("utf-8", errors="replace")
        assets = extract_assets(html_str)
        for img in extract_images(html_str):
            all_image_paths.add(img)
        print(f"  OK   {path} ({len(assets)} assets)", flush=True)
        return assets

    print("\n=== Downloading pages ===", flush=True)
    all_image_paths: set[str] = set()
    with ThreadPoolExecutor(max_workers=CONCURRENCY) as pool:
        futures = {pool.submit(download_page, p): p for p in paths}
        for future in as_completed(futures):
            assets = future.result()
            for a in assets:
                all_asset_paths.add(a)

    print(f"\n=== Downloading {len(all_asset_paths)} assets ===", flush=True)

    # 3. Download CSS and JS assets
    def dl_asset(asset_path: str):
        out_file = OUT_DIR / asset_path.lstrip("/")
        if out_file.exists():
            return
        url = BASE_URL + asset_path
        data = fetch(url)
        if data:
            save_asset(asset_path, data)
            print(f"  ASSET {asset_path}", flush=True)

    with ThreadPoolExecutor(max_workers=CONCURRENCY) as pool:
        list(pool.map(dl_asset, sorted(all_asset_paths)))

    # 4. Download doc images (/_next/static/media/*)
    print(f"\n=== Downloading {len(all_image_paths)} images ===", flush=True)

    def dl_image(img_path: str):
        out_file = OUT_DIR / img_path.lstrip("/")
        if out_file.exists():
            return
        url = BASE_URL + img_path
        data = fetch(url)
        if data:
            save_asset(img_path, data)
            print(f"  IMG  {img_path}", flush=True)
        else:
            print(f"  FAIL {img_path}", flush=True)

    with ThreadPoolExecutor(max_workers=CONCURRENCY) as pool:
        list(pool.map(dl_image, sorted(all_image_paths)))

    # 5. Download /assets/ images referenced in HTML (logo etc.)
    print("\n=== Downloading site images ===", flush=True)
    for img_path in ["/assets/newapi.svg"]:
        url = BASE_URL + img_path
        data = fetch(url)
        if data:
            save_asset(img_path, data)
            print(f"  IMG  {img_path}", flush=True)

    # 5. Create a robots.txt to prevent double-indexing
    robots = (OUT_DIR / "robots.txt")
    if not robots.exists():
        robots.write_text("User-agent: *\nDisallow: /\n")

    print(f"\nDone! Files in {OUT_DIR}", flush=True)
    total = sum(1 for _ in OUT_DIR.rglob("*") if _.is_file())
    size_mb = sum(f.stat().st_size for f in OUT_DIR.rglob("*") if f.is_file()) / 1_048_576
    print(f"Total: {total} files, {size_mb:.1f} MB", flush=True)


if __name__ == "__main__":
    main()
