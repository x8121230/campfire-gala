"""Local-only demo server. Python 3 required. No external dependencies."""
import functools
import http.server
import pathlib
import threading
import webbrowser

if __name__ == '__main__':
    root = pathlib.Path(__file__).resolve().parent
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(root))
    # Stable origin keeps this demo's localStorage available after a server restart.
    with http.server.ThreadingHTTPServer(('127.0.0.1', 8771), handler) as server:
        address = f'http://127.0.0.1:{server.server_port}/wardrobe-preview.html'
        print('Wardrobe preview:', address)
        print('Keep this window open. Ctrl+C to stop.')
        threading.Timer(0.6, lambda: webbrowser.open(address)).start()
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
