"""Validate the CI Ad Hoc profile and prepare Xcode's manual export options."""
import datetime
import os
from pathlib import Path
import plistlib
import shutil
import sys


def validate_profile(profile):
    entitlements = profile.get('Entitlements', {})
    if not profile.get('ProvisionedDevices') or profile.get('ProvisionsAllDevices') or entitlements.get('get-task-allow') is not False:
        raise ValueError('需要 Ad Hoc 分发描述文件，不能使用 Development、Enterprise 或 App Store 描述文件。')
    team = profile['TeamIdentifier'][0]
    prefix = profile['ApplicationIdentifierPrefix'][0]
    if entitlements.get('application-identifier') != f'{prefix}.me.stackli.lingrove':
        raise ValueError('请为独立 App ID me.stackli.lingrove 创建 Ad Hoc 描述文件。')
    if profile['ExpirationDate'] <= datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None):
        raise ValueError('Ad Hoc 描述文件已过期，请重新生成。')
    return team


def main():
    source, decoded, output = map(Path, sys.argv[1:])
    profile = plistlib.loads(decoded.read_bytes())
    team = validate_profile(profile)
    destination = Path.home() / 'Library/Developer/Xcode/UserData/Provisioning Profiles' / f"{profile['UUID']}.mobileprovision"
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, destination)
    options = {
        'method': 'release-testing', 'destination': 'export', 'signingStyle': 'manual',
        'teamID': team, 'signingCertificate': 'Apple Distribution',
        'provisioningProfiles': {'me.stackli.lingrove': profile['UUID']},
        'manageAppVersionAndBuildNumber': False, 'thinning': '<none>',
    }
    output.write_bytes(plistlib.dumps(options))
    with open(os.environ['GITHUB_OUTPUT'], 'a') as stream:
        stream.write(f"team={team}\nprofile={profile['UUID']}\nprofile_path={destination}\n")
    print(f"Ad Hoc profile validated: {len(profile['ProvisionedDevices'])} registered devices; expires {profile['ExpirationDate'].date()}.")


if __name__ == '__main__':
    main()
