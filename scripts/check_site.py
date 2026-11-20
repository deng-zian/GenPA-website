#!/usr/bin/env python3
"""Check the static website without installing Python dependencies."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import hashlib
import json
import re
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
        'param', 'source', 'track', 'wbr'}


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.refs, self.aria, self.stack = [], [], [], []
        self.datasets = {}
        self.capture = None
        self.buffer = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'):
            self.ids.append(attrs['id'])
        for key in ('src', 'href', 'poster'):
            if attrs.get(key):
                self.refs.append(attrs[key])
        for key in ('aria-controls', 'aria-labelledby', 'aria-describedby'):
            self.aria.extend(attrs.get(key, '').split())
        if tag == 'script' and attrs.get('type') == 'application/json':
            self.capture, self.buffer = attrs['id'], []
        if tag not in VOID:
            self.stack.append(tag)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        assert self.stack and self.stack[-1] == tag, f'Unbalanced HTML: {tag}'
        self.stack.pop()
        if tag == 'script' and self.capture:
            self.datasets[self.capture] = json.loads(''.join(self.buffer))
            self.capture = None

    def handle_data(self, text):
        if self.capture:
            self.buffer.append(text)


def check():
    page = Page()
    page.feed((ROOT / 'index.html').read_text())
    assert not page.stack, f'Unclosed elements: {page.stack}'
    duplicates = [key for key, count in Counter(page.ids).items() if count > 1]
    assert not duplicates, f'Duplicate IDs: {duplicates}'
    assert all(key in page.ids for key in page.aria), 'Missing ARIA target'
    for ref in page.refs:
        url = urlsplit(ref)
        if url.scheme or url.netloc:
            continue
        if url.path:
            assert (ROOT / unquote(url.path)).is_file(), f'Missing file: {ref}'
        elif url.fragment:
            assert url.fragment in page.ids, f'Missing anchor: {ref}'
    for inline, filename in {
        'benchmark-data': 'benchmark-data.json',
        'gul-total-data': 'latency-data.json',
        'gul-profile-data': 'latency-components.json',
        'supervision-data': 'supervision-data.json',
    }.items():
        assert page.datasets[inline] == json.loads((ROOT / 'assets' / filename).read_text()), \
            f'Embedded data differs from {filename}'
    for filename, expected in json.loads((ROOT / 'asset-manifest.json').read_text()).items():
        data = (ROOT / filename).read_bytes()
        assert len(data) == expected['bytes'], f'Asset size changed: {filename}'
        assert hashlib.sha256(data).hexdigest() == expected['sha256'], f'Asset hash changed: {filename}'
    for css in ROOT.glob('*.css'):
        for ref in re.findall(r'url\([\"\']?([^\)\"\']+)', css.read_text()):
            if not urlsplit(ref).scheme and not ref.startswith('#'):
                assert (css.parent / unquote(urlsplit(ref).path)).is_file(), f'Missing CSS asset: {ref}'
    scripts = sorted(ROOT.glob('*.js'))
    if shutil.which('node'):
        for script in scripts:
            subprocess.run(['node', '--check', str(script)], check=True, capture_output=True)
    print(json.dumps({'status': 'passed', 'html_ids': len(page.ids),
                      'local_and_external_references': len(page.refs),
                      'embedded_datasets': len(page.datasets),
                      'javascript_syntax': len(scripts) if shutil.which('node') else 'Node.js unavailable'}, indent=2))


if __name__ == '__main__':
    check()
