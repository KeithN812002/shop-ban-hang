#!/usr/bin/env python3
"""Verify the backend i18n bundles against the Java sources.

IntelliJ cannot see keys referenced as "{key}" in Bean Validation annotations (it only
resolves those against ValidationMessages.properties), keys built at runtime
("prefix" + ".invalidStatus") or keys passed through constants, so its "Unused property"
warning is not reliable for these bundles. Run this script instead before removing keys.

Checks: duplicate keys, keys present in only one bundle, empty values, keys referenced by
code but missing from a bundle, and keys no code references.

Usage: python3 scripts/check-i18n.py        (from the backend repo root; exit code 1 on issues)
"""
import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUNDLES = {
    'vi': os.path.join(ROOT, 'core-common/src/main/resources/messages.properties'),
    'en': os.path.join(ROOT, 'core-common/src/main/resources/messages_en.properties'),
}


def load(path):
    keys, dups = {}, []
    with open(path, encoding='utf-8') as fh:
        for line in fh:
            if '=' not in line or line.lstrip().startswith(('#', '!')):
                continue
            key, value = line.rstrip('\n').split('=', 1)
            key = key.strip()
            if key in keys:
                dups.append(key)
            keys[key] = value
    return keys, dups


def read_sources():
    chunks = []
    for path in glob.glob(os.path.join(ROOT, '*/src/main/java/**/*.java'), recursive=True):
        with open(path, encoding='utf-8') as fh:
            chunks.append(fh.read())
    return '\n'.join(chunks)


def main():
    bundles = {}
    issues = 0
    for lang, path in BUNDLES.items():
        keys, dups = load(path)
        bundles[lang] = keys
        for key in dups:
            print(f'DUPLICATE [{lang}] {key}')
            issues += 1
        for key, value in keys.items():
            if not value.strip():
                print(f'EMPTY     [{lang}] {key}')
                issues += 1

    vi, en = bundles['vi'], bundles['en']
    for key in sorted(set(vi) - set(en)):
        print(f'ONLY VI   {key}')
        issues += 1
    for key in sorted(set(en) - set(vi)):
        print(f'ONLY EN   {key}')
        issues += 1

    src = read_sources()
    literals = set(re.findall(r'"([A-Za-z][\w.\-]*)"', src))
    braces = set(re.findall(r'\{([A-Za-z][\w.\-]+)\}', src))
    prefixes = set(re.findall(r'"([A-Za-z][\w.\-]*\.)"\s*\+', src))
    suffixes = set(re.findall(r'\+\s*"(\.[\w.\-]+)"', src))
    referenced = (set(re.findall(r'new BaseException\(\s*"([^"]+)"', src))
                  | set(re.findall(r'getMessage\(\s*"([^"]+)"', src))
                  | set(re.findall(r'message\s*=\s*"\{([^}]+)\}"', src)))

    for lang, keys in bundles.items():
        for key in sorted(referenced - set(keys)):
            print(f'MISSING   [{lang}] {key}')
            issues += 1

    def used(key):
        return (key in literals or key in braces
                or any(key.startswith(p) for p in prefixes)
                or any(key.endswith(s) for s in suffixes))

    for key in sorted(k for k in set(vi) | set(en) if not used(k)):
        print(f'UNUSED    {key}')
        issues += 1

    print(f'{len(vi)} vi keys, {len(en)} en keys, {issues} issue(s)')
    return 1 if issues else 0


if __name__ == '__main__':
    sys.exit(main())
