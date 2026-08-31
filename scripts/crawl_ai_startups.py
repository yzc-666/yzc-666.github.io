#!/usr/bin/env python3
"""Refresh the public CN/US AI startup tracker.

Sources are all public JSON/RSS endpoints. Failures in one source should not
abort the run; the previous seed plus whatever succeeded still gets written.
"""

from __future__ import annotations

import json
import re
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SEED_PATH = Path(__file__).resolve().parent / "seed_ai_startups.json"
OUT_PATH = ROOT / "data" / "ai-startups.json"

USER_AGENT = (
    "yzc-666.github.io-ai-tracker/1.0 "
    "(+https://github.com/yzc-666/yzc-666.github.io)"
)
TIMEOUT = 25
YC_RECENT_MONTHS = 30
YC_CAP = 90
PROJECT_CAP = 36

AI_TAG_URLS = [
    "https://yc-oss.github.io/api/tags/artificial-intelligence.json",
    "https://yc-oss.github.io/api/tags/ai.json",
    "https://yc-oss.github.io/api/tags/generative-ai.json",
    "https://yc-oss.github.io/api/tags/machine-learning.json",
]

RSS_FEEDS = [
    ("techcrunch-ai", "https://techcrunch.com/category/artificial-intelligence/feed/", "US"),
    ("technode", "https://technode.com/feed/", "CN"),
    ("36kr", "https://rsshub.app/36kr/information/AI", "CN"),
]

AI_TEXT = re.compile(
    r"(ai|a\.i\.|llm|gpt|agent|model|foundation|generative|机器学习|大模型|"
    r"人工智能|生成式|智能体|创业)",
    re.I,
)
TAG_RE = re.compile(r"<[^>]+>")
WS_RE = re.compile(r"\s+")

CN_HINTS = (
    "china",
    "chinese",
    "beijing",
    "shanghai",
    "shenzhen",
    "hangzhou",
    "guangzhou",
    "chengdu",
    "suzhou",
    "nanjing",
    "wuhan",
    "hong kong",
    "hongkong",
)
US_HINTS = (
    "united states",
    "usa",
    "u.s.",
    "america / canada",
    "san francisco",
    "new york",
    "seattle",
    "austin",
    "boston",
    "palo alto",
    "mountain view",
    "los angeles",
    "california",
)


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def log(msg: str) -> None:
    print(msg, file=sys.stderr)


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-") or "item"


def clean_text(value: str | None, limit: int = 280) -> str:
    if not value:
        return ""
    text = unescape(TAG_RE.sub(" ", str(value)))
    text = WS_RE.sub(" ", text).strip()
    if len(text) > limit:
        text = text[: limit - 1].rstrip() + "…"
    return text


def fetch(url: str, accept: str = "application/json") -> bytes | None:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": accept,
        },
        method="GET",
    )
    ctx = ssl.create_default_context()
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT, context=ctx) as resp:
            return resp.read()
    except (urllib.error.URLError, TimeoutError, ssl.SSLError, ValueError) as exc:
        log(f"skip {url}: {exc}")
        return None


def fetch_json(url: str):
    raw = fetch(url, accept="application/json")
    if not raw:
        return None
    try:
        return json.loads(raw.decode("utf-8"))
    except json.JSONDecodeError as exc:
        log(f"bad json {url}: {exc}")
        return None


def load_seed() -> list[dict]:
    data = json.loads(SEED_PATH.read_text(encoding="utf-8"))
    companies = []
    for item in data.get("companies", []):
        companies.append(normalize_company(item, source="seed"))
    return companies


def product_list(raw) -> list[dict]:
    out = []
    seen = set()
    for item in raw or []:
        if isinstance(item, str):
            name, note, url = item, "", ""
        else:
            name = clean_text(item.get("name"), 80)
            note = clean_text(item.get("note"), 140)
            url = (item.get("url") or "").strip()
        key = name.lower()
        if not name or key in seen:
            continue
        seen.add(key)
        entry = {"name": name}
        if note:
            entry["note"] = note
        if url:
            entry["url"] = url
        out.append(entry)
    return out[:8]


def infer_country(blob: str, fallback: str = "") -> str:
    text = blob.lower()
    if any(h in text for h in CN_HINTS):
        return "CN"
    if any(h in text for h in US_HINTS):
        return "US"
    return fallback


