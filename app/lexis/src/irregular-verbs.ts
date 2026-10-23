export interface VerbExampleGroup {
  title: string;
  note: string;
  words: { word: string; reading: string; meaning?: string; example?: string }[];
}

export const irregularVerbLists: Record<
  'sahen' | 'kahen',
  {
    title: string;
    notes: string[];
    groups: VerbExampleGroup[];
  }
> = {
  sahen: {
    title: 'サ变动词词例',
    notes: [
      'サ变包括「する」及与它结合的动词。下面列出常见例子，并非完整词表；不是所有名词都能直接加する。',
      '常见变化：する → しない・します・して・した・すれば・しよう。复合词通常保留前半部分，变化末尾的する。',
    ],
    groups: [
      {
        title: '基本词',
        note: 'する可以表示做、进行等，具体含义取决于搭配。',
        words: [
          { word: 'する', reading: 'する', meaning: '做；进行', example: 'する → しない・します' },
        ],
      },
      {
        title: '常见「～する」动词',
        note: '从学习、生活到工作中都很常见。',
        words: [
          {
            word: '勉強する',
            reading: 'べんきょうする',
            meaning: '学习',
            example: '勉強する → 勉強します',
          },
          {
            word: '練習する',
            reading: 'れんしゅうする',
            meaning: '练习',
            example: '練習する → 練習しない',
          },
          {
            word: '掃除する',
            reading: 'そうじする',
            meaning: '打扫',
            example: '掃除する → 掃除して',
          },
          {
            word: '料理する',
            reading: 'りょうりする',
            meaning: '做饭；烹饪',
            example: '料理する → 料理した',
          },
          {
            word: '洗濯する',
            reading: 'せんたくする',
            meaning: '洗衣服',
            example: '洗濯する → 洗濯します',
          },
          {
            word: '散歩する',
            reading: 'さんぽする',
            meaning: '散步',
            example: '散歩する → 散歩しよう',
          },
          {
            word: '運動する',
            reading: 'うんどうする',
            meaning: '运动',
            example: '運動する → 運動して',
          },
          {
            word: '仕事する',
            reading: 'しごとする',
            meaning: '工作',
            example: '仕事する → 仕事します',
          },
          {
            word: '電話する',
            reading: 'でんわする',
            meaning: '打电话',
            example: '電話する → 電話した',
          },
          {
            word: '予約する',
            reading: 'よやくする',
            meaning: '预约',
            example: '予約する → 予約します',
          },
          {
            word: '旅行する',
            reading: 'りょこうする',
            meaning: '旅行',
            example: '旅行する → 旅行しよう',
          },
          {
            word: 'コピーする',
            reading: 'コピーする',
            meaning: '复印；复制',
            example: 'コピーする → コピーして',
          },
        ],
      },
    ],
  },
  kahen: {
    title: 'カ变动词词例',
    notes: [
      '现代日语的カ变核心动词只有「来る（くる）」。下面同时列出含来る的常见表达，并不是多个独立的カ变基本动词。',
      '注意读音变化：来ない（こない）・来ます（きます）・来て（きて）・来た（きた）・来れば（くれば）・来よう（こよう）。',
    ],
    groups: [
      {
        title: '核心动词',
        note: '表示“来”；仅仅读音以くる结尾并不能判断为カ变，如作る（つくる）是五段。',
        words: [
          {
            word: '来る',
            reading: 'くる',
            meaning: '来',
            example: '来る → 来ない（こない）・来ます（きます）',
          },
        ],
      },
      {
        title: '含「来る」的常见表达',
        note: '前面的动词使用て形，末尾的来る按カ变活用。',
        words: [
          {
            word: 'やって来る',
            reading: 'やってくる',
            meaning: '到来；来到',
            example: 'やって来る → やって来た（やってきた）',
          },
          {
            word: '持って来る',
            reading: 'もってくる',
            meaning: '带来（物品）',
            example: '持って来る → 持って来て（もってきて）',
          },
          {
            word: '連れて来る',
            reading: 'つれてくる',
            meaning: '带来（人或动物）',
            example: '連れて来る → 連れて来ます（つれてきます）',
          },
          {
            word: '帰って来る',
            reading: 'かえってくる',
            meaning: '回来',
            example: '帰って来る → 帰って来ない（かえってこない）',
          },
          {
            word: '戻って来る',
            reading: 'もどってくる',
            meaning: '返回；回来',
            example: '戻って来る → 戻って来た（もどってきた）',
          },
        ],
      },
    ],
  },
};
