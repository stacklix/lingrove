"""Serve unpacked debug resources without HTTP caching or compression."""
import argparse
import json
import ipaddress
import socket
import re
import os
import secrets
import string
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

PRIVATE_LAN_RANGES = tuple(ipaddress.ip_network(value) for value in (
    '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'))
FORWARDING_HEADERS = (
    'Forwarded', 'X-Forwarded-For', 'X-Forwarded-Host',
    'X-Forwarded-Proto', 'X-Real-IP', 'Via')


def load_access_settings(project):
    try:
        settings = json.loads((project / '.local/debug-server.json').read_text(encoding='utf-8'))
    except FileNotFoundError:
        return {}
    if not isinstance(settings, dict) or set(settings) - {'lanCidrs', 'proxyCidrs'}:
        raise ValueError('.local/debug-server.json must contain only lanCidrs and proxyCidrs')
    for key, values in settings.items():
        if not isinstance(values, list) or any(not isinstance(value, str) for value in values):
            raise ValueError(f'{key} must be a list of IPv4 addresses or subnets')
    return settings


def configured_networks(name, lan_only=False, default=()):
    networks = []
    raw = os.environ.get(name)
    values = re.split(r'[\s,]+', raw.strip()) if raw is not None else default
    for value in filter(None, values):
        network = ipaddress.ip_network(value, strict=False)
        if network.version != 4:
            raise ValueError(f'{name} only supports IPv4 addresses or subnets')
        if lan_only and not any(network.subnet_of(private) for private in PRIVATE_LAN_RANGES):
            raise ValueError(f'{name} must contain only private LAN subnets')
        networks.append(network)
    return networks


class AccessPolicy:
    def __init__(self, lan_networks=(), proxy_networks=(), local_ips=()):
        self.lan_networks = tuple(lan_networks)
        self.proxy_networks = tuple(proxy_networks)
        self.local_ips = {ipaddress.ip_address(value) for value in local_ips}

    def requires_token(self, peer, local, headers):
        # Forwarded values are never used to grant access. Merely carrying a
        # proxy header makes a request authenticated, regardless of its value.
        if any(name in headers for name in FORWARDING_HEADERS):
            return True
        try:
            source = ipaddress.ip_address(peer)
            destination = ipaddress.ip_address(local)
        except ValueError:
            return True
        # frpc on the NAS connects from the NAS itself or its container network.
        # Explicit proxy ranges take precedence over every LAN exemption.
        if (source.is_loopback or source == destination or source in self.local_ips
                or any(source in network for network in self.proxy_networks)):
            return True
        return not any(source in network for network in self.lan_networks)


def local_addresses():
    addresses = []
    # UDP connect selects the outbound interface without sending any packets.
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as probe:
            probe.connect(('8.8.8.8', 80))
            addresses.append(probe.getsockname()[0])
    except OSError:
        pass
    try:
        addresses.extend(info[4][0] for info in socket.getaddrinfo(
            socket.gethostname(), None, socket.AF_INET, socket.SOCK_STREAM))
    except OSError:
        pass
    return [address for address in dict.fromkeys(addresses)
            if not (ipaddress.ip_address(address).is_loopback
                    or ipaddress.ip_address(address).is_unspecified)]


class DebugHandler(SimpleHTTPRequestHandler):
    requires_token = True

    def parse_request(self):
        self.requires_token = True
        if not super().parse_request():
            return False
        self.requires_token = self.server.access_policy.requires_token(
            self.client_address[0], self.connection.getsockname()[0], self.headers)
        if not self.requires_token:
            return True
        tokens = self.headers.get_all('Stack-Pass', [])
        expected = self.server.debug_token.encode('utf-8')
        if len(tokens) != 1 or not secrets.compare_digest(tokens[0].encode('utf-8'), expected):
            self.send_response(401)
            self.send_header('WWW-Authenticate', 'Stack-Pass realm="Lingrove Debug"')
            self.send_header('Content-Length', '0')
            self.end_headers()
            self.close_connection = True
            return False
        return True

    def list_directory(self, path):
        self.send_error(403, 'Directory listing is disabled')
        return None

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Lingrove-Debug-Auth', 'Stack-Pass' if self.requires_token else 'none')
        super().end_headers()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()
    project = Path(__file__).resolve().parent.parent
    token = os.environ.get('LINGROVE_DEBUG_TOKEN')
    if token is None:
        token = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(6))
    if not re.fullmatch(r'[A-Za-z0-9]{6}', token):
        parser.error('LINGROVE_DEBUG_TOKEN must contain exactly 6 ASCII letters or digits (case-sensitive)')
    try:
        settings = load_access_settings(project)
        lan_networks = configured_networks('LINGROVE_DEBUG_LAN_CIDRS', lan_only=True, default=settings.get('lanCidrs', []))
        proxy_networks = configured_networks('LINGROVE_DEBUG_PROXY_CIDRS', default=settings.get('proxyCidrs', []))
    except (OSError, ValueError) as error:
        parser.error(str(error))
    root = project / 'dist'
    try:
        modules = json.loads((project / 'modules.json').read_text())
    except (OSError, ValueError) as error:
        parser.error(f'Cannot read modules.json: {error}')
    if (not isinstance(modules, list) or not modules
            or any(not isinstance(name, str) or not re.fullmatch(r'[a-z0-9][a-z0-9-]{0,63}', name) for name in modules)
            or len(set(modules)) != len(modules)):
        parser.error('modules.json must contain unique module directory names')
    missing = [name for name in modules if not (root / 'snapshot/app' / name / 'index.html').is_file()]
    if missing:
        parser.error(f'Missing built resources for {", ".join(missing)}. Run npm run build first')
    addresses = local_addresses()
    with ThreadingHTTPServer(('0.0.0.0', args.port), partial(DebugHandler, directory=str(root))) as server:
        server.debug_token = token
        server.access_policy = AccessPolicy(lan_networks, proxy_networks, addresses)
        port = server.server_port
        print(f'Serving {root}', flush=True)
        print(f'  本机访问：http://localhost:{port}', flush=True)
        print(f'  Token：{token}', flush=True)
        if lan_networks:
            print(f'  免 Token 局域网：{", ".join(map(str, lan_networks))}', flush=True)
        else:
            print('  未配置免 Token 网段，所有请求均需 Token。', flush=True)
        print('  NAS 自身、回环、代理及其他来源须携带 Stack-Pass: <Token>。', flush=True)
        if proxy_networks:
            print(f'  强制认证代理网段：{", ".join(map(str, proxy_networks))}', flush=True)
        for address in addresses:
            print(f'  局域网地址：http://{address}:{port}', flush=True)
        if addresses:
            print('将局域网地址填入 Lingrove 的调试服务器地址，设备需处于同一网络。', flush=True)
        else:
            print(f'未能自动获取局域网 IP，请在网络设置中查看并填写 http://<本机 IP>:{port}。', flush=True)
        for name in modules:
            print(f'  /snapshot/app/{name}/index.html', flush=True)
        server.serve_forever()


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('\n调试服务器已停止。', flush=True)