def normalize_company(item: dict, source: str) -> dict:
    name = clean_text(item.get("name"), 80)
    country = (item.get("country") or "").upper()
    if country not in {"CN", "US"}:
        country = infer_country(
            " ".join(
                [
                    item.get("all_locations") or "",
                    " ".join(item.get("regions") or []),
                    item.get("location") or "",
                    name,
                ]
            ),
            fallback="",
        )
    tags = []
    for tag in item.get("tags") or []:
        t = clean_text(str(tag), 40)
        if t and t.lower() not in {x.lower() for x in tags}:
            tags.append(t)
    website = (item.get("website") or item.get("url") or "").strip()
    if website and not website.startswith("http"):
        website = "https://" + website
    products = product_list(item.get("products"))
    one_liner = clean_text(item.get("one_liner") or item.get("long_description"), 220)
    if not products and one_liner:
        products = [{"name": name, "note": one_liner}]
    return {
        "id": item.get("id") or f"{source}:{slugify(name)}",
        "name": name,
        "country": country,
        "website": website,
        "one_liner": one_liner,
        "tags": tags[:8],
        "products": products,
        "batch": clean_text(item.get("batch"), 40),
        "status": clean_text(item.get("status"), 24) or "Active",
        "source": source,
        "source_url": (item.get("source_url") or item.get("yc_url") or "").strip(),
        "wiki_title": item.get("wiki_title") or "",
        "launched_at": item.get("launched_at") or 0,
    }


def merge_company(base: dict, incoming: dict) -> dict:
    out = dict(base)
    if incoming.get("one_liner") and (
        not out.get("one_liner") or incoming["source"] == "seed"
    ):
        if incoming["source"] == "seed" or not out["one_liner"]:
            out["one_liner"] = incoming["one_liner"]
    if incoming.get("website") and not out.get("website"):
        out["website"] = incoming["website"]
    if incoming.get("batch") and not out.get("batch"):
        out["batch"] = incoming["batch"]
    if incoming.get("source_url") and not out.get("source_url"):
        out["source_url"] = incoming["source_url"]
    tags = list(out.get("tags") or [])
    for tag in incoming.get("tags") or []:
        if tag.lower() not in {t.lower() for t in tags}:
            tags.append(tag)
    out["tags"] = tags[:8]
    products = list(out.get("products") or [])
    seen = {p["name"].lower() for p in products}
    for prod in incoming.get("products") or []:
        key = prod["name"].lower()
        if key in seen:
            continue
        products.append(prod)
        seen.add(key)
    out["products"] = products[:8]
    if incoming.get("launched_at"):
        out["launched_at"] = max(int(out.get("launched_at") or 0), int(incoming["launched_at"]))
    return out


def refresh_wikipedia(companies: list[dict]) -> None:
    for company in companies:
        title = company.get("wiki_title")
        if not title:
            continue
        encoded = urllib.parse.quote(title.replace(" ", "_"))
        url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{encoded}"
        data = fetch_json(url)
        time.sleep(0.15)
        if not isinstance(data, dict):
            continue
        extract = clean_text(data.get("extract"), 220)
        if extract and not company.get("one_liner"):
            company["one_liner"] = extract
        wiki_url = (data.get("content_urls") or {}).get("desktop", {}).get("page")
        if wiki_url and not company.get("source_url"):
            company["source_url"] = wiki_url


def is_recent(ts: int) -> bool:
    if not ts:
        return False
    cutoff = now_utc() - timedelta(days=30 * YC_RECENT_MONTHS)
    try:
        launched = datetime.fromtimestamp(int(ts), tz=timezone.utc)
    except (OSError, OverflowError, ValueError):
        return False
    return launched >= cutoff


def crawl_yc() -> list[dict]:
    found: dict[str, dict] = {}
    for url in AI_TAG_URLS:
        payload = fetch_json(url)
        if not isinstance(payload, list):
            continue
        log(f"yc {url} -> {len(payload)} rows")
        for raw in payload:
            if not isinstance(raw, dict):
                continue
            item = dict(raw)
            item["yc_url"] = raw.get("url") or ""
            item["url"] = raw.get("website") or raw.get("url") or ""
            company = normalize_company(item, source="yc")
            if company["country"] not in {"CN", "US"}:
                continue
            if (company.get("status") or "Active") not in {"Active", "Public"}:
                continue
            keep = bool(raw.get("top_company")) or is_recent(raw.get("launched_at") or 0)
            if not keep:
                continue
            key = company["name"].lower()
            prev = found.get(key)
            found[key] = merge_company(prev, company) if prev else company
    ranked = sorted(
        found.values(),
        key=lambda c: (c.get("launched_at") or 0, c["name"].lower()),
        reverse=True,
    )
    return ranked[:YC_CAP]


