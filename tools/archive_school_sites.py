from __future__ import annotations

import hashlib
import json
import re
import socket
from collections import deque
from dataclasses import dataclass
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote, unquote, urljoin, urlparse, urlunparse
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
ARCHIVE_ROOT = ROOT / "archives" / "school-sites"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36"
MAX_ASSETS_PER_SITE = 450
MAX_BYTES = 18 * 1024 * 1024
TIMEOUT_SECONDS = 18
EXPECTED_ASSET_EXTENSIONS = {
    ".css",
    ".eot",
    ".gif",
    ".htc",
    ".ico",
    ".jpeg",
    ".jpg",
    ".js",
    ".json",
    ".otf",
    ".png",
    ".svg",
    ".ttf",
    ".webp",
    ".woff",
    ".woff2",
}
INLINE_ASSET_RE = re.compile(
    r"""["']((?:https?:)?//[^"']+\.(?:css|eot|gif|ico|jpeg|jpg|js|json|otf|png|svg|ttf|webp|woff|woff2)(?:\?[^"']*)?)["']""",
    re.I,
)

TARGETS = [
    {
        "slug": "spanish-schoolhouse-tomball",
        "name": "Spanish Schoolhouse Tomball",
        "url": "https://spanishschoolhouse.com/tomball/",
    },
    {
        "slug": "esprit-international-school",
        "name": "Esprit International School",
        "url": "https://www.espritinternationalschool.com/",
    },
]

DOWNLOAD_LINK_RELS = {
    "apple-touch-icon",
    "icon",
    "preload",
    "prefetch",
    "shortcut icon",
    "stylesheet",
}


@dataclass
class Asset:
    url: str
    path: Path
    content_type: str
    size: int


class PageAssetParser(HTMLParser):
    def __init__(self, base_url: str) -> None:
        super().__init__()
        self.base_url = base_url
        self.urls: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr_map = {name.lower(): value for name, value in attrs if value}
        rels = {part.strip().lower() for part in (attr_map.get("rel") or "").split()}

        if tag in {"img", "script", "source", "video", "audio", "iframe"}:
            self._add(attr_map.get("src"))
            self._add(attr_map.get("poster"))
            self._add_srcset(attr_map.get("srcset"))
        elif tag == "link" and (not rels or rels & DOWNLOAD_LINK_RELS):
            self._add(attr_map.get("href"))
            self._add_srcset(attr_map.get("imagesrcset"))

        self._add_css_urls(attr_map.get("style"))

    def _add(self, value: str | None) -> None:
        if not value:
            return
        absolute = normalize_url(urljoin(self.base_url, value))
        if is_fetchable(absolute):
            self.urls.append(absolute)

    def _add_srcset(self, value: str | None) -> None:
        if not value:
            return
        for url in parse_srcset(value):
            self._add(url)

    def _add_css_urls(self, value: str | None) -> None:
        if not value:
            return
        for url in extract_css_urls(value):
            self._add(url)


def normalize_url(url: str) -> str:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        return url
    path = quote(unquote(parsed.path or "/"), safe="/:@")
    return urlunparse((parsed.scheme.lower(), parsed.netloc.lower(), path, "", parsed.query, ""))


def is_fetchable(url: str) -> bool:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        return False
    lowered = url.lower()
    blocked_bits = ("facebook.com/tr", "googletagmanager.com/gtm.js", "google-analytics.com", "doubleclick.net")
    return not any(bit in lowered for bit in blocked_bits)


def sanitize(value: str) -> str:
    clean = re.sub(r"[^A-Za-z0-9._-]+", "_", value).strip("._")
    return clean or "asset"


def local_path(root: Path, url: str, content_type: str = "") -> Path:
    parsed = urlparse(url)
    parts = [sanitize(part) for part in unquote(parsed.path).strip("/").split("/") if part]
    if not parts:
        parts = ["index"]
    last = parts[-1]
    suffix = Path(last).suffix
    if not suffix:
        suffix = extension_for(content_type)
        last = f"{last}{suffix}"
    if parsed.query:
        digest = hashlib.sha1(parsed.query.encode("utf-8")).hexdigest()[:10]
        stem = last[: -len(suffix)] if suffix and last.endswith(suffix) else last
        last = f"{stem}.{digest}{suffix}"
    parts[-1] = last
    return root / "assets" / sanitize(parsed.netloc.lower()) / Path(*parts)


def extension_for(content_type: str) -> str:
    content_type = content_type.split(";")[0].strip().lower()
    return {
        "text/css": ".css",
        "text/javascript": ".js",
        "application/javascript": ".js",
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/gif": ".gif",
        "image/svg+xml": ".svg",
        "image/webp": ".webp",
        "font/woff": ".woff",
        "font/woff2": ".woff2",
        "application/font-woff": ".woff",
        "application/json": ".json",
    }.get(content_type, ".bin")


def relpath(from_file: Path, to_file: Path) -> str:
    return Path(__import__("os").path.relpath(to_file, start=from_file.parent)).as_posix()


