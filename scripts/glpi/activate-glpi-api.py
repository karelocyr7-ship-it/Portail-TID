#!/usr/bin/env python3
"""Controlled setup: generate secrets in memory; never read an existing .env."""
import argparse
import json
import os
import re
from pathlib import Path
import secrets
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[2]
DESTINATION = Path('/srv/tad/secrets/glpi-provisioning.env')


def new_payload(fixture=False):
    return {'fixture': fixture, 'fixtureId': secrets.token_hex(6),
               'appToken': secrets.token_hex(32), 'userToken': secrets.token_hex(32)}


def configure(payload):
    fixture = payload['fixture']
    container = 'portal-glpi-fixture-20261020-web' if fixture else 'tad-glpi-glpi-1'
    php = (ROOT / 'scripts/glpi/configure-api.php').read_text()
    # JSON is encoded as hex before insertion into PHP source; no shell interpolation.
    data = json.dumps(payload).encode().hex()
    source = '<?php $provisioningInput=json_decode(hex2bin("' + data + '"),true);\n' + php.removeprefix('<?php')
    result = subprocess.run(['docker', 'exec', '-i', container, 'php'], input=source,
                            text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode:
        # Do not forward raw PHP output; native failures can include arguments.
        stage = re.search(r'failed at stage: ([a-z]+)', result.stderr)
        raise RuntimeError('GLPI setup failed at stage: ' + (stage.group(1) if stage else 'bootstrap'))
    response = json.loads(result.stdout)
    if response.get('ok') is not True:
        raise RuntimeError('GLPI setup not confirmed')
    return response


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--fixture', action='store_true')
    parser.add_argument('--backup-dir', type=Path)
    args = parser.parse_args()
    if os.geteuid() != 0:
        raise RuntimeError('Run through sudo for Docker and protected file permissions')
    if args.fixture:
        payload = new_payload(True)
        response = configure(payload)
        print(json.dumps(response), flush=True)
        environment = {**os.environ,
                       'GLPI_FIXTURE_API_APP_TOKEN': payload['appToken'],
                       'GLPI_FIXTURE_API_USER_TOKEN': payload['userToken'],
                       'GLPI_ISOLATED_LEAST_PRIVILEGE': '1'}
        subprocess.run(['pnpm', 'exec', 'node', 'scripts/test-glpi-isolated.mjs'],
                       cwd=ROOT / 'apps/portal', env=environment, check=True)
        return
    branch = subprocess.check_output(['git', '-C', str(ROOT), 'branch', '--show-current'], text=True).strip()
    head = subprocess.check_output(['git', '-C', str(ROOT), 'rev-parse', 'HEAD'], text=True).strip()
    main_ref = subprocess.check_output(['git', '-C', str(ROOT), 'rev-parse', 'origin/main'], text=True).strip()
    dirty = subprocess.check_output(['git', '-C', str(ROOT), 'status', '--porcelain'], text=True).strip()
    if branch != 'main' or head != main_ref or dirty:
        raise RuntimeError('Production setup requires a clean, merged main checkout')
    backup = args.backup_dir
    if backup is None or backup.resolve().parent != Path('/home/debian/GLPI/backups'):
        raise RuntimeError('A recent official GLPI backup is required')
    manifest = backup / 'SHA256SUMS'
    if not manifest.is_file() or not 0 <= time.time() - manifest.stat().st_mtime < 3600:
        raise RuntimeError('GLPI backup manifest must be less than one hour old')
    subprocess.run(['sha256sum', '--check', '--status', 'SHA256SUMS'], cwd=backup, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    payload = new_payload()
    # Reserve the new path exclusively before touching GLPI. Existing files are never opened.
    descriptor = os.open(DESTINATION, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    try:
        content = ('GLPI_API_URL=https://glpi.tadgroupe.com/apirest.php\n'
                   'GLPI_LOGIN_ATTRIBUTE=email\n'
                   f'GLPI_API_APP_TOKEN={payload["appToken"]}\n'
                   f'GLPI_API_USER_TOKEN={payload["userToken"]}\n')
        with os.fdopen(descriptor, 'w') as handle:
            descriptor = -1
            handle.write(content)
            handle.flush()
            os.fsync(handle.fileno())
        response = configure(payload)
        print(json.dumps({**response, 'protectedConnectorFileCreated': True}))
    finally:
        if descriptor >= 0:
            os.close(descriptor)


if __name__ == '__main__':
    try:
        main()
    except RuntimeError as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
    except Exception:
        print('GLPI API activation failed; existing secret files were not read or overwritten.', file=sys.stderr)
        sys.exit(1)