def rss_items(url: str) -> list[dict]:
    raw = fetch(url, accept="application/rss+xml, application/atom+xml, application/xml, text/xml")
    if not raw:
        return []
    try:
        root = ET.fromstring(raw)
    except ET.ParseError as exc:
        log(f"bad rss {url}: {exc}")
        return []

    ns = {"atom": "http://www.w3.org/2005/Atom"}
    items = []
    for node in root.findall("./channel/item"):
        items.append(
            {
                "title": (node.findtext("title") or "").strip(),
                "url": (node.findtext("link") or "").strip(),
                "summary": (node.findtext("description") or "").strip(),
                "published": (node.findtext("pubDate") or "").strip(),
            }
        )
    for node in root.findall("atom:entry", ns):
        link = ""
        for child in node.findall("atom:link", ns):
            if child.attrib.get("rel") in (None, "alternate"):
                link = child.attrib.get("href") or ""
                break
        items.append(
            {
                "title": (node.findtext("atom:title", default="", namespaces=ns) or "").strip(),
                "url": link,
                "summary": (
                    node.findtext("atom:summary", default="", namespaces=ns)
                    or node.findtext("atom:content", default="", namespaces=ns)
                    or ""
                ).strip(),
                "published": (node.findtext("atom:updated", default="", namespaces=ns) or "").strip(),
            }
        )
    return items


def crawl_rss() -> list[dict]:
    projects = []
    for source, url, country in RSS_FEEDS:
        rows = rss_items(url)
        log(f"rss {source} -> {len(rows)} rows")
        for row in rows:
            title = clean_text(row.get("title"), 140)
            if not title or not AI_TEXT.search(title + " " + (row.get("summary") or "")):
                continue
            projects.append(
                {
                    "id": f"rss:{slugify(title)[:80]}",
                    "name": title,
                    "country": country,
                    "url": (row.get("url") or "").strip(),
                    "summary": clean_text(row.get("summary"), 180),
                    "source": source,
                    "published_at": clean_text(row.get("published"), 60),
                }
            )
    return projects


def crawl_hn() -> list[dict]:
    cutoff = int((now_utc() - timedelta(days=21)).timestamp())
    projects = []
    queries = [
        {"query": "AI", "tags": "show_hn", "hitsPerPage": 40},
        {"query": "LLM", "tags": "story", "hitsPerPage": 25},
    ]
    for params in queries:
        url = (
            "https://hn.algolia.com/api/v1/search_by_date?"
            + urllib.parse.urlencode(
                {
                    **params,
                    "numericFilters": f"created_at_i>{cutoff}",
                }
            )
        )
        payload = fetch_json(url)
        if not isinstance(payload, dict):
            continue
        for hit in payload.get("hits") or []:
            title = clean_text(hit.get("title"), 140)
            if not title or not AI_TEXT.search(title):
                continue
            object_id = hit.get("objectID") or slugify(title)
            projects.append(
                {
                    "id": f"hn:{object_id}",
                    "name": title,
                    "country": infer_country(title, fallback="US"),
                    "url": hit.get("url")
                    or f"https://news.ycombinator.com/item?id={object_id}",
                    "summary": clean_text(
                        hit.get("story_text") or "Hacker News discussion", 180
                    ),
                    "source": "hacker-news",
                    "published_at": hit.get("created_at") or "",
                }
            )
    log(f"hn -> {len(projects)} rows")
    return projects


def dedupe_projects(projects: list[dict]) -> list[dict]:
    seen = set()
    out = []
    for item in projects:
        key = (item.get("name") or "").lower()
        if not key or key in seen:
            continue
        seen.add(key)
        out.append(item)
        if len(out) >= PROJECT_CAP:
            break
    return out


def sort_key(company: dict):
    return (
        0 if company["country"] == "CN" else 1,
        0 if company.get("source") == "seed" else 1,
        -(company.get("launched_at") or 0),
        company["name"].lower(),
    )


def main() -> int:
    companies = load_seed()
    by_name = {c["name"].lower(): c for c in companies}

    try:
        refresh_wikipedia(companies)
    except Exception as exc:  # noqa: BLE001
        log(f"wikipedia refresh failed: {exc}")

    for yc in crawl_yc():
        key = yc["name"].lower()
        if key in by_name:
            by_name[key] = merge_company(by_name[key], yc)
        else:
            by_name[key] = yc

    companies = [c for c in by_name.values() if c.get("name") and c.get("country") in {"CN", "US"}]
    companies.sort(key=sort_key)

    projects = dedupe_projects(crawl_hn() + crawl_rss())

    stats = {
        "total": len(companies),
        "cn": sum(1 for c in companies if c["country"] == "CN"),
        "us": sum(1 for c in companies if c["country"] == "US"),
        "projects": len(projects),
    }
    payload = {
        "updated_at": now_utc().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "stats": stats,
        "sources": [
            "seed catalog",
            "Wikipedia REST summary",
            "YC OSS AI tags",
            "Hacker News Algolia",
            "TechCrunch / TechNode / 36Kr RSS",
        ],
        "companies": [
            {k: v for k, v in c.items() if k != "wiki_title" and v not in ("", [], 0, None)}
            for c in companies
        ],
        "projects": projects,
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    log(f"wrote {OUT_PATH} ({stats['cn']} CN, {stats['us']} US, {stats['projects']} projects)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