def fetch(url: str) -> tuple[bytes, str, str]:
    request = Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept-Encoding": "identity",
            "Accept": "*/*",
        },
    )
    with urlopen(request, timeout=TIMEOUT_SECONDS) as response:
        content_type = response.headers.get("content-type", "").split(";")[0].strip().lower()
        content_length = response.headers.get("content-length")
        if content_length and int(content_length) > MAX_BYTES:
            raise ValueError(f"asset too large: {content_length} bytes")
        data = response.read(MAX_BYTES + 1)
        if len(data) > MAX_BYTES:
            raise ValueError(f"asset too large: {len(data)} bytes")
        return data, content_type, normalize_url(response.geturl())


def root_asset_fallback(url: str) -> str | None:
    parsed = urlparse(url)
    parts = [part for part in parsed.path.split("/") if part]
    if len(parts) < 2:
        return None
    suffix = Path(parts[-1]).suffix.lower()
    if suffix not in EXPECTED_ASSET_EXTENSIONS:
        return None
    root_path = "/" + "/".join(parts[1:])
    fallback = urlunparse((parsed.scheme, parsed.netloc, root_path, "", parsed.query, ""))
    return normalize_url(fallback) if fallback != url else None


def decode_text(data: bytes, content_type: str) -> str:
    match = re.search(r"charset=([A-Za-z0-9_-]+)", content_type)
    charset = match.group(1) if match else "utf-8"
    return data.decode(charset, "replace")


def parse_srcset(value: str) -> list[str]:
    urls: list[str] = []
    for candidate in value.split(","):
        pieces = candidate.strip().split()
        if pieces:
            urls.append(pieces[0])
    return urls


def extract_css_urls(css: str) -> list[str]:
    urls = [url.strip("\"' ") for url in re.findall(r"url\(([^)]+)\)", css, flags=re.I)]
    imports = [url.strip("\"' ") for url in re.findall(r"@import\s+(?:url\()?['\"]?([^'\"\);]+)", css, flags=re.I)]
    return [url for url in urls + imports if url and not url.startswith("data:")]


def extract_inline_asset_urls(html: str, base_url: str) -> list[str]:
    base_netloc = urlparse(base_url).netloc.lower()
    urls: list[str] = []
    for match in INLINE_ASSET_RE.finditer(html):
        absolute = normalize_url(urljoin(base_url, match.group(1)))
        parsed = urlparse(absolute)
        if parsed.netloc.lower() == base_netloc and is_fetchable(absolute):
            urls.append(absolute)
    return urls


def rewrite_srcset(value: str, base_url: str, url_to_path: dict[str, Path], from_file: Path) -> str:
    rewritten: list[str] = []
    for candidate in value.split(","):
        pieces = candidate.strip().split()
        if not pieces:
            continue
        absolute = normalize_url(urljoin(base_url, pieces[0]))
        if absolute in url_to_path:
            pieces[0] = relpath(from_file, url_to_path[absolute])
        elif is_fetchable(absolute):
            pieces[0] = absolute
        rewritten.append(" ".join(pieces))
    return ", ".join(rewritten)


def rewrite_url(value: str, base_url: str, url_to_path: dict[str, Path], from_file: Path) -> str:
    if not value or value.startswith(("#", "mailto:", "tel:", "javascript:", "data:")):
        return value
    absolute = normalize_url(urljoin(base_url, value))
    if absolute in url_to_path:
        return relpath(from_file, url_to_path[absolute])
    if is_fetchable(absolute):
        return absolute
    return value


def rewrite_css(css: str, base_url: str, url_to_path: dict[str, Path], from_file: Path) -> str:
    def replace_url(match: re.Match[str]) -> str:
        raw = match.group(1).strip("\"' ")
        return f"url({rewrite_url(raw, base_url, url_to_path, from_file)})"

    def replace_import(match: re.Match[str]) -> str:
        raw = match.group(1).strip("\"' ")
        return f"@import url({rewrite_url(raw, base_url, url_to_path, from_file)})"

    css = re.sub(r"url\(([^)]+)\)", replace_url, css, flags=re.I)
    return re.sub(r"@import\s+(?:url\()?['\"]?([^'\"\);]+)['\"]?\)?", replace_import, css, flags=re.I)


def rewrite_html(html: str, base_url: str, url_to_path: dict[str, Path], from_file: Path) -> str:
    def replace_attr(match: re.Match[str]) -> str:
        attr, quote, value = match.groups()
        if attr.lower() in {"srcset", "imagesrcset"}:
            rewritten = rewrite_srcset(value, base_url, url_to_path, from_file)
        else:
            rewritten = rewrite_url(value, base_url, url_to_path, from_file)
        return f"{attr}={quote}{rewritten}{quote}"

    html = re.sub(r"\b(href|src|poster|srcset|imagesrcset)=(['\"])(.*?)\2", replace_attr, html, flags=re.I)

    def replace_style(match: re.Match[str]) -> str:
        quote, value = match.groups()
        return f"style={quote}{rewrite_css(value, base_url, url_to_path, from_file)}{quote}"

    html = re.sub(r"\bstyle=(['\"])(.*?)\1", replace_style, html, flags=re.I | re.S)

    for absolute, path in sorted(url_to_path.items(), key=lambda item: len(item[0]), reverse=True):
        parsed = urlparse(absolute)
        if parsed.scheme not in {"http", "https"}:
            continue
        local = relpath(from_file, path)
        protocol_relative = urlunparse(("", parsed.netloc, parsed.path, "", parsed.query, ""))
        html = html.replace(absolute, local).replace(protocol_relative, local)
    return html


