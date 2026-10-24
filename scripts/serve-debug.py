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
    def parse_request(self):
        if not super().parse_request():
            return False
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
        self.send_header('X-Lingrove-Debug-Auth', 'Stack-Pass')
        super().end_headers()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()
    token = os.environ.get('LINGROVE_DEBUG_TOKEN')
    if token is None:
        token = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(6))
    if not re.fullmatch(r'[A-Za-z0-9]{6}', token):
        parser.error('LINGROVE_DEBUG_TOKEN must contain exactly 6 ASCII letters or digits (case-sensitive)')
    project = Path(__file__).resolve().parent.parent
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
    with ThreadingHTTPServer(('0.0.0.0', args.port), partial(DebugHandler, directory=str(root))) as server:
        server.debug_token = token
        port = server.server_port
        print(f'Serving {root}', flush=True)
        print(f'  本机访问：http://localhost:{port}', flush=True)
        print(f'  Token：{token}', flush=True)
        print('  所有请求须携带 Stack-Pass: <Token>；在手机调试地址中填写 Token。', flush=True)
        addresses = local_addresses()
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
