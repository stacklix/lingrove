import { validateReading } from './model';
export const demoSource = '私は昨日、図書館で本を読みました。';
const word = (
  text: string,
  lemma: string,
  reading: string,
  meaning: string,
  pos: string,
  role: string,
  ruby: { text: string; reading: string }[],
  grammar = '',
) => ({ text, kind: 'word', lemma, reading, meaning, pos, role, ruby, grammar });
export const demo = validateReading(
  {
    language: 'ja',
    sentences: [
      {
        tokens: [
          word('私', '私', 'わたし', '我', '代词', '与「は」一起提出本句的话题：我。', [
            { text: '私', reading: 'わたし' },
          ]),
          word(
            'は',
            'は',
            'わ',
            '表示话题：至于我',
            '提示助词',
            '把「私」标记为话题；本句读作「わ」。',
            [{ text: 'は', reading: '' }],
          ),
          word(
            '昨日',
            '昨日',
            'きのう',
            '昨天',
            '名词（时间）',
            '作时间状语，说明读书发生在昨天。',
            [{ text: '昨日', reading: 'きのう' }],
          ),
          { text: '、', kind: 'separator' },
          word(
            '図書館',
            '図書館',
            'としょかん',
            '图书馆',
            '名词',
            '与「で」组成地点状语，修饰「読みました」。',
            [{ text: '図書館', reading: 'としょかん' }],
          ),
          word('で', 'で', 'で', '在……（做某事）', '格助词', '标记读书这一动作发生的地点。', [
            { text: 'で', reading: '' },
          ]),
          word('本', '本', 'ほん', '书', '名词', '是「読みました」的宾语，即阅读的对象。', [
            { text: '本', reading: 'ほん' },
          ]),
          word('を', 'を', 'を', '标记动作的对象', '格助词', '标记「本」为「読む」的直接宾语。', [
            { text: 'を', reading: '' },
          ]),
          word(
            '読みました',
            '読む',
            'よみました',
            '读了',
            '动词（五段）＋助动词',
            '作本句谓语，表示过去发生的阅读动作。',
            [
              { text: '読', reading: 'よ' },
              { text: 'みました', reading: '' },
            ],
            '読む → 连用形「読み」＋「ました」，礼貌体过去式。',
          ),
          { text: '。', kind: 'separator' },
        ],
        translation: '我昨天在图书馆读了书。',
        explanation:
          '话题「私は」＋时间「昨日」＋地点「図書館で」＋宾语「本を」＋谓语「読みました」。日语的谓语通常放在句末。',
      },
    ],
  },
  demoSource,
);
