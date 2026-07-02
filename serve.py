#!/usr/bin/env python3
"""Dev server for Spendr: static files with no-cache headers.

Plain `python3 -m http.server` sends no Cache-Control, so browsers heuristically
cache ES modules and keep running stale code after edits. This forces revalidation.
"""
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, must-revalidate')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5177
    # 0.0.0.0 → reachable from other devices on the same Wi-Fi (e.g. your phone)
    print(f'Serving Spendr on http://localhost:{port}/ and on this machine\'s LAN IP (no-cache)')
    HTTPServer(('0.0.0.0', port), NoCacheHandler).serve_forever()
