import type { Language } from './curriculum';

export interface LanguageIntroduction {
  nativeName: string;
  summary: string;
  facts: { family: string; region: string; script: string };
  writingNote: string;
  history: { period: string; title: string; description: string }[];
  tip: string;
  sources: { label: string; url: string }[];
}

export const introductions: Record<Language, LanguageIntroduction> = {
  ja: {
    nativeName: '日本語',
    summary:
      '日语属于日琉语系，主要在日本使用。句子通常以谓语收尾，助词标示词语的作用，敬语则体现说话人与听话人的关系。',
    facts: {
      family: '日琉语系',
      region: '日本及海外日语社群',
      script: '汉字、平假名与片假名',
    },
    writingNote:
      '现代日语混用三种文字。汉字多承载词义，平假名常写助词、词尾等，片假名常写外来语和拟声词。假名主要表示拍，长音、促音和拗音也参与词语的节奏。',
    history: [
      {
        period: '8 世纪',
        title: '以汉字记录日语',
        description:
          '《古事记》和《万叶集》等早期文献留下上代日语的记录，万叶假名借用汉字的读音来记音。',
      },
      {
        period: '9—10 世纪',
        title: '两种假名逐渐成形',
        description:
          '平假名从汉字的草写演变，片假名多取自汉字的一部分，逐渐形成与汉字并用的书写方式。',
      },
      {
        period: '19—20 世纪',
        title: '现代书面语与教育普及',
        description:
          '言文一致运动推动书面语接近口语，学校教育、出版和媒体促进了现代标准日语的传播。',
      },
    ],
    tip: '先把平假名和片假名的字形与读音配对，再用短词练习长音、促音和拗音。本应用的字母页各收录 46 个基本假名。',
    sources: [
      {
        label: 'Japan Foundation · Origins of the written language',
        url: 'https://classroomresources.sydney.jpf.go.jp/jpfmedia/Teachers_Notes_Origin_of_the_written_language.pdf',
      },
      {
        label: 'NINJAL · Japanese language structure',
        url: 'https://www.ninjal.ac.jp/research/cr-project/project/pubpro/acquisition/pdf/acquistion_paper03.pdf',
      },
      {
        label: 'Nippon.com · Modern Japanese prose',
        url: 'https://www.nippon.com/en/people/e00001/',
      },
      {
        label: 'Japonic language family · Oxford Academic',
        url: 'https://doi.org/10.1093/jole/lzaf002',
      },
    ],
  },
  ru: {
    nativeName: 'Русский',
    summary:
      '俄语属于印欧语系斯拉夫语族的东斯拉夫语支。它主要在俄罗斯使用，也在许多跨地区社群中承担交流功能；名词变格、动词体和重音是学习重点。',
    facts: {
      family: '印欧语系 · 东斯拉夫语支',
      region: '俄罗斯及跨地区俄语社群',
      script: '西里尔字母 · 33 个字母',
    },
    writingNote:
      '俄语字母有大小写，印刷体与手写体的差异较明显。软音符 ь 和硬音符 ъ 本身不表示独立元音；重音位置还会影响元音的实际读法。',
    history: [
      {
        period: '10—11 世纪',
        title: '东斯拉夫书面传统发展',
        description:
          '随着基督教传播，西里尔文字和教会斯拉夫语书面传统进入东斯拉夫地区，并与当地语言相互影响。',
      },
      {
        period: '18—19 世纪',
        title: '现代文学语言形成',
        description:
          '彼得一世时期的民用字体改革改变了世俗印刷面貌，随后文学、教育和出版共同塑造现代标准俄语。',
      },
      {
        period: '1917—1918 年',
        title: '正字法改革',
        description: '改革移除部分旧字母，并取消词末辅音后常写的硬音符，使书写规则进一步简化。',
      },
    ],
    tip: '不要只按外形猜读音：例如 В 的读音与拉丁字母 B 不同。先熟悉印刷体，再对照手写体，并尽早连同重音一起记词。',
    sources: [
      {
        label: 'University of Kansas · Russian orthographic reform',
        url: 'https://olrc.ku.edu/russian_orthography',
      },
      {
        label: 'Russian language · Overview and references',
        url: 'https://en.wikipedia.org/wiki/Russian_language',
      },
    ],
  },
  el: {
    nativeName: 'Ελληνικά',
    summary:
      '希腊语是印欧语系中的独立分支，拥有延续数千年的文字记录。现代希腊语主要用于希腊和塞浦路斯，经历了古希腊语、通用希腊语和中世纪希腊语等发展阶段。',
    facts: {
      family: '印欧语系 · 希腊语支',
      region: '希腊、塞浦路斯及海外社群',
      script: '希腊字母 · 24 个字母',
    },
    writingNote:
      '希腊字母有大小写，小写 σ 在词尾通常写作 ς。现代读音与古代读音有明显差异，字母组合也会共同表示一个音；本应用录音采用现代希腊语。',
    history: [
      {
        period: '约公元前 8 世纪',
        title: '字母体系出现',
        description: '希腊人改造腓尼基字母，明确用字母表示元音。早期各地区字形并不完全统一。',
      },
      {
        period: '希腊化时代',
        title: '通用希腊语传播',
        description:
          '亚历山大征服之后，以阿提卡语为重要基础的通用希腊语在更广阔地区传播，并成为后续语言演变的重要基础。',
      },
      {
        period: '1976 年',
        title: '现代标准语确立',
        description: '经过长期书面语争论，以民众日常语言为基础的现代希腊语确立为官方和教育语言。',
      },
    ],
    tip: '先练习大小写配对和词尾 ς，再把字母放入短词中学习。数学、物理里熟悉的字母名称，不一定与现代希腊语的实际读法相同。',
    sources: [
      {
        label: 'Scuola Normale Superiore · Greek alphabets',
        url: 'https://mnamon.sns.it/index.php?id=12&lang=en&page=Scrittura',
      },
      {
        label: 'Harvard CHS · A brief history of Greek',
        url: 'https://www-current.chs.harvard.edu/the-greek-language-a-brief-history/',
      },
    ],
  },
  hy: {
    nativeName: 'Հայերեն',
    summary:
      '亚美尼亚语在印欧语系中自成一支。它是亚美尼亚的重要日常与文化语言，海外社群也长期使用；现代书面语主要有东亚美尼亚语和西亚美尼亚语两种标准。',
    facts: {
      family: '印欧语系 · 亚美尼亚语支',
      region: '亚美尼亚及海外亚美尼亚社群',
      script: '亚美尼亚字母 · 本应用收录 39 项',
    },
    writingNote:
      '亚美尼亚字母有大小写。现代教学中常把 ու 和 և 作为独立项目排列；传统正字法与改革正字法存在差别，字母计数也可能因口径不同而变化。',
    history: [
      {
        period: '约 405 年',
        title: '马什托茨创制字母',
        description:
          '梅斯罗普·马什托茨创制最初的 36 个字母，为翻译、教育和古典亚美尼亚语文学的发展提供基础。',
      },
      {
        period: '中世纪',
        title: '文字持续扩充',
        description: 'օ 和 ֆ 等字母在后来的使用中加入，书体也逐步发展为多种抄写与印刷传统。',
      },
      {
        period: '19—20 世纪',
        title: '现代标准与正字法分化',
        description:
          '东、西两种现代书面标准逐渐发展；20 世纪的正字法改革又使部分社群采用不同拼写传统。',
      },
    ],
    tip: '先成对认识大小写，注意 ու 是由两个字符组成的字母项目。本应用的真人录音采用东亚美尼亚语，西部标准的部分辅音读法有所不同。',
    sources: [
      {
        label: 'Yerevan State University · Eastern Armenian',
        url: 'https://lib.armedu.am/files/resource/files/2023-01-26/6ea102f4eca086199c186f54c1aecfc3.pdf',
      },
      {
        label: 'Armenian script history · Scholarly reference',
        url: 'https://arar.sci.am/Content/276462/191-.pdf',
      },
      {
        label: 'Armenian alphabet · Orthography and references',
        url: 'https://en.wikipedia.org/wiki/Armenian_alphabet',
      },
    ],
  },
  ka: {
    nativeName: 'ქართული',
    summary:
      '格鲁吉亚语属于卡特维尔语系，是格鲁吉亚的主要公共生活语言。它拥有独立的书写传统，辅音组合丰富，动词形式能表达多层语法信息。',
    facts: {
      family: '卡特维尔语系',
      region: '格鲁吉亚及海外格鲁吉亚社群',
      script: '现代骑士体 · 33 个字母',
    },
    writingNote:
      '现代常用的骑士体（Mkhedruli）包含 33 个字母，基本按语音拼写。日常文字使用单一套字形；排版中也会见到 Mtavruli 大写形式。本应用展示常用骑士体。',
    history: [
      {
        period: '5 世纪',
        title: '早期文字记录',
        description: '现存早期格鲁吉亚语铭文可追溯到 5 世纪，古老的圆体字母见证了书写传统的形成。',
      },
      {
        period: '中世纪',
        title: '三种书体演进',
        description:
          '圆体、教会小写体和骑士体在不同阶段发展，并分别延续于宗教、文化和日常书写之中。',
      },
      {
        period: '2016 年',
        title: '书写文化列入非遗',
        description:
          '格鲁吉亚字母三种书写体系的活态文化列入联合国教科文组织人类非物质文化遗产代表作名录。',
      },
    ],
    tip: '先把字母与录音逐个对应，再区分送气音、浊音和挤喉音。遇到连续辅音时放慢分解练习，不要自行插入元音。',
    sources: [
      {
        label: 'UNESCO · Three Georgian writing systems',
        url: 'https://ich.unesco.org/en/RL/living-culture-of-three-writing-systems-of-the-georgian-alphabet-01205',
      },
      {
        label: 'Malmö scholars · The Georgian script',
        url: 'https://georgian.se/kartuli/GeoGrammar/Script/IntrScr2.html',
      },
      {
        label: 'Georgian language · Overview and references',
        url: 'https://en.wikipedia.org/wiki/Georgian_language',
      },
    ],
  },
  ko: {
    nativeName: '한국어',
    summary:
      '韩语属于朝鲜语系，主要在朝鲜半岛及海外社群中使用。它通常把谓语放在句末，用词尾变化和敬语表达时间、语气以及人际关系。',
    facts: {
      family: '朝鲜语系',
      region: '朝鲜半岛及海外韩语社群',
      script: '谚文 · 24 个基本字母',
    },
    writingNote:
      '谚文是字母文字，字母按音节组合成方块，而不是沿直线逐个排列。例如 한 由 ㅎ、ㅏ、ㄴ 组成。本应用列出 19 个辅音和 21 个元音，共 40 项，包含双辅音和复合元音。',
    history: [
      {
        period: '15 世纪以前',
        title: '汉字与借字书写',
        description:
          '正式书面活动长期使用汉文，也发展出借用汉字记录本地语言的方式，但学习门槛较高。',
      },
      {
        period: '1443 年',
        title: '世宗创制新文字',
        description: '世宗创制用于记录本地语言的新文字，最初有 28 个字母，旨在让更多人能够读写。',
      },
      {
        period: '1446 年至今',
        title: '公布与逐步普及',
        description:
          '《训民正音》公布并解释造字原理。经过长期传播与近现代规范化，谚文成为日常教育、出版和数字交流的主要文字。',
      },
    ],
    tip: '先认基本辅音和元音，再练习组装音节。辅音名称与词中的发音用途不同；本应用辅音录音保留名称和发音示范，后续还需结合收音与音变练习。',
    sources: [
      {
        label: 'National Institute of Korean Language · Hangeul origins',
        url: 'https://www.korean.go.kr/hangeul/origin/001.html',
      },
      {
        label: 'National Archives of Korea · Hangeul',
        url: 'https://theme.archives.go.kr/next/koreaOfRecord/hangul.do',
      },
      {
        label: 'Korean language · Overview and references',
        url: 'https://en.wikipedia.org/wiki/Korean_language',
      },
    ],
  },
};
