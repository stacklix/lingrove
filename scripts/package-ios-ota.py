"""Generate a Pages installation site from the exported IPA, never from archive metadata."""
import argparse
import datetime
import hashlib
import html
import importlib.util
from pathlib import Path
import plistlib
import shutil
import subprocess
import tempfile
from urllib.parse import quote, urlsplit
import zipfile

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('ios_signing', ROOT / 'scripts/prepare-ios-signing.py')
signing = importlib.util.module_from_spec(spec)
spec.loader.exec_module(signing)
validate_profile = signing.validate_profile


def package(ipa, output, base_url, configuration):
    url = urlsplit(base_url)
    if url.scheme != 'https' or not url.netloc or url.query or url.fragment or url.username:
        raise ValueError('安装页面必须使用无查询参数的公开 HTTPS 地址。')
    if ipa.stat().st_size >= 100 * 1024 * 1024:
        raise ValueError('IPA 达到 GitHub 单文件 100 MiB 限制，不能推送到 gh-pages。')
    with zipfile.ZipFile(ipa) as archive:
        infos = [name for name in archive.namelist() if name.startswith('Payload/') and name.count('/') == 2 and name.endswith('.app/Info.plist')]
        if len(infos) != 1:
            raise ValueError('IPA 必须包含唯一的主应用。')
        info = plistlib.loads(archive.read(infos[0]))
        if info['CFBundleIdentifier'] != 'me.stackli.lingrove':
            raise ValueError('IPA Bundle ID 不匹配。')
        with tempfile.TemporaryDirectory() as temporary:
            profile_path = Path(temporary) / 'embedded.mobileprovision'
            profile_path.write_bytes(archive.read(infos[0].replace('Info.plist', 'embedded.mobileprovision')))
            decoded = subprocess.run(['openssl', 'smime', '-verify', '-inform', 'DER', '-in', str(profile_path), '-noverify'], check=True, capture_output=True).stdout
            profile = plistlib.loads(decoded)
            validate_profile(profile)
    digest = hashlib.sha256(ipa.read_bytes()).hexdigest()
    filename = f'Lingrove-{digest[:16]}.ipa'
    manifest_name = f'manifest-{digest[:16]}.plist'
    base = base_url.rstrip('/')
    manifest = {'items': [{
        'assets': [{'kind': 'software-package', 'url': f'{base}/{filename}'},
                   {'kind': 'display-image', 'url': f'{base}/icon.png'},
                   {'kind': 'full-size-image', 'url': f'{base}/icon.png'}],
        'metadata': {'bundle-identifier': info['CFBundleIdentifier'],
                     'bundle-version': str(info['CFBundleVersion']), 'kind': 'software', 'title': 'Lingrove'},
    }]}
    output.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(ipa, output / filename)
    shutil.copyfile(ROOT / 'ios/Lingrove/Resources/Assets.xcassets/AppIcon.appiconset/AppIcon.png', output / 'icon.png')
    (output / manifest_name).write_bytes(plistlib.dumps(manifest))
    values = {
        'INSTALL_URL': 'itms-services://?action=download-manifest&url=' + quote(f'{base}/{manifest_name}', safe=''),
        'IPA_URL': filename, 'VERSION': str(info['CFBundleShortVersionString']),
        'BUILD': str(info['CFBundleVersion']), 'CONFIGURATION': configuration,
        'SIZE': f'{ipa.stat().st_size / 1024 / 1024:.1f}',
        'EXPIRES': str(profile['ExpirationDate'].date()), 'SHA256': digest,
        'DATE': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M UTC'),
    }
    page = (ROOT / 'web/ios-install.html').read_text()
    for key, value in values.items():
        page = page.replace('{{' + key + '}}', html.escape(value, quote=True))
    (output / 'index.html').write_text(page)
    print(f'Prepared {base}/ — {info["CFBundleShortVersionString"]} ({info["CFBundleVersion"]})')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('ipa', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--base-url', required=True)
    parser.add_argument('--configuration', choices=['Debug', 'Release'], required=True)
    args = parser.parse_args()
    package(args.ipa, args.output, args.base_url, args.configuration)