def save_asset(root: Path, url: str, url_to_path: dict[str, Path]) -> tuple[Asset | None, list[str], str | None]:
    try:
        data, content_type, final_url = fetch(url)
        expected_suffix = Path(urlparse(url).path).suffix.lower()
        if content_type == "text/html" and expected_suffix in EXPECTED_ASSET_EXTENSIONS:
            fallback = root_asset_fallback(url)
            if fallback:
                data, content_type, final_url = fetch(fallback)
        if content_type == "text/html" and expected_suffix in EXPECTED_ASSET_EXTENSIONS:
            return None, [], f"skipped HTML response for asset URL: {final_url}"
    except (HTTPError, URLError, TimeoutError, socket.timeout, ValueError, OSError) as exc:
        return None, [], str(exc)

    target = local_path(root, final_url, content_type)
    target.parent.mkdir(parents=True, exist_ok=True)
    url_to_path[normalize_url(url)] = target
    url_to_path[final_url] = target

    discovered: list[str] = []
    if content_type == "text/css":
        css = data.decode("utf-8", "replace")
        for next_url in extract_css_urls(css):
            absolute = normalize_url(urljoin(final_url, next_url))
            if is_fetchable(absolute):
                discovered.append(absolute)
        target.write_text(css, encoding="utf-8")
    else:
        target.write_bytes(data)
    return Asset(final_url, target, content_type, len(data)), discovered, None


def archive_target(target: dict[str, str]) -> dict[str, object]:
    root = ARCHIVE_ROOT / target["slug"]
    root.mkdir(parents=True, exist_ok=True)
    captured_at = datetime.now(timezone.utc).isoformat()
    page_data, page_content_type, final_url = fetch(target["url"])
    html = page_data.decode("utf-8", "replace")
    index_path = root / "index.html"

    parser = PageAssetParser(final_url)
    parser.feed(html)

    queue = deque(dict.fromkeys(parser.urls + extract_inline_asset_urls(html, final_url)))
    seen: set[str] = set()
    url_to_path: dict[str, Path] = {}
    assets: list[Asset] = []
    errors: list[dict[str, str]] = []

    while queue and len(seen) < MAX_ASSETS_PER_SITE:
        url = queue.popleft()
        if url in seen:
            continue
        seen.add(url)
        asset, discovered, error = save_asset(root, url, url_to_path)
        if error:
            errors.append({"url": url, "error": error})
            continue
        if asset:
            assets.append(asset)
        for next_url in discovered:
            if next_url not in seen:
                queue.append(next_url)

    for asset in assets:
        if asset.content_type == "text/css":
            css = asset.path.read_text(encoding="utf-8", errors="replace")
            asset.path.write_text(rewrite_css(css, asset.url, url_to_path, asset.path), encoding="utf-8")

    rewritten_html = rewrite_html(html, final_url, url_to_path, index_path)
    index_path.write_text(rewritten_html, encoding="utf-8")
    (root / "source.html").write_text(html, encoding="utf-8")
    (root / "live-url.txt").write_text(final_url, encoding="utf-8")

    manifest = {
        "name": target["name"],
        "source": target["url"],
        "finalUrl": final_url,
        "capturedAt": captured_at,
        "archiveType": "one-page-html-with-downloaded-assets",
        "assetCount": len(assets),
        "errorCount": len(errors),
        "files": ["index.html", "source.html", "live-url.txt", "manifest.json", "assets/"],
        "assets": [
            {
                "url": asset.url,
                "path": str(asset.path.relative_to(root)),
                "contentType": asset.content_type,
                "size": asset.size,
            }
            for asset in assets
        ],
        "errors": errors[:50],
    }
    (root / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return manifest


def main() -> None:
    ARCHIVE_ROOT.mkdir(parents=True, exist_ok=True)
    manifests = [archive_target(target) for target in TARGETS]
    summary = {
        "capturedAt": datetime.now(timezone.utc).isoformat(),
        "archiveType": "one-page-html-with-downloaded-assets",
        "archives": [
            {
                "name": manifest["name"],
                "source": manifest["source"],
                "finalUrl": manifest["finalUrl"],
                "assetCount": manifest["assetCount"],
                "errorCount": manifest["errorCount"],
            }
            for manifest in manifests
        ],
    }
    (ARCHIVE_ROOT / "manifest.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
