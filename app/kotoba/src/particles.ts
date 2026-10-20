import type { GrammarTopic } from './grammar';

export const particleTopics: GrammarTopic[] = [
  {
    id: 'particle-ga',
    stage: '格助词',
    title: '格助词「が」',
    intro: '标记主语，也常与喜好、能力等表达搭配。',
    rules: [
      {
        name: '主语与新信息',
        rule: '说明谁做某事，或什么发生了；回答「谁／什么」时常用が。',
        example: '',
        sentence: {
          japanese: '猫が庭で寝ています。',
          translation: '猫正在院子里睡觉。',
        },
      },
      {
        name: '喜好与能力的对象',
        rule: '好き、上手、わかる等表达常用が标记对象，应连同谓语一起记忆。',
        example: '',
        sentence: {
          japanese: '私は日本語がわかります。',
          translation: '我懂日语。',
        },
      },
    ],
    note: 'が标记主语，は提示话题或对比；不能简单理解成可以随意互换。',
  },
  {
    id: 'particle-wo',
    stage: '格助词',
    title: '格助词「を」',
    intro: '标记动作对象，也表示移动经过或离开的地方。读作「お」。',
    rules: [
      {
        name: '动作的对象',
        rule: '他动词前用「名词＋を」表示动作直接作用的对象。',
        example: '',
        sentence: {
          japanese: '妹は手紙を書いています。',
          translation: '妹妹正在写信。',
        },
      },
      {
        name: '经过的路线',
        rule: '歩く、渡る、通る等移动动词可用を标记经过的路线。',
        example: '',
        sentence: {
          japanese: '毎朝、この橋を渡ります。',
          translation: '我每天早上都过这座桥。',
        },
      },
      {
        name: '离开的地点',
        rule: '出る、降りる等动词可用を标记离开的地方或交通工具。',
        example: '',
        sentence: {
          japanese: '次の駅で電車を降ります。',
          translation: '我在下一站下电车。',
        },
      },
    ],
    note: '「公園で歩く」侧重活动场所，「公園を歩く」侧重移动经过的区域。',
  },
  {
    id: 'particle-ni',
    stage: '格助词',
    title: '格助词「に」',
    intro: '标记到达点、存在地点、时间点、动作对象或变化结果。',
    rules: [
      {
        name: '到达点与存在地点',
        rule: '行く等用に表示到达点；ある、いる等用に表示存在地点。',
        example: '',
        sentence: {
          japanese: '机の下に犬がいます。',
          translation: '桌子下面有一只狗。',
        },
      },
      {
        name: '具体时间点',
        rule: '钟点、日期等具体时间常用に；今日、明日、毎日等通常不加に。',
        example: '',
        sentence: {
          japanese: '授業は九時に始まります。',
          translation: '课九点开始。',
        },
      },
      {
        name: '接收者与动作对象',
        rule: '给、教、询问等动作可用に标记接收者或对象，具体搭配由动词决定。',
        example: '',
        sentence: {
          japanese: '先生に質問しました。',
          translation: '我向老师提了问题。',
        },
      },
      {
        name: '变化的结果',
        rule: '「名词＋に＋なる」表示变成某种身份或状态。',
        example: '',
        sentence: {
          japanese: '姉は医者になりました。',
          translation: '姐姐成为了医生。',
        },
      },
    ],
    note: '存在地点用に，动作进行的场所常用で；「図書館にいる」与「図書館で読む」含义不同。',
  },
  {
    id: 'particle-he',
    stage: '格助词',
    title: '格助词「へ」',
    intro: '表示移动的方向，也可以表示目的地。读作「え」。',
    rules: [
      {
        name: '移动方向',
        rule: '「地点＋へ＋移动动词」表示朝某处移动。',
        example: '',
        sentence: {
          japanese: '週末は海へ行きます。',
          translation: '周末我要去海边。',
        },
      },
      {
        name: '与の组合修饰名词',
        rule: 'へ后面可以接の，用「～への＋名词」表达朝向或送往某处的事物。',
        example: '',
        sentence: {
          japanese: 'これは母への手紙です。',
          translation: '这是写给母亲的信。',
        },
      },
    ],
    note: '表示目的地时に和へ常可替换，但时间点、接收者、存在地点等用法不能直接改为へ。',
  },
  {
    id: 'particle-de',
    stage: '格助词',
    title: '格助词「で」',
    intro: '表示动作发生的场所、手段、材料、原因或范围。',
    rules: [
      {
        name: '动作发生的场所',
        rule: '用「地点＋で」说明在哪里进行活动；活动或事件的举办地点也可用で。',
        example: '',
        sentence: {
          japanese: '図書館で宿題をします。',
          translation: '我在图书馆做作业。',
        },
      },
      {
        name: '手段与材料',
        rule: '交通工具、使用的语言、工具或材料等可用で表示。',
        example: '',
        sentence: {
          japanese: '電車で会社に通っています。',
          translation: '我乘电车通勤。',
        },
      },
      {
        name: '原因与范围',
        rule: 'で可表示导致结果的原因，也可限定比较、人数或数量的范围。',
        example: '',
        sentence: {
          japanese: '雪でバスが遅れました。',
          translation: '公交车因下雪晚点了。',
        },
      },
    ],
    note: '「公園に花がある」说明存在地点；「公園で祭りがある」说明活动举办地点。',
  },
  {
    id: 'particle-to',
    stage: '格助词',
    title: '格助词「と」',
    intro: '表示共同参与者、相互动作的对象，以及引用的内容。',
    rules: [
      {
        name: '共同参与者',
        rule: '「人＋と」表示与谁一起做事，可搭配一緒に。',
        example: '',
        sentence: {
          japanese: '友達と映画を見ました。',
          translation: '我和朋友一起看了电影。',
        },
      },
      {
        name: '引用与思考内容',
        rule: 'と放在引用内容之后，连接言う、思う等；引用中的句末通常用普通形。',
        example: '',
        sentence: {
          japanese: '明日は晴れると思います。',
          translation: '我想明天会放晴。',
        },
      },
    ],
    note: '名词并列中的と常归为并列助词；「雨が降ると」中的と是接续助词，要按用法区分。',
  },
  {
    id: 'particle-kara',
    stage: '格助词',
    title: '格助词「から」',
    intro: '表示时间、地点的起点，也可以表示信息或物品的来源。',
    rules: [
      {
        name: '时间与地点的起点',
        rule: '「～から」表示从某时或某处开始，常与表示终点的まで搭配。',
        example: '',
        sentence: {
          japanese: '毎日、家から駅まで歩きます。',
          translation: '我每天从家走到车站。',
        },
      },
      {
        name: '信息或物品的来源',
        rule: 'もらう、聞く、借りる等动词可用から标记来源人物。',
        example: '',
        sentence: {
          japanese: '兄から辞書をもらいました。',
          translation: '哥哥给了我一本词典。',
        },
      },
    ],
    note: '「寒いから帰る」中的から连接理由，是接续助词。まで常见于终点表达；学校文法通常把まで归为副助词。',
  },
  {
    id: 'particle-yori',
    stage: '格助词',
    title: '格助词「より」',
    intro: '常用于比较，标记比较的基准。',
    rules: [
      {
        name: '比较的基准',
        rule: '「AはBより～」表示以B为基准，说明A的性质或程度。',
        example: '',
        sentence: {
          japanese: '今日は昨日より暖かいです。',
          translation: '今天比昨天暖和。',
        },
      },
      {
        name: '正式表达中的起点',
        rule: '通知、广播等正式语境中，より也可表示起点，含义接近から。',
        example: '',
        sentence: {
          japanese: '午後二時より受付を開始します。',
          translation: '下午两点起开始受理。',
        },
      },
    ],
    note: 'より本身不表示“更好”；比较的具体性质由后面的谓语决定。',
  },
  {
    id: 'particle-no',
    stage: '格助词',
    title: '格助词「の」',
    intro: '连接名词表示所属、类别等关系；也可在修饰名词的从句中标记主语。',
    rules: [
      {
        name: '名词之间的关系',
        rule: '「名词A＋の＋名词B」用A说明B的所属、类别、内容等；并不都译成“的”。',
        example: '',
        sentence: {
          japanese: 'これは日本語の教科書です。',
          translation: '这是日语教科书。',
        },
      },
      {
        name: '修饰名词的从句中的主语',
        rule: '在修饰名词的从句中，主语的が有时可换成の；并非所有が都能替换。',
        example: '',
        sentence: {
          japanese: '母の作った料理が好きです。',
          translation: '我喜欢妈妈做的菜。',
        },
      },
    ],
    note: '「読むのが好き」中的の把动词短语名词化，与本节连接名词、标记从句主语的用法不同。',
  },
];
