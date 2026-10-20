import type { GrammarTopic } from './grammar';
export const foundationTopics: GrammarTopic[] = [
  {
    id: 'word-classes',
    title: '日语词类总览',
    stage: '文法基础',
    group: '',
    intro: '学校文法通常分为十种词类。先看能否独立使用，再看是否活用，以及在句子中的作用。',
    rules: [
      {
        name: '动词',
        rule: '表示动作、存在或变化，可以活用。',
        example: '走る、ある、なる',
      },
      {
        name: '形容词（い形容词）',
        rule: '表示性质或状态，辞书形通常以い结尾。',
        example: '赤い、寒い',
      },
      {
        name: '形容动词（な形容词）',
        rule: '表示性质或状态，修饰名词时常接な。',
        example: '静かだ、便利だ',
      },
      {
        name: '名词',
        rule: '为人、事物、地点或概念命名；代名词属于名词。',
        example: '学生、机、私',
      },
      {
        name: '副词',
        rule: '不活用，主要修饰动词、形容词或整句话。',
        example: 'ゆっくり、とても',
      },
      {
        name: '连体词',
        rule: '不活用，直接修饰名词。',
        example: 'この、ある、大きな',
      },
      {
        name: '接续词',
        rule: '连接句子或段落，表达顺接、转折等关系。',
        example: 'そして、しかし',
      },
      {
        name: '感叹词',
        rule: '独立表达感叹、呼唤或应答。',
        example: 'ああ、はい',
      },
      {
        name: '助动词',
        rule: '不能独立使用，接在其他词后活用，增添否定、过去等意义。',
        example: 'ない、た、ます',
      },
      {
        name: '助词',
        rule: '不能独立使用且不活用，标记关系或语气。',
        example: 'が、を、は、か',
      },
    ],
    note: '教育文法常说“い形容词／な形容词”；本目录把它们分成两页。格助词属于助词的一类。',
  },
  {
    id: 'keigo-intro',
    title: '敬语系统简介',
    stage: '文法基础',
    group: '',
    intro: '敬语表达对话题人物、听者及场合的尊重。判断谁做动作、动作朝向谁、正在对谁说话。',
    rules: [
      {
        name: '人物与听者两条轴线',
        rule: '尊敬语抬高动作主体；谦让语Ⅰ抬高动作所向的人；丁宁语对听者表达礼貌。',
        example: '',
        sentence: {
          japanese: '先生がいらっしゃいます。',
          translation: '老师在这里。',
        },
      },
      {
        name: '五类敬语',
        rule: '本目录区分尊敬语、谦让语Ⅰ、谦让语Ⅱ（郑重语）、丁宁语和美化语；详细表达见“敬语系统”。',
        example: '',
        sentence: {
          japanese: '私は明日参ります。',
          translation: '我明天去。',
        },
      },
    ],
    note: '不以“越长越尊敬”为原则；根据内外关系、场合和动作主体选择表达。',
  },
];
export const wordClassTopics: GrammarTopic[] = [
  {
    id: 'nouns',
    title: '名词与代名词',
    stage: '词类',
    group: '其他词类',
    intro: '名词不活用，可以接助词作主语或宾语；代名词指代人、事物或地点。',
    rules: [
      {
        name: '名词作谓语',
        rule: '名词后接だ／です等判断表达；变化发生在后续表达，名词本身不活用。',
        example: '',
        sentence: {
          japanese: '私は大学生です。',
          translation: '我是大学生。',
        },
      },
      {
        name: '指示与代名词',
        rule: 'これ／それ／あれ可独立指物；この／その／あの要接名词，属于连体词。',
        example: '',
        sentence: {
          japanese: 'これは私の傘です。',
          translation: '这是我的伞。',
        },
      },
    ],
    note: '日语常省略可由语境确定的主语，不必每句重复私或あなた。',
  },
  {
    id: 'adverbs',
    title: '副词',
    stage: '词类',
    group: '其他词类',
    intro: '副词从程度、方式、时间等方面修饰表达，通常不活用。',
    rules: [
      {
        name: '方式与程度',
        rule: 'ゆっくり修饰动作方式；とても、少し等表示程度。',
        example: '',
        sentence: {
          japanese: 'もう少しゆっくり話してください。',
          translation: '请再说慢一点。',
        },
      },
      {
        name: '与否定搭配',
        rule: 'あまり常与否定搭配，表示“不太”；一起记忆后续谓语。',
        example: '',
        sentence: {
          japanese: 'この店にはあまり行きません。',
          translation: '我不太去这家店。',
        },
      },
    ],
    note: '副词不等于形容词的副词用法；高く、静かに分别来自动词以外的活用词。',
  },
  {
    id: 'adnominals',
    title: '连体词',
    stage: '词类',
    group: '其他词类',
    intro: '连体词直接放在名词前，不活用，也通常不能独立作谓语。',
    rules: [
      {
        name: '指示名词',
        rule: 'この／その／あの后必须有名词，不能当作これ／それ／あれ独立使用。',
        example: '',
        sentence: {
          japanese: 'この本を借りてもいいですか。',
          translation: '我可以借这本书吗？',
        },
      },
      {
        name: '固定的名词修饰',
        rule: '大きな、小さな是连体词；大きい、小さい是可以活用的い形容词。',
        example: '',
        sentence: {
          japanese: '小さな庭に花が咲いています。',
          translation: '小花园里开着花。',
        },
      },
    ],
    note: '不要把所有修饰名词的形式都称为连体词：动词连体形、形容词也能修饰名词。',
  },
  {
    id: 'conjunctions',
    title: '接续词',
    stage: '词类',
    group: '其他词类',
    intro: '接续词连接前后句或段落，明确内容之间的关系。',
    rules: [
      {
        name: '顺接与追加',
        rule: 'だから表示由前文推出结果；そして表示顺序或追加。',
        example: '',
        sentence: {
          japanese: '雨が降っています。だから、傘を持っていきます。',
          translation: '正在下雨，所以我要带伞。',
        },
      },
      {
        name: '转折与选择',
        rule: 'しかし表示转折；それとも常用于问句中列出选择。',
        example: '',
        sentence: {
          japanese: 'お茶にしますか。それとも、コーヒーにしますか。',
          translation: '您要茶，还是咖啡？',
        },
      },
    ],
    note: '接续词可在句首独立连接句子；接续助词接在词或分句后，如けれど、ので。',
  },
  {
    id: 'interjections',
    title: '感叹词',
    stage: '词类',
    group: '其他词类',
    intro: '感叹词可独立用于应答、感叹、呼唤或问候。',
    rules: [
      {
        name: '应答与呼唤',
        rule: 'はい表示应答；ねえ用于引起注意，要留意对象和场合。',
        example: '',
        sentence: {
          japanese: 'はい、わかりました。',
          translation: '好的，我明白了。',
        },
      },
      {
        name: '感叹与语境',
        rule: 'ああ、わあ等表达即时感受，语调会影响含义。',
        example: '',
        sentence: {
          japanese: 'わあ、きれいな景色ですね。',
          translation: '哇，景色真美啊。',
        },
      },
    ],
    note: '感叹词通常不与其他成分形成主语、宾语等关系。',
  },
  {
    id: 'auxiliaries',
    title: '助动词',
    stage: '词类',
    group: '其他词类',
    intro: '学校文法的助动词是附属且会活用的词。按接续位置及意义学习，不能只看中文译义。',
    rules: [
      {
        name: '否定、过去与礼貌',
        rule: 'ない、た、ます分别增添否定、过去／完成、礼貌等意义，接续形式不同。',
        example: '',
        sentence: {
          japanese: '昨日は映画を見ませんでした。',
          translation: '昨天我没有看电影。',
        },
      },
      {
        name: '受身、使役与推量',
        rule: 'れる／られる、せる／させる等接在未然形后；意义要结合语境判断。',
        example: '',
        sentence: {
          japanese: '私は先生に褒められました。',
          translation: '我受到了老师的表扬。',
        },
      },
    ],
    note: '教育文法常把完整组合称为“ない形／た形”；学校文法区分词干的活用和后接的助动词。',
  },
  {
    id: 'particles-overview',
    title: '助词的种类',
    stage: '词类',
    group: '助词',
    intro: '助词不活用，用于标记关系、连接内容或表达话题与语气；格助词另设页面筛选学习。',
    rules: [
      {
        name: '格关系与连接',
        rule: 'が、を、に等标记名词与谓语的关系；けれど、ので等连接分句。',
        example: '',
        sentence: {
          japanese: '雨が降ったので、家にいました。',
          translation: '因为下雨，我待在家里。',
        },
      },
      {
        name: '话题、限定与语气',
        rule: 'は提示话题或对比，も表示追加，だけ限定范围；か、ね、よ等用于句末语气。',
        example: '',
        sentence: {
          japanese: '私も日本語を勉強しています。',
          translation: '我也在学日语。',
        },
      },
    ],
    note: '助词的分类会因学校文法或教育文法而异；本目录先依据句子中的实际用法解释。',
  },
];
export const honorificTopics: GrammarTopic[] = [
  {
    id: 'respectful',
    title: '尊敬语',
    stage: '敬语系统',
    group: '',
    intro: '对他人动作或状态使用抬高表达，先确认动作主体。',
    rules: [
      {
        name: '专门的尊敬动词',
        rule: '行く／来る／いる可用いらっしゃる，食べる／飲む可用召し上がる。',
        example: '',
        sentence: {
          japanese: '先生はもうお帰りになりました。',
          translation: '老师已经回去了。',
        },
      },
      {
        name: 'お／ご～になる',
        rule: '常见形式为お＋连用形＋になる或ご＋汉语词＋になる；并非每个动词都可机械套用。',
        example: '',
        sentence: {
          japanese: 'こちらでお待ちになりますか。',
          translation: '您要在这里等吗？',
        },
      },
    ],
    note: '不要用尊敬语抬高自己的动作；同一种尊敬形式一般不要重复叠加。',
  },
  {
    id: 'humble-one',
    title: '谦让语Ⅰ',
    stage: '敬语系统',
    group: '',
    intro: '谦让表达自己的动作，从而抬高动作所朝向的人。',
    rules: [
      {
        name: '动作所向的人',
        rule: '伺う可表示拜访或请教；拝見する表示看对方有关的事物。',
        example: '',
        sentence: {
          japanese: '明日、先生のお宅に伺います。',
          translation: '明天我去拜访老师家。',
        },
      },
      {
        name: 'お／ご～する',
        rule: '用お＋连用形＋する或ご＋汉语词＋する表达朝向对方的行为。',
        example: '',
        sentence: {
          japanese: '私が資料をお届けします。',
          translation: '我来把资料送给您。',
        },
      },
    ],
    note: '谦让语Ⅰ需要有值得抬高的“向かう先”；不把自己的普通动作一律改成お～する。',
  },
  {
    id: 'humble-two',
    title: '谦让语Ⅱ（郑重语）',
    stage: '敬语系统',
    group: '',
    intro: '对听者郑重地述说自己一方的行为，不要求行为朝向听者。',
    rules: [
      {
        name: '参る与申す',
        rule: '参る表示郑重地说去／来，申す用于说或自我介绍；与伺う的敬意方向不同。',
        example: '',
        sentence: {
          japanese: '田中と申します。',
          translation: '我叫田中。',
        },
      },
      {
        name: 'おります与いたします',
        rule: 'おる、いたす常与ます组合，用郑重语气述说自己一方的状态或动作。',
        example: '',
        sentence: {
          japanese: '私は受付におります。',
          translation: '我在接待处。',
        },
      },
    ],
    note: '不要把おる用于抬高对方主体；介绍对方在场通常用いらっしゃる。',
  },
  {
    id: 'polite',
    title: '丁宁语',
    stage: '敬语系统',
    group: '',
    intro: '用です、ます等对听者表达礼貌，不直接改变动作主体的高低关系。',
    rules: [
      {
        name: 'です与ます',
        rule: '名词和な形容词等用です；动词用连用形＋ます。い形容词后也可接です。',
        example: '',
        sentence: {
          japanese: '今日は寒いです。',
          translation: '今天很冷。',
        },
      },
      {
        name: '组合使用',
        rule: '尊敬语或谦让语可再与ます组合；尊敬的对象和听者的礼貌是不同层面。',
        example: '',
        sentence: {
          japanese: '先生がいらっしゃいます。',
          translation: '老师在这里。',
        },
      },
    ],
    note: 'です／ます不等于尊敬语；避免「静かだです」「高いでございます」等机械拼接。',
  },
  {
    id: 'beautifying',
    title: '美化语',
    stage: '敬语系统',
    group: '',
    intro: '使措辞显得文雅，常见形式是名词前的お／ご，并不一定抬高某个人。',
    rules: [
      {
        name: '文雅的词语',
        rule: 'お酒、お料理等常作美化语使用，是否自然要看词语的固定习惯。',
        example: '',
        sentence: {
          japanese: 'お茶を飲みませんか。',
          translation: '要不要喝杯茶？',
        },
      },
      {
        name: '根据语境判断お／ご',
        rule: '同样的お／ご也可表达对人的尊敬，不能只看词头就判断为美化语。',
        example: '',
        sentence: {
          japanese: '先生のお名前を教えてください。',
          translation: '请告诉我老师的姓名。',
        },
      },
    ],
    note: '不要给所有名词都加お／ご；最后一个例句中的お名前与人物相关，应按尊敬表达理解。',
  },
];
