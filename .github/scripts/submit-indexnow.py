"""Submit canonical URLs from the deployed sitemap after a successful deployment."""
import json
import os
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from xml.etree import ElementTree

host, key = os.environ["SITE_HOST"], os.environ["INDEXNOW_KEY"]
base = "https://" + host

def get(url):
    with urlopen(Request(url, headers={"User-Agent": "Owner-SEO-Maintenance/1.0"}), timeout=20) as response:
        if response.status != 200:
            raise RuntimeError(f"Unexpected HTTP {response.status}")
        return response.read(1_000_000).decode("utf-8")

if get(f"{base}/{key}.txt").strip() != key:
    raise RuntimeError("Published IndexNow verification key does not match")
root = ElementTree.fromstring(get(base + "/sitemap.xml"))
urls = list(dict.fromkeys(n.text.strip() for n in root.findall("{*}url/{*}loc") if n.text))
if not urls or len(urls) > 100 or any(urlparse(u).scheme != "https" or urlparse(u).netloc != host for u in urls):
    raise RuntimeError("Expected 1-100 canonical same-host HTTPS URLs")
payload = {"host": host, "key": key, "keyLocation": f"{base}/{key}.txt", "urlList": urls}
request = Request("https://api.indexnow.org/indexnow", data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"}, method="POST")
with urlopen(request, timeout=20) as response:
    if response.status not in (200, 202):
        raise RuntimeError(f"IndexNow rejected the submission: HTTP {response.status}")
    print(f"IndexNow accepted {len(urls)} deployed URLs (HTTP {response.status}). Acceptance does not guarantee indexing.")
