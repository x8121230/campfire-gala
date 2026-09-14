"""Forest main launcher: stable local origin, no source or save mutation."""
import functools
import http.server
import json
import pathlib
import urllib.request
import webbrowser

ROOT = pathlib.Path(__file__).resolve().parent
PORT = 8771
URL = f'http://127.0.0.1:{PORT}'
TOKEN = 'forest-main-20260912'

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/__forest_launcher__':
            data = json.dumps({'token': TOKEN, 'root': str(ROOT)}).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        else:
            super().do_GET()

def main():
    missing = [p for p in ('index.html', 'src/main.js', 'assets') if not (ROOT / p).exists()]
    if missing:
        print('Missing required files/folder:', ', '.join(missing))
        print('Copy the UPDATE contents into the original game folder, alongside assets.')
        return
    try:
        server = http.server.ThreadingHTTPServer(('127.0.0.1', PORT), functools.partial(Handler, directory=str(ROOT)))
    except OSError:
        try:
            with urllib.request.urlopen(URL + '/__forest_launcher__', timeout=2) as response:
                info = json.load(response)
            if info.get('token') == TOKEN and info.get('root') == str(ROOT):
                webbrowser.open(URL + '/index.html')
                print('Opened the existing Forest server.')
                return
        except Exception:
            pass
        print('Port 8771 is occupied by another server. Close the old preview/server window and try again.')
        print('No process was stopped and no port was changed.')
        return
    with server:
        print('Forest main:', URL + '/index.html')
        print('Keep this window open. Ctrl+C to stop.')
        webbrowser.open(URL + '/index.html')
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass

if __name__ == '__main__':
    main()
