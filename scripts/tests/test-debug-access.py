"""Exercise LAN exemptions and proxy authentication through real HTTP requests."""
import http.client
from functools import partial
from http.server import HTTPServer
import ipaddress
import json
import os
from pathlib import Path
import runpy
import tempfile
import threading
import unittest
from unittest.mock import patch


debug = runpy.run_path(str(Path(__file__).resolve().parents[1] / 'serve-debug.py'))
AccessPolicy = debug['AccessPolicy']
configured_networks = debug['configured_networks']
load_access_settings = debug['load_access_settings']


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
        cls.server.debug_token = 'Ab12Cd'
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.thread.join(timeout=5)
        cls.server.server_close()
        cls.directory.cleanup()

    def setUp(self):
        self.server.access_policy = AccessPolicy(
            [ipaddress.ip_network('192.168.1.0/24')],
            [ipaddress.ip_network('192.168.1.10/32'), ipaddress.ip_network('172.17.0.0/16')],
            ['192.168.1.2'])

    def request(self, peer, path='/', headers=None, method='GET'):
        self.server.peer = peer
        connection = http.client.HTTPConnection(*self.server.server_address, timeout=5)
        try:
            connection.request(method, path, headers=headers or {})
            response = connection.getresponse()
            return response.status, response.getheader('X-Lingrove-Debug-Auth'), response.read()
        finally:
            connection.close()

    def test_lan_pages_and_assets_need_no_token(self):
        for method in ['GET', 'HEAD']:
            for path in ['/', '/assets/style.css']:
                with self.subTest(method=method, path=path):
                    status, auth, _ = self.request('192.168.1.20', path, method=method)
                    self.assertEqual((status, auth), (200, 'none'))
        self.assertEqual(self.request('192.168.1.20', headers={'Stack-Pass': 'wrong'})[0], 200)
        self.assertEqual(self.request('192.168.1.20', '/assets/')[0], 403)

    def test_nas_loopback_proxy_container_and_other_sources_need_token(self):
        for peer in ['192.168.1.2', '127.0.0.1', '192.168.1.10', '172.17.0.2', '192.168.2.20', '8.8.8.8']:
            for method in ['GET', 'HEAD']:
                with self.subTest(peer=peer, method=method):
                    self.assertEqual(self.request(peer, method=method)[0], 401)
                    self.assertEqual(self.request(peer, headers={'Stack-Pass': 'wrong'}, method=method)[0], 401)
                    self.assertEqual(self.request(peer, headers={'Stack-Pass': 'Ab12Cd'}, method=method)[:2], (200, 'Stack-Pass'))

    def test_proxy_inside_exempt_lan_still_needs_token(self):
        for header in debug['FORWARDING_HEADERS']:
            with self.subTest(header=header):
                self.assertEqual(self.request('192.168.1.20', headers={header: '192.168.1.30'})[0], 401)
                self.assertEqual(self.request('192.168.1.20', headers={header: '', 'Stack-Pass': 'Ab12Cd'})[:2], (200, 'Stack-Pass'))

    def test_forwarded_values_cannot_grant_lan_access(self):
        for peer in ['127.0.0.1', '192.168.1.2', '8.8.8.8']:
            self.assertEqual(self.request(peer, headers={'X-Forwarded-For': '192.168.1.20'})[0], 401)

    def test_no_allowlist_keeps_all_requests_authenticated(self):
        self.server.access_policy = AccessPolicy()
        self.assertEqual(self.request('192.168.1.20')[0], 401)

    def settings_project(self):
        project = Path(self.directory.name) / self.id().split('.')[-1]
        (project / '.local').mkdir(parents=True, exist_ok=True)
        return project

    def test_local_settings_protect_proxies_and_exempt_other_lan_clients(self):
        project = self.settings_project()
        config = {'lanCidrs': ['10.42.0.0/24'], 'proxyCidrs': ['10.42.0.10/32', '10.42.0.11/32']}
        (project / '.local/debug-server.json').write_text(json.dumps(config), encoding='utf-8')
        with patch.dict(os.environ, {}, clear=True):
            settings = load_access_settings(project)
            self.server.access_policy = AccessPolicy(
                configured_networks('LINGROVE_DEBUG_LAN_CIDRS', lan_only=True, default=settings['lanCidrs']),
                configured_networks('LINGROVE_DEBUG_PROXY_CIDRS', default=settings['proxyCidrs']),
                ['10.42.0.9'])
        for peer in ['10.42.0.10', '10.42.0.11']:
            for method in ['GET', 'HEAD']:
                with self.subTest(peer=peer, method=method):
                    self.assertEqual(self.request(peer, method=method)[0], 401)
                    self.assertEqual(self.request(peer, headers={'Stack-Pass': 'Ab12Cd'}, method=method)[:2], (200, 'Stack-Pass'))
        for peer in ['10.42.0.1', '10.42.0.3', '10.42.0.20', '10.42.0.254']:
            self.assertEqual(self.request(peer)[:2], (200, 'none'))
        for peer in ['10.42.1.20', '172.17.0.2', '8.8.8.8', '10.42.0.9']:
            self.assertEqual(self.request(peer)[0], 401)
        self.assertEqual(self.request('10.42.0.20', headers={'X-Forwarded-For': '10.42.0.3'})[0], 401)

    def test_missing_local_settings_has_no_network_exemptions(self):
        project = self.settings_project()
        with patch.dict(os.environ, {}, clear=True):
            self.assertEqual(load_access_settings(project), {})
            self.assertEqual(configured_networks('LINGROVE_DEBUG_LAN_CIDRS', lan_only=True), [])
            self.assertEqual(configured_networks('LINGROVE_DEBUG_PROXY_CIDRS'), [])

    def test_local_settings_reject_malformed_json_and_invalid_fields(self):
        project = self.settings_project()
        for value in ['invalid', '[]', '{"unexpected": []}', '{"lanCidrs": "10.42.0.0/24"}', '{"proxyCidrs": [1]}']:
            with self.subTest(value=value):
                (project / '.local/debug-server.json').write_text(value, encoding='utf-8')
                with self.assertRaises(ValueError):
                    load_access_settings(project)

    def test_environment_overrides_local_settings_and_can_disable_exemptions(self):
        name = 'LINGROVE_DEBUG_LAN_CIDRS'
        configured = ['10.42.0.0/24']
        with patch.dict(os.environ, {name: ''}):
            self.assertEqual(configured_networks(name, lan_only=True, default=configured), [])
        with patch.dict(os.environ, {name: '192.168.10.0/24'}):
            self.assertEqual(configured_networks(name, lan_only=True, default=configured), [ipaddress.ip_network('192.168.10.0/24')])

    def test_local_destination_and_unknown_sources_require_token(self):
        policy = self.server.access_policy
        self.assertTrue(policy.requires_token('192.168.1.30', '192.168.1.30', {}))
        self.assertTrue(policy.requires_token('invalid', '192.168.1.2', {}))

    def test_network_configuration_is_explicit_and_private(self):
        name = 'LINGROVE_DEBUG_LAN_CIDRS'
        with patch.dict(os.environ, {name: '192.168.1.0/24, 10.2.0.0/16'}):
            self.assertEqual(len(configured_networks(name, lan_only=True)), 2)
        for value in ['0.0.0.0/0', '8.8.8.0/24', '127.0.0.0/8', 'invalid', 'fc00::/7']:
            with self.subTest(value=value), patch.dict(os.environ, {name: value}):
                with self.assertRaises(ValueError):
                    configured_networks(name, lan_only=True)


if __name__ == '__main__':
    unittest.main()
