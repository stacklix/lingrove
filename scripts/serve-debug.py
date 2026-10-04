"""Serve unpacked debug resources without HTTP caching or compression."""
import argparse
import json
import ipaddress
import socket
import re
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
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()
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
    missing = [name for name in modules if not (root / name / 'index.html').is_file()]
    if missing:
        parser.error(f'Missing built resources for {", ".join(missing)}. Run npm run build first')
    with ThreadingHTTPServer(('0.0.0.0', args.port), partial(DebugHandler, directory=str(root))) as server:
        port = server.server_port
        print(f'Serving {root}', flush=True)
        print(f'  本机访问：http://localhost:{port}', flush=True)
        addresses = local_addresses()
        for address in addresses:
            print(f'  局域网地址：http://{address}:{port}', flush=True)
        if addresses:
            print('将局域网地址填入 Lingrove 的调试服务器地址，设备需处于同一网络。', flush=True)
        else:
            print(f'未能自动获取局域网 IP，请在网络设置中查看并填写 http://<本机 IP>:{port}。', flush=True)
        for name in modules:
            print(f'  /{name}/index.html', flush=True)
        server.serve_forever()


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('\n调试服务器已停止。', flush=True)
