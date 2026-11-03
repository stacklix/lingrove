"""Exercise unauthenticated debug access through real HTTP requests."""
import http.client
from functools import partial
from http.server import HTTPServer
from pathlib import Path
import runpy
import tempfile
import threading
import unittest


debug = runpy.run_path(str(Path(__file__).resolve().parents[1] / 'serve-debug.py'))
class QuietHandler(debug['DebugHandler']):
    def log_message(self, *_args):
        pass


class SourceServer(HTTPServer):
    """Keep real HTTP handling while simulating the accepted TCP peer address."""
    peer = '192.168.1.20'

    def get_request(self):
        connection, address = super().get_request()
        return connection, (self.peer, address[1])


class DebugAccessTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.directory = tempfile.TemporaryDirectory(prefix='lingrove-debug-access-')
        root = Path(cls.directory.name)
        assert root.resolve().parent == Path(tempfile.gettempdir()).resolve()
        (root / 'index.html').write_text('debug page', encoding='utf-8')
        (root / 'assets').mkdir()
        (root / 'assets/style.css').write_text('body {}', encoding='utf-8')
        cls.server = SourceServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(root)))
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.thread.join(timeout=5)
        cls.server.server_close()
        cls.directory.cleanup()

    def request(self, peer, path='/', headers=None, method='GET'):
        self.server.peer = peer
        connection = http.client.HTTPConnection(*self.server.server_address, timeout=5)
        try:
            connection.request(method, path, headers=headers or {})
            response = connection.getresponse()
            return response.status, response.getheader('X-Lingrove-Debug-Auth'), response.read()
        finally:
            connection.close()

    def test_all_sources_and_forwarded_requests_need_no_token(self):
        for peer in ['192.168.1.20', '192.168.1.2', '127.0.0.1', '172.17.0.2', '8.8.8.8']:
            for headers in [{}, {'X-App-Token': 'wrong'}, {'X-Forwarded-For': '8.8.8.8'}, {'Forwarded': 'for=8.8.8.8'}]:
                for method in ['GET', 'HEAD']:
                    for path in ['/', '/assets/style.css']:
                        with self.subTest(peer=peer, headers=headers, method=method, path=path):
                            self.assertEqual(self.request(peer, path, headers, method)[:2], (200, 'none'))
        self.assertEqual(self.request('127.0.0.1', '/assets/')[0], 403)
        self.assertEqual(self.request('127.0.0.1', '/missing')[0], 404)


if __name__ == '__main__':
    unittest.main()
