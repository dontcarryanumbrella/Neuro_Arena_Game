"""Serve Neuro Arena locally without browser caching, so edits always show up on reload.

    python serve.py        then open http://localhost:8137
"""
import http.server
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8137


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


# threaded: browsers keep spare connections open, which would stall a one-at-a-time server
http.server.ThreadingHTTPServer.allow_reuse_address = True
with http.server.ThreadingHTTPServer(('', PORT), NoCache) as httpd:
    print(f'Neuro Arena on http://localhost:{PORT}')
    httpd.serve_forever()
