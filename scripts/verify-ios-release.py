"""Verify a compiled Release .app, including the executable and installed configuration."""
import json
import plistlib
import sys
from pathlib import Path


def verify(bundle):
    info = plistlib.loads((bundle / 'Info.plist').read_bytes())
    config = json.loads((bundle / 'HostConfig.json').read_text(encoding='utf-8'))
    assert set(config) == {'catalogURL'}, 'Release must only include the formal catalog configuration'
    assert config['catalogURL'] == 'https://lingrove.stackli.me/catalog.json'
    ats = info.get('NSAppTransportSecurity', {})
    assert not any(ats.get(key) for key in (
        'NSAllowsArbitraryLoads', 'NSAllowsArbitraryLoadsInWebContent', 'NSAllowsLocalNetworking'
    )), 'Release includes development network exceptions'
    assert 'NSLocalNetworkUsageDescription' not in info, 'Release includes debug local-network configuration'
    executable = (bundle / info['CFBundleExecutable']).read_bytes()
    for marker in (
        b'DebugServer', b'GitHubBuildStatus', b'DebugAddressRow', b'ModuleDeveloperDetailsView',
        b'ModuleReloadRecord', b'debug.servers', b'modules.reloadHistory', b'module-refresh',
        b'snapshot/catalog.snapshot.json', b'snapshotCatalogURL',
        b'Stack-Pass', b'X-Lingrove-Debug-Auth',
    ):
        assert marker not in executable, f'Release executable contains debug code: {marker.decode()}'
    print('PASS Release executable, host configuration and network policy exclude debug functionality')


if __name__ == '__main__':
    verify(Path(sys.argv[1]))
