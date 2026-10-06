// The SDK catalog is the single source for shared native and Web UI copy.
import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const messages = JSON.parse(
  await readFile(new URL('packages/host-sdk/src/locales/messages.json', root), 'utf8'),
);
const strings = Object.fromEntries(
  Object.entries(messages).map(([key, translations]) => [
    key,
    {
      localizations: Object.fromEntries(
        Object.entries({ 'zh-Hans': key, ...translations }).map(([locale, value]) => [
          locale,
          {
            stringUnit: { state: 'translated', value },
          },
        ]),
      ),
    },
  ]),
);
await writeFile(
  new URL('ios/Lingrove/Resources/Localizable.xcstrings', root),
  JSON.stringify({ sourceLanguage: 'zh-Hans', strings, version: '1.0' }, null, 2) + '\n',
);
