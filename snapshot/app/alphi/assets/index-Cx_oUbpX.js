(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) return;
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) processPreload(link);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
    }
  }).observe(document, {
    childList: true,
    subtree: true
  });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep) return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const messages$1 = {
  "记录": { "en": "History", "ja": "履歴" },
  "页面工具": { "en": "Page tools", "ja": "ページ操作" },
  "重试保存": { "en": "Retry saving", "ja": "保存を再試行" },
  "保存失败": { "en": "Save failed", "ja": "保存失敗" },
  "清空": { "en": "Clear", "ja": "クリア" },
  "主导航": { "en": "Main navigation", "ja": "メインナビゲーション" },
  "日语": { "en": "Japanese", "ja": "日本語" },
  "假名": { "en": "Kana", "ja": "仮名" },
  "保存": { "en": "Save", "ja": "保存" },
  "俄语": { "en": "Russian", "ja": "ロシア語" },
  "希腊语": { "en": "Greek", "ja": "ギリシャ語" },
  "下一个": { "en": "Next", "ja": "次へ" },
  "书写方法 ↗": { "en": "Writing guide ↗", "ja": "書き方 ↗" },
  "学习": { "en": "Learn", "ja": "学習" },
  "测试": { "en": "Test", "ja": "テスト" },
  "字母": { "en": "Letters", "ja": "文字" },
  "练习语言": { "en": "Practice language", "ja": "練習する言語" },
  "练习语言：{0}": { "en": "Practice language: {0}", "ja": "練習する言語：{0}" },
  "正在准备离线字帖…": { "en": "Preparing offline letter guides…", "ja": "オフラインの手本を準備中…" },
  "重新加载资源": { "en": "Reload resources", "ja": "リソースを再読み込み" },
  "已完成全部学习": { "en": "All letters completed", "ja": "すべて学習済み" },
  "下一个未学字形": { "en": "Next unlearned letter", "ja": "次の未学習文字" },
  "已学习": { "en": "Learned", "ja": "学習済み" },
  "个字母": { "en": "letters", "ja": "文字" },
  "查看进度": { "en": "View progress", "ja": "進捗を見る" },
  "查看学习进度": { "en": "View learning progress", "ja": "学習の進捗を見る" },
  "继续学习 →": { "en": "Continue learning →", "ja": "学習を続ける →" },
  "查看书写方法，临摹后切换测试并评分，记录学习进度。进度与笔迹自动保存。": { "en": "Study the writing guide, trace, then test and score your writing. Progress and strokes are saved automatically.", "ja": "書き方を確認してなぞり書きし、テストで採点します。進捗と筆跡は自動保存されます。" },
  "学习进度": { "en": "Learning progress", "ja": "学習の進捗" },
  "未学习": { "en": "Not learned", "ja": "未学習" },
  "TEST / 检验进步": { "en": "TEST / Check your progress", "ja": "TEST / 進歩を確かめる" },
  "看看记住了多少。": { "en": "See how much you remember.", "ja": "どれだけ覚えたか確かめよう。" },
  "· 10 道题，书写和选择交替进行。": { "en": "· 10 questions, alternating writing and multiple choice.", "ja": "· 全10問、筆記と選択を交互に出題。" },
  "测试范围": { "en": "Test range", "ja": "出題範囲" },
  "已学字母（": { "en": "Learned letters (", "ja": "学習済みの文字（" },
  "全部字母（": { "en": "All letters (", "ja": "すべての文字（" },
  "当前字母组还没有学习记录。先去学习，或选择全部字母测试。": { "en": "No learning history for this group. Learn first or test all letters.", "ja": "このグループの学習履歴はありません。先に学習するか、すべての文字を選んでください。" },
  "已学字母不足 10 个，本轮会重复抽取；选择题干扰项来自同组字母。": { "en": "Fewer than 10 letters learned: some will repeat. Distractors come from the same group.", "ja": "学習済みの文字が10個未満のため重複出題します。選択肢は同じグループから選びます。" },
  "继续本轮 · 第": { "en": "Resume · Question", "ja": "再開 · 第" },
  "/ 10 题 →": { "en": "/ 10 →", "ja": "/ 10 問 →" },
  "开始测试 →": { "en": "Start test →", "ja": "テスト開始 →" },
  "最近成绩": { "en": "Latest score", "ja": "前回の得点" },
  "最佳成绩": { "en": "Best score", "ja": "最高得点" },
  "完成轮数": { "en": "Tests completed", "ja": "完了した回数" },
  "测试记录": { "en": "Test history", "ja": "テスト履歴" },
  "总分 / 100": { "en": "Total / 100", "ja": "合計 / 100" },
  "还没有完成的测试。你的第一份成绩，会出现在这里。": { "en": "No completed tests yet. Your first score will appear here.", "ja": "まだ完了したテストはありません。最初の得点がここに表示されます。" },
  "书写": { "en": "Writing", "ja": "筆記" },
  "选择": { "en": "Choice", "ja": "選択" },
  "分": { "en": "points", "ja": "点" },
  "24 个字母 · 含词尾 ς": { "en": "24 letters · including final ς", "ja": "24文字 · 語末の ς を含む" },
  "{0} 个字母": { "en": "{0} letters", "ja": "{0} 文字" },
  "查看 {0} 的书写说明": { "en": "View writing guide for {0}", "ja": "{0} の書き方を見る" },
  "PRACTICE / 小小测验": { "en": "PRACTICE / Quick test", "ja": "PRACTICE / ミニテスト" },
  "写出对应的手写体": { "en": "Write the handwritten form", "ja": "対応する手書き文字を書こう" },
  "选出对应的手写体": { "en": "Choose the handwritten form", "ja": "対応する手書き文字を選ぼう" },
  "题目字形": { "en": "Question letter", "ja": "問題の文字" },
  "印刷体": { "en": "Print", "ja": "活字体" },
  "手写体": { "en": "Handwriting", "ja": "手書き体" },
  "观察印刷体，用手写体作答。": { "en": "Look at the printed letter and write its handwritten form.", "ja": "活字体を見て、手書き体で答えてください。" },
  "从右侧四个手写字形中选择。": { "en": "Choose from the four handwritten forms.", "ja": "4つの手書き文字から選んでください。" },
  "沿着范字描摹": { "en": "Trace the guide", "ja": "手本をなぞる" },
  "轮到你来写": { "en": "Your turn to write", "ja": "書いてみよう" },
  "正在比对字形…": { "en": "Comparing letter shapes…", "ja": "字形を比較中…" },
  "落笔 · 观察 · 再试一次": { "en": "Write · Observe · Try again", "ja": "書く · 観察する · もう一度" },
  "临摹": { "en": "Trace", "ja": "なぞり書き" },
  "练习模式": { "en": "Practice mode", "ja": "練習モード" },
  "书写假名": { "en": "Kana to write", "ja": "書く仮名" },
  "书写大小写": { "en": "Letter case", "ja": "大文字・小文字" },
  "选项 {0}": { "en": "Option {0}", "ja": "選択肢 {0}" },
  "回答正确": { "en": "Correct", "ja": "正解" },
  "再记一次": { "en": "Try to remember again", "ja": "もう一度覚えよう" },
  "描摹练习分": { "en": "Tracing score", "ja": "なぞり書きの得点" },
  "字形练习分": { "en": "Letter shape score", "ja": "字形の得点" },
  "· 本地相似度估计，不代表笔顺或书法等级。": { "en": "· Local similarity estimate, not a stroke-order or calligraphy grade.", "ja": "· 端末内の類似度推定です。筆順や書道の評価ではありません。" },
  "收起对照": { "en": "Hide overlay", "ja": "重ね表示を閉じる" },
  "叠加对照范字": { "en": "Overlay guide", "ja": "手本を重ねる" },
  "浅色范字": { "en": "Light guide", "ja": "薄い色の手本" },
  "本次书写": { "en": "Your writing", "ja": "今回の筆跡" },
  "浅色：范字 · 深色：你的书写": { "en": "Light: guide · Dark: your writing", "ja": "薄い色：手本 · 濃い色：あなたの筆跡" },
  "正确范字": { "en": "Correct form", "ja": "正しい手本" },
  "再写一次": { "en": "Write again", "ja": "もう一度書く" },
  "独立书写 →": { "en": "Write independently →", "ja": "手本なしで書く →" },
  "重新书写": { "en": "Rewrite", "ja": "書き直す" },
  "跳过此题（记 0 分）": { "en": "Skip (0 points)", "ja": "スキップ（0点）" },
  "查看本轮结果": { "en": "View test results", "ja": "今回の結果を見る" },
  "下一题 →": { "en": "Next question →", "ja": "次の問題 →" },
  "当前组各写法的测试均需达到 80 分，临摹分数不计入。": { "en": "Score 80 or more on each form in this group. Tracing scores do not count.", "ja": "このグループの各字形で80点以上が必要です。なぞり書きは対象外です。" },
  "又熟悉了一点。": { "en": "A little more familiar.", "ja": "また少し、身についた。" },
  "十次小小的练习，都是留下的进步。": { "en": "Ten small exercises, ten steps forward.", "ja": "10回の小さな練習が、確かな一歩に。" },
  "书写平均分 / 100": { "en": "Writing average / 100", "ja": "筆記平均点 / 100" },
  "选择题答对": { "en": "Correct choices", "ja": "選択問題の正解数" },
  "继续未完成测试 →": { "en": "Resume unfinished test →", "ja": "未完了のテストを再開 →" },
  "再练一轮 →": { "en": "Practice again →", "ja": "もう一度練習 →" },
  "回到学习": { "en": "Back to learning", "ja": "学習に戻る" },
  "本轮回顾": { "en": "Test review", "ja": "今回の振り返り" },
  "点击查看作答与范字": { "en": "Tap to compare your answer and the guide", "ja": "タップして解答と手本を確認" },
  "书写题": { "en": "Writing question", "ja": "筆記問題" },
  "选择题": { "en": "Multiple choice", "ja": "選択問題" },
  "已跳过": { "en": "Skipped", "ja": "スキップ済み" },
  "已匹配": { "en": "Matched", "ja": "一致" },
  "待复习": { "en": "Review needed", "ja": "要復習" },
  "字帖来源与评分说明": { "en": "Guide sources and scoring", "ja": "手本の出典と採点について" },
  "字形评分是离线模板相似度估计，尚未经过大规模真实手写样本校准。合理变体可能无法识别；不评判书法水平，不将字形相似度当作笔顺正确性。": { "en": "Scores estimate similarity to offline templates and have not been calibrated on large handwriting datasets. Valid variants may be missed. Scores do not judge calligraphy or stroke order.", "ja": "採点はオフラインの手本との類似度推定であり、大規模な筆跡データでの調整は未実施です。正しい別字形を認識できない場合があります。書道や筆順の評価ではありません。" },
  "日语笔顺：KanjiVG / Ulrich Apel，CC BY-SA 3.0。俄语：Bad Script / The Bad Script Project Authors，SIL OFL。希腊语：Playpen Sans / The Playpen Sans Project Authors，SIL OFL。范字是一种参考写法。": { "en": "Japanese strokes: KanjiVG / Ulrich Apel, CC BY-SA 3.0. Russian: Bad Script / The Bad Script Project Authors, SIL OFL. Greek: Playpen Sans / The Playpen Sans Project Authors, SIL OFL. Guides show one possible form.", "ja": "日本語の筆順：KanjiVG / Ulrich Apel、CC BY-SA 3.0。ロシア語：Bad Script / The Bad Script Project Authors、SIL OFL。ギリシャ語：Playpen Sans / The Playpen Sans Project Authors、SIL OFL。手本は参考の一例です。" },
  "关闭": { "en": "Close", "ja": "閉じる" },
  "ANSWER / 作答回顾": { "en": "ANSWER / Review", "ja": "ANSWER / 解答を振り返る" },
  "正确的手写范字": { "en": "Correct handwritten form", "ja": "正しい手書きの手本" },
  "当时的书写": { "en": "Your submitted writing", "ja": "解答時の筆跡" },
  "本题未书写。": { "en": "No writing for this question.", "ja": "この問題は未記入です。" },
  "你的选择：": { "en": "Your choice:", "ja": "あなたの選択：" },
  "未作答": { "en": "Unanswered", "ja": "未解答" },
  "建议再练习这个字母": { "en": "Practice this letter again", "ja": "この文字をもう一度練習しましょう" },
  "练习这个字母 →": { "en": "Practice this letter →", "ja": "この文字を練習 →" },
  "书写说明假名": { "en": "Kana writing guide", "ja": "仮名の書き方" },
  "书写说明大小写": { "en": "Letter case guide", "ja": "大文字・小文字の書き方" },
  "作答回顾": { "en": "Answer review", "ja": "解答の振り返り" },
  "书写方法与动画": { "en": "Writing guide and animation", "ja": "書き方とアニメーション" },
  "大写": { "en": "Uppercase", "ja": "大文字" },
  "小写": { "en": "Lowercase", "ja": "小文字" },
  "平假名": { "en": "Hiragana", "ja": "平仮名" },
  "片假名": { "en": "Katakana", "ja": "片仮名" },
  "进度保存失败：{0}": { "en": "Could not save progress: {0}", "ja": "進捗の保存に失敗：{0}" },
  "字母学习": { "en": "Learn letters", "ja": "文字の学習" },
  "字母测试": { "en": "Letter test", "ja": "文字のテスト" },
  "测试结果": { "en": "Test results", "ja": "テスト結果" },
  "返回学习首页": { "en": "Back to learning home", "ja": "学習トップに戻る" },
  "返回测试": { "en": "Back to test", "ja": "テストに戻る" },
  "保存并返回测试": { "en": "Save and return to test", "ja": "保存してテストに戻る" },
  "保存并返回": { "en": "Save and go back", "ja": "保存して戻る" },
  "操作暂时失败，请重试。": { "en": "Operation failed. Please retry.", "ja": "操作に失敗しました。再試行してください。" },
  "历史记录未成功读取，本次结果仅保留在当前页面。": { "en": "History could not be loaded. This result is kept only on this page.", "ja": "履歴を読み込めませんでした。今回の結果はこのページにのみ保持されます。" },
  "记录保存失败：{0}。请点击重试保存。": { "en": "Could not save history: {0}. Retry saving.", "ja": "履歴の保存に失敗：{0}。保存を再試行してください。" },
  "选择正确，记住这个字形。": { "en": "Correct choice. Remember this form.", "ja": "正解です。この字形を覚えましょう。" },
  "这不是对应的字形。下面是正确的手写范字。": { "en": "This is not the matching form. The correct guide is below.", "ja": "対応する字形ではありません。下に正しい手本を表示します。" },
  "字形匹配": { "en": "Shape matched", "ja": "字形が一致" },
  "需要再练习": { "en": "More practice needed", "ja": "もう少し練習" },
  "暂无法判断": { "en": "Unable to assess", "ja": "判定できません" },
  "手写范字 {0}": { "en": "Handwriting guide {0}", "ja": "手書きの手本 {0}" },
  "{0} {1} 的{2}": { "en": "{2} for {0} {1}", "ja": "{0} {1} の{2}" },
  "播放失败，重试": { "en": "Playback failed. Retry", "ja": "再生失敗、再試行" },
  "正在播放": { "en": "Playing", "ja": "再生中" },
  "播放": { "en": "Play", "ja": "再生" },
  "播放失败，点击重试": { "en": "Playback failed. Tap to retry", "ja": "再生できません。タップして再試行" },
  "正在播放：": { "en": "Playing:", "ja": "再生中：" },
  "发音来源与许可": { "en": "Audio sources and licenses", "ja": "音声の出典とライセンス" },
  "日语录音来自": { "en": "Japanese recordings from", "ja": "日本語音声の出典：" },
  "的假名教学音频。本地个人学习使用，保留原站来源信息。": { "en": "'s kana teaching audio. For local personal study; original source credits retained.", "ja": "の仮名学習用音声。個人学習用として使用し、出典情報を保持しています。" },
  "俄语录音：Cherus / Wikimedia Commons，": { "en": "Russian recordings: Cherus / Wikimedia Commons,", "ja": "ロシア語音声：Cherus / Wikimedia Commons、" },
  "。 转换格式并裁去首尾空白；修改后的音频继续按 CC BY-SA 3.0 提供。": { "en": ". Converted format and trimmed silence; modified audio remains under CC BY-SA 3.0.", "ja": "。形式変換と前後の無音部分の削除を実施。編集後も CC BY-SA 3.0 で提供します。" },
  "现代希腊语录音：CuteHappyBrute / Wikimedia Commons，RoB 降噪及均衡处理，公有领域（PD-self）。 从完整字母表朗读中截取各字母；σ 与词尾 ς 共用字母名称。": { "en": "Modern Greek: CuteHappyBrute / Wikimedia Commons, denoising and EQ by RoB, public domain (PD-self). Letters clipped from the alphabet recording; σ and final ς share a name.", "ja": "現代ギリシャ語音声：CuteHappyBrute / Wikimedia Commons。RoB によるノイズ除去と音質調整。パブリックドメイン（PD-self）。全字母の朗読から抽出し、σ と語末の ς は同じ名称を使用します。" },
  "音频已转换为离线格式，部分截取单次发音；未调整语速或音高。各录音的原始页面：": { "en": "Audio converted for offline use; some single pronunciations clipped. Speed and pitch unchanged. Original pages:", "ja": "音声はオフライン用に変換し、一部は単音を抽出しました。速度と音程は変更していません。元のページ：" },
  "{0} 第 {1} 笔": { "en": "{0}, stroke {1}", "ja": "{0}、第 {1} 画" },
  "动画为一种手写笔顺示意，连笔与字帖字体可有差异。": { "en": "Animation shows one writing order; joins may differ from the guide font.", "ja": "アニメーションは筆順の一例です。続け字は手本の字体と異なる場合があります。" },
  "一种参考书写顺序；实际连笔与起收笔可有合理变体。下方逐步说明笔的走向。": { "en": "One reference stroke order. Joins and stroke endings may vary. Steps below show the pen direction.", "ja": "参考の筆順です。続け字や起筆・終筆には別の書き方もあります。下に運筆を順番に示します。" },
  "暂停": { "en": "Pause", "ja": "一時停止" },
  "上一笔": { "en": "Previous stroke", "ja": "前の画" },
  "下一笔": { "en": "Next stroke", "ja": "次の画" },
  "手写练习区域": { "en": "Handwriting practice area", "ja": "手書き練習エリア" },
  "撤销": { "en": "Undo", "ja": "元に戻す" },
  "切换为笔": { "en": "Switch to pen", "ja": "ペンに切り替え" },
  "橡皮": { "en": "Eraser", "ja": "消しゴム" },
  "允许手指": { "en": "Allow finger input", "ja": "指での入力を許可" },
  "评分": { "en": "Score", "ja": "採点" },
  "直接用 Apple Pencil 在格内书写；可在画板外滑动页面。": { "en": "Write in the grid with Apple Pencil. Scroll outside the pad.", "ja": "Apple Pencil で枠内に書いてください。枠外ではページをスクロールできます。" },
  "笔画较多，请清空后重新书写。": { "en": "Too many strokes. Clear and write again.", "ja": "筆画が多すぎます。クリアして書き直してください。" },
  "从五十音开始": { "en": "Start with kana", "ja": "五十音から始める" },
  "认识流畅的手写体": { "en": "Discover flowing handwriting", "ja": "流れるような手書き体を学ぶ" },
  "写下新的字母": { "en": "Write new letters", "ja": "新しい文字を書く" },
  "注意手写体的环形与下伸部分，不要照抄印刷体。": { "en": "Notice the loops and descender. Do not copy the printed form.", "ja": "輪と下に伸びる部分に注目し、活字体をそのまま写さないでください。" },
  "当前范字采用短横加下行笔的写法；拱形连笔也是常见变体。": { "en": "This guide uses a short horizontal and downstrokes; joined arches are another common form.", "ja": "この手本は短い横線と下向きの線で書きます。アーチ状の続け字も一般的です。" },
  "留意起笔与拱形，不要与 т、и 混淆。": { "en": "Watch the start and arch; distinguish it from т and и.", "ja": "起筆とアーチに注意し、т や и と区別しましょう。" },
  "留意两侧笔画与中间连接的走向。": { "en": "Watch the sides and the direction of the connecting stroke.", "ja": "両側の線と中央のつなぎ方に注意しましょう。" },
  "数清连续起伏，注意与 и、щ 的区别。": { "en": "Count the arches; distinguish it from и and щ.", "ja": "山の数を確認し、и や щ と区別しましょう。" },
  "末端有下伸部分，注意与 ш 区分。": { "en": "The ending descends below the line; distinguish it from ш.", "ja": "末尾は下に伸びます。ш と区別しましょう。" },
  "上方短弧是字母的一部分，不要漏写。": { "en": "The short arc above is part of the letter. Do not omit it.", "ja": "上の短い弧も文字の一部です。忘れずに書きましょう。" },
  "上方两点是字母的一部分，不要漏写。": { "en": "The two dots above are part of the letter. Do not omit them.", "ja": "上の2点も文字の一部です。忘れずに書きましょう。" },
  "留意竖画与下方的环形。": { "en": "Watch the vertical stroke and the lower loop.", "ja": "縦線と下の輪に注意しましょう。" },
  "注意两部分的间距与比例。": { "en": "Watch the spacing and proportion of the two parts.", "ja": "2つの部分の間隔と比率に注意しましょう。" },
  "观察笔画的先后、方向与位置，再独立书写。": { "en": "Observe stroke order, direction and position, then write independently.", "ja": "筆順、方向、位置を観察してから自分で書きましょう。" },
  "对照手写范字，留意转折、连接与整体比例。": { "en": "Compare the guide, noting turns, joins and overall proportions.", "ja": "手本と比べて、曲がり方、つなぎ方、全体の比率に注意しましょう。" },
  "sigma · 词尾形式": { "en": "sigma · final form", "ja": "sigma · 語末形" },
  "ς 是小写 sigma 位于词尾时的形式。": { "en": "ς is the lowercase sigma used at the end of a word.", "ja": "ς は小文字 sigma の語末形です。" },
  "观察手写字形的弧线、开口与上下伸展。": { "en": "Observe curves, openings, ascenders and descenders.", "ja": "曲線、開き方、上下への伸びに注目しましょう。" },
  "大小写混合": { "en": "Mixed case", "ja": "大文字・小文字混合" },
  "练习记录格式异常，暂不写入新记录。": { "en": "Invalid practice history. New saves are paused.", "ja": "練習履歴の形式が無効です。新しい記録の保存を停止しました。" },
  "学习进度格式异常，原始记录已保留。": { "en": "Invalid progress format. Original records are preserved.", "ja": "進捗の形式が無効です。元の記録は保持されています。" },
  "还没有写下字形，请先书写。": { "en": "Write a letter first.", "ja": "先に文字を書いてください。" },
  "字形与范字较接近。可叠加对照，继续留意比例与转折。": { "en": "Your shape is close to the guide. Use the overlay to check proportions and turns.", "ja": "手本に近い字形です。重ね表示で比率や曲がり方を確認しましょう。" },
  "与目标范字差异较大。请检查是否写成其他字母，或遗漏了笔画。": { "en": "This differs from the guide. Check for a different letter or missing strokes.", "ja": "手本と大きく異なります。別の文字や書き忘れた画がないか確認してください。" },
  "暂时无法可靠判断。请对照范字重写；合理的手写变体也可能出现这种情况。": { "en": "Unable to assess reliably. Compare the guide and retry; valid variants may also cause this.", "ja": "正確に判定できません。手本を見て書き直してください。正しい別字形でも起こる場合があります。" },
  "请先学习字母，或选择全部字母测试": { "en": "Learn letters first or choose all letters for the test", "ja": "先に文字を学ぶか、すべての文字を選んでください" },
  "至少需要四个字形作为选项": { "en": "At least four letter forms are required", "ja": "選択肢には4つ以上の字形が必要です" },
  "识别": { "en": "Identification", "ja": "見分け方" },
  "查看{0} ↗": { "en": "View {0} ↗", "ja": "{0}を見る ↗" },
  "关闭{0}": { "en": "Close {0}", "ja": "{0}を閉じる" },
  "字": { "en": "characters", "ja": "文字" },
  "字 ·": { "en": "characters ·", "ja": "文字 ·" },
  "次": { "en": "times", "ja": "回" },
  "已完成": { "en": "Completed", "ja": "完了" },
  "连接": { "en": "Linking", "ja": "接続" },
  "从右上向左绕过左侧与底部，回到起点闭合椭圆。": { "en": "From upper right, curve left around the left and bottom, returning to close the oval.", "ja": "右上から左側と下側を回り、始点に戻って楕円を閉じます。" },
  "从右上沿椭圆右侧下行，在基线处向右弯出。": { "en": "Descend along the oval's right side and curve right at the baseline.", "ja": "右上から楕円の右側を下り、基線で右へ曲げます。" },
  "从下部向上绕出长环，在中腰向右绕出下部圆腹，回到左侧收笔。": { "en": "Loop upward from below, curve right at mid-height into the lower bowl, and finish left.", "ja": "下から上へ長い輪を描き、中ほどから右へ下の丸みを作って左で終えます。" },
  "从左上弯向右下，越过基线绕出窄环，再向右上收笔。": { "en": "Curve from upper left to lower right, loop below the baseline, then finish up-right.", "ja": "左上から右下へ曲げ、基線の下で細い輪を作り、右上で終えます。" },
  "从顶部右侧向左弯入，再向右下绕过字身右侧和底部，沿左侧回到字身上沿闭合。": { "en": "Curve left from top right, around the right and bottom, then up the left to close.", "ja": "右上から左へ入り、右側と下側を回り、左側を上がって閉じます。" },
  "从右上向左绕出上半弧，回到中部，再向左下绕出下半弧，在右下收笔。": { "en": "Curve left through the upper arc, return to center, then make a lower arc and finish lower right.", "ja": "右上から左へ上の弧を作り、中央に戻り、左下へ下の弧を描いて右下で終えます。" },
  "从左向右写顶横，转向左下，再向右绕出下部弧线，末端向左弯成下伸钩。": { "en": "Draw the top bar rightward, turn down-left, curve right below, then hook down-left.", "ja": "上の横線を右へ、左下へ折れ、下で右へ回り、末尾を左下へ鉤状にします。" },
  "从字身上沿向下写左竖。": { "en": "Draw the left vertical down from the body top.", "ja": "字の上端から左の縦線を下へ書きます。" },
  "从左竖中部向右上拱起，再沿右侧向下越过基线。": { "en": "Arch up-right from the left vertical's midpoint, then descend past the baseline.", "ja": "左縦線の中ほどから右上へ山を作り、右側を基線の下まで下ろします。" },
  "从顶部向左下绕出狭长椭圆，经底部与右侧回到起点。": { "en": "Curve down-left into a narrow oval, returning along the bottom and right.", "ja": "上から左下へ細長い楕円を描き、下と右を通って始点に戻ります。" },
  "抬笔，从左向右写中横。": { "en": "Lift, then draw the middle bar left to right.", "ja": "ペンを上げ、中央の横線を左から右へ書きます。" },
  "从上方向下写短竖，在基线处向右轻弯收笔，不加点。": { "en": "Draw a short downstroke, curving right at the baseline; no dot.", "ja": "短い縦線を下ろし、基線で軽く右へ曲げます。点は付けません。" },
  "先写左侧短竖。": { "en": "First draw the short left vertical.", "ja": "まず左の短い縦線を書きます。" },
  "从右上斜向左侧中腰，再折向右下。": { "en": "Slant from upper right to left midpoint, then turn down-right.", "ja": "右上から左の中ほどへ斜めに引き、右下へ折ります。" },
  "从左上向右绕出顶部弧线，再沿右侧向下写长竖。": { "en": "Curve right from upper left, then draw a long downstroke on the right.", "ja": "左上から右へ上の弧を描き、右側を長く下ろします。" },
  "从右侧中部向左绕出拱形，沿左侧下行收笔。": { "en": "Arch left from the right midpoint and finish downward on the left.", "ja": "右の中ほどから左へアーチを描き、左側を下りて終えます。" },
  "从字身上沿向下写越过基线的长竖。": { "en": "Draw a long downstroke from the body top past the baseline.", "ja": "字の上端から基線を越える長い縦線を書きます。" },
  "回到字身上沿，下行后圆转向右上，再沿右侧下行并向右收笔。": { "en": "Return to the body top, descend and round up-right, descend again and finish right.", "ja": "字の上端に戻り、下りて丸く右上へ返し、右側を下りて右で終えます。" },
  "从左上向下略弯，到底部后转向右上。": { "en": "Curve slightly down from upper left, then turn up-right at the bottom.", "ja": "左上から少し曲げて下り、下端で右上へ返します。" },
  "从左向右写顶部短弧，回绕出中部弧线，再回绕出下部弧线，末端向下弯出。": { "en": "Draw a short top arc rightward, loop through middle and lower arcs, then curve down.", "ja": "上の短い弧を右へ書き、中央、下の弧へ回り、末尾を下へ曲げます。" },
  "从右上向左绕过左侧与底部，经右侧回到起点闭合。": { "en": "Curve left from upper right, around the bottom, then up the right to close.", "ja": "右上から左と下を回り、右側を上がって始点で閉じます。" },
  "从左向右写顶横。": { "en": "Draw the top bar left to right.", "ja": "上の横線を左から右へ書きます。" },
  "从顶横左部向下写左侧笔画。": { "en": "Draw the left stroke down from the top bar.", "ja": "上の横線の左側から下へ書きます。" },
  "从顶横右部下行，在底部向右轻弯。": { "en": "Descend from the top bar's right side, curving gently right at the bottom.", "ja": "上の横線の右側から下り、下端で軽く右へ曲げます。" },
  "从字身中部向下写越过基线的长竖。": { "en": "Draw a long vertical from mid-body below the baseline.", "ja": "字の中ほどから基線を越えて長く下ろします。" },
  "从竖画上端向上绕出完整圆腹，经右侧与底部回到起点。": { "en": "Loop upward from the vertical's top into a full bowl, returning via right and bottom.", "ja": "縦線の上端から上へ丸みを描き、右と下を通って戻ります。" },
  "从右上向左绕出圆腹，经底部与右侧回到起点，再向右写顶部短横。": { "en": "Loop left into a bowl, return around bottom and right, then add a short top bar rightward.", "ja": "右上から左へ丸みを描き、下と右を通って戻り、上に短い横線を右へ書きます。" },
  "从右上向左绕过圆腹，转向右下写弯尾，末端向左收笔。": { "en": "Curve left around the bowl, turn down-right for the tail, then finish left.", "ja": "右上から左へ丸みを回り、右下へ尾を曲げ、左で終えます。" },
  "从顶横中部向下，在底部向右轻弯。": { "en": "Descend from the top bar's midpoint, curving right at the bottom.", "ja": "上の横線の中央から下り、下で軽く右へ曲げます。" },
  "从左上向下弯到基线，再圆转向右上，形成开口向上的字形。": { "en": "Curve down to the baseline then round up-right, leaving the top open.", "ja": "左上から基線まで曲げて下り、丸く右上へ返して上を開けます。" },
  "先从顶部向下写越过基线的长竖。": { "en": "First draw a long vertical from the top past the baseline.", "ja": "まず上から基線を越える長い縦線を書きます。" },
  "从长竖与字身上沿的交点向左绕出椭圆，经底部与右侧闭合。": { "en": "At the body-top intersection, loop left into an oval, closing via bottom and right.", "ja": "長い縦線と字の上端の交点から左へ楕円を描き、下と右で閉じます。" },
  "从左上斜向右下，越过基线。": { "en": "Slant upper left to lower right, past the baseline.", "ja": "左上から右下へ、基線を越えて斜めに書きます。" },
  "抬笔，从右上斜向左下，与第一笔相交。": { "en": "Lift, then slant upper right to lower left across the first stroke.", "ja": "ペンを上げ、右上から左下へ1画目と交差させます。" },
  "从左上向下绕成杯形，再沿右侧回升到字身上沿。": { "en": "Curve down into a cup, rising on the right to the body top.", "ja": "左上から下へカップ状に描き、右側を字の上端まで上がります。" },
  "抬笔，从中间向下写越过基线的长竖。": { "en": "Lift, then draw a central vertical below the baseline.", "ja": "ペンを上げ、中央から基線を越えて長く下ろします。" },
  "从左上向下绕出左侧圆腹，向上回转形成中间短竖，再绕出右侧圆腹，向右上收笔。": { "en": "Curve down into the left bowl, rise for the central short stem, loop the right bowl and finish up-right.", "ja": "左の丸みを下へ描き、上へ返して中央の短い縦線を作り、右の丸みを描いて右上で終えます。" },
  "从左下斜向顶点，再斜向右下。": { "en": "Slant from lower left to the apex, then down-right.", "ja": "左下から頂点へ斜めに上がり、右下へ下ろします。" },
  "抬笔，从左向右补中横。": { "en": "Lift and add the middle bar left to right.", "ja": "ペンを上げ、中央の横線を左から右へ加えます。" },
  "从上到下写左侧主干。": { "en": "Draw the left stem from top to bottom.", "ja": "左の主軸を上から下へ書きます。" },
  "从主干顶部向右依次绕出上、下两个圆腹。": { "en": "From the stem top, loop right to form upper and lower bowls.", "ja": "主軸の上端から右へ、上と下の丸みを順に描きます。" },
  "从上到下写左竖。": { "en": "Draw the left vertical top to bottom.", "ja": "左の縦線を上から下へ書きます。" },
  "抬笔，从左上向右写顶横。": { "en": "Lift and draw the top bar rightward from upper left.", "ja": "ペンを上げ、左上から右へ上の横線を書きます。" },
  "从顶点斜向左下，再向右写底边，最后斜回顶点闭合三角形。": { "en": "Slant from apex down-left, draw the base rightward, then return to close the triangle.", "ja": "頂点から左下へ、底辺を右へ書き、頂点へ戻って三角形を閉じます。" },
  "从左向右写中横。": { "en": "Draw the middle bar left to right.", "ja": "中央の横線を左から右へ書きます。" },
  "从左向右写底横。": { "en": "Draw the bottom bar left to right.", "ja": "下の横線を左から右へ書きます。" },
  "从左向右写顶横，斜向左下，再向右写底横。": { "en": "Draw the top bar rightward, slant down-left, then draw the bottom bar rightward.", "ja": "上の横線を右へ、左下へ斜めに引き、下の横線を右へ書きます。" },
  "从上到下写右竖。": { "en": "Draw the right vertical top to bottom.", "ja": "右の縦線を上から下へ書きます。" },
  "从左向右补中横。": { "en": "Add the middle bar left to right.", "ja": "中央の横線を左から右へ加えます。" },
  "从顶部向左绕出大椭圆，经底部与右侧回到起点。": { "en": "Loop left from the top into a large oval, returning via bottom and right.", "ja": "上から左へ大きな楕円を描き、下と右を通って戻ります。" },
  "从顶部向下写直竖；这里采用不加上下短横的写法。": { "en": "Draw a straight downstroke; this form has no top or bottom bars.", "ja": "上からまっすぐ縦線を書きます。この形では上下の短い横線は付けません。" },
  "先从上到下写左竖。": { "en": "First draw the left vertical top to bottom.", "ja": "まず左の縦線を上から下へ書きます。" },
  "从左下斜向顶点，再斜向右下，不加中横。": { "en": "Slant lower left to apex and down-right, without a middle bar.", "ja": "左下から頂点へ、右下へ斜めに書き、中央の横線は付けません。" },
  "从左下向上写左竖，斜向中部低点，再斜向右上，最后下行写右竖。": { "en": "Rise on the left, slant to the low midpoint, up-right, then down the right.", "ja": "左下から上へ、中央の低い点へ斜めに下り、右上へ上がって右の縦線を下ろします。" },
  "从左下向上写左竖，斜向右下，再向上写右竖。": { "en": "Rise on the left, slant down-right, then rise on the right.", "ja": "左の縦線を上へ、右下へ斜めに下り、右の縦線を上へ書きます。" },
  "抬笔，从左向右写较短的中横。": { "en": "Lift and draw a short middle bar left to right.", "ja": "ペンを上げ、中央の短い横線を左から右へ書きます。" },
  "抬笔，从左向右写底横。": { "en": "Lift and draw the bottom bar left to right.", "ja": "ペンを上げ、下の横線を左から右へ書きます。" },
  "从右上向左绕过顶部、左侧和底部，沿右侧回升，顶部保留字体中的小开口。": { "en": "Loop from upper right around top, left and bottom, rising right; leave the font's small opening at the top.", "ja": "右上から上・左・下を回り、右側を上がります。上には字体にある小さな隙間を残します。" },
  "从左上向右写顶横，再向下写右竖。": { "en": "Draw the top bar rightward, then the right vertical downward.", "ja": "左上から上の横線を右へ、右の縦線を下へ書きます。" },
  "从左竖顶部向右绕出圆腹，回到中腰。": { "en": "Loop right from the left vertical's top and return to mid-height.", "ja": "左の縦線の上端から右へ丸みを描き、中ほどに戻ります。" },
  "从右向左写顶横，斜向中部，再斜向左下，最后向右写底横。": { "en": "Draw the top bar right to left, slant to center then lower left, and finish the bottom bar rightward.", "ja": "上の横線を右から左へ、中央、左下へ斜めに引き、下の横線を右へ書きます。" },
  "从顶横中间向下写主干。": { "en": "Draw the stem down from the top bar's midpoint.", "ja": "上の横線の中央から主軸を下へ書きます。" },
  "从左上斜向中部交汇点，再斜向右上。": { "en": "Slant upper left to the central junction, then up-right.", "ja": "左上から中央の交点へ、さらに右上へ斜めに書きます。" },
  "从交汇点向下写竖画。": { "en": "Draw a vertical down from the junction.", "ja": "交点から縦線を下へ書きます。" },
  "先从顶部向下写长竖。": { "en": "First draw a long downstroke from the top.", "ja": "まず上から長い縦線を書きます。" },
  "从长竖上部向左绕出椭圆，经底部与右侧闭合。": { "en": "Loop left from the upper stem into an oval, closing through bottom and right.", "ja": "長い縦線の上部から左へ楕円を描き、下と右で閉じます。" },
  "从左上斜向右下。": { "en": "Slant from upper left to lower right.", "ja": "左上から右下へ斜めに書きます。" },
  "抬笔，从右上斜向左下。": { "en": "Lift and slant from upper right to lower left.", "ja": "ペンを上げ、右上から左下へ斜めに書きます。" },
  "从左上向下绕成杯形，再沿右侧回升到顶部。": { "en": "Curve down into a cup and rise on the right to the top.", "ja": "左上から下へカップ状に描き、右側を上端まで上がります。" },
  "从中间顶部向下写长竖，穿过杯形底部。": { "en": "Draw a central vertical from the top through the cup's bottom.", "ja": "中央上部からカップの底を通る長い縦線を書きます。" },
  "从圆圈顶部向左绕过左侧与底部，再沿右侧回到起点，闭合圆圈。": { "en": "Loop left from the circle top, around bottom and right, closing at the start.", "ja": "円の上から左・下・右を回って始点で閉じます。" },
  "抬笔，在圆圈下方从左向右写一横，与圆圈留出间隙。": { "en": "Lift and draw a bar below the circle, leaving a gap.", "ja": "ペンを上げ、円の下に隙間を空けて横線を左から右へ書きます。" },
  "从右上向左绕出小椭圆，回到起点。": { "en": "Loop left from upper right into a small oval, returning to the start.", "ja": "右上から左へ小さな楕円を描き、始点に戻ります。" },
  "沿右侧下行至基线，向右上轻挑收笔。": { "en": "Descend on the right to the baseline, then flick up-right.", "ja": "右側を基線まで下り、軽く右上へ払います。" },
  "从上方起笔，弯向左下形成字身。": { "en": "Start above and curve down-left to form the body.", "ja": "上から書き始め、左下へ曲げて字の胴体を作ります。" },
  "顺势围出下部椭圆，顶部保留向右的短钩。": { "en": "Continue around the lower oval, leaving a short right hook at the top.", "ja": "続けて下の楕円を囲み、上に右向きの短い鉤を残します。" },
  "从基线向上绕出长环，再回到字身。": { "en": "Loop upward from the baseline and return to the body.", "ja": "基線から上へ長い輪を描き、字の胴体に戻ります。" },
  "接写下方的小圆腹，向右收笔。": { "en": "Continue with the small lower bowl and finish right.", "ja": "続けて下の小さな丸みを描き、右で終えます。" },
  "从左上向右写圆弧肩部。": { "en": "Draw a rounded shoulder rightward from upper left.", "ja": "左上から右へ丸い肩の部分を描きます。" },
  "斜向左下回转，在基线向右弯出。": { "en": "Turn down-left and curve right at the baseline.", "ja": "左下へ斜めに戻り、基線で右へ曲げます。" },
  "先写字身的小椭圆。": { "en": "First draw the body's small oval.", "ja": "まず字の小さな楕円を描きます。" },
  "右侧向下越过基线，绕出下伸环并向右上收笔。": { "en": "Descend past the baseline on the right, loop below and finish up-right.", "ja": "右側を基線の下まで下り、下の輪を描いて右上で終えます。" },
  "从中部向右上起笔，绕出小环。": { "en": "Start at the middle, move up-right into a small loop.", "ja": "中央から右上へ書き始め、小さな輪を描きます。" },
  "向左下转成圆腹，向右开口收笔。": { "en": "Turn down-left into a bowl, ending open on the right.", "ja": "左下へ丸みを作り、右側を開けて終えます。" },
  "先按 е 的走向写好字身。": { "en": "First write the body as for е.", "ja": "まず е と同じ運筆で胴体を書きます。" },
  "抬笔，在上方加左点。": { "en": "Lift and add the left dot above.", "ja": "ペンを上げ、上に左の点を加えます。" },
  "抬笔，在上方加右点。": { "en": "Lift and add the right dot above.", "ja": "ペンを上げ、上に右の点を加えます。" },
  "先写左侧弯曲支臂，到中部连接。": { "en": "First curve the left arm into the center.", "ja": "まず左の曲がった枝を中央へつなげます。" },
  "抬笔，从上向下写中间主干。": { "en": "Lift and draw the central stem downward.", "ja": "ペンを上げ、中央の主軸を上から下へ書きます。" },
  "抬笔，从右上弯向中部，再绕向右下。": { "en": "Lift, curve from upper right into the center, then lower right.", "ja": "ペンを上げ、右上から中央へ曲げ、右下へ回します。" },
  "由左上向右绕出上半圆。": { "en": "Curve right from upper left into the upper semicircle.", "ja": "左上から右へ上の半円を描きます。" },
  "回到中腰，再向右下绕出下半圆并收笔。": { "en": "Return to mid-height and loop down-right through the lower semicircle.", "ja": "中ほどに戻り、右下へ下の半円を描いて終えます。" },
  "从左上斜下到基线，圆转向右上。": { "en": "Slant down to the baseline and round up-right.", "ja": "左上から基線へ斜めに下り、丸く右上へ返します。" },
  "从第二个高点下行，再向右上挑出。": { "en": "Descend from the second peak and flick up-right.", "ja": "2つ目の頂点から下り、右上へ払います。" },
  "先写 и 的两个下行笔和连接。": { "en": "First write и's two downstrokes and join.", "ja": "まず и の2本の下向きの線とつなぎを書きます。" },
  "抬笔，在上方从左到右加短弧。": { "en": "Lift and add a short arc above, left to right.", "ja": "ペンを上げ、上に短い弧を左から右へ加えます。" },
  "先写左侧下行笔。": { "en": "First write the left downstroke.", "ja": "まず左の下向きの線を書きます。" },
  "从右上接向中腰，再从中腰弯向右下。": { "en": "Join upper right to mid-height, then curve down-right.", "ja": "右上から中ほどへつなぎ、そこから右下へ曲げます。" },
  "从基线写小入笔钩，上行至尖顶。": { "en": "Start with a small baseline hook and rise to a peak.", "ja": "基線に小さな入りの鉤を書き、尖った頂点へ上がります。" },
  "斜下到基线，向右上挑出。": { "en": "Slant down to the baseline and flick up-right.", "ja": "基線へ斜めに下り、右上へ払います。" },
  "从基线入笔，上行到第一个尖顶，再回到基线。": { "en": "Start at the baseline, rise to the first peak and return down.", "ja": "基線から最初の頂点へ上がり、基線へ戻ります。" },
  "接写第二个尖顶，末端向右上挑出。": { "en": "Continue to a second peak and finish with an up-right flick.", "ja": "続けて2つ目の頂点を書き、末尾を右上へ払います。" },
  "写左侧下行笔。": { "en": "Write the left downstroke.", "ja": "左の下向きの線を書きます。" },
  "抬笔，从中部向右写连接横画。": { "en": "Lift and draw a joining bar rightward from the middle.", "ja": "ペンを上げ、中央から右へつなぎの横線を書きます。" },
  "抬笔，写右侧下行笔，在基线向右挑出。": { "en": "Lift, write the right downstroke and flick right at the baseline.", "ja": "ペンを上げ、右側を下り、基線で右へ払います。" },
  "从右上向左逆时针绕出椭圆。": { "en": "Draw a counterclockwise oval from upper right.", "ja": "右上から左へ反時計回りに楕円を描きます。" },
  "回到顶部闭合，留出向右的连接。": { "en": "Close at the top, leaving a rightward join.", "ja": "上で閉じ、右へのつなぎを残します。" },
  "先下行写左竖，再沿竖回到上部。": { "en": "Draw the left vertical down, then retrace upward.", "ja": "左の縦線を下ろし、同じ線に沿って上へ戻ります。" },
  "向右拱起，下行写右竖，基线处挑出。": { "en": "Arch right, descend on the right and flick at the baseline.", "ja": "右へ山を作り、右の縦線を下ろして基線で払います。" },
  "从字身上沿向下，写越过基线的长竖。": { "en": "From the body top, draw a long vertical below the baseline.", "ja": "字の上端から基線を越えて長く縦線を書きます。" },
  "回到字身上部，向右拱起，下行并收笔。": { "en": "Return to the upper body, arch right, descend and finish.", "ja": "字の上部に戻り、右へ山を作って下り、終えます。" },
  "从右上向左弯入。": { "en": "Curve in leftward from upper right.", "ja": "右上から左へ曲げて入ります。" },
  "绕过左侧与底部，在右侧开口收笔。": { "en": "Curve around left and bottom, ending open on the right.", "ja": "左と下を回り、右側を開けて終えます。" },
  "从左向右写略带倾斜的短横。": { "en": "Draw a slightly slanted short bar left to right.", "ja": "少し傾いた短い横線を左から右へ書きます。" },
  "从横画中部斜向下写主干，到基线轻挑收笔。": { "en": "Slant the stem down from the bar's center, flicking at the baseline.", "ja": "横線の中央から主軸を斜めに下ろし、基線で軽く払います。" },
  "先写左侧下行弧，回升到右上。": { "en": "First curve down the left and rise to upper right.", "ja": "まず左を弧状に下り、右上へ上がります。" },
  "沿右侧向下越过基线，绕出下伸环。": { "en": "Descend on the right past the baseline and make a lower loop.", "ja": "右側を基線の下まで下り、下に輪を描きます。" },
  "从中部先绕出左侧小椭圆。": { "en": "From the middle, first loop a small oval on the left.", "ja": "中央からまず左の小さな楕円を描きます。" },
  "抬笔，从上到下写中间长竖。": { "en": "Lift and draw the long central vertical downward.", "ja": "ペンを上げ、中央の長い縦線を上から下へ書きます。" },
  "抬笔，绕出右侧小椭圆。": { "en": "Lift and loop a small oval on the right.", "ja": "ペンを上げ、右の小さな楕円を描きます。" },
  "从左上弯向中间，再到左下。": { "en": "Curve from upper left through the middle to lower left.", "ja": "左上から中央へ曲げ、左下へ続けます。" },
  "抬笔，从右上经过中间弯到右下。": { "en": "Lift and curve upper right through the middle to lower right.", "ja": "ペンを上げ、右上から中央を通って右下へ曲げます。" },
  "先按 и 写出两个下行笔。": { "en": "First write two downstrokes as for и.", "ja": "まず и のように2本の下向きの線を書きます。" },
  "末端向下越过基线，补一个短尾钩。": { "en": "Extend below the baseline and add a short tail hook.", "ja": "末尾を基線の下へ伸ばし、短い尾の鉤を加えます。" },
  "从左上写短下行弧，弯向右上。": { "en": "Draw a short downward arc from upper left and curve up-right.", "ja": "左上から短い弧を下へ描き、右上へ曲げます。" },
  "从右上向下写右竖，在基线挑出。": { "en": "Draw the right vertical down and flick at the baseline.", "ja": "右上から右の縦線を下ろし、基線で払います。" },
  "连续写三个下行笔，笔间从基线回升。": { "en": "Write three downstrokes, rising from the baseline between them.", "ja": "3本の下向きの線を続け、間は基線から上へ戻ります。" },
  "第三笔在基线圆转，向右上收笔。": { "en": "Round the third stroke at the baseline and finish up-right.", "ja": "3本目は基線で丸く返し、右上で終えます。" },
  "先写 ш 的三个下行笔。": { "en": "First write ш's three downstrokes.", "ja": "まず ш の3本の下向きの線を書きます。" },
  "末端补越过基线的短尾钩。": { "en": "Add a short tail hook below the baseline.", "ja": "末尾に基線を越える短い鉤を加えます。" },
  "从左上向右写短肩部。": { "en": "Draw a short shoulder rightward from upper left.", "ja": "左上から右へ短い肩の部分を書きます。" },
  "向下写主干，在下部向右绕出圆腹。": { "en": "Draw the stem down and loop a bowl to the right below.", "ja": "主軸を下ろし、下部で右へ丸みを描きます。" },
  "先写左侧竖与下部圆腹，形成 ь。": { "en": "First draw the left stem and lower bowl to form ь.", "ja": "まず左の縦線と下の丸みで ь を作ります。" },
  "向右上连接，再写右侧下行笔。": { "en": "Join up-right, then draw the right downstroke.", "ja": "右上へつなぎ、右の下向きの線を書きます。" },
  "从上方下行到基线。": { "en": "Descend from above to the baseline.", "ja": "上から基線まで下ろします。" },
  "向右绕出下部圆腹，再接回主干。": { "en": "Loop the lower bowl rightward and rejoin the stem.", "ja": "右へ下の丸みを描き、主軸につなぎます。" },
  "从左上向右绕出向左开口的弧形。": { "en": "Curve right from upper left into a left-open arc.", "ja": "左上から右へ、左が開いた弧を描きます。" },
  "抬笔，从中部向右补短横。": { "en": "Lift and add a short rightward bar at the middle.", "ja": "ペンを上げ、中央から右へ短い横線を加えます。" },
  "抬笔，在中部从左向右写连接横画。": { "en": "Lift and draw the middle joining bar left to right.", "ja": "ペンを上げ、中央のつなぎの横線を左から右へ書きます。" },
  "抬笔，在右侧绕出椭圆并闭合。": { "en": "Lift and draw a closed oval on the right.", "ja": "ペンを上げ、右に楕円を描いて閉じます。" },
  "从右上向左绕出上部圆腹。": { "en": "Loop the upper bowl leftward from upper right.", "ja": "右上から左へ上の丸みを描きます。" },
  "从中腰斜向左下写支腿。": { "en": "Slant the leg from mid-height to lower left.", "ja": "中ほどから左下へ斜めに脚を書きます。" },
  "抬笔，从右上写下行主干，在基线向右挑出。": { "en": "Lift, draw the stem down from upper right and flick right at the baseline.", "ja": "ペンを上げ、右上から主軸を下ろし、基線で右へ払います。" },
  "从左下斜向上到顶点，再斜向右下。": { "en": "Slant from lower left to the apex, then down-right.", "ja": "左下から頂点へ斜めに上がり、右下へ下ろします。" },
  "抬笔，在中部从左到右加横。": { "en": "Lift and add a middle bar left to right.", "ja": "ペンを上げ、中央に横線を左から右へ加えます。" },
  "从左上向下写主干。": { "en": "Draw the stem down from upper left.", "ja": "左上から主軸を下へ書きます。" },
  "抬笔，回到顶部向右写帽檐。": { "en": "Lift, return to the top and draw the cap rightward.", "ja": "ペンを上げ、上に戻って帽子のつばを右へ書きます。" },
  "抬笔，从中腰向右绕出下部圆腹。": { "en": "Lift and loop the lower bowl rightward from mid-height.", "ja": "ペンを上げ、中ほどから右へ下の丸みを描きます。" },
  "先从顶部下行写左侧主干。": { "en": "First draw the left stem down from the top.", "ja": "まず上から左の主軸を下ろします。" },
  "从上方向右依次绕出上、下两个圆腹。": { "en": "From above, loop the upper and lower bowls rightward in order.", "ja": "上から右へ、上と下の丸みを順に描きます。" },
  "先写从上到下的左侧主干。": { "en": "First write the left stem from top to bottom.", "ja": "まず左の主軸を上から下へ書きます。" },
  "从顶部斜向左下，形成左侧支撑。": { "en": "Slant down-left from the top to form the left support.", "ja": "上から左下へ斜めに書き、左の支えを作ります。" },
  "抬笔，从顶部向右弯下形成字身，绕向左下收笔。": { "en": "Lift, curve right and down from the top to form the body, finishing lower left.", "ja": "ペンを上げ、上から右下へ胴体を曲げ、左下へ回って終えます。" },
  "抬笔，在下方补向右弯出的连接。": { "en": "Lift and add a right-curving join below.", "ja": "ペンを上げ、下に右へ曲がるつなぎを加えます。" },
  "先写左侧从上到下的主干。": { "en": "First draw the left stem top to bottom.", "ja": "まず左の主軸を上から下へ書きます。" },
  "抬笔，从左向右写顶横。": { "en": "Lift and draw the top bar left to right.", "ja": "ペンを上げ、上の横線を左から右へ書きます。" },
  "先写中间主干。": { "en": "First draw the central stem.", "ja": "まず中央の主軸を書きます。" },
  "抬笔，写左侧上下两支，经过中腰。": { "en": "Lift and draw both left arms through the midpoint.", "ja": "ペンを上げ、中ほどを通る左の上下の枝を書きます。" },
  "抬笔，写右侧上下两支，经过中腰。": { "en": "Lift and draw both right arms through the midpoint.", "ja": "ペンを上げ、中ほどを通る右の上下の枝を書きます。" },
  "从左上向右写上半圆。": { "en": "Draw the upper semicircle rightward from upper left.", "ja": "左上から右へ上の半円を描きます。" },
  "顺势写下半圆，左下收笔。": { "en": "Continue through the lower semicircle and finish lower left.", "ja": "続けて下の半円を描き、左下で終えます。" },
  "从左上写下行笔。": { "en": "Draw a downstroke from upper left.", "ja": "左上から下向きの線を書きます。" },
  "由左下斜向右上，再下行到右下。": { "en": "Slant from lower left to upper right, then descend lower right.", "ja": "左下から右上へ斜めに引き、右下へ下ろします。" },
  "先写 И。": { "en": "First write И.", "ja": "まず И を書きます。" },
  "抬笔，在顶部加从左到右的短弧。": { "en": "Lift and add a short arc above, left to right.", "ja": "ペンを上げ、上に短い弧を左から右へ加えます。" },
  "先写左侧主干。": { "en": "First draw the left stem.", "ja": "まず左の主軸を書きます。" },
  "从右上写到中腰，再由中腰向右下展开。": { "en": "Draw from upper right to mid-height, then extend down-right.", "ja": "右上から中ほどへ書き、そこから右下へ広げます。" },
  "从左下上行至顶部。": { "en": "Rise from lower left to the top.", "ja": "左下から上端へ上がります。" },
  "从顶部斜向右下，在基线处收笔。": { "en": "Slant from top to lower right, ending at the baseline.", "ja": "上から右下へ斜めに書き、基線で終えます。" },
  "从左下向上，再斜向中部低点。": { "en": "Rise from lower left, then slant to the low midpoint.", "ja": "左下から上がり、中央の低い点へ斜めに下ろします。" },
  "上行到右侧高点，再下行至右下。": { "en": "Rise to the right peak, then descend to lower right.", "ja": "右の高い点へ上がり、右下へ下ろします。" },
  "抬笔，从上到下写右侧主干。": { "en": "Lift and draw the right stem downward.", "ja": "ペンを上げ、右の主軸を上から下へ書きます。" },
  "抬笔，从左到右补中横。": { "en": "Lift and add the middle bar left to right.", "ja": "ペンを上げ、中央の横線を左から右へ加えます。" },
  "从右上向左绕过顶端与左侧。": { "en": "Curve left from upper right around the top and left side.", "ja": "右上から左へ、上端と左側を回ります。" },
  "经底部返回右上，闭合椭圆。": { "en": "Return via the bottom to upper right, closing the oval.", "ja": "下を通って右上へ戻り、楕円を閉じます。" },
  "写左侧下行主干。": { "en": "Draw the left stem downward.", "ja": "左の主軸を下へ書きます。" },
  "从左上向右写顶横，再写右侧下行主干。": { "en": "Draw the top bar rightward, then the right stem downward.", "ja": "左上から上の横線を右へ、右の主軸を下へ書きます。" },
  "回到顶部，向右绕出上部圆腹并接回中腰。": { "en": "Return to the top, loop the upper bowl rightward and rejoin at mid-height.", "ja": "上に戻り、右へ上の丸みを描いて中ほどにつなぎます。" },
  "经左侧和底部，在右下开口收笔。": { "en": "Curve around left and bottom, ending open at lower right.", "ja": "左と下を通り、右下を開けて終えます。" },
  "从左到右写顶部横画。": { "en": "Draw the top horizontal left to right.", "ja": "上の横線を左から右へ書きます。" },
  "从顶部中间向下写主干。": { "en": "Draw the stem down from the top center.", "ja": "上の中央から主軸を下へ書きます。" },
  "从左上斜向中间。": { "en": "Slant from upper left to the center.", "ja": "左上から中央へ斜めに書きます。" },
  "从右上斜下经过交汇点，再延伸至左下。": { "en": "Slant down from upper right through the junction to lower left.", "ja": "右上から交点を通って左下へ斜めに伸ばします。" },
  "先写中间长竖。": { "en": "First draw the long central vertical.", "ja": "まず中央の長い縦線を書きます。" },
  "抬笔，围绕中部写左右对称的椭圆。": { "en": "Lift and draw a symmetric oval around the middle.", "ja": "ペンを上げ、中央を囲む左右対称の楕円を描きます。" },
  "从左上写到右下。": { "en": "Write from upper left to lower right.", "ja": "左上から右下へ書きます。" },
  "抬笔，从右上写到左下。": { "en": "Lift and write from upper right to lower left.", "ja": "ペンを上げ、右上から左下へ書きます。" },
  "先写左侧下行笔，沿基线连向右侧。": { "en": "First draw the left downstroke, joining right along the baseline.", "ja": "まず左を下り、基線に沿って右へつなぎます。" },
  "写右侧下行笔，末端补短尾。": { "en": "Draw the right downstroke and add a short tail.", "ja": "右の下向きの線を書き、末尾に短い尾を加えます。" },
  "从左上写下弯，到中腰向右连接。": { "en": "Curve down from upper left and join right at mid-height.", "ja": "左上から下へ曲げ、中ほどで右へつなぎます。" },
  "从右上写到底部，形成右侧主干。": { "en": "Draw from upper right to the bottom for the right stem.", "ja": "右上から下まで書き、右の主軸を作ります。" },
  "连续写左、中、右三个下行笔，底部相连。": { "en": "Write left, middle and right downstrokes, joined at the bottom.", "ja": "左・中央・右の下向きの線を続け、下部でつなぎます。" },
  "最后在右下向右收笔。": { "en": "Finish rightward at lower right.", "ja": "最後に右下で右へ終えます。" },
  "先写 Ш。": { "en": "First write Ш.", "ja": "まず Ш を書きます。" },
  "右下补越过基线的短尾。": { "en": "Add a short tail below the baseline at lower right.", "ja": "右下に基線を越える短い尾を加えます。" },
  "从左向右写顶部肩部，再向下写主干。": { "en": "Draw the top shoulder left to right, then the stem downward.", "ja": "上の肩を左から右へ書き、主軸を下ろします。" },
  "在下部向右绕出圆腹。": { "en": "Loop the lower bowl rightward.", "ja": "下部で右へ丸みを描きます。" },
  "先写左侧主干及下部圆腹。": { "en": "First draw the left stem and lower bowl.", "ja": "まず左の主軸と下の丸みを書きます。" },
  "在右侧另写下行主干。": { "en": "Draw a separate right downstem.", "ja": "右側に別の下向きの主軸を書きます。" },
  "从中腰向右绕出下部圆腹。": { "en": "Loop the lower bowl rightward from mid-height.", "ja": "中ほどから右へ下の丸みを描きます。" },
  "从左上向右写半圆，回到左下。": { "en": "Draw a semicircle rightward from upper left to lower left.", "ja": "左上から右へ半円を描き、左下へ戻ります。" },
  "抬笔，补中间向右的横画。": { "en": "Lift and add the middle rightward bar.", "ja": "ペンを上げ、中央に右向きの横線を加えます。" },
  "抬笔，在中部向右写连接横画。": { "en": "Lift and draw a rightward joining bar at the middle.", "ja": "ペンを上げ、中央に右向きのつなぎの横線を書きます。" },
  "抬笔，在右侧绕出闭合椭圆。": { "en": "Lift and draw a closed oval on the right.", "ja": "ペンを上げ、右側に閉じた楕円を描きます。" },
  "从右上向左绕写上部圆腹。": { "en": "Loop the upper bowl leftward from upper right.", "ja": "右上から左へ上の丸みを描きます。" },
  "从右上向下写右侧主干。": { "en": "Draw the right stem down from upper right.", "ja": "右上から右の主軸を下へ書きます。" },
  "抬笔，从中腰斜向左下写支腿。": { "en": "Lift and slant the leg from mid-height to lower left.", "ja": "ペンを上げ、中ほどから左下へ斜めに脚を書きます。" },
  "第 {0} 笔：沿高亮轨迹，从圆点起笔，跟随动画方向书写。": { "en": "Stroke {0}: start at the dot and follow the highlighted animated path.", "ja": "第 {0} 画：丸い点から始め、強調された軌跡をアニメーションの方向へ書きます。" },
  "浅色": { "en": "Light", "ja": "ライト" },
  "深色": { "en": "Dark", "ja": "ダーク" },
  "完成": { "en": "Done", "ja": "完了" },
  "好": { "en": "OK", "ja": "OK" },
  "允许": { "en": "Allow", "ja": "許可" },
  "重新加载": { "en": "Reload", "ja": "再読み込み" },
  "高": { "en": "High", "ja": "高" },
  "练习": { "en": "Practice", "ja": "練習" },
  "来": { "en": "Come", "ja": "来ること" },
  "假名读音": { "en": "Kana pronunciation", "ja": "仮名の発音" },
  "Alphi · 字母学习": { "en": "Alphi · Letter learning", "ja": "Alphi · 文字の学習" },
  "书写区域加载失败，请重新打开。": { "en": "Could not load the writing area. Please reopen the app.", "ja": "書き取りエリアを読み込めませんでした。開き直してください。" },
  "范字加载失败，请重新打开。": { "en": "Could not load the sample characters. Please reopen the app.", "ja": "お手本を読み込めませんでした。開き直してください。" },
  "来源": { "en": "Source", "ja": "提供元" },
  "加载失败": { "en": "Loading failed", "ja": "読み込み失敗" },
  "亚美尼亚语": { "en": "Armenian", "ja": "アルメニア語" },
  "格鲁吉亚语": { "en": "Georgian", "ja": "ジョージア語" },
  "韩语": { "en": "Korean", "ja": "韓国語" },
  "字母读音": { "en": "Letter sound", "ja": "文字の発音" },
  "字母名称与读音": { "en": "Letter name and sound", "ja": "文字名と発音" },
  "新增字母真人录音：亚美尼亚语由母语者 Vahagn Petrosyan 录制（CC BY-SA 3.0），已截取单字母并降噪，修改后的音频沿用该许可。格鲁吉亚语来自 Learn Kartuli 母语者录音；韩语来自 zKorean 字母教学录音，辅音包含名称与读音。后两者仅供个人学习，未确认公开再分发许可。": { "en": "New human recordings: Armenian by native speaker Vahagn Petrosyan (CC BY-SA 3.0), excerpted and denoised under the same license. Georgian: Learn Kartuli native-speaker recordings. Korean: zKorean teaching recordings; consonants include names and sounds. The latter two are for personal study; public redistribution permission has not been verified.", "ja": "追加した人の録音：アルメニア語は母語話者 Vahagn Petrosyan（CC BY-SA 3.0）。文字ごとに切り出し、ノイズを軽減し、同じライセンスで提供。ジョージア語は Learn Kartuli の母語話者録音、韓国語は zKorean の教材録音（子音は名称と発音）。後二者は個人学習用で、公開再配布の許諾は未確認です。" },
  "正在加载录音": { "en": "Loading recordings", "ja": "録音を読み込み中" },
  "日语属于日琉语系，主要在日本使用。句子通常以谓语收尾，助词标示词语的作用，敬语则体现说话人与听话人的关系。": { "en": "Japanese belongs to the Japonic family and is used mainly in Japan. Predicates usually come last; particles mark grammatical roles, while honorific forms express social relationships.", "ja": "日本語は日琉語族に属し、主に日本で使われます。述語は通常文末に置かれ、助詞が語の役割を示し、敬語が相手との関係を表します。" },
  "日琉语系": { "en": "Japonic", "ja": "日琉語族" },
  "日本及海外日语社群": { "en": "Japan and overseas communities", "ja": "日本と海外の日本語話者社会" },
  "汉字、平假名与片假名": { "en": "Kanji, hiragana and katakana", "ja": "漢字・平仮名・片仮名" },
  "现代日语混用三种文字。汉字多承载词义，平假名常写助词、词尾等，片假名常写外来语和拟声词。假名主要表示拍，长音、促音和拗音也参与词语的节奏。": { "en": "Modern Japanese combines three scripts. Kanji often carry lexical meaning, hiragana mark particles and endings, and katakana commonly represent loanwords and sound symbolism. Kana mainly represent morae; long vowels, geminates and contracted sounds affect rhythm.", "ja": "現代日本語は三つの文字を併用します。漢字は語の意味、平仮名は助詞や語尾、片仮名は外来語や擬音語などに使われます。仮名は主に拍を表し、長音・促音・拗音にも注意が必要です。" },
  "8 世纪": { "en": "8th century", "ja": "8世紀" },
  "以汉字记录日语": { "en": "Recording Japanese with kanji", "ja": "漢字による日本語の記録" },
  "《古事记》和《万叶集》等早期文献留下上代日语的记录，万叶假名借用汉字的读音来记音。": { "en": "Early works such as the Kojiki and Man’yōshū preserve Old Japanese; man’yōgana used Chinese characters for their sounds.", "ja": "『古事記』『万葉集』などに上代日本語が残され、万葉仮名は漢字の音を借りて日本語を記しました。" },
  "9—10 世纪": { "en": "9th–10th centuries", "ja": "9〜10世紀" },
  "两种假名逐渐成形": { "en": "The kana scripts take shape", "ja": "二つの仮名の成立" },
  "平假名从汉字的草写演变，片假名多取自汉字的一部分，逐渐形成与汉字并用的书写方式。": { "en": "Hiragana evolved from cursive characters and katakana largely from character fragments, leading to mixed-script writing.", "ja": "平仮名は漢字の草書から、片仮名は主に漢字の一部から生まれ、漢字と併用されるようになりました。" },
  "19—20 世纪": { "en": "19th–20th centuries", "ja": "19〜20世紀" },
  "现代书面语与教育普及": { "en": "Modern prose and wider education", "ja": "現代の書き言葉と教育" },
  "言文一致运动推动书面语接近口语，学校教育、出版和媒体促进了现代标准日语的传播。": { "en": "The genbun itchi movement brought written prose closer to speech; education, publishing and media spread modern standard Japanese.", "ja": "言文一致運動で文章が話し言葉に近づき、学校教育・出版・メディアが現代標準語の普及を支えました。" },
  "先把平假名和片假名的字形与读音配对，再用短词练习长音、促音和拗音。本应用的字母页各收录 46 个基本假名。": { "en": "Pair each kana form with its sound, then practise long vowels, geminates and contracted sounds in short words. The library includes 46 basic forms for each kana script.", "ja": "まず平仮名・片仮名の形と音を結び付け、短い語で長音・促音・拗音を練習しましょう。字母一覧には各46字の基本仮名を収録しています。" },
  "俄语属于印欧语系斯拉夫语族的东斯拉夫语支。它主要在俄罗斯使用，也在许多跨地区社群中承担交流功能；名词变格、动词体和重音是学习重点。": { "en": "Russian is an East Slavic language within Indo-European. It is used mainly in Russia and for communication across many communities. Noun case, verbal aspect and stress are central learning topics.", "ja": "ロシア語は印欧語族スラヴ語派の東スラヴ語群に属します。主にロシアで使われ、各地の共通語としても機能します。名詞の格・動詞の体・アクセントが学習の要点です。" },
  "印欧语系 · 东斯拉夫语支": { "en": "Indo-European · East Slavic", "ja": "印欧語族・東スラヴ語群" },
  "俄罗斯及跨地区俄语社群": { "en": "Russia and Russian-speaking communities elsewhere", "ja": "ロシアと各地のロシア語話者社会" },
  "西里尔字母 · 33 个字母": { "en": "Cyrillic · 33 letters", "ja": "キリル文字・33字" },
  "俄语字母有大小写，印刷体与手写体的差异较明显。软音符 ь 和硬音符 ъ 本身不表示独立元音；重音位置还会影响元音的实际读法。": { "en": "Russian has upper- and lowercase forms, with marked differences between print and handwriting. The soft sign ь and hard sign ъ are not independent vowels; stress also affects vowel pronunciation.", "ja": "ロシア語には大文字と小文字があり、活字体と筆記体の違いが目立ちます。軟音符ь・硬音符ъは独立した母音を表さず、アクセントの位置も母音の発音に影響します。" },
  "10—11 世纪": { "en": "10th–11th centuries", "ja": "10〜11世紀" },
  "东斯拉夫书面传统发展": { "en": "East Slavic written traditions", "ja": "東スラヴの書き言葉" },
  "随着基督教传播，西里尔文字和教会斯拉夫语书面传统进入东斯拉夫地区，并与当地语言相互影响。": { "en": "Christianization brought Cyrillic writing and the Church Slavonic literary tradition to East Slavic regions, where they interacted with local speech.", "ja": "キリスト教の伝播に伴い、キリル文字と教会スラヴ語の文語的伝統が東スラヴ地域に広がり、地域の言語と影響し合いました。" },
  "18—19 世纪": { "en": "18th–19th centuries", "ja": "18〜19世紀" },
  "现代文学语言形成": { "en": "The modern literary language", "ja": "近代文学語の形成" },
  "彼得一世时期的民用字体改革改变了世俗印刷面貌，随后文学、教育和出版共同塑造现代标准俄语。": { "en": "Peter I’s civil-script reform changed secular printing; literature, education and publishing subsequently shaped modern standard Russian.", "ja": "ピョートル1世期の民用字体改革で世俗の印刷が変化し、その後の文学・教育・出版が現代標準ロシア語を形作りました。" },
  "1917—1918 年": { "en": "1917–1918", "ja": "1917〜1918年" },
  "正字法改革": { "en": "Orthographic reform", "ja": "正書法改革" },
  "改革移除部分旧字母，并取消词末辅音后常写的硬音符，使书写规则进一步简化。": { "en": "The reform removed several older letters and the routine word-final hard sign after consonants, simplifying spelling.", "ja": "一部の旧字母と、子音で終わる語の末尾に慣習的に書かれていた硬音符が廃止され、綴りが簡素化されました。" },
  "不要只按外形猜读音：例如 В 的读音与拉丁字母 B 不同。先熟悉印刷体，再对照手写体，并尽早连同重音一起记词。": { "en": "Avoid guessing sounds from familiar shapes: Cyrillic В differs from Latin B. Learn print forms, compare handwriting, and memorise words with their stress.", "ja": "見慣れた形だけで発音を推測せず、例えばВとラテン文字Bの違いに注意しましょう。活字体と筆記体を対照し、単語はアクセントと一緒に覚えましょう。" },
  "希腊语是印欧语系中的独立分支，拥有延续数千年的文字记录。现代希腊语主要用于希腊和塞浦路斯，经历了古希腊语、通用希腊语和中世纪希腊语等发展阶段。": { "en": "Greek forms its own branch of Indo-European, with written records spanning millennia. Modern Greek is used mainly in Greece and Cyprus and developed through ancient, Koine and medieval stages.", "ja": "ギリシャ語は印欧語族の独立した一派で、数千年に及ぶ文字記録があります。主にギリシャとキプロスで使われる現代語は、古代・コイネー・中世の段階を経て発展しました。" },
  "印欧语系 · 希腊语支": { "en": "Indo-European · Hellenic", "ja": "印欧語族・ギリシャ語派" },
  "希腊、塞浦路斯及海外社群": { "en": "Greece, Cyprus and overseas communities", "ja": "ギリシャ・キプロスと海外の話者社会" },
  "希腊字母 · 24 个字母": { "en": "Greek alphabet · 24 letters", "ja": "ギリシャ文字・24字" },
  "希腊字母有大小写，小写 σ 在词尾通常写作 ς。现代读音与古代读音有明显差异，字母组合也会共同表示一个音；本应用录音采用现代希腊语。": { "en": "Greek has upper- and lowercase forms; lowercase σ normally becomes ς at word endings. Modern and ancient pronunciation differ, and letter combinations can represent a single sound. Alphi uses Modern Greek recordings.", "ja": "大文字・小文字があり、小文字σは通常語末でςになります。現代語と古代語の発音は異なり、複数字母で一つの音を表す場合もあります。本アプリは現代ギリシャ語の録音を使います。" },
  "约公元前 8 世纪": { "en": "Around the 8th century BCE", "ja": "紀元前8世紀頃" },
  "字母体系出现": { "en": "The alphabet emerges", "ja": "アルファベットの成立" },
  "希腊人改造腓尼基字母，明确用字母表示元音。早期各地区字形并不完全统一。": { "en": "Greeks adapted Phoenician writing and assigned letters to vowels; early regional alphabets differed.", "ja": "フェニキア文字を改変して母音を字母で表す体系が生まれました。当初は地域ごとに字形が異なりました。" },
  "希腊化时代": { "en": "Hellenistic era", "ja": "ヘレニズム時代" },
  "通用希腊语传播": { "en": "The spread of Koine", "ja": "コイネーの広がり" },
  "亚历山大征服之后，以阿提卡语为重要基础的通用希腊语在更广阔地区传播，并成为后续语言演变的重要基础。": { "en": "After Alexander’s conquests, Koine, based substantially on Attic Greek, spread widely and became a major foundation for later developments.", "ja": "アレクサンドロスの征服後、アッティカ方言を重要な基盤とするコイネーが広がり、その後の言語発展の土台となりました。" },
  "1976 年": { "en": "1976", "ja": "1976年" },
  "现代标准语确立": { "en": "Modern standardisation", "ja": "現代標準語の確立" },
  "经过长期书面语争论，以民众日常语言为基础的现代希腊语确立为官方和教育语言。": { "en": "After a long language debate, Modern Greek based on the vernacular became the official and educational language.", "ja": "長年の言語問題を経て、日常の民衆語を基盤とする現代ギリシャ語が公用・教育の言語として確立しました。" },
  "先练习大小写配对和词尾 ς，再把字母放入短词中学习。数学、物理里熟悉的字母名称，不一定与现代希腊语的实际读法相同。": { "en": "Start with case pairs and final ς, then read short words. Letter names familiar from mathematics and physics may differ from Modern Greek usage.", "ja": "大文字・小文字の対応と語末ςを覚えてから短い語を読みましょう。数学や物理で親しんだ字母名が、現代語の読み方と一致するとは限りません。" },
  "亚美尼亚语在印欧语系中自成一支。它是亚美尼亚的重要日常与文化语言，海外社群也长期使用；现代书面语主要有东亚美尼亚语和西亚美尼亚语两种标准。": { "en": "Armenian is an independent branch of Indo-European. Used in Armenia and long-established overseas communities, it has two main modern literary standards: Eastern and Western Armenian.", "ja": "アルメニア語は印欧語族の独立した一派です。アルメニアと海外の話者社会で使われ、現代の文語には主に東アルメニア語と西アルメニア語の二つの標準があります。" },
  "印欧语系 · 亚美尼亚语支": { "en": "Indo-European · Armenian", "ja": "印欧語族・アルメニア語派" },
  "亚美尼亚及海外亚美尼亚社群": { "en": "Armenia and Armenian communities abroad", "ja": "アルメニアと海外のアルメニア人社会" },
  "亚美尼亚字母 · 本应用收录 39 项": { "en": "Armenian script · 39 entries in Alphi", "ja": "アルメニア文字・本アプリは39項目" },
  "亚美尼亚字母有大小写。现代教学中常把 ու 和 և 作为独立项目排列；传统正字法与改革正字法存在差别，字母计数也可能因口径不同而变化。": { "en": "Armenian has upper- and lowercase forms. Modern teaching often lists ու and և as separate entries. Traditional and reformed orthographies differ, and letter counts depend on the convention used.", "ja": "大文字・小文字があります。現代の教材ではուとևを独立項目として並べることが多く、伝統正書法と改革正書法の違いや数え方によって字母数も異なります。" },
  "约 405 年": { "en": "Around 405 CE", "ja": "405年頃" },
  "马什托茨创制字母": { "en": "Mashtots creates the alphabet", "ja": "マシュトツによる文字の創製" },
  "梅斯罗普·马什托茨创制最初的 36 个字母，为翻译、教育和古典亚美尼亚语文学的发展提供基础。": { "en": "Mesrop Mashtots created an initial alphabet of 36 letters, supporting translation, education and Classical Armenian literature.", "ja": "メスロプ・マシュトツが最初の36字を創製し、翻訳・教育・古典アルメニア語文学の基盤を築きました。" },
  "中世纪": { "en": "Middle Ages", "ja": "中世" },
  "文字持续扩充": { "en": "The script expands", "ja": "文字の拡充" },
  "օ 和 ֆ 等字母在后来的使用中加入，书体也逐步发展为多种抄写与印刷传统。": { "en": "Letters including օ and ֆ were added later, while different manuscript and printing styles developed.", "ja": "後にօやֆなどが加わり、写本や印刷に用いられる多様な書体も発展しました。" },
  "现代标准与正字法分化": { "en": "Modern standards and spelling", "ja": "現代標準語と正書法" },
  "东、西两种现代书面标准逐渐发展；20 世纪的正字法改革又使部分社群采用不同拼写传统。": { "en": "Eastern and Western literary standards developed; twentieth-century spelling reforms led communities to follow different orthographic traditions.", "ja": "東西の現代文語が発展し、20世紀の正書法改革により、話者社会ごとに異なる綴りの伝統が用いられるようになりました。" },
  "先成对认识大小写，注意 ու 是由两个字符组成的字母项目。本应用的真人录音采用东亚美尼亚语，西部标准的部分辅音读法有所不同。": { "en": "Learn case pairs and note that ու is a two-character alphabet entry. The recordings use Eastern Armenian; some consonants differ in the Western standard.", "ja": "大文字・小文字を対で覚え、ուが二つの文字からなる項目であることに注意しましょう。録音は東アルメニア語で、西部標準とは一部子音の発音が異なります。" },
  "格鲁吉亚语属于卡特维尔语系，是格鲁吉亚的主要公共生活语言。它拥有独立的书写传统，辅音组合丰富，动词形式能表达多层语法信息。": { "en": "Georgian belongs to the Kartvelian family and is the main language of public life in Georgia. It has its own writing tradition, rich consonant clusters and complex verbal morphology.", "ja": "ジョージア語はカルトヴェリ語族に属し、ジョージアの公共生活で中心となる言語です。独自の文字、豊かな子音連続、複雑な動詞の形態を持ちます。" },
  "卡特维尔语系": { "en": "Kartvelian", "ja": "カルトヴェリ語族" },
  "格鲁吉亚及海外格鲁吉亚社群": { "en": "Georgia and Georgian communities abroad", "ja": "ジョージアと海外のジョージア人社会" },
  "现代骑士体 · 33 个字母": { "en": "Modern Mkhedruli · 33 letters", "ja": "現代ムヘドルリ文字・33字" },
  "现代常用的骑士体（Mkhedruli）包含 33 个字母，基本按语音拼写。日常文字使用单一套字形；排版中也会见到 Mtavruli 大写形式。本应用展示常用骑士体。": { "en": "Modern Mkhedruli has 33 letters and largely phonemic spelling. Everyday writing uses one case; Mtavruli capitals also appear in typography. Alphi shows everyday Mkhedruli forms.", "ja": "現代のムヘドルリ文字は33字で、おおむね音に沿って綴ります。日常文では一組の字形を使い、見出しなどにはムタヴルリ大文字も現れます。本アプリでは通常のムヘドルリを扱います。" },
  "5 世纪": { "en": "5th century", "ja": "5世紀" },
  "早期文字记录": { "en": "Early written evidence", "ja": "初期の文字記録" },
  "现存早期格鲁吉亚语铭文可追溯到 5 世纪，古老的圆体字母见证了书写传统的形成。": { "en": "Early surviving Georgian inscriptions date to the fifth century; the old rounded script marks the beginnings of its written tradition.", "ja": "現存する初期の碑文は5世紀にさかのぼり、古い丸みのある文字が書記伝統の成立を伝えています。" },
  "三种书体演进": { "en": "Three scripts develop", "ja": "三つの書体の発展" },
  "圆体、教会小写体和骑士体在不同阶段发展，并分别延续于宗教、文化和日常书写之中。": { "en": "Asomtavruli, Nuskhuri and Mkhedruli developed at different stages and continue in religious, cultural and everyday contexts.", "ja": "アソムタヴルリ・ヌスフリ・ムヘドルリが異なる時期に発展し、宗教・文化・日常の場面で受け継がれています。" },
  "2016 年": { "en": "2016", "ja": "2016年" },
  "书写文化列入非遗": { "en": "Writing culture recognised by UNESCO", "ja": "文字文化のユネスコ登録" },
  "格鲁吉亚字母三种书写体系的活态文化列入联合国教科文组织人类非物质文化遗产代表作名录。": { "en": "The living culture of the three Georgian writing systems was inscribed on UNESCO’s Representative List of Intangible Cultural Heritage.", "ja": "三つの文字体系の生きた文化が、ユネスコ無形文化遺産の代表一覧表に登録されました。" },
  "先把字母与录音逐个对应，再区分送气音、浊音和挤喉音。遇到连续辅音时放慢分解练习，不要自行插入元音。": { "en": "Match each letter with its recording, then distinguish aspirated, voiced and ejective consonants. Practise clusters slowly without inserting extra vowels.", "ja": "文字と録音を一つずつ結び付け、有気音・有声音・放出音を聞き分けましょう。子音連続はゆっくり分解し、余分な母音を挟まないよう練習します。" },
  "韩语属于朝鲜语系，主要在朝鲜半岛及海外社群中使用。它通常把谓语放在句末，用词尾变化和敬语表达时间、语气以及人际关系。": { "en": "Korean belongs to the Koreanic family and is used across the Korean Peninsula and in overseas communities. Predicates usually come last; endings and honorific forms express tense, mood and social relationships.", "ja": "韓国語は朝鮮語族に属し、朝鮮半島と海外の話者社会で使われます。述語を通常文末に置き、語尾や敬語で時制・話し手の態度・人間関係を表します。" },
  "朝鲜语系": { "en": "Koreanic", "ja": "朝鮮語族" },
  "朝鲜半岛及海外韩语社群": { "en": "Korean Peninsula and overseas communities", "ja": "朝鮮半島と海外の韓国語話者社会" },
  "谚文 · 24 个基本字母": { "en": "Hangeul · 24 basic letters", "ja": "ハングル・24の基本字母" },
  "谚文是字母文字，字母按音节组合成方块，而不是沿直线逐个排列。例如 한 由 ㅎ、ㅏ、ㄴ 组成。本应用列出 19 个辅音和 21 个元音，共 40 项，包含双辅音和复合元音。": { "en": "Hangeul is alphabetic, with letters arranged into syllable blocks. For example, 한 combines ㅎ, ㅏ and ㄴ. Alphi lists 19 consonants and 21 vowels: 40 entries including doubled consonants and compound vowels.", "ja": "ハングルは字母を音節単位のブロックに組み合わせる文字です。例えば한はㅎ・ㅏ・ㄴから成ります。本アプリは二重子音・複合母音を含む子音19・母音21の計40項目を収録します。" },
  "15 世纪以前": { "en": "Before the 15th century", "ja": "15世紀以前" },
  "汉字与借字书写": { "en": "Chinese characters and adapted writing", "ja": "漢字と借字表記" },
  "正式书面活动长期使用汉文，也发展出借用汉字记录本地语言的方式，但学习门槛较高。": { "en": "Classical Chinese long served formal writing, alongside systems adapting Chinese characters to local speech; literacy required substantial study.", "ja": "公的な文章には長く漢文が使われ、漢字を借りて地域の言語を記す方式も発達しましたが、習得には多くの学習が必要でした。" },
  "1443 年": { "en": "1443", "ja": "1443年" },
  "世宗创制新文字": { "en": "Sejong creates a new script", "ja": "世宗による文字の創製" },
  "世宗创制用于记录本地语言的新文字，最初有 28 个字母，旨在让更多人能够读写。": { "en": "King Sejong created a script for the local language, originally with 28 letters, to make literacy more accessible.", "ja": "世宗は人々が読み書きを学びやすくするため、当初28字からなる新しい文字を創製しました。" },
  "1446 年至今": { "en": "From 1446 onward", "ja": "1446年から現代へ" },
  "公布与逐步普及": { "en": "Publication and wider adoption", "ja": "公布と普及" },
  "《训民正音》公布并解释造字原理。经过长期传播与近现代规范化，谚文成为日常教育、出版和数字交流的主要文字。": { "en": "Hunminjeongeum introduced the script and explained its principles. Gradual adoption and modern standardisation made Hangeul central to education, publishing and digital communication.", "ja": "『訓民正音』で文字と原理が公に示されました。長い普及と近現代の標準化を経て、教育・出版・デジタル交流の中心的な文字となりました。" },
  "先认基本辅音和元音，再练习组装音节。辅音名称与词中的发音用途不同；本应用辅音录音保留名称和发音示范，后续还需结合收音与音变练习。": { "en": "Learn basic consonants and vowels, then build syllables. Letter names serve a different purpose from sounds in words; the consonant recordings include names and demonstrations. Later, practise final consonants and sound changes in context.", "ja": "基本子音・母音を覚え、音節を組み立てましょう。字母名と語中の音は用途が異なります。子音の録音には名称と発音例が入り、次の段階ではパッチムや音変化も練習します。" },
  "介绍": { "en": "About", "ja": "紹介" },
  "语言概况": { "en": "At a glance", "ja": "言語の概要" },
  "语系": { "en": "Language family", "ja": "語族" },
  "主要使用地区": { "en": "Where it is used", "ja": "主な使用地域" },
  "文字系统": { "en": "Writing system", "ja": "文字体系" },
  "文字与读音": { "en": "Script and sounds", "ja": "文字と発音" },
  "发展历史": { "en": "Historical development", "ja": "発展の歴史" },
  "学习提示": { "en": "Learning tips", "ja": "学習のヒント" },
  "资料来源": { "en": "Sources and further reading", "ja": "参考資料" },
  "越南语": { "en": "Vietnamese", "ja": "ベトナム語" },
  "越南语属于南亚语系，主要在越南及海外社群中使用。声调和元音的区别会改变词义。": { "en": "Vietnamese is an Austroasiatic language used in Vietnam and overseas communities. Tones and vowel distinctions can change word meanings.", "ja": "ベトナム語はオーストロアジア語族に属し、ベトナムや海外のコミュニティで使われます。声調や母音の違いによって語の意味が変わります。" },
  "南亚语系 · 越语支": { "en": "Austroasiatic · Vietic", "ja": "オーストロアジア語族 · ベト語支" },
  "越南及海外越南语社群": { "en": "Vietnam and overseas Vietnamese communities", "ja": "ベトナムおよび海外のベトナム語コミュニティ" },
  "国语字 · 29 个字母": { "en": "Quốc ngữ · 29 letters", "ja": "クオック・グー · 29文字" },
  "ă、â、đ、ê、ô、ơ、ư 是独立字母。声调另用五种符号标记，无标记也是一种声调；不要把声调变体当作新字母。": { "en": "The letters ă, â, đ, ê, ô, ơ and ư are distinct letters. Five marks indicate tones, alongside an unmarked tone; tonal variants are not additional alphabet letters.", "ja": "ă・â・đ・ê・ô・ơ・ư は独立した文字です。声調は5種類の記号と無標で表し、声調付きの形を別の字母として数えません。" },
  "早期书写传统": { "en": "Early writing traditions", "ja": "初期の表記" },
  "汉文与字喃": { "en": "Classical Chinese and chữ Nôm", "ja": "漢文とチュノム" },
  "汉文长期用于正式文书，字喃则借用和改造汉字来记录越南语。": { "en": "Classical Chinese served formal writing, while chữ Nôm adapted Chinese characters to record Vietnamese.", "ja": "漢文は長く公的な文書に用いられ、チュノムは漢字を借用・改変してベトナム語を表しました。" },
  "17 世纪": { "en": "17th century", "ja": "17世紀" },
  "拉丁字母记音发展": { "en": "Latin-based writing develops", "ja": "ラテン文字による表記の発展" },
  "传教士与本地使用者参与发展拉丁字母记音；1651 年出版的越葡拉词典留下重要记录。": { "en": "Missionaries and local speakers developed Latin-based transcription; a Vietnamese–Portuguese–Latin dictionary published in 1651 is an important record.", "ja": "宣教師と現地の話者がラテン文字による表記を発展させ、1651年の越葡羅辞典に重要な記録が残されました。" },
  "国语字逐步普及": { "en": "Quốc ngữ spreads", "ja": "クオック・グーの普及" },
  "报刊、教育与文学推动国语字传播，逐渐形成今天通行的书写体系。": { "en": "Newspapers, education and literature spread Quốc ngữ, leading to the writing system used today.", "ja": "新聞、教育、文学を通じてクオック・グーが広まり、現在の一般的な表記となりました。" },
  "先区分 a、ă、â 和 o、ô、ơ，再结合短词练习声调。字母名称不等于词中的实际发音，不同地区的读法也有差异。": { "en": "First distinguish a/ă/â and o/ô/ơ, then practise tones in short words. Letter names differ from sounds in words, and pronunciation varies by region.", "ja": "まず a・ă・â と o・ô・ơ を区別し、短い語で声調を練習しましょう。文字の名前と語中の発音は異なり、地域差もあります。" },
  "越南语录音来自北伊利诺伊大学 SEAsite 字母教材，大小写共用字母读音。音频仅供个人学习，保留原始来源；未确认公开再分发许可。": { "en": "Vietnamese recordings come from Northern Illinois University’s SEAsite alphabet lessons, shared by upper- and lowercase forms. For personal study with original credits retained; public redistribution permission has not been verified.", "ja": "ベトナム語の録音は北イリノイ大学 SEAsite の字母教材に由来し、大文字と小文字で共用します。原典の情報を保持した個人学習用で、公開再配布の許諾は確認していません。" },
  "六个声调": { "en": "Six tones", "ja": "6つの声調" },
  "越南语有六个书写声调：一个无标记，五个用符号标在元音上。声调会改变词义。以下以北部常见读法为参考，各地区的音高和发声方式会有差异。": { "en": "Vietnamese spelling distinguishes six tones: one unmarked and five marked on vowels. Tones change word meanings. The descriptions below reflect common Northern pronunciation; pitch and voice quality vary by region.", "ja": "ベトナム語の表記は6つの声調を区別し、1つは無標、5つは母音に記号を付けます。声調で語の意味が変わります。以下は北部の一般的な発音を参考にしており、音の高さや声質には地域差があります。" },
  "三": { "en": "Three", "ja": "三" },
  "和": { "en": "And", "ja": "〜と" },
  "鱼": { "en": "Fish", "ja": "魚" },
  "年长的；大的": { "en": "Elder; large", "ja": "年長の・大きい" },
  "表示过去": { "en": "Past-time marker", "ja": "過去を表す" },
  "稻秧": { "en": "Rice seedling", "ja": "稲の苗" },
  "无标记。音高居中或略高，单独读时通常较平稳。": { "en": "Unmarked. Mid or upper-mid pitch, usually fairly level in isolation.", "ja": "無標。中程度またはやや高い音で、単独では比較的平らに発音します。" },
  "左斜符号。音高较低，轻缓下降，常带一点气声。": { "en": "Grave accent. Low pitch with a gentle fall, often slightly breathy.", "ja": "左下がりの記号。低めの音が緩やかに下がり、息の混じった声になることがあります。" },
  "右斜符号。音高向上升，发音较紧。": { "en": "Acute accent. Rising pitch with a tense voice.", "ja": "右上がりの記号。音が上がり、声に張りがあります。" },
  "上方钩号。音高先向中低处降，单独读时末尾常回升。": { "en": "Hook above. Pitch drops to a mid-low range, often rising again at the end in isolation.", "ja": "上のかぎ形記号。中低域へ下がり、単独では終わりに上がることがよくあります。" },
  "上方波浪号。音高上升，中间常有喉部收紧或短暂中断。": { "en": "Tilde above. Rising pitch, often with a constriction or brief break in the throat.", "ja": "上の波形記号。音が上がり、途中で喉が締まったり、声が一瞬途切れたりします。" },
  "下方圆点。音高较低并急降，发音短促，收尾常有喉部收紧。": { "en": "Dot below. A short, low, sharply falling tone, often ending with a constriction in the throat.", "ja": "下の点。低い音が急に下がる短い声調で、終わりに喉を締めることがよくあります。" },
  "先认字母，再认声调：ắ 是 ă 加 sắc，ầ 是 â 加 huyền，ợ 是 ơ 加 nặng。字母符号决定元音，声调符号决定声调；同一个元音上可以同时出现两种符号。练习时结合词语听辨，不要直接套用普通话四声。": { "en": "Identify the letter first, then the tone: ắ is ă plus sắc, ầ is â plus huyền, and ợ is ơ plus nặng. Letter marks identify the vowel; tone marks identify the tone. Both can appear on one vowel. Practise listening in words rather than mapping them directly to Mandarin’s four tones.", "ja": "まず文字、次に声調を確認しましょう。ắ は ă に sắc、ầ は â に huyền、ợ は ơ に nặng を加えた形です。字母の記号は母音、声調記号は声調を表し、同じ母音に両方が付くことがあります。語の中で聞き分け、中国語普通話の四声にそのまま当てはめないようにしましょう。" },
  "字母名称": { "en": "Letter name", "ja": "文字の名前" }
};
const messages = {
  "已取消": { "en": "Canceled", "ja": "キャンセル済み" },
  "接口必须使用 HTTPS": { "en": "The endpoint must use HTTPS", "ja": "接続先にはHTTPSが必要です" },
  "响应超过大小限制": { "en": "Response exceeds size limit", "ja": "応答がサイズ制限を超えています" },
  "模块名称无效": { "en": "Invalid module name", "ja": "モジュール名が無効です" },
  "已耗时 {0} 秒 · 已接收 {1}{2} token": { "en": "{0}s elapsed · {1}{2} tokens received", "ja": "{0} 秒経過 · {1}{2} トークン受信" },
  "约 ": { "en": "about ", "ja": "約 " },
  "模型输出被截断或拒绝，请缩短输入后重试": { "en": "Model output truncated or refused. Shorten input and retry.", "ja": "出力が途中で終了、または拒否されました。入力を短くして再試行してください" },
  "连接中断，结果未完成，请重试": { "en": "Connection interrupted. Result incomplete; retry.", "ja": "接続が中断され、結果が未完了です。再試行してください" },
  "模型服务返回错误": { "en": "Model service error", "ja": "モデルサービスのエラー" },
  "朗读文本须为 1–4000 个字符，请将长文章分段生成": { "en": "Text must contain 1–4000 characters. Split long articles into sections.", "ja": "テキストは 1～4000 文字で指定してください。長文は分割して生成してください。" },
  "语速须为 0.5–2 倍": { "en": "Speed must be between 0.5 and 2.", "ja": "速度は 0.5～2 倍で指定してください。" },
  "此功能暂时不可用，请重新打开应用。": { "en": "This feature is unavailable. Please reopen the app.", "ja": "この機能は現在利用できません。アプリを開き直してください。" },
  "请在 Lingrove 中使用朗读功能。": { "en": "Please use read aloud in Lingrove.", "ja": "読み上げ機能は Lingrove でご利用ください。" },
  "请在 Lingrove 中使用此功能。": { "en": "Please use this feature in Lingrove.", "ja": "この機能は Lingrove でご利用ください。" },
  "生成中断，请重试。": { "en": "Generation was interrupted. Please try again.", "ja": "生成が中断されました。もう一度お試しください。" },
  "生成结果不完整，请重试。": { "en": "The result is incomplete. Please try again.", "ja": "結果が不完全です。もう一度お試しください。" },
  "请求失败，请检查「应用设置 → 通用模型」中的设置。": { "en": "Request failed. Check your settings in App Settings → General-purpose model.", "ja": "リクエストに失敗しました。「アプリ設定 → 汎用モデル」の設定を確認してください。" },
  "请选择有效的朗读语言。": { "en": "Choose a valid reading language.", "ja": "有効な読み上げ言語を選択してください。" }
};
let catalog = messages;
let patterns = createPatterns(catalog);
function resolveAppLocale(language) {
  const code = language.toLowerCase().replace(/_/g, "-");
  if (code === "zh" || code.startsWith("zh-")) {
    return "zh-Hans";
  }
  return code === "ja" || code.startsWith("ja-") ? "ja" : "en";
}
let locale = "zh-Hans";
const listeners = /* @__PURE__ */ new Set();
let pageTitle;
const currentAppLocale = () => locale;
function setAppLocale(language) {
  const next = resolveAppLocale(language);
  document.documentElement.lang = next;
  const changed = next !== locale;
  locale = next;
  pageTitle ??= document.title;
  document.title = translate(pageTitle);
  if (!changed) return;
  listeners.forEach((listener) => listener());
}
function onAppLocaleChange(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
let initialized = false;
async function initializeAppLanguage(appMessages) {
  catalog = { ...messages, ...appMessages };
  patterns = createPatterns(catalog);
  if (!initialized) {
    initialized = true;
    window.addEventListener("lingrove:languagechange", (event) => {
      const language = event.detail?.language;
      if (typeof language === "string") setAppLocale(language);
    });
    window.addEventListener("languagechange", () => {
      void getAppLanguage().then(setAppLocale).catch(() => {
      });
    });
  }
  setAppLocale(await getAppLanguage());
}
function createPatterns(source) {
  return Object.entries(source).filter(([key]) => /\{\d+\}/.test(key)).map(([key, value]) => ({
    pattern: new RegExp(
      "^" + key.split(/(\{\d+\})/).map(
        (part) => /^\{\d+\}$/.test(part) ? "([\\s\\S]*?)" : part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      ).join("") + "$"
    ),
    value
  }));
}
function translate(value, values = []) {
  const source = value == null ? "" : String(value);
  const selected = catalog[source];
  let result = locale === "zh-Hans" ? source : selected?.[locale];
  let args = values;
  if (result === void 0 && locale !== "zh-Hans") {
    for (const entry of patterns) {
      const match = entry.pattern.exec(source);
      if (match) {
        result = entry.value[locale];
        args = match.slice(1);
        break;
      }
    }
  }
  return (result ?? source).replace(
    /\{(\d+)\}/g,
    (placeholder, index) => index in args ? String(args[Number(index)] ?? "") : placeholder
  );
}
function installFocusMode() {
  const root = document.documentElement;
  root.dataset.focusMode = "managed";
  delete root.dataset.keyboardFocus;
  const onPointer = () => {
    delete root.dataset.keyboardFocus;
  };
  const onKey = (event) => {
    if (["Tab", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
      root.dataset.keyboardFocus = "true";
    }
  };
  document.addEventListener("pointerdown", onPointer, true);
  document.addEventListener("keydown", onKey, true);
  return () => {
    document.removeEventListener("pointerdown", onPointer, true);
    document.removeEventListener("keydown", onKey, true);
    delete root.dataset.keyboardFocus;
    delete root.dataset.focusMode;
  };
}
function createID() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
const streams = /* @__PURE__ */ new Map();
if (typeof window !== "undefined") window.__lingroveChunk = (id, chunk) => streams.get(id)?.(chunk);
const isNative = () => !!window.webkit?.messageHandlers?.lingrove;
async function invoke(method, params) {
  const bridge = window.webkit?.messageHandlers?.lingrove;
  if (!bridge) throw new Error("此功能暂时不可用，请重新打开应用。");
  return await bridge.postMessage({ version: 1, method, params });
}
async function ready() {
  if (isNative()) await invoke("runtime.ready", {});
}
function moduleStorage(moduleID) {
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(moduleID)) throw new Error("模块名称无效");
  return {
    async get(key) {
      const raw = isNative() ? await invoke("state.get", { key }) : localStorage.getItem(`${moduleID}.${key}`);
      return raw === null ? null : JSON.parse(raw);
    },
    async set(key, value) {
      const encoded = JSON.stringify(value);
      if (isNative()) await invoke("state.set", { key, value: encoded });
      else localStorage.setItem(`${moduleID}.${key}`, encoded);
    }
  };
}
async function setRootPage(isRoot) {
  if (isNative()) await invoke("runtime.navigation", { isRoot });
}
async function getAppLanguage() {
  if (isNative()) return resolveAppLocale(await invoke("runtime.language", {}));
  return resolveAppLocale(navigator.language || "en");
}
// @__NO_SIDE_EFFECTS__
function makeMap(str) {
  const map = /* @__PURE__ */ Object.create(null);
  for (const key of str.split(",")) map[key] = 1;
  return (val) => val in map;
}
const EMPTY_OBJ = {};
const EMPTY_ARR = [];
const NOOP = () => {
};
const NO = () => false;
const isOn = (key) => key.charCodeAt(0) === 111 && key.charCodeAt(1) === 110 && // uppercase letter
(key.charCodeAt(2) > 122 || key.charCodeAt(2) < 97);
const isModelListener = (key) => key.startsWith("onUpdate:");
const extend = Object.assign;
const remove = (arr, el) => {
  const i = arr.indexOf(el);
  if (i > -1) {
    arr.splice(i, 1);
  }
};
const hasOwnProperty$1 = Object.prototype.hasOwnProperty;
const hasOwn = (val, key) => hasOwnProperty$1.call(val, key);
const isArray = Array.isArray;
const isMap = (val) => toTypeString(val) === "[object Map]";
const isSet = (val) => toTypeString(val) === "[object Set]";
const isDate = (val) => toTypeString(val) === "[object Date]";
const isFunction = (val) => typeof val === "function";
const isString = (val) => typeof val === "string";
const isSymbol = (val) => typeof val === "symbol";
const isObject = (val) => val !== null && typeof val === "object";
const isPromise = (val) => {
  return (isObject(val) || isFunction(val)) && isFunction(val.then) && isFunction(val.catch);
};
const objectToString = Object.prototype.toString;
const toTypeString = (value) => objectToString.call(value);
const toRawType = (value) => {
  return toTypeString(value).slice(8, -1);
};
const isPlainObject = (val) => toTypeString(val) === "[object Object]";
const isIntegerKey = (key) => isString(key) && key !== "NaN" && key[0] !== "-" && "" + parseInt(key, 10) === key;
const isReservedProp = /* @__PURE__ */ makeMap(
  // the leading comma is intentional so empty string "" is also included
  ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
);
const cacheStringFunction = (fn) => {
  const cache2 = /* @__PURE__ */ Object.create(null);
  return ((str) => {
    const hit = cache2[str];
    return hit || (cache2[str] = fn(str));
  });
};
const camelizeRE = /-\w/g;
const camelize = cacheStringFunction(
  (str) => {
    return str.replace(camelizeRE, (c) => c.slice(1).toUpperCase());
  }
);
const hyphenateRE = /\B([A-Z])/g;
const hyphenate = cacheStringFunction(
  (str) => str.replace(hyphenateRE, "-$1").toLowerCase()
);
const capitalize = cacheStringFunction((str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
});
const toHandlerKey = cacheStringFunction(
  (str) => {
    const s = str ? `on${capitalize(str)}` : ``;
    return s;
  }
);
const hasChanged = (value, oldValue) => !Object.is(value, oldValue);
const invokeArrayFns = (fns, ...arg) => {
  for (let i = 0; i < fns.length; i++) {
    fns[i](...arg);
  }
};
const def = (obj, key, value, writable = false) => {
  Object.defineProperty(obj, key, {
    configurable: true,
    enumerable: false,
    writable,
    value
  });
};
const looseToNumber = (val) => {
  const n = parseFloat(val);
  return isNaN(n) ? val : n;
};
let _globalThis;
const getGlobalThis = () => {
  return _globalThis || (_globalThis = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
};
function normalizeStyle(value) {
  if (isArray(value)) {
    const res = {};
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      const normalized = isString(item) ? parseStringStyle(item) : normalizeStyle(item);
      if (normalized) {
        for (const key in normalized) {
          res[key] = normalized[key];
        }
      }
    }
    return res;
  } else if (isString(value) || isObject(value)) {
    return value;
  }
}
const listDelimiterRE = /;(?![^(]*\))/g;
const propertyDelimiterRE = /:([^]+)/;
const styleCommentRE = /"(?:[^"\\]|\\[^])*"|'(?:[^'\\]|\\[^])*'|\\[^]|\/\*[^]*?\*\//g;
function parseStringStyle(cssText) {
  const ret = {};
  cssText.replace(styleCommentRE, (match) => match.startsWith("/*") ? "" : match).split(listDelimiterRE).forEach((item) => {
    if (item) {
      const tmp = item.split(propertyDelimiterRE);
      tmp.length > 1 && (ret[tmp[0].trim()] = tmp[1].trim());
    }
  });
  return ret;
}
function normalizeClass(value) {
  let res = "";
  if (isString(value)) {
    res = value;
  } else if (isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const normalized = normalizeClass(value[i]);
      if (normalized) {
        res += normalized + " ";
      }
    }
  } else if (isObject(value)) {
    for (const name in value) {
      if (value[name]) {
        res += name + " ";
      }
    }
  }
  return res.trim();
}
const specialBooleanAttrs = `itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly`;
const isSpecialBooleanAttr = /* @__PURE__ */ makeMap(specialBooleanAttrs);
function includeBooleanAttr(value) {
  return !!value || value === "";
}
function looseCompareArrays(a, b, seen2) {
  if (a.length !== b.length) return false;
  let equal = true;
  for (let i = 0; equal && i < a.length; i++) {
    equal = looseEqual(a[i], b[i], seen2);
  }
  return equal;
}
function looseCompareCollections(a, b, seen2) {
  if (a.size !== b.size) return false;
  const candidates = Array.from(b);
  const matched = new Uint8Array(candidates.length);
  for (const item of a) {
    let index = -1;
    for (let i = 0; i < candidates.length; i++) {
      if (!matched[i] && looseEqual(item, candidates[i], seen2)) {
        index = i;
        break;
      }
    }
    if (index < 0) return false;
    matched[index] = 1;
  }
  return true;
}
function looseCompareObjects(a, b, seen2) {
  let aValidType = isMap(a);
  let bValidType = isMap(b);
  if (aValidType || bValidType) {
    return aValidType && bValidType ? looseCompareCollections(a, b, seen2) : false;
  }
  aValidType = isSet(a);
  bValidType = isSet(b);
  if (aValidType || bValidType) {
    return aValidType && bValidType ? looseCompareCollections(a, b, seen2) : false;
  }
  const aKeysCount = Object.keys(a).length;
  const bKeysCount = Object.keys(b).length;
  if (aKeysCount !== bKeysCount) {
    return false;
  }
  for (const key in a) {
    const aHasKey = a.hasOwnProperty(key);
    const bHasKey = b.hasOwnProperty(key);
    if (aHasKey && !bHasKey || !aHasKey && bHasKey || !looseEqual(a[key], b[key], seen2)) {
      return false;
    }
  }
  return String(a) === String(b);
}
function looseCompareNested(a, b, seen2, compare) {
  if (!seen2) {
    seen2 = [/* @__PURE__ */ new Map(), /* @__PURE__ */ new Map()];
  }
  const [seenA, seenB] = seen2;
  if (seenA.has(a) || seenB.has(b)) {
    return seenA.get(a) === b && seenB.get(b) === a;
  }
  seenA.set(a, b);
  seenB.set(b, a);
  const equal = compare(a, b, seen2);
  seenA.delete(a);
  seenB.delete(b);
  return equal;
}
function looseEqual(a, b, seen2) {
  if (a === b) return true;
  let aValidType = isDate(a);
  let bValidType = isDate(b);
  if (aValidType || bValidType) {
    return aValidType && bValidType ? a.getTime() === b.getTime() : false;
  }
  aValidType = isSymbol(a);
  bValidType = isSymbol(b);
  if (aValidType || bValidType) {
    return a === b;
  }
  aValidType = isArray(a);
  bValidType = isArray(b);
  if (aValidType || bValidType) {
    return aValidType && bValidType ? looseCompareNested(a, b, seen2, looseCompareArrays) : false;
  }
  aValidType = isObject(a);
  bValidType = isObject(b);
  if (aValidType || bValidType) {
    if (!aValidType || !bValidType) {
      return false;
    }
    return looseCompareNested(a, b, seen2, looseCompareObjects);
  }
  return String(a) === String(b);
}
function looseIndexOf(arr, val) {
  return arr.findIndex((item) => looseEqual(item, val));
}
const isRef$1 = (val) => {
  return !!(val && val["__v_isRef"] === true);
};
const toDisplayString = (val) => {
  return isString(val) ? val : val == null ? "" : isArray(val) || isObject(val) && (val.toString === objectToString || !isFunction(val.toString)) ? isRef$1(val) ? toDisplayString(val.value) : JSON.stringify(val, replacer, 2) : String(val);
};
const replacer = (_key, val) => {
  if (isRef$1(val)) {
    return replacer(_key, val.value);
  } else if (isMap(val)) {
    return {
      [`Map(${val.size})`]: [...val.entries()].reduce(
        (entries, [key, val2], i) => {
          entries[stringifySymbol(key, i) + " =>"] = val2;
          return entries;
        },
        {}
      )
    };
  } else if (isSet(val)) {
    return {
      [`Set(${val.size})`]: [...val.values()].map((v) => stringifySymbol(v))
    };
  } else if (isSymbol(val)) {
    return stringifySymbol(val);
  } else if (isObject(val) && !isArray(val) && !isPlainObject(val)) {
    return String(val);
  }
  return val;
};
const stringifySymbol = (v, i = "") => {
  var _a;
  return (
    // Symbol.description in es2019+ so we need to cast here to pass
    // the lib: es2016 check
    isSymbol(v) ? `Symbol(${(_a = v.description) != null ? _a : i})` : v
  );
};
let activeEffectScope;
class EffectScope {
  // TODO isolatedDeclarations "__v_skip"
  constructor(detached = false) {
    this.detached = detached;
    this._active = true;
    this._on = 0;
    this.effects = [];
    this.cleanups = [];
    this._isPaused = false;
    this._warnOnRun = true;
    this.__v_skip = true;
    if (!detached && activeEffectScope) {
      if (activeEffectScope.active) {
        this.parent = activeEffectScope;
        this.index = (activeEffectScope.scopes || (activeEffectScope.scopes = [])).push(
          this
        ) - 1;
      } else {
        this._active = false;
        this._warnOnRun = false;
      }
    }
  }
  get active() {
    return this._active;
  }
  pause() {
    if (this._active) {
      this._isPaused = true;
      let i, l;
      if (this.scopes) {
        const scopes = this.scopes.slice();
        for (i = 0, l = scopes.length; i < l; i++) {
          scopes[i].pause();
        }
      }
      for (i = 0, l = this.effects.length; i < l; i++) {
        this.effects[i].pause();
      }
    }
  }
  /**
   * Resumes the effect scope, including all child scopes and effects.
   */
  resume() {
    if (this._active) {
      if (this._isPaused) {
        this._isPaused = false;
        let i, l;
        if (this.scopes) {
          const scopes = this.scopes.slice();
          for (i = 0, l = scopes.length; i < l; i++) {
            scopes[i].resume();
          }
        }
        const effects = this.effects.slice();
        for (i = 0, l = effects.length; i < l; i++) {
          effects[i].resume();
        }
      }
    }
  }
  run(fn) {
    if (this._active) {
      const currentEffectScope = activeEffectScope;
      try {
        activeEffectScope = this;
        return fn();
      } finally {
        activeEffectScope = currentEffectScope;
      }
    }
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  on() {
    if (++this._on === 1) {
      this.prevScope = activeEffectScope;
      activeEffectScope = this;
    }
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  off() {
    if (this._on > 0 && --this._on === 0) {
      if (activeEffectScope === this) {
        activeEffectScope = this.prevScope;
      } else {
        let current = activeEffectScope;
        while (current) {
          if (current.prevScope === this) {
            current.prevScope = this.prevScope;
            break;
          }
          current = current.prevScope;
        }
      }
      this.prevScope = void 0;
    }
  }
  stop(fromParent) {
    if (this._active) {
      this._active = false;
      let i, l;
      for (i = 0, l = this.effects.length; i < l; i++) {
        this.effects[i].stop();
      }
      this.effects.length = 0;
      for (i = 0, l = this.cleanups.length; i < l; i++) {
        this.cleanups[i]();
      }
      this.cleanups.length = 0;
      if (this.scopes) {
        const scopes = this.scopes.slice();
        for (i = 0, l = scopes.length; i < l; i++) {
          scopes[i].stop(true);
        }
        this.scopes.length = 0;
      }
      if (!this.detached && this.parent && !fromParent) {
        const last = this.parent.scopes.pop();
        if (last && last !== this) {
          this.parent.scopes[this.index] = last;
          last.index = this.index;
        }
      }
      this.parent = void 0;
    }
  }
}
function getCurrentScope() {
  return activeEffectScope;
}
let activeSub;
const pausedQueueEffects = /* @__PURE__ */ new WeakSet();
class ReactiveEffect {
  constructor(fn) {
    this.fn = fn;
    this.deps = void 0;
    this.depsTail = void 0;
    this.flags = 1 | 4;
    this.next = void 0;
    this.cleanup = void 0;
    this.scheduler = void 0;
    if (activeEffectScope) {
      if (activeEffectScope.active) {
        activeEffectScope.effects.push(this);
      } else {
        this.flags &= -2;
      }
    }
  }
  pause() {
    this.flags |= 64;
  }
  resume() {
    if (this.flags & 64) {
      this.flags &= -65;
      if (pausedQueueEffects.has(this)) {
        pausedQueueEffects.delete(this);
        this.trigger();
      }
    }
  }
  /**
   * @internal
   */
  notify() {
    if (this.flags & 2 && !(this.flags & 32)) {
      return;
    }
    if (!(this.flags & 8)) {
      batch(this);
    }
  }
  run() {
    if (!(this.flags & 1)) {
      return this.fn();
    }
    this.flags |= 2;
    cleanupEffect(this);
    prepareDeps(this);
    const prevEffect = activeSub;
    const prevShouldTrack = shouldTrack;
    activeSub = this;
    shouldTrack = true;
    try {
      return this.fn();
    } finally {
      cleanupDeps(this);
      activeSub = prevEffect;
      shouldTrack = prevShouldTrack;
      this.flags &= -3;
    }
  }
  stop() {
    if (this.flags & 1) {
      for (let link = this.deps; link; link = link.nextDep) {
        removeSub(link);
      }
      this.deps = this.depsTail = void 0;
      cleanupEffect(this);
      this.onStop && this.onStop();
      this.flags &= -2;
    }
  }
  trigger() {
    if (this.flags & 64) {
      pausedQueueEffects.add(this);
    } else if (this.scheduler) {
      this.scheduler();
    } else {
      this.runIfDirty();
    }
  }
  /**
   * @internal
   */
  runIfDirty() {
    if (isDirty(this)) {
      this.run();
    }
  }
  get dirty() {
    return isDirty(this);
  }
}
let batchDepth = 0;
let batchedSub;
let batchedComputed;
function batch(sub, isComputed = false) {
  sub.flags |= 8;
  if (isComputed) {
    sub.next = batchedComputed;
    batchedComputed = sub;
    return;
  }
  sub.next = batchedSub;
  batchedSub = sub;
}
function startBatch() {
  batchDepth++;
}
function endBatch() {
  if (--batchDepth > 0) {
    return;
  }
  if (batchedComputed) {
    let e = batchedComputed;
    batchedComputed = void 0;
    while (e) {
      const next = e.next;
      e.next = void 0;
      e.flags &= -9;
      e = next;
    }
  }
  let error;
  while (batchedSub) {
    let e = batchedSub;
    batchedSub = void 0;
    while (e) {
      const next = e.next;
      e.next = void 0;
      e.flags &= -9;
      if (e.flags & 1) {
        try {
          ;
          e.trigger();
        } catch (err) {
          if (!error) error = err;
        }
      }
      e = next;
    }
  }
  if (error) throw error;
}
function prepareDeps(sub) {
  for (let link = sub.deps; link; link = link.nextDep) {
    link.version = -1;
    link.prevActiveLink = link.dep.activeLink;
    link.dep.activeLink = link;
  }
}
function cleanupDeps(sub) {
  let head;
  let tail = sub.depsTail;
  let link = tail;
  while (link) {
    const prev = link.prevDep;
    if (link.version === -1) {
      if (link === tail) tail = prev;
      removeSub(link);
      removeDep(link);
    } else {
      head = link;
    }
    link.dep.activeLink = link.prevActiveLink;
    link.prevActiveLink = void 0;
    link = prev;
  }
  sub.deps = head;
  sub.depsTail = tail;
}
function isDirty(sub) {
  for (let link = sub.deps; link; link = link.nextDep) {
    if (link.dep.version !== link.version || link.dep.computed && (refreshComputed(link.dep.computed) || link.dep.version !== link.version)) {
      return true;
    }
  }
  if (sub._dirty) {
    return true;
  }
  return false;
}
function refreshComputed(computed2) {
  if (computed2.flags & 4 && !(computed2.flags & 16)) {
    return;
  }
  computed2.flags &= -17;
  if (computed2.globalVersion === globalVersion) {
    return;
  }
  computed2.globalVersion = globalVersion;
  if (!computed2.isSSR && computed2.flags & 128 && (!computed2.deps && !computed2._dirty || !isDirty(computed2))) {
    return;
  }
  computed2.flags |= 2;
  const dep = computed2.dep;
  const prevSub = activeSub;
  const prevShouldTrack = shouldTrack;
  activeSub = computed2;
  shouldTrack = true;
  try {
    prepareDeps(computed2);
    const value = computed2.fn(computed2._value);
    if (dep.version === 0 || hasChanged(value, computed2._value)) {
      computed2.flags |= 128;
      computed2._value = value;
      dep.version++;
    }
  } catch (err) {
    dep.version++;
    throw err;
  } finally {
    activeSub = prevSub;
    shouldTrack = prevShouldTrack;
    cleanupDeps(computed2);
    computed2.flags &= -3;
  }
}
function removeSub(link, soft = false) {
  const { dep, prevSub, nextSub } = link;
  if (prevSub) {
    prevSub.nextSub = nextSub;
    link.prevSub = void 0;
  }
  if (nextSub) {
    nextSub.prevSub = prevSub;
    link.nextSub = void 0;
  }
  if (dep.subs === link) {
    dep.subs = prevSub;
    if (!prevSub && dep.computed) {
      dep.computed.flags &= -5;
      for (let l = dep.computed.deps; l; l = l.nextDep) {
        removeSub(l, true);
      }
    }
  }
  if (!soft && !--dep.sc && dep.map) {
    dep.map.delete(dep.key);
  }
}
function removeDep(link) {
  const { prevDep, nextDep } = link;
  if (prevDep) {
    prevDep.nextDep = nextDep;
    link.prevDep = void 0;
  }
  if (nextDep) {
    nextDep.prevDep = prevDep;
    link.nextDep = void 0;
  }
}
let shouldTrack = true;
const trackStack = [];
function pauseTracking() {
  trackStack.push(shouldTrack);
  shouldTrack = false;
}
function resetTracking() {
  const last = trackStack.pop();
  shouldTrack = last === void 0 ? true : last;
}
function cleanupEffect(e) {
  const { cleanup } = e;
  e.cleanup = void 0;
  if (cleanup) {
    const prevSub = activeSub;
    activeSub = void 0;
    try {
      cleanup();
    } finally {
      activeSub = prevSub;
    }
  }
}
let globalVersion = 0;
class Link {
  constructor(sub, dep) {
    this.sub = sub;
    this.dep = dep;
    this.version = dep.version;
    this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
  }
}
class Dep {
  // TODO isolatedDeclarations "__v_skip"
  constructor(computed2) {
    this.computed = computed2;
    this.version = 0;
    this.activeLink = void 0;
    this.subs = void 0;
    this.map = void 0;
    this.key = void 0;
    this.sc = 0;
    this.__v_skip = true;
  }
  track(debugInfo) {
    if (!activeSub || !shouldTrack || activeSub === this.computed) {
      return;
    }
    let link = this.activeLink;
    if (link === void 0 || link.sub !== activeSub) {
      link = this.activeLink = new Link(activeSub, this);
      if (!activeSub.deps) {
        activeSub.deps = activeSub.depsTail = link;
      } else {
        link.prevDep = activeSub.depsTail;
        activeSub.depsTail.nextDep = link;
        activeSub.depsTail = link;
      }
      addSub(link);
    } else if (link.version === -1) {
      link.version = this.version;
      if (link.nextDep) {
        const next = link.nextDep;
        next.prevDep = link.prevDep;
        if (link.prevDep) {
          link.prevDep.nextDep = next;
        }
        link.prevDep = activeSub.depsTail;
        link.nextDep = void 0;
        activeSub.depsTail.nextDep = link;
        activeSub.depsTail = link;
        if (activeSub.deps === link) {
          activeSub.deps = next;
        }
      }
    }
    return link;
  }
  trigger(debugInfo) {
    this.version++;
    globalVersion++;
    this.notify(debugInfo);
  }
  notify(debugInfo) {
    startBatch();
    try {
      if (false) ;
      for (let link = this.subs; link; link = link.prevSub) {
        if (link.sub.notify()) {
          ;
          link.sub.dep.notify();
        }
      }
    } finally {
      endBatch();
    }
  }
}
function addSub(link) {
  link.dep.sc++;
  if (link.sub.flags & 4) {
    const computed2 = link.dep.computed;
    if (computed2 && !link.dep.subs) {
      computed2.flags |= 4 | 16;
      for (let l = computed2.deps; l; l = l.nextDep) {
        addSub(l);
      }
    }
    const currentTail = link.dep.subs;
    if (currentTail !== link) {
      link.prevSub = currentTail;
      if (currentTail) currentTail.nextSub = link;
    }
    link.dep.subs = link;
  }
}
const targetMap = /* @__PURE__ */ new WeakMap();
const ITERATE_KEY = /* @__PURE__ */ Symbol(
  ""
);
const MAP_KEY_ITERATE_KEY = /* @__PURE__ */ Symbol(
  ""
);
const ARRAY_ITERATE_KEY = /* @__PURE__ */ Symbol(
  ""
);
function track(target, type, key) {
  if (shouldTrack && activeSub) {
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, dep = new Dep());
      dep.map = depsMap;
      dep.key = key;
    }
    {
      dep.track();
    }
  }
}
function trigger(target, type, key, newValue, oldValue, oldTarget) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    globalVersion++;
    return;
  }
  const run = (dep) => {
    if (dep) {
      {
        dep.trigger();
      }
    }
  };
  startBatch();
  if (type === "clear") {
    depsMap.forEach(run);
  } else {
    const targetIsArray = isArray(target);
    const isArrayIndex = targetIsArray && isIntegerKey(key);
    if (targetIsArray && key === "length") {
      const newLength = Number(newValue);
      depsMap.forEach((dep, key2) => {
        if (key2 === "length" || key2 === ARRAY_ITERATE_KEY || !isSymbol(key2) && key2 >= newLength) {
          run(dep);
        }
      });
    } else {
      if (key !== void 0 || depsMap.has(void 0)) {
        run(depsMap.get(key));
      }
      if (isArrayIndex) {
        run(depsMap.get(ARRAY_ITERATE_KEY));
      }
      switch (type) {
        case "add":
          if (!targetIsArray) {
            run(depsMap.get(ITERATE_KEY));
            if (isMap(target)) {
              run(depsMap.get(MAP_KEY_ITERATE_KEY));
            }
          } else if (isArrayIndex) {
            run(depsMap.get("length"));
          }
          break;
        case "delete":
          if (!targetIsArray) {
            run(depsMap.get(ITERATE_KEY));
            if (isMap(target)) {
              run(depsMap.get(MAP_KEY_ITERATE_KEY));
            }
          }
          break;
        case "set":
          if (isMap(target)) {
            run(depsMap.get(ITERATE_KEY));
          }
          break;
      }
    }
  }
  endBatch();
}
function reactiveReadArray(array) {
  const raw = /* @__PURE__ */ toRaw(array);
  if (raw === array) return raw;
  track(raw, "iterate", ARRAY_ITERATE_KEY);
  if (/* @__PURE__ */ isShallow(array)) return raw;
  if (!/* @__PURE__ */ isReadonly(array)) return raw.map(toReactive);
  return /* @__PURE__ */ isReactive(array) ? raw.map((item) => toReadonly(toReactive(item))) : raw.map(toReadonly);
}
function shallowReadArray(arr) {
  track(arr = /* @__PURE__ */ toRaw(arr), "iterate", ARRAY_ITERATE_KEY);
  return arr;
}
function toWrapped(target, item) {
  if (/* @__PURE__ */ isReadonly(target)) {
    return /* @__PURE__ */ isReactive(target) ? toReadonly(toReactive(item)) : toReadonly(item);
  }
  return toReactive(item);
}
const arrayInstrumentations = {
  __proto__: null,
  [Symbol.iterator]() {
    return iterator(this, Symbol.iterator, (item) => toWrapped(this, item));
  },
  concat(...args) {
    return reactiveReadArray(this).concat(
      ...args.map((x) => isArray(x) ? reactiveReadArray(x) : x)
    );
  },
  entries() {
    return iterator(this, "entries", (value) => {
      value[1] = toWrapped(this, value[1]);
      return value;
    });
  },
  every(fn, thisArg) {
    return apply(this, "every", fn, thisArg, void 0, arguments);
  },
  filter(fn, thisArg) {
    return apply(
      this,
      "filter",
      fn,
      thisArg,
      (v) => v.map((item) => toWrapped(this, item)),
      arguments
    );
  },
  find(fn, thisArg) {
    return apply(
      this,
      "find",
      fn,
      thisArg,
      (item) => toWrapped(this, item),
      arguments
    );
  },
  findIndex(fn, thisArg) {
    return apply(this, "findIndex", fn, thisArg, void 0, arguments);
  },
  findLast(fn, thisArg) {
    return apply(
      this,
      "findLast",
      fn,
      thisArg,
      (item) => toWrapped(this, item),
      arguments
    );
  },
  findLastIndex(fn, thisArg) {
    return apply(this, "findLastIndex", fn, thisArg, void 0, arguments);
  },
  // flat, flatMap could benefit from ARRAY_ITERATE but are not straight-forward to implement
  forEach(fn, thisArg) {
    return apply(this, "forEach", fn, thisArg, void 0, arguments);
  },
  includes(...args) {
    return searchProxy(this, "includes", args);
  },
  indexOf(...args) {
    return searchProxy(this, "indexOf", args);
  },
  join(separator) {
    return reactiveReadArray(this).join(separator);
  },
  // keys() iterator only reads `length`, no optimization required
  lastIndexOf(...args) {
    return searchProxy(this, "lastIndexOf", args);
  },
  map(fn, thisArg) {
    return apply(this, "map", fn, thisArg, void 0, arguments);
  },
  pop() {
    return noTracking(this, "pop");
  },
  push(...args) {
    return noTracking(this, "push", args);
  },
  reduce(fn, ...args) {
    return reduce(this, "reduce", fn, args);
  },
  reduceRight(fn, ...args) {
    return reduce(this, "reduceRight", fn, args);
  },
  shift() {
    return noTracking(this, "shift");
  },
  // slice could use ARRAY_ITERATE but also seems to beg for range tracking
  some(fn, thisArg) {
    return apply(this, "some", fn, thisArg, void 0, arguments);
  },
  splice(...args) {
    return noTracking(this, "splice", args);
  },
  toReversed() {
    return reactiveReadArray(this).toReversed();
  },
  toSorted(comparer) {
    return reactiveReadArray(this).toSorted(comparer);
  },
  toSpliced(...args) {
    return reactiveReadArray(this).toSpliced(...args);
  },
  unshift(...args) {
    return noTracking(this, "unshift", args);
  },
  values() {
    return iterator(this, "values", (item) => toWrapped(this, item));
  }
};
function iterator(self2, method, wrapValue) {
  const arr = shallowReadArray(self2);
  const iter = arr[method]();
  if (arr !== self2 && !/* @__PURE__ */ isShallow(self2)) {
    iter._next = iter.next;
    iter.next = () => {
      const result = iter._next();
      if (!result.done) {
        result.value = wrapValue(result.value);
      }
      return result;
    };
  }
  return iter;
}
const arrayProto = Array.prototype;
function apply(self2, method, fn, thisArg, wrappedRetFn, args) {
  const arr = shallowReadArray(self2);
  const needsWrap = arr !== self2 && !/* @__PURE__ */ isShallow(self2);
  const methodFn = arr[method];
  if (methodFn !== arrayProto[method]) {
    const result2 = methodFn.apply(self2, args);
    return needsWrap ? toReactive(result2) : result2;
  }
  let wrappedFn = fn;
  if (arr !== self2) {
    if (needsWrap) {
      wrappedFn = function(item, index) {
        return fn.call(this, toWrapped(self2, item), index, self2);
      };
    } else if (fn.length > 2) {
      wrappedFn = function(item, index) {
        return fn.call(this, item, index, self2);
      };
    }
  }
  const result = methodFn.call(arr, wrappedFn, thisArg);
  return needsWrap && wrappedRetFn ? wrappedRetFn(result) : result;
}
function reduce(self2, method, fn, args) {
  const arr = shallowReadArray(self2);
  const needsWrap = arr !== self2 && !/* @__PURE__ */ isShallow(self2);
  let wrappedFn = fn;
  let wrapInitialAccumulator = false;
  if (arr !== self2) {
    if (needsWrap) {
      wrapInitialAccumulator = args.length === 0;
      wrappedFn = function(acc, item, index) {
        if (wrapInitialAccumulator) {
          wrapInitialAccumulator = false;
          acc = toWrapped(self2, acc);
        }
        return fn.call(this, acc, toWrapped(self2, item), index, self2);
      };
    } else if (fn.length > 3) {
      wrappedFn = function(acc, item, index) {
        return fn.call(this, acc, item, index, self2);
      };
    }
  }
  const result = arr[method](wrappedFn, ...args);
  return wrapInitialAccumulator ? toWrapped(self2, result) : result;
}
function searchProxy(self2, method, args) {
  const arr = /* @__PURE__ */ toRaw(self2);
  track(arr, "iterate", ARRAY_ITERATE_KEY);
  const res = arr[method](...args);
  if ((res === -1 || res === false) && /* @__PURE__ */ isProxy(args[0])) {
    args[0] = /* @__PURE__ */ toRaw(args[0]);
    return arr[method](...args);
  }
  return res;
}
function noTracking(self2, method, args = []) {
  pauseTracking();
  startBatch();
  const res = (/* @__PURE__ */ toRaw(self2))[method].apply(self2, args);
  endBatch();
  resetTracking();
  return res;
}
const isNonTrackableKeys = /* @__PURE__ */ makeMap(`__proto__,__v_isRef,__isVue`);
const builtInSymbols = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((key) => key !== "arguments" && key !== "caller").map((key) => Symbol[key]).filter(isSymbol)
);
function hasOwnProperty(key) {
  if (!isSymbol(key)) key = String(key);
  const obj = /* @__PURE__ */ toRaw(this);
  track(obj, "has", key);
  return obj.hasOwnProperty(key);
}
class BaseReactiveHandler {
  constructor(_isReadonly = false, _isShallow = false) {
    this._isReadonly = _isReadonly;
    this._isShallow = _isShallow;
  }
  get(target, key, receiver) {
    if (key === "__v_skip") return target["__v_skip"];
    const isReadonly2 = this._isReadonly, isShallow2 = this._isShallow;
    if (key === "__v_isReactive") {
      return !isReadonly2;
    } else if (key === "__v_isReadonly") {
      return isReadonly2;
    } else if (key === "__v_isShallow") {
      return isShallow2;
    } else if (key === "__v_raw") {
      if (receiver === (isReadonly2 ? isShallow2 ? shallowReadonlyMap : readonlyMap : isShallow2 ? shallowReactiveMap : reactiveMap).get(target) || // receiver is not the reactive proxy, but has the same prototype
      // this means the receiver is a user proxy of the reactive proxy
      Object.getPrototypeOf(target) === Object.getPrototypeOf(receiver)) {
        return target;
      }
      return;
    }
    const targetIsArray = isArray(target);
    if (!isReadonly2) {
      let fn;
      if (targetIsArray && (fn = arrayInstrumentations[key])) {
        return fn;
      }
      if (key === "hasOwnProperty") {
        return hasOwnProperty;
      }
    }
    const res = Reflect.get(
      target,
      key,
      // if this is a proxy wrapping a ref, return methods using the raw ref
      // as receiver so that we don't have to call `toRaw` on the ref in all
      // its class methods
      /* @__PURE__ */ isRef(target) ? target : receiver
    );
    if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) {
      return res;
    }
    if (!isReadonly2) {
      track(target, "get", key);
    }
    if (isShallow2) {
      return res;
    }
    if (/* @__PURE__ */ isRef(res)) {
      const value = targetIsArray && isIntegerKey(key) ? res : res.value;
      return isReadonly2 && isObject(value) ? /* @__PURE__ */ readonly(value) : value;
    }
    if (isObject(res)) {
      return isReadonly2 ? /* @__PURE__ */ readonly(res) : /* @__PURE__ */ reactive(res);
    }
    return res;
  }
}
class MutableReactiveHandler extends BaseReactiveHandler {
  constructor(isShallow2 = false) {
    super(false, isShallow2);
  }
  set(target, key, value, receiver) {
    let oldValue = target[key];
    const isArrayWithIntegerKey = isArray(target) && isIntegerKey(key);
    if (!this._isShallow) {
      const isOldValueReadonly = /* @__PURE__ */ isReadonly(oldValue);
      if (!/* @__PURE__ */ isShallow(value) && !/* @__PURE__ */ isReadonly(value)) {
        oldValue = /* @__PURE__ */ toRaw(oldValue);
        value = /* @__PURE__ */ toRaw(value);
      }
      if (!isArrayWithIntegerKey && /* @__PURE__ */ isRef(oldValue) && !/* @__PURE__ */ isRef(value)) {
        if (isOldValueReadonly) {
          return true;
        } else {
          oldValue.value = value;
          return true;
        }
      }
    }
    const hadKey = isArrayWithIntegerKey ? Number(key) < target.length : hasOwn(target, key);
    const result = Reflect.set(
      target,
      key,
      value,
      /* @__PURE__ */ isRef(target) ? target : receiver
    );
    if (target === /* @__PURE__ */ toRaw(receiver) && result) {
      if (!hadKey) {
        trigger(target, "add", key, value);
      } else if (hasChanged(value, oldValue)) {
        trigger(target, "set", key, value);
      }
    }
    return result;
  }
  deleteProperty(target, key) {
    const hadKey = hasOwn(target, key);
    target[key];
    const result = Reflect.deleteProperty(target, key);
    if (result && hadKey) {
      trigger(target, "delete", key, void 0);
    }
    return result;
  }
  has(target, key) {
    const result = Reflect.has(target, key);
    if (!isSymbol(key) || !builtInSymbols.has(key)) {
      track(target, "has", key);
    }
    return result;
  }
  ownKeys(target) {
    track(
      target,
      "iterate",
      isArray(target) ? "length" : ITERATE_KEY
    );
    return Reflect.ownKeys(target);
  }
}
class ReadonlyReactiveHandler extends BaseReactiveHandler {
  constructor(isShallow2 = false) {
    super(true, isShallow2);
  }
  set(target, key) {
    return true;
  }
  deleteProperty(target, key) {
    return true;
  }
}
const mutableHandlers = /* @__PURE__ */ new MutableReactiveHandler();
const readonlyHandlers = /* @__PURE__ */ new ReadonlyReactiveHandler();
const shallowReactiveHandlers = /* @__PURE__ */ new MutableReactiveHandler(true);
const shallowReadonlyHandlers = /* @__PURE__ */ new ReadonlyReactiveHandler(true);
const toShallow = (value) => value;
const getProto = (v) => Reflect.getPrototypeOf(v);
function createIterableMethod(method, isReadonly2, isShallow2) {
  return function(...args) {
    const target = this["__v_raw"];
    const rawTarget = /* @__PURE__ */ toRaw(target);
    const targetIsMap = isMap(rawTarget);
    const isPair = method === "entries" || method === Symbol.iterator && targetIsMap;
    const isKeyOnly = method === "keys" && targetIsMap;
    const innerIterator = target[method](...args);
    const wrap = isShallow2 ? toShallow : isReadonly2 ? toReadonly : toReactive;
    !isReadonly2 && track(
      rawTarget,
      "iterate",
      isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY
    );
    return extend(
      // inheriting all iterator properties
      Object.create(innerIterator),
      {
        // iterator protocol
        next() {
          const { value, done } = innerIterator.next();
          return done ? { value, done } : {
            value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
            done
          };
        }
      }
    );
  };
}
function createReadonlyMethod(type) {
  return function(...args) {
    return type === "delete" ? false : type === "clear" ? void 0 : this;
  };
}
function createInstrumentations(readonly2, shallow) {
  const instrumentations = {
    get(key) {
      const target = this["__v_raw"];
      const rawTarget = /* @__PURE__ */ toRaw(target);
      const rawKey = /* @__PURE__ */ toRaw(key);
      if (!readonly2) {
        if (hasChanged(key, rawKey)) {
          track(rawTarget, "get", key);
        }
        track(rawTarget, "get", rawKey);
      }
      const { has } = getProto(rawTarget);
      const wrap = shallow ? toShallow : readonly2 ? toReadonly : toReactive;
      if (has.call(rawTarget, key)) {
        return wrap(target.get(key));
      } else if (has.call(rawTarget, rawKey)) {
        return wrap(target.get(rawKey));
      } else if (target !== rawTarget) {
        target.get(key);
      }
    },
    get size() {
      const target = this["__v_raw"];
      !readonly2 && track(/* @__PURE__ */ toRaw(target), "iterate", ITERATE_KEY);
      return target.size;
    },
    has(key) {
      const target = this["__v_raw"];
      const rawTarget = /* @__PURE__ */ toRaw(target);
      const rawKey = /* @__PURE__ */ toRaw(key);
      if (!readonly2) {
        if (hasChanged(key, rawKey)) {
          track(rawTarget, "has", key);
        }
        track(rawTarget, "has", rawKey);
      }
      return key === rawKey ? target.has(key) : target.has(key) || target.has(rawKey);
    },
    forEach(callback, thisArg) {
      const observed = this;
      const target = observed["__v_raw"];
      const rawTarget = /* @__PURE__ */ toRaw(target);
      const wrap = shallow ? toShallow : readonly2 ? toReadonly : toReactive;
      !readonly2 && track(rawTarget, "iterate", ITERATE_KEY);
      return target.forEach((value, key) => {
        return callback.call(thisArg, wrap(value), wrap(key), observed);
      });
    }
  };
  extend(
    instrumentations,
    readonly2 ? {
      add: createReadonlyMethod("add"),
      set: createReadonlyMethod("set"),
      delete: createReadonlyMethod("delete"),
      clear: createReadonlyMethod("clear")
    } : {
      add(value) {
        const target = /* @__PURE__ */ toRaw(this);
        const proto = getProto(target);
        const rawValue = /* @__PURE__ */ toRaw(value);
        const valueToAdd = !shallow && !/* @__PURE__ */ isShallow(value) && !/* @__PURE__ */ isReadonly(value) ? rawValue : value;
        const hadKey = proto.has.call(target, valueToAdd) || hasChanged(value, valueToAdd) && proto.has.call(target, value) || hasChanged(rawValue, valueToAdd) && proto.has.call(target, rawValue);
        if (!hadKey) {
          target.add(valueToAdd);
          trigger(target, "add", valueToAdd, valueToAdd);
        }
        return this;
      },
      set(key, value) {
        if (!shallow && !/* @__PURE__ */ isShallow(value) && !/* @__PURE__ */ isReadonly(value)) {
          value = /* @__PURE__ */ toRaw(value);
        }
        const target = /* @__PURE__ */ toRaw(this);
        const { has, get } = getProto(target);
        let hadKey = has.call(target, key);
        if (!hadKey) {
          key = /* @__PURE__ */ toRaw(key);
          hadKey = has.call(target, key);
        }
        const oldValue = get.call(target, key);
        target.set(key, value);
        if (!hadKey) {
          trigger(target, "add", key, value);
        } else if (hasChanged(value, oldValue)) {
          trigger(target, "set", key, value);
        }
        return this;
      },
      delete(key) {
        const target = /* @__PURE__ */ toRaw(this);
        const { has, get } = getProto(target);
        let hadKey = has.call(target, key);
        if (!hadKey) {
          key = /* @__PURE__ */ toRaw(key);
          hadKey = has.call(target, key);
        }
        get ? get.call(target, key) : void 0;
        const result = target.delete(key);
        if (hadKey) {
          trigger(target, "delete", key, void 0);
        }
        return result;
      },
      clear() {
        const target = /* @__PURE__ */ toRaw(this);
        const hadItems = target.size !== 0;
        const result = target.clear();
        if (hadItems) {
          trigger(
            target,
            "clear",
            void 0,
            void 0
          );
        }
        return result;
      }
    }
  );
  const iteratorMethods = [
    "keys",
    "values",
    "entries",
    Symbol.iterator
  ];
  iteratorMethods.forEach((method) => {
    instrumentations[method] = createIterableMethod(method, readonly2, shallow);
  });
  return instrumentations;
}
function createInstrumentationGetter(isReadonly2, shallow) {
  const instrumentations = createInstrumentations(isReadonly2, shallow);
  return (target, key, receiver) => {
    if (key === "__v_isReactive") {
      return !isReadonly2;
    } else if (key === "__v_isReadonly") {
      return isReadonly2;
    } else if (key === "__v_raw") {
      return target;
    }
    return Reflect.get(
      hasOwn(instrumentations, key) && key in target ? instrumentations : target,
      key,
      receiver
    );
  };
}
const mutableCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(false, false)
};
const shallowCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(false, true)
};
const readonlyCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(true, false)
};
const shallowReadonlyCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(true, true)
};
const reactiveMap = /* @__PURE__ */ new WeakMap();
const shallowReactiveMap = /* @__PURE__ */ new WeakMap();
const readonlyMap = /* @__PURE__ */ new WeakMap();
const shallowReadonlyMap = /* @__PURE__ */ new WeakMap();
function targetTypeMap(rawType) {
  switch (rawType) {
    case "Object":
    case "Array":
      return 1;
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return 2;
    default:
      return 0;
  }
}
// @__NO_SIDE_EFFECTS__
function reactive(target) {
  if (/* @__PURE__ */ isReadonly(target)) {
    return target;
  }
  return createReactiveObject(
    target,
    false,
    mutableHandlers,
    mutableCollectionHandlers,
    reactiveMap
  );
}
// @__NO_SIDE_EFFECTS__
function shallowReactive(target) {
  return createReactiveObject(
    target,
    false,
    shallowReactiveHandlers,
    shallowCollectionHandlers,
    shallowReactiveMap
  );
}
// @__NO_SIDE_EFFECTS__
function readonly(target) {
  return createReactiveObject(
    target,
    true,
    readonlyHandlers,
    readonlyCollectionHandlers,
    readonlyMap
  );
}
// @__NO_SIDE_EFFECTS__
function shallowReadonly(target) {
  return createReactiveObject(
    target,
    true,
    shallowReadonlyHandlers,
    shallowReadonlyCollectionHandlers,
    shallowReadonlyMap
  );
}
function createReactiveObject(target, isReadonly2, baseHandlers, collectionHandlers, proxyMap) {
  if (!isObject(target)) {
    return target;
  }
  if (target["__v_raw"] && !(isReadonly2 && target["__v_isReactive"])) {
    return target;
  }
  if (target["__v_skip"] || !Object.isExtensible(target)) {
    return target;
  }
  const existingProxy = proxyMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }
  const targetType = targetTypeMap(toRawType(target));
  if (targetType === 0) {
    return target;
  }
  const proxy = new Proxy(
    target,
    targetType === 2 ? collectionHandlers : baseHandlers
  );
  proxyMap.set(target, proxy);
  return proxy;
}
// @__NO_SIDE_EFFECTS__
function isReactive(value) {
  if (/* @__PURE__ */ isReadonly(value)) {
    return /* @__PURE__ */ isReactive(value["__v_raw"]);
  }
  return !!(value && value["__v_isReactive"]);
}
// @__NO_SIDE_EFFECTS__
function isReadonly(value) {
  return !!(value && value["__v_isReadonly"]);
}
// @__NO_SIDE_EFFECTS__
function isShallow(value) {
  return !!(value && value["__v_isShallow"]);
}
// @__NO_SIDE_EFFECTS__
function isProxy(value) {
  return value ? !!value["__v_raw"] : false;
}
// @__NO_SIDE_EFFECTS__
function toRaw(observed) {
  const raw = observed && observed["__v_raw"];
  return raw ? /* @__PURE__ */ toRaw(raw) : observed;
}
function markRaw(value) {
  if (!hasOwn(value, "__v_skip") && Object.isExtensible(value)) {
    def(value, "__v_skip", true);
  }
  return value;
}
const toReactive = (value) => isObject(value) ? /* @__PURE__ */ reactive(value) : value;
const toReadonly = (value) => isObject(value) ? /* @__PURE__ */ readonly(value) : value;
// @__NO_SIDE_EFFECTS__
function isRef(r) {
  return r ? r["__v_isRef"] === true : false;
}
// @__NO_SIDE_EFFECTS__
function ref(value) {
  return createRef(value, false);
}
function createRef(rawValue, shallow) {
  if (/* @__PURE__ */ isRef(rawValue)) {
    return rawValue;
  }
  return new RefImpl(rawValue, shallow);
}
class RefImpl {
  constructor(value, isShallow2) {
    this.dep = new Dep();
    this["__v_isRef"] = true;
    this["__v_isShallow"] = false;
    this._rawValue = isShallow2 ? value : /* @__PURE__ */ toRaw(value);
    this._value = isShallow2 ? value : toReactive(value);
    this["__v_isShallow"] = isShallow2;
  }
  get value() {
    {
      this.dep.track();
    }
    return this._value;
  }
  set value(newValue) {
    const oldValue = this._rawValue;
    const useDirectValue = this["__v_isShallow"] || /* @__PURE__ */ isShallow(newValue) || /* @__PURE__ */ isReadonly(newValue);
    newValue = useDirectValue ? newValue : /* @__PURE__ */ toRaw(newValue);
    if (hasChanged(newValue, oldValue)) {
      this._rawValue = newValue;
      this._value = useDirectValue ? newValue : toReactive(newValue);
      {
        this.dep.trigger();
      }
    }
  }
}
function unref(ref2) {
  return /* @__PURE__ */ isRef(ref2) ? ref2.value : ref2;
}
const shallowUnwrapHandlers = {
  get: (target, key, receiver) => key === "__v_raw" ? target : unref(Reflect.get(target, key, receiver)),
  set: (target, key, value, receiver) => {
    const oldValue = target[key];
    if (/* @__PURE__ */ isRef(oldValue) && !/* @__PURE__ */ isRef(value)) {
      oldValue.value = value;
      return true;
    } else {
      return Reflect.set(target, key, value, receiver);
    }
  }
};
function proxyRefs(objectWithRefs) {
  return /* @__PURE__ */ isReactive(objectWithRefs) ? objectWithRefs : new Proxy(objectWithRefs, shallowUnwrapHandlers);
}
class ComputedRefImpl {
  constructor(fn, setter, isSSR) {
    this.fn = fn;
    this.setter = setter;
    this._value = void 0;
    this.dep = new Dep(this);
    this.__v_isRef = true;
    this.deps = void 0;
    this.depsTail = void 0;
    this.flags = 16;
    this.globalVersion = globalVersion - 1;
    this.next = void 0;
    this.effect = this;
    this["__v_isReadonly"] = !setter;
    this.isSSR = isSSR;
  }
  /**
   * @internal
   */
  notify() {
    this.flags |= 16;
    if (!(this.flags & 8) && // avoid infinite self recursion
    activeSub !== this) {
      batch(this, true);
      return true;
    }
  }
  get value() {
    const link = this.dep.track();
    refreshComputed(this);
    if (link) {
      link.version = this.dep.version;
    }
    return this._value;
  }
  set value(newValue) {
    if (this.setter) {
      this.setter(newValue);
    }
  }
}
// @__NO_SIDE_EFFECTS__
function computed$1(getterOrOptions, debugOptions, isSSR = false) {
  let getter;
  let setter;
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions;
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  const cRef = new ComputedRefImpl(getter, setter, isSSR);
  return cRef;
}
const INITIAL_WATCHER_VALUE = {};
const cleanupMap = /* @__PURE__ */ new WeakMap();
let activeWatcher = void 0;
function onWatcherCleanup(cleanupFn, failSilently = false, owner = activeWatcher) {
  if (owner) {
    let cleanups = cleanupMap.get(owner);
    if (!cleanups) cleanupMap.set(owner, cleanups = []);
    cleanups.push(cleanupFn);
  }
}
function watch$1(source, cb, options = EMPTY_OBJ) {
  const { immediate, deep, once, scheduler, augmentJob, call } = options;
  const reactiveGetter = (source2) => {
    if (deep) return source2;
    if (/* @__PURE__ */ isShallow(source2) || deep === false || deep === 0)
      return traverse(source2, 1);
    return traverse(source2);
  };
  let effect2;
  let getter;
  let cleanup;
  let boundCleanup;
  let forceTrigger = false;
  let isMultiSource = false;
  if (/* @__PURE__ */ isRef(source)) {
    getter = () => source.value;
    forceTrigger = /* @__PURE__ */ isShallow(source);
  } else if (/* @__PURE__ */ isReactive(source)) {
    getter = () => reactiveGetter(source);
    forceTrigger = true;
  } else if (isArray(source)) {
    isMultiSource = true;
    forceTrigger = source.some((s) => /* @__PURE__ */ isReactive(s) || /* @__PURE__ */ isShallow(s));
    getter = () => source.map((s) => {
      if (/* @__PURE__ */ isRef(s)) {
        return s.value;
      } else if (/* @__PURE__ */ isReactive(s)) {
        return reactiveGetter(s);
      } else if (isFunction(s)) {
        return call ? call(s, 2) : s();
      } else ;
    });
  } else if (isFunction(source)) {
    if (cb) {
      getter = call ? () => call(source, 2) : source;
    } else {
      getter = () => {
        if (cleanup) {
          pauseTracking();
          try {
            cleanup();
          } finally {
            resetTracking();
          }
        }
        const currentEffect = activeWatcher;
        activeWatcher = effect2;
        try {
          return call ? call(source, 3, [boundCleanup]) : source(boundCleanup);
        } finally {
          activeWatcher = currentEffect;
        }
      };
    }
  } else {
    getter = NOOP;
  }
  if (cb && deep) {
    const baseGetter = getter;
    const depth = deep === true ? Infinity : deep;
    getter = () => traverse(baseGetter(), depth);
  }
  const scope = getCurrentScope();
  const watchHandle = () => {
    effect2.stop();
    if (scope && scope.active) {
      remove(scope.effects, effect2);
    }
  };
  if (once && cb) {
    const _cb = cb;
    cb = (...args) => {
      const res = _cb(...args);
      watchHandle();
      return res;
    };
  }
  let oldValue = isMultiSource ? new Array(source.length).fill(INITIAL_WATCHER_VALUE) : INITIAL_WATCHER_VALUE;
  const job = (immediateFirstRun) => {
    if (!(effect2.flags & 1) || !effect2.dirty && !immediateFirstRun) {
      return;
    }
    if (cb) {
      const newValue = effect2.run();
      if (immediateFirstRun || deep || forceTrigger || (isMultiSource ? newValue.some((v, i) => hasChanged(v, oldValue[i])) : hasChanged(newValue, oldValue))) {
        if (cleanup) {
          cleanup();
        }
        const currentWatcher = activeWatcher;
        activeWatcher = effect2;
        try {
          const args = [
            newValue,
            // pass undefined as the old value when it's changed for the first time
            oldValue === INITIAL_WATCHER_VALUE ? void 0 : isMultiSource && oldValue[0] === INITIAL_WATCHER_VALUE ? [] : oldValue,
            boundCleanup
          ];
          oldValue = newValue;
          call ? call(cb, 3, args) : (
            // @ts-expect-error
            cb(...args)
          );
        } finally {
          activeWatcher = currentWatcher;
        }
      }
    } else {
      effect2.run();
    }
  };
  if (augmentJob) {
    augmentJob(job);
  }
  effect2 = new ReactiveEffect(getter);
  effect2.scheduler = scheduler ? () => scheduler(job, false) : job;
  boundCleanup = (fn) => onWatcherCleanup(fn, false, effect2);
  cleanup = effect2.onStop = () => {
    const cleanups = cleanupMap.get(effect2);
    if (cleanups) {
      if (call) {
        call(cleanups, 4);
      } else {
        for (const cleanup2 of cleanups) cleanup2();
      }
      cleanupMap.delete(effect2);
    }
  };
  if (cb) {
    if (immediate) {
      job(true);
    } else {
      oldValue = effect2.run();
    }
  } else if (scheduler) {
    scheduler(job.bind(null, true), true);
  } else {
    effect2.run();
  }
  watchHandle.pause = effect2.pause.bind(effect2);
  watchHandle.resume = effect2.resume.bind(effect2);
  watchHandle.stop = watchHandle;
  return watchHandle;
}
function traverse(value, depth = Infinity, seen2) {
  if (depth <= 0 || !isObject(value) || value["__v_skip"]) {
    return value;
  }
  seen2 = seen2 || /* @__PURE__ */ new Map();
  if ((seen2.get(value) || 0) >= depth) {
    return value;
  }
  seen2.set(value, depth);
  depth--;
  if (/* @__PURE__ */ isRef(value)) {
    traverse(value.value, depth, seen2);
  } else if (isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      traverse(value[i], depth, seen2);
    }
  } else if (isSet(value) || isMap(value)) {
    value.forEach((v) => {
      traverse(v, depth, seen2);
    });
  } else if (isPlainObject(value)) {
    for (const key in value) {
      traverse(value[key], depth, seen2);
    }
    for (const key of Object.getOwnPropertySymbols(value)) {
      if (Object.prototype.propertyIsEnumerable.call(value, key)) {
        traverse(value[key], depth, seen2);
      }
    }
  }
  return value;
}
const stack = [];
let isWarning = false;
function warn$1(msg, ...args) {
  if (isWarning) return;
  isWarning = true;
  pauseTracking();
  const instance = stack.length ? stack[stack.length - 1].component : null;
  const appWarnHandler = instance && instance.appContext.config.warnHandler;
  const trace = getComponentTrace();
  if (appWarnHandler) {
    callWithErrorHandling(
      appWarnHandler,
      instance,
      11,
      [
        // eslint-disable-next-line no-restricted-syntax
        msg + args.map((a) => {
          var _a, _b;
          return (_b = (_a = a.toString) == null ? void 0 : _a.call(a)) != null ? _b : JSON.stringify(a);
        }).join(""),
        instance && instance.proxy,
        trace.map(
          ({ vnode }) => `at <${formatComponentName(instance, vnode.type)}>`
        ).join("\n"),
        trace
      ]
    );
  } else {
    const warnArgs = [`[Vue warn]: ${msg}`, ...args];
    if (trace.length && // avoid spamming console during tests
    true) {
      warnArgs.push(`
`, ...formatTrace(trace));
    }
    console.warn(...warnArgs);
  }
  resetTracking();
  isWarning = false;
}
function getComponentTrace() {
  let currentVNode = stack[stack.length - 1];
  if (!currentVNode) {
    return [];
  }
  const normalizedStack = [];
  while (currentVNode) {
    const last = normalizedStack[0];
    if (last && last.vnode === currentVNode) {
      last.recurseCount++;
    } else {
      normalizedStack.push({
        vnode: currentVNode,
        recurseCount: 0
      });
    }
    const parentInstance = currentVNode.component && currentVNode.component.parent;
    currentVNode = parentInstance && parentInstance.vnode;
  }
  return normalizedStack;
}
function formatTrace(trace) {
  const logs = [];
  trace.forEach((entry, i) => {
    logs.push(...i === 0 ? [] : [`
`], ...formatTraceEntry(entry));
  });
  return logs;
}
function formatTraceEntry({ vnode, recurseCount }) {
  const postfix = recurseCount > 0 ? `... (${recurseCount} recursive calls)` : ``;
  const isRoot = vnode.component ? vnode.component.parent == null : false;
  const open = ` at <${formatComponentName(
    vnode.component,
    vnode.type,
    isRoot
  )}`;
  const close = `>` + postfix;
  return vnode.props ? [open, ...formatProps(vnode.props), close] : [open + close];
}
function formatProps(props) {
  const res = [];
  const keys = Object.keys(props);
  keys.slice(0, 3).forEach((key) => {
    res.push(...formatProp(key, props[key]));
  });
  if (keys.length > 3) {
    res.push(` ...`);
  }
  return res;
}
function formatProp(key, value, raw) {
  if (isString(value)) {
    value = JSON.stringify(value);
    return raw ? value : [`${key}=${value}`];
  } else if (typeof value === "number" || typeof value === "boolean" || value == null) {
    return raw ? value : [`${key}=${value}`];
  } else if (/* @__PURE__ */ isRef(value)) {
    value = formatProp(key, /* @__PURE__ */ toRaw(value.value), true);
    return raw ? value : [`${key}=Ref<`, value, `>`];
  } else if (isFunction(value)) {
    return [`${key}=fn${value.name ? `<${value.name}>` : ``}`];
  } else {
    value = /* @__PURE__ */ toRaw(value);
    return raw ? value : [`${key}=`, value];
  }
}
function callWithErrorHandling(fn, instance, type, args) {
  try {
    return args ? fn(...args) : fn();
  } catch (err) {
    handleError(err, instance, type);
  }
}
function callWithAsyncErrorHandling(fn, instance, type, args) {
  if (isFunction(fn)) {
    const res = callWithErrorHandling(fn, instance, type, args);
    if (res && isPromise(res)) {
      res.catch((err) => {
        handleError(err, instance, type);
      });
    }
    return res;
  }
  if (isArray(fn)) {
    const values = [];
    for (let i = 0; i < fn.length; i++) {
      values.push(callWithAsyncErrorHandling(fn[i], instance, type, args));
    }
    return values;
  }
}
function handleError(err, instance, type, throwInDev = true) {
  const contextVNode = instance ? instance.vnode : null;
  const { errorHandler, throwUnhandledErrorInProduction } = instance && instance.appContext.config || EMPTY_OBJ;
  if (instance) {
    let cur = instance.parent;
    const exposedInstance = instance.proxy;
    const errorInfo = `https://vuejs.org/error-reference/#runtime-${type}`;
    while (cur) {
      const errorCapturedHooks = cur.ec;
      if (errorCapturedHooks) {
        for (let i = 0; i < errorCapturedHooks.length; i++) {
          if (errorCapturedHooks[i](err, exposedInstance, errorInfo) === false) {
            return;
          }
        }
      }
      cur = cur.parent;
    }
    if (errorHandler) {
      pauseTracking();
      callWithErrorHandling(errorHandler, null, 10, [
        err,
        exposedInstance,
        errorInfo
      ]);
      resetTracking();
      return;
    }
  }
  logError(err, type, contextVNode, throwInDev, throwUnhandledErrorInProduction);
}
function logError(err, type, contextVNode, throwInDev = true, throwInProd = false) {
  if (throwInProd) {
    throw err;
  } else {
    console.error(err);
  }
}
const queue$1 = [];
let flushIndex = -1;
const pendingPostFlushCbs = [];
let activePostFlushCbs = null;
let postFlushIndex = 0;
const resolvedPromise = /* @__PURE__ */ Promise.resolve();
let currentFlushPromise = null;
function nextTick(fn) {
  const p2 = currentFlushPromise || resolvedPromise;
  return fn ? p2.then(this ? fn.bind(this) : fn) : p2;
}
function findInsertionIndex(id) {
  let start = flushIndex + 1;
  let end = queue$1.length;
  while (start < end) {
    const middle = start + end >>> 1;
    const middleJob = queue$1[middle];
    const middleJobId = getId(middleJob);
    if (middleJobId < id || middleJobId === id && middleJob.flags & 2) {
      start = middle + 1;
    } else {
      end = middle;
    }
  }
  return start;
}
function queueJob(job) {
  if (!(job.flags & 1)) {
    const jobId = getId(job);
    const lastJob = queue$1[queue$1.length - 1];
    if (!lastJob || // fast path when the job id is larger than the tail
    !(job.flags & 2) && jobId >= getId(lastJob)) {
      queue$1.push(job);
    } else {
      queue$1.splice(findInsertionIndex(jobId), 0, job);
    }
    job.flags |= 1;
    queueFlush();
  }
}
function queueFlush() {
  if (!currentFlushPromise) {
    currentFlushPromise = resolvedPromise.then(flushJobs);
  }
}
function queuePostFlushCb(cb) {
  if (!isArray(cb)) {
    if (activePostFlushCbs && cb.id === -1) {
      activePostFlushCbs.splice(postFlushIndex + 1, 0, cb);
    } else if (!(cb.flags & 1)) {
      pendingPostFlushCbs.push(cb);
      cb.flags |= 1;
    }
  } else {
    for (let i = 0; i < cb.length; i++) {
      pendingPostFlushCbs.push(cb[i]);
    }
  }
  queueFlush();
}
function flushPreFlushCbs(instance, seen2, i = flushIndex + 1) {
  for (; i < queue$1.length; i++) {
    const cb = queue$1[i];
    if (cb && cb.flags & 2) {
      if (instance && cb.id !== instance.uid) {
        continue;
      }
      queue$1.splice(i, 1);
      i--;
      if (cb.flags & 4) {
        cb.flags &= -2;
      }
      cb();
      if (!(cb.flags & 4)) {
        cb.flags &= -2;
      }
    }
  }
}
function flushPostFlushCbs(seen2) {
  if (pendingPostFlushCbs.length) {
    const deduped = [...new Set(pendingPostFlushCbs)].sort(
      (a, b) => getId(a) - getId(b)
    );
    pendingPostFlushCbs.length = 0;
    if (activePostFlushCbs) {
      for (let i = 0; i < deduped.length; i++) {
        activePostFlushCbs.push(deduped[i]);
      }
      return;
    }
    activePostFlushCbs = deduped;
    for (postFlushIndex = 0; postFlushIndex < activePostFlushCbs.length; postFlushIndex++) {
      const cb = activePostFlushCbs[postFlushIndex];
      if (cb.flags & 4) {
        cb.flags &= -2;
      }
      if (!(cb.flags & 8)) cb();
      cb.flags &= -2;
    }
    activePostFlushCbs = null;
    postFlushIndex = 0;
  }
}
const getId = (job) => job.id == null ? job.flags & 2 ? -1 : Infinity : job.id;
function flushJobs(seen2) {
  try {
    for (flushIndex = 0; flushIndex < queue$1.length; flushIndex++) {
      const job = queue$1[flushIndex];
      if (job && !(job.flags & 8)) {
        if (false) ;
        if (job.flags & 4) {
          job.flags &= ~1;
        }
        callWithErrorHandling(
          job,
          job.i,
          job.i ? 15 : 14
        );
        if (!(job.flags & 4)) {
          job.flags &= ~1;
        }
      }
    }
  } finally {
    for (; flushIndex < queue$1.length; flushIndex++) {
      const job = queue$1[flushIndex];
      if (job) {
        job.flags &= -2;
      }
    }
    flushIndex = -1;
    queue$1.length = 0;
    flushPostFlushCbs();
    currentFlushPromise = null;
    if (queue$1.length || pendingPostFlushCbs.length) {
      flushJobs();
    }
  }
}
let currentRenderingInstance = null;
let currentScopeId = null;
function setCurrentRenderingInstance(instance) {
  const prev = currentRenderingInstance;
  currentRenderingInstance = instance;
  currentScopeId = instance && instance.type.__scopeId || null;
  return prev;
}
function withCtx(fn, ctx = currentRenderingInstance, isNonScopedSlot) {
  if (!ctx) return fn;
  if (fn._n) {
    return fn;
  }
  const renderFnWithContext = (...args) => {
    if (renderFnWithContext._d) {
      setBlockTracking(-1);
    }
    const prevInstance = setCurrentRenderingInstance(ctx);
    const prevStackSize = blockStack.length;
    let res;
    try {
      res = fn(...args);
    } finally {
      for (let i = blockStack.length; i > prevStackSize; i--) closeBlock();
      setCurrentRenderingInstance(prevInstance);
      if (renderFnWithContext._d) {
        setBlockTracking(1);
      }
    }
    return res;
  };
  renderFnWithContext._n = true;
  renderFnWithContext._c = true;
  renderFnWithContext._d = true;
  return renderFnWithContext;
}
function withDirectives(vnode, directives) {
  if (currentRenderingInstance === null) {
    return vnode;
  }
  const instance = getComponentPublicInstance(currentRenderingInstance);
  const bindings = vnode.dirs || (vnode.dirs = []);
  for (let i = 0; i < directives.length; i++) {
    let [dir, value, arg, modifiers = EMPTY_OBJ] = directives[i];
    if (dir) {
      if (isFunction(dir)) {
        dir = {
          mounted: dir,
          updated: dir
        };
      }
      if (dir.deep) {
        traverse(value);
      }
      bindings.push({
        dir,
        instance,
        value,
        oldValue: void 0,
        arg,
        modifiers
      });
    }
  }
  return vnode;
}
function invokeDirectiveHook(vnode, prevVNode, instance, name) {
  const bindings = vnode.dirs;
  const oldBindings = prevVNode && prevVNode.dirs;
  for (let i = 0; i < bindings.length; i++) {
    const binding = bindings[i];
    if (oldBindings) {
      binding.oldValue = oldBindings[i].value;
    }
    let hook = binding.dir[name];
    if (hook) {
      pauseTracking();
      callWithAsyncErrorHandling(hook, instance, 8, [
        vnode.el,
        binding,
        vnode,
        prevVNode
      ]);
      resetTracking();
    }
  }
}
function provide(key, value) {
  if (currentInstance) {
    let provides = currentInstance.provides;
    const parentProvides = currentInstance.parent && currentInstance.parent.provides;
    if (parentProvides === provides) {
      provides = currentInstance.provides = Object.create(parentProvides);
    }
    provides[key] = value;
  }
}
function inject(key, defaultValue, treatDefaultAsFactory = false) {
  const instance = getCurrentInstance();
  if (instance || currentApp) {
    let provides = currentApp ? currentApp._context.provides : instance ? instance.parent == null || instance.ce ? instance.vnode.appContext && instance.vnode.appContext.provides : instance.parent.provides : void 0;
    if (provides && key in provides) {
      return provides[key];
    } else if (arguments.length > 1) {
      return treatDefaultAsFactory && isFunction(defaultValue) ? defaultValue.call(instance && instance.proxy) : defaultValue;
    } else ;
  }
}
const ssrContextKey = /* @__PURE__ */ Symbol.for("v-scx");
const useSSRContext = () => {
  {
    const ctx = inject(ssrContextKey);
    return ctx;
  }
};
function watch(source, cb, options) {
  return doWatch(source, cb, options);
}
function doWatch(source, cb, options = EMPTY_OBJ) {
  const { immediate, deep, flush, once } = options;
  const baseWatchOptions = extend({}, options);
  const runsImmediately = cb && immediate || !cb && flush !== "post";
  let ssrCleanup;
  if (isInSSRComponentSetup) {
    if (flush === "sync") {
      const ctx = useSSRContext();
      ssrCleanup = ctx.__watcherHandles || (ctx.__watcherHandles = []);
    } else if (!runsImmediately) {
      const watchStopHandle = () => {
      };
      watchStopHandle.stop = NOOP;
      watchStopHandle.resume = NOOP;
      watchStopHandle.pause = NOOP;
      return watchStopHandle;
    }
  }
  const instance = currentInstance;
  baseWatchOptions.call = (fn, type, args) => callWithAsyncErrorHandling(fn, instance, type, args);
  let isPre = false;
  if (flush === "post") {
    baseWatchOptions.scheduler = (job) => {
      queuePostRenderEffect(job, instance && instance.suspense);
    };
  } else if (flush !== "sync") {
    isPre = true;
    baseWatchOptions.scheduler = (job, isFirstRun) => {
      if (isFirstRun) {
        job();
      } else {
        queueJob(job);
      }
    };
  }
  baseWatchOptions.augmentJob = (job) => {
    if (cb) {
      job.flags |= 4;
    }
    if (isPre) {
      job.flags |= 2;
      if (instance) {
        job.id = instance.uid;
        job.i = instance;
      }
    }
  };
  const watchHandle = watch$1(source, cb, baseWatchOptions);
  if (isInSSRComponentSetup) {
    if (ssrCleanup) {
      ssrCleanup.push(watchHandle);
    } else if (runsImmediately) {
      watchHandle();
    }
  }
  return watchHandle;
}
function instanceWatch(source, value, options) {
  const publicThis = this.proxy;
  const getter = isString(source) ? source.includes(".") ? createPathGetter(publicThis, source) : () => publicThis[source] : source.bind(publicThis, publicThis);
  let cb;
  if (isFunction(value)) {
    cb = value;
  } else {
    cb = value.handler;
    options = value;
  }
  const reset = setCurrentInstance(this);
  const res = doWatch(getter, cb.bind(publicThis), options);
  reset();
  return res;
}
function createPathGetter(ctx, path) {
  const segments = path.split(".");
  return () => {
    let cur = ctx;
    for (let i = 0; i < segments.length && cur; i++) {
      cur = cur[segments[i]];
    }
    return cur;
  };
}
const TeleportEndKey = /* @__PURE__ */ Symbol("_vte");
const isTeleport = (type) => type.__isTeleport;
const leaveCbKey = /* @__PURE__ */ Symbol("_leaveCb");
function findNonCommentChild(children) {
  let child = children[0];
  if (children.length > 1) {
    for (const c of children) {
      if (c.type !== Comment) {
        child = c;
        break;
      }
    }
  }
  return child;
}
function getInnerChild$1(vnode) {
  if (!isKeepAlive(vnode)) {
    if (isTeleport(vnode.type) && vnode.children) {
      return findNonCommentChild(vnode.children);
    }
    return vnode;
  }
  if (vnode.component) {
    return vnode.component.subTree;
  }
  const { shapeFlag, children } = vnode;
  if (children) {
    if (shapeFlag & 16) {
      return children[0];
    }
    if (shapeFlag & 32 && isFunction(children.default)) {
      return children.default();
    }
  }
}
function setTransitionHooks(vnode, hooks) {
  if (vnode.shapeFlag & 6 && vnode.component) {
    vnode.transition = hooks;
    const subTree = vnode.component.subTree;
    setTransitionHooks(
      isTeleport(subTree.type) ? getInnerChild$1(subTree) || subTree : subTree,
      hooks
    );
  } else if (vnode.shapeFlag & 128) {
    vnode.ssContent.transition = hooks.clone(vnode.ssContent);
    vnode.ssFallback.transition = hooks.clone(vnode.ssFallback);
  } else {
    vnode.transition = hooks;
  }
}
// @__NO_SIDE_EFFECTS__
function defineComponent(options, extraOptions) {
  return isFunction(options) ? (
    // #8236: extend call and options.name access are considered side-effects
    // by Rollup, so we have to wrap it in a pure-annotated IIFE.
    /* @__PURE__ */ (() => extend({ name: options.name }, extraOptions, { setup: options }))()
  ) : options;
}
function markAsyncBoundary(instance) {
  instance.ids = [instance.ids[0] + instance.ids[2]++ + "-", 0, 0];
}
function isTemplateRefKey(refs, key) {
  let desc;
  return !!((desc = Object.getOwnPropertyDescriptor(refs, key)) && !desc.configurable);
}
const pendingSetRefMap = /* @__PURE__ */ new WeakMap();
function setRef(rawRef, oldRawRef, parentSuspense, vnode, isUnmount = false) {
  if (isArray(rawRef)) {
    rawRef.forEach(
      (r, i) => setRef(
        r,
        oldRawRef && (isArray(oldRawRef) ? oldRawRef[i] : oldRawRef),
        parentSuspense,
        vnode,
        isUnmount
      )
    );
    return;
  }
  if (isAsyncWrapper(vnode) && !isUnmount) {
    if (vnode.shapeFlag & 512 && vnode.type.__asyncResolved && vnode.component.subTree.component) {
      setRef(rawRef, oldRawRef, parentSuspense, vnode.component.subTree);
    }
    return;
  }
  const refValue = vnode.shapeFlag & 4 ? getComponentPublicInstance(vnode.component) : vnode.el;
  const value = isUnmount ? null : refValue;
  const { i: owner, r: ref3 } = rawRef;
  const oldRef = oldRawRef && oldRawRef.r;
  const refs = owner.refs === EMPTY_OBJ ? owner.refs = {} : owner.refs;
  const setupState = owner.setupState;
  const rawSetupState = /* @__PURE__ */ toRaw(setupState);
  const canSetSetupRef = setupState === EMPTY_OBJ ? NO : (key) => {
    if (isTemplateRefKey(refs, key)) {
      return false;
    }
    return hasOwn(rawSetupState, key);
  };
  const canSetRef = (ref22, key) => {
    if (key && isTemplateRefKey(refs, key)) {
      return false;
    }
    return true;
  };
  if (oldRef != null && oldRef !== ref3) {
    invalidatePendingSetRef(oldRawRef);
    if (isString(oldRef)) {
      refs[oldRef] = null;
      if (canSetSetupRef(oldRef)) {
        setupState[oldRef] = null;
      }
    } else if (/* @__PURE__ */ isRef(oldRef)) {
      const oldRawRefAtom = oldRawRef;
      if (canSetRef(oldRef, oldRawRefAtom.k)) {
        oldRef.value = null;
      }
      if (oldRawRefAtom.k) refs[oldRawRefAtom.k] = null;
    }
  }
  if (isFunction(ref3)) {
    callWithErrorHandling(ref3, owner, 12, [value, refs]);
  } else {
    const _isString = isString(ref3);
    const _isRef = /* @__PURE__ */ isRef(ref3);
    if (_isString || _isRef) {
      const doSet = () => {
        if (rawRef.f) {
          const existing = _isString ? canSetSetupRef(ref3) ? setupState[ref3] : refs[ref3] : canSetRef() || !rawRef.k ? ref3.value : refs[rawRef.k];
          if (isUnmount) {
            isArray(existing) && remove(existing, refValue);
          } else {
            if (!isArray(existing)) {
              if (_isString) {
                refs[ref3] = [refValue];
                if (canSetSetupRef(ref3)) {
                  setupState[ref3] = refs[ref3];
                }
              } else {
                const newVal = [refValue];
                if (canSetRef(ref3, rawRef.k)) {
                  ref3.value = newVal;
                }
                if (rawRef.k) refs[rawRef.k] = newVal;
              }
            } else if (!existing.includes(refValue)) {
              existing.push(refValue);
            }
          }
        } else if (_isString) {
          refs[ref3] = value;
          if (canSetSetupRef(ref3)) {
            setupState[ref3] = value;
          }
        } else if (_isRef) {
          if (canSetRef(ref3, rawRef.k)) {
            ref3.value = value;
          }
          if (rawRef.k) refs[rawRef.k] = value;
        } else ;
      };
      if (value) {
        const job = () => {
          doSet();
          pendingSetRefMap.delete(rawRef);
        };
        job.id = -1;
        pendingSetRefMap.set(rawRef, job);
        queuePostRenderEffect(job, parentSuspense);
      } else {
        invalidatePendingSetRef(rawRef);
        doSet();
      }
    }
  }
}
function invalidatePendingSetRef(rawRef) {
  const pendingSetRef = pendingSetRefMap.get(rawRef);
  if (pendingSetRef) {
    pendingSetRef.flags |= 8;
    pendingSetRefMap.delete(rawRef);
  }
}
getGlobalThis().requestIdleCallback || ((cb) => setTimeout(cb, 1));
getGlobalThis().cancelIdleCallback || ((id) => clearTimeout(id));
const isAsyncWrapper = (i) => !!i.type.__asyncLoader;
const isKeepAlive = (vnode) => vnode.type.__isKeepAlive;
function onActivated(hook, target) {
  registerKeepAliveHook(hook, "a", target);
}
function onDeactivated(hook, target) {
  registerKeepAliveHook(hook, "da", target);
}
function registerKeepAliveHook(hook, type, target = currentInstance) {
  const wrappedHook = hook.__wdc || (hook.__wdc = () => {
    let current = target;
    while (current) {
      if (current.isDeactivated) {
        return;
      }
      current = current.parent;
    }
    return hook();
  });
  injectHook(type, wrappedHook, target);
  if (target) {
    let current = target.parent;
    while (current && current.parent) {
      if (isKeepAlive(current.parent.vnode)) {
        injectToKeepAliveRoot(wrappedHook, type, target, current);
      }
      current = current.parent;
    }
  }
}
function injectToKeepAliveRoot(hook, type, target, keepAliveRoot) {
  const injected = injectHook(
    type,
    hook,
    keepAliveRoot,
    true
    /* prepend */
  );
  onUnmounted(() => {
    remove(keepAliveRoot[type], injected);
  }, target);
}
function injectHook(type, hook, target = currentInstance, prepend = false) {
  if (target) {
    const hooks = target[type] || (target[type] = []);
    const wrappedHook = hook.__weh || (hook.__weh = (...args) => {
      pauseTracking();
      const reset = setCurrentInstance(target);
      const res = callWithAsyncErrorHandling(hook, target, type, args);
      reset();
      resetTracking();
      return res;
    });
    if (prepend) {
      hooks.unshift(wrappedHook);
    } else {
      hooks.push(wrappedHook);
    }
    return wrappedHook;
  }
}
const createHook = (lifecycle) => (hook, target = currentInstance) => {
  if (!isInSSRComponentSetup || lifecycle === "sp") {
    injectHook(lifecycle, (...args) => hook(...args), target);
  }
};
const onBeforeMount = createHook("bm");
const onMounted = createHook("m");
const onBeforeUpdate = createHook(
  "bu"
);
const onUpdated = createHook("u");
const onBeforeUnmount = createHook(
  "bum"
);
const onUnmounted = createHook("um");
const onServerPrefetch = createHook(
  "sp"
);
const onRenderTriggered = createHook("rtg");
const onRenderTracked = createHook("rtc");
function onErrorCaptured(hook, target = currentInstance) {
  injectHook("ec", hook, target);
}
const NULL_DYNAMIC_COMPONENT = /* @__PURE__ */ Symbol.for("v-ndc");
function renderList(source, renderItem, cache2, index) {
  let ret;
  const cached = cache2;
  const sourceIsArray = isArray(source);
  if (sourceIsArray || isString(source)) {
    const sourceIsReactiveArray = sourceIsArray && /* @__PURE__ */ isReactive(source);
    let needsWrap = false;
    let isReadonlySource = false;
    if (sourceIsReactiveArray) {
      needsWrap = !/* @__PURE__ */ isShallow(source);
      isReadonlySource = /* @__PURE__ */ isReadonly(source);
      source = shallowReadArray(source);
    }
    ret = new Array(source.length);
    for (let i = 0, l = source.length; i < l; i++) {
      ret[i] = renderItem(
        needsWrap ? isReadonlySource ? toReadonly(toReactive(source[i])) : toReactive(source[i]) : source[i],
        i,
        void 0,
        cached
      );
    }
  } else if (typeof source === "number") {
    {
      ret = new Array(source);
      for (let i = 0; i < source; i++) {
        ret[i] = renderItem(i + 1, i, void 0, cached);
      }
    }
  } else if (isObject(source)) {
    if (source[Symbol.iterator]) {
      ret = Array.from(
        source,
        (item, i) => renderItem(item, i, void 0, cached)
      );
    } else {
      const keys = Object.keys(source);
      ret = new Array(keys.length);
      for (let i = 0, l = keys.length; i < l; i++) {
        const key = keys[i];
        ret[i] = renderItem(source[key], key, i, cached);
      }
    }
  } else {
    ret = [];
  }
  return ret;
}
const getPublicInstance = (i) => {
  if (!i) return null;
  if (isStatefulComponent(i)) return getComponentPublicInstance(i);
  return getPublicInstance(i.parent);
};
const publicPropertiesMap = (
  // Move PURE marker to new line to workaround compiler discarding it
  // due to type annotation
  /* @__PURE__ */ extend(/* @__PURE__ */ Object.create(null), {
    $: (i) => i,
    $el: (i) => i.vnode.el,
    $data: (i) => i.data,
    $props: (i) => i.props,
    $attrs: (i) => i.attrs,
    $slots: (i) => i.slots,
    $refs: (i) => i.refs,
    $parent: (i) => getPublicInstance(i.parent),
    $root: (i) => getPublicInstance(i.root),
    $host: (i) => i.ce,
    $emit: (i) => i.emit,
    $options: (i) => resolveMergedOptions(i),
    $forceUpdate: (i) => i.f || (i.f = () => {
      queueJob(i.update);
    }),
    $nextTick: (i) => i.n || (i.n = nextTick.bind(i.proxy)),
    $watch: (i) => instanceWatch.bind(i)
  })
);
const hasSetupBinding = (state, key) => state !== EMPTY_OBJ && !state.__isScriptSetup && hasOwn(state, key);
const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    if (key === "__v_skip") {
      return true;
    }
    const { ctx, setupState, data, props, accessCache, type, appContext } = instance;
    if (key[0] !== "$") {
      const n = accessCache[key];
      if (n !== void 0) {
        switch (n) {
          case 1:
            return setupState[key];
          case 2:
            return data[key];
          case 4:
            return ctx[key];
          case 3:
            return props[key];
        }
      } else if (hasSetupBinding(setupState, key)) {
        accessCache[key] = 1;
        return setupState[key];
      } else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
        accessCache[key] = 2;
        return data[key];
      } else if (hasOwn(props, key)) {
        accessCache[key] = 3;
        return props[key];
      } else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
        accessCache[key] = 4;
        return ctx[key];
      } else if (shouldCacheAccess) {
        accessCache[key] = 0;
      }
    }
    const publicGetter = publicPropertiesMap[key];
    let cssModule, globalProperties;
    if (publicGetter) {
      if (key === "$attrs") {
        track(instance.attrs, "get", "");
      }
      return publicGetter(instance);
    } else if (
      // css module (injected by vue-loader)
      (cssModule = type.__cssModules) && (cssModule = cssModule[key])
    ) {
      return cssModule;
    } else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
      accessCache[key] = 4;
      return ctx[key];
    } else if (
      // global properties
      globalProperties = appContext.config.globalProperties, hasOwn(globalProperties, key)
    ) {
      {
        return globalProperties[key];
      }
    } else ;
  },
  set({ _: instance }, key, value) {
    const { data, setupState, ctx } = instance;
    if (hasSetupBinding(setupState, key)) {
      setupState[key] = value;
      return true;
    } else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
      data[key] = value;
      return true;
    } else if (hasOwn(instance.props, key)) {
      return false;
    }
    if (key[0] === "$" && key.slice(1) in instance) {
      return false;
    } else {
      {
        ctx[key] = value;
      }
    }
    return true;
  },
  has({
    _: { data, setupState, accessCache, ctx, appContext, props, type }
  }, key) {
    let cssModules;
    return !!(accessCache[key] || data !== EMPTY_OBJ && key[0] !== "$" && hasOwn(data, key) || hasSetupBinding(setupState, key) || hasOwn(props, key) || hasOwn(ctx, key) || hasOwn(publicPropertiesMap, key) || hasOwn(appContext.config.globalProperties, key) || (cssModules = type.__cssModules) && cssModules[key]);
  },
  defineProperty(target, key, descriptor) {
    if (descriptor.get != null) {
      target._.accessCache[key] = 0;
    } else if (hasOwn(descriptor, "value")) {
      this.set(target, key, descriptor.value, null);
    }
    return Reflect.defineProperty(target, key, descriptor);
  }
};
function normalizePropsOrEmits(props) {
  return isArray(props) ? props.reduce(
    (normalized, p2) => (normalized[p2] = null, normalized),
    {}
  ) : props;
}
let shouldCacheAccess = true;
function applyOptions(instance) {
  const options = resolveMergedOptions(instance);
  const publicThis = instance.proxy;
  const ctx = instance.ctx;
  shouldCacheAccess = false;
  if (options.beforeCreate) {
    callHook(options.beforeCreate, instance, "bc");
  }
  const {
    // state
    data: dataOptions,
    computed: computedOptions,
    methods,
    watch: watchOptions,
    provide: provideOptions,
    inject: injectOptions,
    // lifecycle
    created,
    beforeMount,
    mounted,
    beforeUpdate,
    updated,
    activated,
    deactivated,
    beforeDestroy,
    beforeUnmount,
    destroyed,
    unmounted,
    render,
    renderTracked,
    renderTriggered,
    errorCaptured,
    serverPrefetch,
    // public API
    expose,
    inheritAttrs,
    // assets
    components,
    directives,
    filters
  } = options;
  const checkDuplicateProperties = null;
  if (injectOptions) {
    resolveInjections(injectOptions, ctx, checkDuplicateProperties);
  }
  if (methods) {
    for (const key in methods) {
      const methodHandler = methods[key];
      if (isFunction(methodHandler)) {
        {
          ctx[key] = methodHandler.bind(publicThis);
        }
      }
    }
  }
  if (dataOptions) {
    const data = dataOptions.call(publicThis, publicThis);
    if (!isObject(data)) ;
    else {
      instance.data = /* @__PURE__ */ reactive(data);
    }
  }
  shouldCacheAccess = true;
  if (computedOptions) {
    for (const key in computedOptions) {
      const opt = computedOptions[key];
      const get = isFunction(opt) ? opt.bind(publicThis, publicThis) : isFunction(opt.get) ? opt.get.bind(publicThis, publicThis) : NOOP;
      const set = !isFunction(opt) && isFunction(opt.set) ? opt.set.bind(publicThis) : NOOP;
      const c = computed({
        get,
        set
      });
      Object.defineProperty(ctx, key, {
        enumerable: true,
        configurable: true,
        get: () => c.value,
        set: (v) => c.value = v
      });
    }
  }
  if (watchOptions) {
    for (const key in watchOptions) {
      createWatcher(watchOptions[key], ctx, publicThis, key);
    }
  }
  if (provideOptions) {
    const provides = isFunction(provideOptions) ? provideOptions.call(publicThis) : provideOptions;
    Reflect.ownKeys(provides).forEach((key) => {
      provide(key, provides[key]);
    });
  }
  if (created) {
    callHook(created, instance, "c");
  }
  function registerLifecycleHook(register, hook) {
    if (isArray(hook)) {
      hook.forEach((_hook) => register(_hook.bind(publicThis)));
    } else if (hook) {
      register(hook.bind(publicThis));
    }
  }
  registerLifecycleHook(onBeforeMount, beforeMount);
  registerLifecycleHook(onMounted, mounted);
  registerLifecycleHook(onBeforeUpdate, beforeUpdate);
  registerLifecycleHook(onUpdated, updated);
  registerLifecycleHook(onActivated, activated);
  registerLifecycleHook(onDeactivated, deactivated);
  registerLifecycleHook(onErrorCaptured, errorCaptured);
  registerLifecycleHook(onRenderTracked, renderTracked);
  registerLifecycleHook(onRenderTriggered, renderTriggered);
  registerLifecycleHook(onBeforeUnmount, beforeUnmount);
  registerLifecycleHook(onUnmounted, unmounted);
  registerLifecycleHook(onServerPrefetch, serverPrefetch);
  if (isArray(expose)) {
    if (expose.length) {
      const exposed = instance.exposed || (instance.exposed = {});
      expose.forEach((key) => {
        Object.defineProperty(exposed, key, {
          get: () => publicThis[key],
          set: (val) => publicThis[key] = val,
          enumerable: true
        });
      });
    } else if (!instance.exposed) {
      instance.exposed = {};
    }
  }
  if (render && instance.render === NOOP) {
    instance.render = render;
  }
  if (inheritAttrs != null) {
    instance.inheritAttrs = inheritAttrs;
  }
  if (components) instance.components = components;
  if (directives) instance.directives = directives;
  if (serverPrefetch) {
    markAsyncBoundary(instance);
  }
}
function resolveInjections(injectOptions, ctx, checkDuplicateProperties = NOOP) {
  if (isArray(injectOptions)) {
    injectOptions = normalizeInject(injectOptions);
  }
  for (const key in injectOptions) {
    const opt = injectOptions[key];
    let injected;
    if (isObject(opt)) {
      if ("default" in opt) {
        injected = inject(
          opt.from || key,
          opt.default,
          true
        );
      } else {
        injected = inject(opt.from || key);
      }
    } else {
      injected = inject(opt);
    }
    if (/* @__PURE__ */ isRef(injected)) {
      Object.defineProperty(ctx, key, {
        enumerable: true,
        configurable: true,
        get: () => injected.value,
        set: (v) => injected.value = v
      });
    } else {
      ctx[key] = injected;
    }
  }
}
function callHook(hook, instance, type) {
  callWithAsyncErrorHandling(
    isArray(hook) ? hook.map((h2) => h2.bind(instance.proxy)) : hook.bind(instance.proxy),
    instance,
    type
  );
}
function createWatcher(raw, ctx, publicThis, key) {
  let getter = key.includes(".") ? createPathGetter(publicThis, key) : () => publicThis[key];
  if (isString(raw)) {
    const handler = ctx[raw];
    if (isFunction(handler)) {
      {
        watch(getter, handler);
      }
    }
  } else if (isFunction(raw)) {
    {
      watch(getter, raw.bind(publicThis));
    }
  } else if (isObject(raw)) {
    if (isArray(raw)) {
      raw.forEach((r) => createWatcher(r, ctx, publicThis, key));
    } else {
      const handler = isFunction(raw.handler) ? raw.handler.bind(publicThis) : ctx[raw.handler];
      if (isFunction(handler)) {
        watch(getter, handler, raw);
      }
    }
  } else ;
}
function resolveMergedOptions(instance) {
  const base = instance.type;
  const { mixins, extends: extendsOptions } = base;
  const {
    mixins: globalMixins,
    optionsCache: cache2,
    config: { optionMergeStrategies }
  } = instance.appContext;
  const cached = cache2.get(base);
  let resolved;
  if (cached) {
    resolved = cached;
  } else if (!globalMixins.length && !mixins && !extendsOptions) {
    {
      resolved = base;
    }
  } else {
    resolved = {};
    if (globalMixins.length) {
      globalMixins.forEach(
        (m) => mergeOptions(resolved, m, optionMergeStrategies, true)
      );
    }
    mergeOptions(resolved, base, optionMergeStrategies);
  }
  if (isObject(base)) {
    cache2.set(base, resolved);
  }
  return resolved;
}
function mergeOptions(to, from, strats, asMixin = false) {
  const { mixins, extends: extendsOptions } = from;
  if (extendsOptions) {
    mergeOptions(to, extendsOptions, strats, true);
  }
  if (mixins) {
    mixins.forEach(
      (m) => mergeOptions(to, m, strats, true)
    );
  }
  for (const key in from) {
    if (asMixin && key === "expose") ;
    else {
      const strat = internalOptionMergeStrats[key] || strats && strats[key];
      to[key] = strat ? strat(to[key], from[key]) : from[key];
    }
  }
  return to;
}
const internalOptionMergeStrats = {
  data: mergeDataFn,
  props: mergeEmitsOrPropsOptions,
  emits: mergeEmitsOrPropsOptions,
  // objects
  methods: mergeObjectOptions,
  computed: mergeObjectOptions,
  // lifecycle
  beforeCreate: mergeAsArray,
  created: mergeAsArray,
  beforeMount: mergeAsArray,
  mounted: mergeAsArray,
  beforeUpdate: mergeAsArray,
  updated: mergeAsArray,
  beforeDestroy: mergeAsArray,
  beforeUnmount: mergeAsArray,
  destroyed: mergeAsArray,
  unmounted: mergeAsArray,
  activated: mergeAsArray,
  deactivated: mergeAsArray,
  errorCaptured: mergeAsArray,
  serverPrefetch: mergeAsArray,
  // assets
  components: mergeObjectOptions,
  directives: mergeObjectOptions,
  // watch
  watch: mergeWatchOptions,
  // provide / inject
  provide: mergeDataFn,
  inject: mergeInject
};
function mergeDataFn(to, from) {
  if (!from) {
    return to;
  }
  if (!to) {
    return from;
  }
  return function mergedDataFn() {
    return extend(
      isFunction(to) ? to.call(this, this) : to,
      isFunction(from) ? from.call(this, this) : from
    );
  };
}
function mergeInject(to, from) {
  return mergeObjectOptions(normalizeInject(to), normalizeInject(from));
}
function normalizeInject(raw) {
  if (isArray(raw)) {
    const res = {};
    for (let i = 0; i < raw.length; i++) {
      res[raw[i]] = raw[i];
    }
    return res;
  }
  return raw;
}
function mergeAsArray(to, from) {
  return to ? [...new Set([].concat(to, from))] : from;
}
function mergeObjectOptions(to, from) {
  return to ? extend(/* @__PURE__ */ Object.create(null), to, from) : from;
}
function mergeEmitsOrPropsOptions(to, from) {
  if (to) {
    if (isArray(to) && isArray(from)) {
      return [.../* @__PURE__ */ new Set([...to, ...from])];
    }
    return extend(
      /* @__PURE__ */ Object.create(null),
      normalizePropsOrEmits(to),
      normalizePropsOrEmits(from != null ? from : {})
    );
  } else {
    return from;
  }
}
function mergeWatchOptions(to, from) {
  if (!to) return from;
  if (!from) return to;
  const merged = extend(/* @__PURE__ */ Object.create(null), to);
  for (const key in from) {
    merged[key] = mergeAsArray(to[key], from[key]);
  }
  return merged;
}
function createAppContext() {
  return {
    app: null,
    config: {
      isNativeTag: NO,
      performance: false,
      globalProperties: {},
      optionMergeStrategies: {},
      errorHandler: void 0,
      warnHandler: void 0,
      compilerOptions: {}
    },
    mixins: [],
    components: {},
    directives: {},
    provides: /* @__PURE__ */ Object.create(null),
    optionsCache: /* @__PURE__ */ new WeakMap(),
    propsCache: /* @__PURE__ */ new WeakMap(),
    emitsCache: /* @__PURE__ */ new WeakMap()
  };
}
let uid$1 = 0;
function createAppAPI(render, hydrate) {
  return function createApp2(rootComponent, rootProps = null) {
    if (!isFunction(rootComponent)) {
      rootComponent = extend({}, rootComponent);
    }
    if (rootProps != null && !isObject(rootProps)) {
      rootProps = null;
    }
    const context = createAppContext();
    const installedPlugins = /* @__PURE__ */ new WeakSet();
    const pluginCleanupFns = [];
    let isMounted = false;
    const app = context.app = {
      _uid: uid$1++,
      _component: rootComponent,
      _props: rootProps,
      _container: null,
      _context: context,
      _instance: null,
      version,
      get config() {
        return context.config;
      },
      set config(v) {
      },
      use(plugin, ...options) {
        if (installedPlugins.has(plugin)) ;
        else if (plugin && isFunction(plugin.install)) {
          installedPlugins.add(plugin);
          plugin.install(app, ...options);
        } else if (isFunction(plugin)) {
          installedPlugins.add(plugin);
          plugin(app, ...options);
        } else ;
        return app;
      },
      mixin(mixin) {
        {
          if (!context.mixins.includes(mixin)) {
            context.mixins.push(mixin);
          }
        }
        return app;
      },
      component(name, component) {
        if (!component) {
          return context.components[name];
        }
        context.components[name] = component;
        return app;
      },
      directive(name, directive) {
        if (!directive) {
          return context.directives[name];
        }
        context.directives[name] = directive;
        return app;
      },
      mount(rootContainer, isHydrate, namespace) {
        if (!isMounted) {
          const vnode = app._ceVNode || createVNode(rootComponent, rootProps);
          vnode.appContext = context;
          if (namespace === true) {
            namespace = "svg";
          } else if (namespace === false) {
            namespace = void 0;
          }
          {
            render(vnode, rootContainer, namespace);
          }
          isMounted = true;
          app._container = rootContainer;
          rootContainer.__vue_app__ = app;
          return getComponentPublicInstance(vnode.component);
        }
      },
      onUnmount(cleanupFn) {
        pluginCleanupFns.push(cleanupFn);
      },
      unmount() {
        if (isMounted) {
          callWithAsyncErrorHandling(
            pluginCleanupFns,
            app._instance,
            16
          );
          render(null, app._container);
          delete app._container.__vue_app__;
        }
      },
      provide(key, value) {
        context.provides[key] = value;
        return app;
      },
      runWithContext(fn) {
        const lastApp = currentApp;
        currentApp = app;
        try {
          return fn();
        } finally {
          currentApp = lastApp;
        }
      }
    };
    return app;
  };
}
let currentApp = null;
const getModelModifiers = (props, modelName) => {
  return modelName === "modelValue" || modelName === "model-value" ? props.modelModifiers : props[`${modelName}Modifiers`] || props[`${camelize(modelName)}Modifiers`] || props[`${hyphenate(modelName)}Modifiers`];
};
function emit(instance, event, ...rawArgs) {
  if (instance.isUnmounted) return;
  const props = instance.vnode.props || EMPTY_OBJ;
  let args = rawArgs;
  const isModelListener2 = event.startsWith("update:");
  const modifiers = isModelListener2 && getModelModifiers(props, event.slice(7));
  if (modifiers) {
    if (modifiers.trim) {
      args = rawArgs.map((a) => isString(a) ? a.trim() : a);
    }
    if (modifiers.number) {
      args = args.map(looseToNumber);
    }
  }
  let handlerName;
  let handler = props[handlerName = toHandlerKey(event)] || // also try camelCase event handler (#2249)
  props[handlerName = toHandlerKey(camelize(event))];
  if (!handler && isModelListener2) {
    handler = props[handlerName = toHandlerKey(hyphenate(event))];
  }
  if (handler) {
    callWithAsyncErrorHandling(
      handler,
      instance,
      6,
      args
    );
  }
  const onceHandler = props[handlerName + `Once`];
  if (onceHandler) {
    if (!instance.emitted) {
      instance.emitted = {};
    } else if (instance.emitted[handlerName]) {
      return;
    }
    instance.emitted[handlerName] = true;
    callWithAsyncErrorHandling(
      onceHandler,
      instance,
      6,
      args
    );
  }
}
const mixinEmitsCache = /* @__PURE__ */ new WeakMap();
function normalizeEmitsOptions(comp, appContext, asMixin = false) {
  const cache2 = asMixin ? mixinEmitsCache : appContext.emitsCache;
  const cached = cache2.get(comp);
  if (cached !== void 0) {
    return cached;
  }
  const raw = comp.emits;
  let normalized = {};
  let hasExtends = false;
  if (!isFunction(comp)) {
    const extendEmits = (raw2) => {
      const normalizedFromExtend = normalizeEmitsOptions(raw2, appContext, true);
      if (normalizedFromExtend) {
        hasExtends = true;
        extend(normalized, normalizedFromExtend);
      }
    };
    if (!asMixin && appContext.mixins.length) {
      appContext.mixins.forEach(extendEmits);
    }
    if (comp.extends) {
      extendEmits(comp.extends);
    }
    if (comp.mixins) {
      comp.mixins.forEach(extendEmits);
    }
  }
  if (!raw && !hasExtends) {
    if (isObject(comp)) {
      cache2.set(comp, null);
    }
    return null;
  }
  if (isArray(raw)) {
    raw.forEach((key) => normalized[key] = null);
  } else {
    extend(normalized, raw);
  }
  if (isObject(comp)) {
    cache2.set(comp, normalized);
  }
  return normalized;
}
function isEmitListener(options, key) {
  if (!options || !isOn(key)) {
    return false;
  }
  key = key.slice(2);
  key = key === "Once" ? key : key.replace(/Once$/, "");
  return hasOwn(options, key[0].toLowerCase() + key.slice(1)) || hasOwn(options, hyphenate(key)) || hasOwn(options, key);
}
function markAttrsAccessed() {
}
function renderComponentRoot(instance) {
  const {
    type: Component,
    vnode,
    proxy,
    withProxy,
    propsOptions: [propsOptions],
    slots,
    attrs,
    emit: emit2,
    render,
    renderCache,
    props,
    data,
    setupState,
    ctx,
    inheritAttrs
  } = instance;
  const prev = setCurrentRenderingInstance(instance);
  let result;
  let fallthroughAttrs;
  try {
    if (vnode.shapeFlag & 4) {
      const proxyToUse = withProxy || proxy;
      const thisProxy = false ? new Proxy(proxyToUse, {
        get(target, key, receiver) {
          warn$1(
            `Property '${String(
              key
            )}' was accessed via 'this'. Avoid using 'this' in templates.`
          );
          return Reflect.get(target, key, receiver);
        }
      }) : proxyToUse;
      result = normalizeVNode(
        render.call(
          thisProxy,
          proxyToUse,
          renderCache,
          false ? /* @__PURE__ */ shallowReadonly(props) : props,
          setupState,
          data,
          ctx
        )
      );
      fallthroughAttrs = attrs;
    } else {
      const render2 = Component;
      if (false) ;
      result = normalizeVNode(
        render2.length > 1 ? render2(
          false ? /* @__PURE__ */ shallowReadonly(props) : props,
          false ? {
            get attrs() {
              markAttrsAccessed();
              return /* @__PURE__ */ shallowReadonly(attrs);
            },
            slots,
            emit: emit2
          } : { attrs, slots, emit: emit2 }
        ) : render2(
          false ? /* @__PURE__ */ shallowReadonly(props) : props,
          null
        )
      );
      fallthroughAttrs = Component.props ? attrs : getFunctionalFallthrough(attrs);
    }
  } catch (err) {
    blockStack.length = 0;
    handleError(err, instance, 1);
    result = createVNode(Comment);
  }
  let root = result;
  if (fallthroughAttrs && inheritAttrs !== false) {
    const keys = Object.keys(fallthroughAttrs);
    const { shapeFlag } = root;
    if (keys.length) {
      if (shapeFlag & (1 | 6)) {
        if (propsOptions && keys.some(isModelListener)) {
          fallthroughAttrs = filterModelListeners(
            fallthroughAttrs,
            propsOptions
          );
        }
        root = cloneVNode(root, fallthroughAttrs, false, true);
      }
    }
  }
  if (vnode.dirs) {
    root = cloneVNode(root, null, false, true);
    root.dirs = root.dirs ? root.dirs.concat(vnode.dirs) : vnode.dirs;
  }
  if (vnode.transition) {
    const child = isTeleport(root.type) ? getInnerChild$1(root) || root : root;
    setTransitionHooks(child, vnode.transition);
  }
  {
    result = root;
  }
  setCurrentRenderingInstance(prev);
  return result;
}
const getFunctionalFallthrough = (attrs) => {
  let res;
  for (const key in attrs) {
    if (key === "class" || key === "style" || isOn(key)) {
      (res || (res = {}))[key] = attrs[key];
    }
  }
  return res;
};
const filterModelListeners = (attrs, props) => {
  const res = {};
  for (const key in attrs) {
    if (!isModelListener(key) || !(key.slice(9) in props)) {
      res[key] = attrs[key];
    }
  }
  return res;
};
function shouldUpdateComponent(prevVNode, nextVNode, optimized) {
  const { props: prevProps, children: prevChildren, component } = prevVNode;
  const { props: nextProps, children: nextChildren, patchFlag } = nextVNode;
  const emits = component.emitsOptions;
  if (nextVNode.dirs || nextVNode.transition) {
    return true;
  }
  if (optimized && patchFlag >= 0) {
    if (patchFlag & 1024) {
      return true;
    }
    if (patchFlag & 16) {
      if (!prevProps) {
        return !!nextProps;
      }
      return hasPropsChanged(prevProps, nextProps, emits);
    } else if (patchFlag & 8) {
      const dynamicProps = nextVNode.dynamicProps;
      for (let i = 0; i < dynamicProps.length; i++) {
        const key = dynamicProps[i];
        if (hasPropValueChanged(nextProps, prevProps, key) && !isEmitListener(emits, key)) {
          return true;
        }
      }
    }
  } else {
    if (prevChildren || nextChildren) {
      if (!nextChildren || !nextChildren.$stable) {
        return true;
      }
    }
    if (prevProps === nextProps) {
      return false;
    }
    if (!prevProps) {
      return !!nextProps;
    }
    if (!nextProps) {
      return true;
    }
    return hasPropsChanged(prevProps, nextProps, emits);
  }
  return false;
}
function hasPropsChanged(prevProps, nextProps, emitsOptions) {
  const nextKeys = Object.keys(nextProps);
  if (nextKeys.length !== Object.keys(prevProps).length) {
    return true;
  }
  for (let i = 0; i < nextKeys.length; i++) {
    const key = nextKeys[i];
    if (hasPropValueChanged(nextProps, prevProps, key) && !isEmitListener(emitsOptions, key)) {
      return true;
    }
  }
  return false;
}
function hasPropValueChanged(nextProps, prevProps, key) {
  const nextProp = nextProps[key];
  const prevProp = prevProps[key];
  if (key === "style" && isObject(nextProp) && isObject(prevProp)) {
    return !looseEqual(nextProp, prevProp);
  }
  return nextProp !== prevProp;
}
function updateHOCHostEl({ vnode, parent, suspense }, el) {
  while (parent) {
    const root = parent.subTree;
    if (root.suspense && root.suspense.activeBranch === vnode) {
      root.suspense.vnode.el = root.el = el;
      vnode = root;
    }
    if (root === vnode) {
      (vnode = parent.vnode).el = el;
      parent = parent.parent;
    } else {
      break;
    }
  }
  if (suspense && suspense.activeBranch === vnode) {
    suspense.vnode.el = el;
  }
}
const internalObjectProto = {};
const createInternalObject = () => Object.create(internalObjectProto);
const isInternalObject = (obj) => Object.getPrototypeOf(obj) === internalObjectProto;
function initProps(instance, rawProps, isStateful, isSSR = false) {
  const props = {};
  const attrs = createInternalObject();
  instance.propsDefaults = /* @__PURE__ */ Object.create(null);
  setFullProps(instance, rawProps, props, attrs);
  for (const key in instance.propsOptions[0]) {
    if (!(key in props)) {
      props[key] = void 0;
    }
  }
  if (isStateful) {
    instance.props = isSSR ? props : /* @__PURE__ */ shallowReactive(props);
  } else {
    if (!instance.type.props) {
      instance.props = attrs;
    } else {
      instance.props = props;
    }
  }
  instance.attrs = attrs;
}
function updateProps(instance, rawProps, rawPrevProps, optimized) {
  const {
    props,
    attrs,
    vnode: { patchFlag }
  } = instance;
  const rawCurrentProps = /* @__PURE__ */ toRaw(props);
  const [options] = instance.propsOptions;
  let hasAttrsChanged = false;
  if (
    // always force full diff in dev
    // - #1942 if hmr is enabled with sfc component
    // - vite#872 non-sfc component used by sfc component
    (optimized || patchFlag > 0) && !(patchFlag & 16)
  ) {
    if (patchFlag & 8) {
      const propsToUpdate = instance.vnode.dynamicProps;
      for (let i = 0; i < propsToUpdate.length; i++) {
        let key = propsToUpdate[i];
        if (isEmitListener(instance.emitsOptions, key)) {
          continue;
        }
        const value = rawProps[key];
        if (options) {
          if (hasOwn(attrs, key)) {
            if (value !== attrs[key]) {
              attrs[key] = value;
              hasAttrsChanged = true;
            }
          } else {
            const camelizedKey = camelize(key);
            props[camelizedKey] = resolvePropValue(
              options,
              rawCurrentProps,
              camelizedKey,
              value,
              instance,
              false
            );
          }
        } else {
          if (value !== attrs[key]) {
            attrs[key] = value;
            hasAttrsChanged = true;
          }
        }
      }
    }
  } else {
    if (setFullProps(instance, rawProps, props, attrs)) {
      hasAttrsChanged = true;
    }
    let kebabKey;
    for (const key in rawCurrentProps) {
      if (!rawProps || // for camelCase
      !hasOwn(rawProps, key) && // it's possible the original props was passed in as kebab-case
      // and converted to camelCase (#955)
      ((kebabKey = hyphenate(key)) === key || !hasOwn(rawProps, kebabKey))) {
        if (options) {
          if (rawPrevProps && // for camelCase
          (rawPrevProps[key] !== void 0 || // for kebab-case
          rawPrevProps[kebabKey] !== void 0)) {
            props[key] = resolvePropValue(
              options,
              rawCurrentProps,
              key,
              void 0,
              instance,
              true
            );
          }
        } else {
          delete props[key];
        }
      }
    }
    if (attrs !== rawCurrentProps) {
      for (const key in attrs) {
        if (!rawProps || !hasOwn(rawProps, key) && true) {
          delete attrs[key];
          hasAttrsChanged = true;
        }
      }
    }
  }
  if (hasAttrsChanged) {
    trigger(instance.attrs, "set", "");
  }
}
function setFullProps(instance, rawProps, props, attrs) {
  const [options, needCastKeys] = instance.propsOptions;
  let hasAttrsChanged = false;
  let rawCastValues;
  if (rawProps) {
    for (let key in rawProps) {
      if (isReservedProp(key)) {
        continue;
      }
      const value = rawProps[key];
      let camelKey;
      if (options && hasOwn(options, camelKey = camelize(key))) {
        if (!needCastKeys || !needCastKeys.includes(camelKey)) {
          props[camelKey] = value;
        } else {
          (rawCastValues || (rawCastValues = {}))[camelKey] = value;
        }
      } else if (!isEmitListener(instance.emitsOptions, key)) {
        if (!(key in attrs) || value !== attrs[key]) {
          attrs[key] = value;
          hasAttrsChanged = true;
        }
      }
    }
  }
  if (needCastKeys) {
    const rawCurrentProps = /* @__PURE__ */ toRaw(props);
    const castValues = rawCastValues || EMPTY_OBJ;
    for (let i = 0; i < needCastKeys.length; i++) {
      const key = needCastKeys[i];
      props[key] = resolvePropValue(
        options,
        rawCurrentProps,
        key,
        castValues[key],
        instance,
        !hasOwn(castValues, key)
      );
    }
  }
  return hasAttrsChanged;
}
function resolvePropValue(options, props, key, value, instance, isAbsent) {
  const opt = options[key];
  if (opt != null) {
    const hasDefault = hasOwn(opt, "default");
    if (hasDefault && value === void 0) {
      const defaultValue = opt.default;
      if (opt.type !== Function && !opt.skipFactory && isFunction(defaultValue)) {
        const { propsDefaults } = instance;
        if (key in propsDefaults) {
          value = propsDefaults[key];
        } else {
          const reset = setCurrentInstance(instance);
          value = propsDefaults[key] = defaultValue.call(
            null,
            props
          );
          reset();
        }
      } else {
        value = defaultValue;
      }
      if (instance.ce) {
        instance.ce._setProp(key, value);
      }
    }
    if (opt[
      0
      /* shouldCast */
    ]) {
      if (isAbsent && !hasDefault) {
        value = false;
      } else if (opt[
        1
        /* shouldCastTrue */
      ] && (value === "" || value === hyphenate(key))) {
        value = true;
      }
    }
  }
  return value;
}
const mixinPropsCache = /* @__PURE__ */ new WeakMap();
function normalizePropsOptions(comp, appContext, asMixin = false) {
  const cache2 = asMixin ? mixinPropsCache : appContext.propsCache;
  const cached = cache2.get(comp);
  if (cached) {
    return cached;
  }
  const raw = comp.props;
  const normalized = {};
  const needCastKeys = [];
  let hasExtends = false;
  if (!isFunction(comp)) {
    const extendProps = (raw2) => {
      hasExtends = true;
      const [props, keys] = normalizePropsOptions(raw2, appContext, true);
      extend(normalized, props);
      if (keys) needCastKeys.push(...keys);
    };
    if (!asMixin && appContext.mixins.length) {
      appContext.mixins.forEach(extendProps);
    }
    if (comp.extends) {
      extendProps(comp.extends);
    }
    if (comp.mixins) {
      comp.mixins.forEach(extendProps);
    }
  }
  if (!raw && !hasExtends) {
    if (isObject(comp)) {
      cache2.set(comp, EMPTY_ARR);
    }
    return EMPTY_ARR;
  }
  if (isArray(raw)) {
    for (let i = 0; i < raw.length; i++) {
      const normalizedKey = camelize(raw[i]);
      if (validatePropName(normalizedKey)) {
        normalized[normalizedKey] = EMPTY_OBJ;
      }
    }
  } else if (raw) {
    for (const key in raw) {
      const normalizedKey = camelize(key);
      if (validatePropName(normalizedKey)) {
        const opt = raw[key];
        const prop = normalized[normalizedKey] = isArray(opt) || isFunction(opt) ? { type: opt } : extend({}, opt);
        const propType = prop.type;
        let shouldCast = false;
        let shouldCastTrue = true;
        if (isArray(propType)) {
          for (let index = 0; index < propType.length; ++index) {
            const type = propType[index];
            const typeName = isFunction(type) && type.name;
            if (typeName === "Boolean") {
              shouldCast = true;
              break;
            } else if (typeName === "String") {
              shouldCastTrue = false;
            }
          }
        } else {
          shouldCast = isFunction(propType) && propType.name === "Boolean";
        }
        prop[
          0
          /* shouldCast */
        ] = shouldCast;
        prop[
          1
          /* shouldCastTrue */
        ] = shouldCastTrue;
        if (shouldCast || hasOwn(prop, "default")) {
          needCastKeys.push(normalizedKey);
        }
      }
    }
  }
  const res = [normalized, needCastKeys];
  if (isObject(comp)) {
    cache2.set(comp, res);
  }
  return res;
}
function validatePropName(key) {
  if (key[0] !== "$" && !isReservedProp(key)) {
    return true;
  }
  return false;
}
const isInternalKey = (key) => key === "_" || key === "_ctx" || key === "$stable";
const normalizeSlotValue = (value) => isArray(value) ? value.map(normalizeVNode) : [normalizeVNode(value)];
const normalizeSlot = (key, rawSlot, ctx) => {
  if (rawSlot._n) {
    return rawSlot;
  }
  const normalized = withCtx((...args) => {
    if (false) ;
    return normalizeSlotValue(rawSlot(...args));
  }, ctx);
  normalized._c = false;
  return normalized;
};
const normalizeObjectSlots = (rawSlots, slots, instance) => {
  const ctx = rawSlots._ctx;
  for (const key in rawSlots) {
    if (isInternalKey(key)) continue;
    const value = rawSlots[key];
    if (isFunction(value)) {
      slots[key] = normalizeSlot(key, value, ctx);
    } else if (value != null) {
      const normalized = normalizeSlotValue(value);
      slots[key] = () => normalized;
    }
  }
};
const normalizeVNodeSlots = (instance, children) => {
  const normalized = normalizeSlotValue(children);
  instance.slots.default = () => normalized;
};
const assignSlots = (slots, children, optimized) => {
  for (const key in children) {
    if (optimized || !isInternalKey(key)) {
      slots[key] = children[key];
    }
  }
};
const initSlots = (instance, children, optimized) => {
  const slots = instance.slots = createInternalObject();
  if (instance.vnode.shapeFlag & 32) {
    const type = children._;
    if (type) {
      assignSlots(slots, children, optimized);
      if (optimized) {
        def(slots, "_", type, true);
      }
    } else {
      normalizeObjectSlots(children, slots);
    }
  } else if (children) {
    normalizeVNodeSlots(instance, children);
  }
};
const updateSlots = (instance, children, optimized) => {
  const { vnode, slots } = instance;
  let needDeletionCheck = true;
  let deletionComparisonTarget = EMPTY_OBJ;
  if (vnode.shapeFlag & 32) {
    const type = children._;
    if (type) {
      if (optimized && type === 1) {
        needDeletionCheck = false;
      } else {
        assignSlots(slots, children, optimized);
      }
    } else {
      needDeletionCheck = !children.$stable;
      normalizeObjectSlots(children, slots);
    }
    deletionComparisonTarget = children;
  } else if (children) {
    normalizeVNodeSlots(instance, children);
    deletionComparisonTarget = { default: 1 };
  }
  if (needDeletionCheck) {
    for (const key in slots) {
      if (!isInternalKey(key) && deletionComparisonTarget[key] == null) {
        delete slots[key];
      }
    }
  }
};
const queuePostRenderEffect = queueEffectWithSuspense;
function createRenderer(options) {
  return baseCreateRenderer(options);
}
function baseCreateRenderer(options, createHydrationFns) {
  const target = getGlobalThis();
  target.__VUE__ = true;
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    createComment: hostCreateComment,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    setScopeId: hostSetScopeId = NOOP,
    insertStaticContent: hostInsertStaticContent
  } = options;
  const patch = (n1, n2, container, anchor = null, parentComponent = null, parentSuspense = null, namespace = void 0, slotScopeIds = null, optimized = !!n2.dynamicChildren) => {
    if (n1 === n2) {
      return;
    }
    if (n1 && !isSameVNodeType(n1, n2)) {
      anchor = getNextHostNode(n1);
      unmount(n1, parentComponent, parentSuspense, true);
      n1 = null;
    }
    if (n2.patchFlag === -2) {
      optimized = false;
      n2.dynamicChildren = null;
    }
    if (n2.dynamicChildren && n1 && n1.dynamicChildren && n1.dynamicChildren.hasOnce) {
      if (n2.dynamicChildren === EMPTY_ARR) {
        n2.dynamicChildren = [];
      }
      n2.dynamicChildren.hasOnce = true;
    }
    const { type, ref: ref3, shapeFlag } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container, anchor);
        break;
      case Comment:
        processCommentNode(n1, n2, container, anchor);
        break;
      case Static:
        if (n1 == null) {
          mountStaticNode(n2, container, anchor, namespace);
        }
        break;
      case Fragment:
        processFragment(
          n1,
          n2,
          container,
          anchor,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized
        );
        break;
      default:
        if (shapeFlag & 1) {
          processElement(
            n1,
            n2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized
          );
        } else if (shapeFlag & 6) {
          processComponent(
            n1,
            n2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized
          );
        } else if (shapeFlag & 64) {
          type.process(
            n1,
            n2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized,
            internals
          );
        } else if (shapeFlag & 128) {
          type.process(
            n1,
            n2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized,
            internals
          );
        } else ;
    }
    if (ref3 != null && parentComponent) {
      setRef(ref3, n1 && n1.ref, parentSuspense, n2 || n1, !n2);
    } else if (ref3 == null && n1 && n1.ref != null) {
      setRef(n1.ref, null, parentSuspense, n1, true);
    }
  };
  const processText = (n1, n2, container, anchor) => {
    if (n1 == null) {
      hostInsert(
        n2.el = hostCreateText(n2.children),
        container,
        anchor
      );
    } else {
      const el = n2.el = n1.el;
      if (n2.children !== n1.children) {
        hostSetText(el, n2.children);
      }
    }
  };
  const processCommentNode = (n1, n2, container, anchor) => {
    if (n1 == null) {
      hostInsert(
        n2.el = hostCreateComment(n2.children || ""),
        container,
        anchor
      );
    } else {
      n2.el = n1.el;
    }
  };
  const mountStaticNode = (n2, container, anchor, namespace) => {
    [n2.el, n2.anchor] = hostInsertStaticContent(
      n2.children,
      container,
      anchor,
      namespace,
      n2.el,
      n2.anchor
    );
  };
  const moveStaticNode = ({ el, anchor }, container, nextSibling) => {
    let next;
    while (el && el !== anchor) {
      next = hostNextSibling(el);
      hostInsert(el, container, nextSibling);
      el = next;
    }
    hostInsert(anchor, container, nextSibling);
  };
  const removeStaticNode = ({ el, anchor }) => {
    let next;
    while (el && el !== anchor) {
      next = hostNextSibling(el);
      hostRemove(el);
      el = next;
    }
    hostRemove(anchor);
  };
  const processElement = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
    if (n2.type === "svg") {
      namespace = "svg";
    } else if (n2.type === "math") {
      namespace = "mathml";
    }
    if (n1 == null) {
      mountElement(
        n2,
        container,
        anchor,
        parentComponent,
        parentSuspense,
        namespace,
        slotScopeIds,
        optimized
      );
    } else {
      const customElement = n1.el && n1.el._isVueCE ? n1.el : null;
      try {
        if (customElement) {
          customElement._beginPatch();
        }
        patchElement(
          n1,
          n2,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized
        );
      } finally {
        if (customElement) {
          customElement._endPatch();
        }
      }
    }
  };
  const mountElement = (vnode, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
    let el;
    let vnodeHook;
    const { props, shapeFlag, transition, dirs } = vnode;
    el = vnode.el = hostCreateElement(
      vnode.type,
      namespace,
      props && props.is,
      props
    );
    if (shapeFlag & 8) {
      hostSetElementText(el, vnode.children);
    } else if (shapeFlag & 16) {
      mountChildren(
        vnode.children,
        el,
        null,
        parentComponent,
        parentSuspense,
        resolveChildrenNamespace(vnode, namespace),
        slotScopeIds,
        optimized
      );
    }
    if (dirs) {
      invokeDirectiveHook(vnode, null, parentComponent, "created");
    }
    setScopeId(el, vnode, vnode.scopeId, slotScopeIds, parentComponent);
    if (props) {
      for (const key in props) {
        if (key !== "value" && !isReservedProp(key)) {
          hostPatchProp(el, key, null, props[key], namespace, parentComponent);
        }
      }
      if ("value" in props) {
        hostPatchProp(el, "value", null, props.value, namespace);
      }
      if (vnodeHook = props.onVnodeBeforeMount) {
        invokeVNodeHook(vnodeHook, parentComponent, vnode);
      }
    }
    if (dirs) {
      invokeDirectiveHook(vnode, null, parentComponent, "beforeMount");
    }
    const needCallTransitionHooks = needTransition(parentSuspense, transition);
    if (needCallTransitionHooks) {
      transition.beforeEnter(el);
    }
    hostInsert(el, container, anchor);
    if ((vnodeHook = props && props.onVnodeMounted) || needCallTransitionHooks || dirs) {
      queuePostRenderEffect(() => {
        try {
          vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode);
          needCallTransitionHooks && transition.enter(el);
          dirs && invokeDirectiveHook(vnode, null, parentComponent, "mounted");
        } finally {
        }
      }, parentSuspense);
    }
  };
  const setScopeId = (el, vnode, scopeId, slotScopeIds, parentComponent) => {
    if (scopeId) {
      hostSetScopeId(el, scopeId);
    }
    if (slotScopeIds) {
      for (let i = 0; i < slotScopeIds.length; i++) {
        hostSetScopeId(el, slotScopeIds[i]);
      }
    }
    if (parentComponent) {
      let subTree = parentComponent.subTree;
      if (vnode === subTree || isSuspense(subTree.type) && (subTree.ssContent === vnode || subTree.ssFallback === vnode)) {
        const parentVNode = parentComponent.vnode;
        setScopeId(
          el,
          parentVNode,
          parentVNode.scopeId,
          parentVNode.slotScopeIds,
          parentComponent.parent
        );
      }
    }
  };
  const mountChildren = (children, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized, start = 0) => {
    for (let i = start; i < children.length; i++) {
      const child = children[i] = optimized ? cloneIfMounted(children[i]) : normalizeVNode(children[i]);
      patch(
        null,
        child,
        container,
        anchor,
        parentComponent,
        parentSuspense,
        namespace,
        slotScopeIds,
        optimized
      );
    }
  };
  const patchElement = (n1, n2, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
    const el = n2.el = n1.el;
    let { patchFlag, dynamicChildren, dirs } = n2;
    patchFlag |= n1.patchFlag & 16;
    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;
    let vnodeHook;
    parentComponent && toggleRecurse(parentComponent, false);
    if (vnodeHook = newProps.onVnodeBeforeUpdate) {
      invokeVNodeHook(vnodeHook, parentComponent, n2, n1);
    }
    if (dirs) {
      invokeDirectiveHook(n2, n1, parentComponent, "beforeUpdate");
    }
    parentComponent && toggleRecurse(parentComponent, true);
    if (
      // #6385 the old vnode may be a user-wrapped non-isomorphic block
      // Force full diff when block metadata is unstable.
      dynamicChildren && (!n1.dynamicChildren || n1.dynamicChildren.length !== dynamicChildren.length)
    ) {
      patchFlag = 0;
      optimized = false;
      dynamicChildren = null;
    }
    if (oldProps.innerHTML && newProps.innerHTML == null || oldProps.textContent && newProps.textContent == null) {
      hostSetElementText(el, "");
    }
    if (dynamicChildren) {
      patchBlockChildren(
        n1.dynamicChildren,
        dynamicChildren,
        el,
        parentComponent,
        parentSuspense,
        resolveChildrenNamespace(n2, namespace),
        slotScopeIds
      );
    } else if (!optimized) {
      patchChildren(
        n1,
        n2,
        el,
        null,
        parentComponent,
        parentSuspense,
        resolveChildrenNamespace(n2, namespace),
        slotScopeIds,
        false
      );
    }
    if (patchFlag > 0) {
      if (patchFlag & 16) {
        patchProps(el, oldProps, newProps, parentComponent, namespace);
      } else {
        if (patchFlag & 2) {
          if (oldProps.class !== newProps.class) {
            hostPatchProp(el, "class", null, newProps.class, namespace);
          }
        }
        if (patchFlag & 4) {
          hostPatchProp(el, "style", oldProps.style, newProps.style, namespace);
        }
        if (patchFlag & 8) {
          const propsToUpdate = n2.dynamicProps;
          for (let i = 0; i < propsToUpdate.length; i++) {
            const key = propsToUpdate[i];
            const prev = oldProps[key];
            const next = newProps[key];
            if (next !== prev || key === "value") {
              hostPatchProp(el, key, prev, next, namespace, parentComponent);
            }
          }
        }
      }
      if (patchFlag & 1) {
        if (n1.children !== n2.children) {
          hostSetElementText(el, n2.children);
        }
      }
    } else if (!optimized && dynamicChildren == null) {
      patchProps(el, oldProps, newProps, parentComponent, namespace);
    }
    if ((vnodeHook = newProps.onVnodeUpdated) || dirs) {
      queuePostRenderEffect(() => {
        vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, n2, n1);
        dirs && invokeDirectiveHook(n2, n1, parentComponent, "updated");
      }, parentSuspense);
    }
  };
  const patchBlockChildren = (oldChildren, newChildren, fallbackContainer, parentComponent, parentSuspense, namespace, slotScopeIds) => {
    for (let i = 0; i < newChildren.length; i++) {
      const oldVNode = oldChildren[i];
      const newVNode = newChildren[i];
      const container = (
        // oldVNode may be an errored async setup() component inside Suspense
        // which will not have a mounted element
        oldVNode.el && // - In the case of a Fragment, we need to provide the actual parent
        // of the Fragment itself so it can move its children.
        (oldVNode.type === Fragment || // - In the case of different nodes, there is going to be a replacement
        // which also requires the correct parent container
        !isSameVNodeType(oldVNode, newVNode) || // - In the case of a component, it could contain anything.
        oldVNode.shapeFlag & (6 | 64 | 128)) ? hostParentNode(oldVNode.el) : (
          // In other cases, the parent container is not actually used so we
          // just pass the block element here to avoid a DOM parentNode call.
          fallbackContainer
        )
      );
      patch(
        oldVNode,
        newVNode,
        container,
        null,
        parentComponent,
        parentSuspense,
        namespace,
        slotScopeIds,
        true
      );
    }
  };
  const patchProps = (el, oldProps, newProps, parentComponent, namespace) => {
    if (oldProps !== newProps) {
      if (oldProps !== EMPTY_OBJ) {
        for (const key in oldProps) {
          if (!isReservedProp(key) && !(key in newProps)) {
            hostPatchProp(
              el,
              key,
              oldProps[key],
              null,
              namespace,
              parentComponent
            );
          }
        }
      }
      for (const key in newProps) {
        if (isReservedProp(key)) continue;
        const next = newProps[key];
        const prev = oldProps[key];
        if (next !== prev && key !== "value") {
          hostPatchProp(el, key, prev, next, namespace, parentComponent);
        }
      }
      if ("value" in newProps) {
        hostPatchProp(el, "value", oldProps.value, newProps.value, namespace);
      }
    }
  };
  const processFragment = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
    const fragmentStartAnchor = n2.el = n1 ? n1.el : hostCreateText("");
    const fragmentEndAnchor = n2.anchor = n1 ? n1.anchor : hostCreateText("");
    let { patchFlag, dynamicChildren, slotScopeIds: fragmentSlotScopeIds } = n2;
    if (fragmentSlotScopeIds) {
      slotScopeIds = slotScopeIds ? slotScopeIds.concat(fragmentSlotScopeIds) : fragmentSlotScopeIds;
    }
    if (n1 == null) {
      hostInsert(fragmentStartAnchor, container, anchor);
      hostInsert(fragmentEndAnchor, container, anchor);
      mountChildren(
        // #10007
        // such fragment like `<></>` will be compiled into
        // a fragment which doesn't have a children.
        // In this case fallback to an empty array
        n2.children || [],
        container,
        fragmentEndAnchor,
        parentComponent,
        parentSuspense,
        namespace,
        slotScopeIds,
        optimized
      );
    } else {
      if (patchFlag > 0 && patchFlag & 64 && dynamicChildren && // #2715 the previous fragment could've been a BAILed one as a result
      // of renderSlot() with no valid children
      n1.dynamicChildren && n1.dynamicChildren.length === dynamicChildren.length) {
        patchBlockChildren(
          n1.dynamicChildren,
          dynamicChildren,
          container,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds
        );
        if (
          // #2080 if the stable fragment has a key, it's a <template v-for> that may
          //  get moved around. Make sure all root level vnodes inherit el.
          // #2134 or if it's a component root, it may also get moved around
          // as the component is being moved.
          n2.key != null || parentComponent && n2 === parentComponent.subTree
        ) {
          traverseStaticChildren(
            n1,
            n2,
            true
            /* shallow */
          );
        }
      } else {
        patchChildren(
          n1,
          n2,
          container,
          fragmentEndAnchor,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized
        );
      }
    }
  };
  const processComponent = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
    n2.slotScopeIds = slotScopeIds;
    if (n1 == null) {
      if (n2.shapeFlag & 512) {
        parentComponent.ctx.activate(
          n2,
          container,
          anchor,
          namespace,
          optimized
        );
      } else {
        mountComponent(
          n2,
          container,
          anchor,
          parentComponent,
          parentSuspense,
          namespace,
          optimized
        );
      }
    } else {
      updateComponent(n1, n2, optimized);
    }
  };
  const mountComponent = (initialVNode, container, anchor, parentComponent, parentSuspense, namespace, optimized) => {
    const instance = initialVNode.component = createComponentInstance(
      initialVNode,
      parentComponent,
      parentSuspense
    );
    if (isKeepAlive(initialVNode)) {
      instance.ctx.renderer = internals;
    }
    {
      setupComponent(instance, false, optimized);
    }
    if (instance.asyncDep) {
      parentSuspense && parentSuspense.registerDep(instance, setupRenderEffect, optimized);
      if (!initialVNode.el) {
        const placeholder = instance.subTree = createVNode(Comment);
        processCommentNode(null, placeholder, container, anchor);
        initialVNode.placeholder = placeholder.el;
      }
    } else {
      setupRenderEffect(
        instance,
        initialVNode,
        container,
        anchor,
        parentSuspense,
        namespace,
        optimized
      );
    }
  };
  const updateComponent = (n1, n2, optimized) => {
    const instance = n2.component = n1.component;
    if (shouldUpdateComponent(n1, n2, optimized)) {
      if (instance.asyncDep && !instance.asyncResolved) {
        n2.el = n1.el;
        updateComponentPreRender(instance, n2, optimized);
        return;
      } else {
        instance.next = n2;
        instance.update();
      }
    } else {
      n2.el = n1.el;
      instance.vnode = n2;
    }
  };
  const setupRenderEffect = (instance, initialVNode, container, anchor, parentSuspense, namespace, optimized) => {
    const componentUpdateFn = () => {
      if (!instance.isMounted) {
        let vnodeHook;
        const { el, props } = initialVNode;
        const { bm, m, parent, root, type } = instance;
        const isAsyncWrapperVNode = isAsyncWrapper(initialVNode);
        toggleRecurse(instance, false);
        if (bm) {
          invokeArrayFns(bm);
        }
        if (!isAsyncWrapperVNode && (vnodeHook = props && props.onVnodeBeforeMount)) {
          invokeVNodeHook(vnodeHook, parent, initialVNode);
        }
        toggleRecurse(instance, true);
        {
          if (root.ce && root.ce._hasShadowRoot()) {
            root.ce._injectChildStyle(
              type,
              instance.parent ? instance.parent.type : void 0
            );
          }
          const subTree = instance.subTree = renderComponentRoot(instance);
          patch(
            null,
            subTree,
            container,
            anchor,
            instance,
            parentSuspense,
            namespace
          );
          initialVNode.el = subTree.el;
        }
        if (m) {
          queuePostRenderEffect(m, parentSuspense);
        }
        if (!isAsyncWrapperVNode && (vnodeHook = props && props.onVnodeMounted)) {
          const scopedInitialVNode = initialVNode;
          queuePostRenderEffect(
            () => invokeVNodeHook(vnodeHook, parent, scopedInitialVNode),
            parentSuspense
          );
        }
        if (initialVNode.shapeFlag & 256 || parent && isAsyncWrapper(parent.vnode) && parent.vnode.shapeFlag & 256) {
          instance.a && queuePostRenderEffect(instance.a, parentSuspense);
        }
        instance.isMounted = true;
        initialVNode = container = anchor = null;
      } else {
        let { next, bu, u, parent, vnode } = instance;
        {
          const nonHydratedAsyncRoot = locateNonHydratedAsyncRoot(instance);
          if (nonHydratedAsyncRoot) {
            if (next) {
              next.el = vnode.el;
              updateComponentPreRender(instance, next, optimized);
            }
            nonHydratedAsyncRoot.asyncDep.then(() => {
              queuePostRenderEffect(() => {
                if (!instance.isUnmounted) update();
              }, parentSuspense);
            });
            return;
          }
        }
        let originNext = next;
        let vnodeHook;
        toggleRecurse(instance, false);
        if (next) {
          next.el = vnode.el;
          updateComponentPreRender(instance, next, optimized);
        } else {
          next = vnode;
        }
        if (bu) {
          invokeArrayFns(bu);
        }
        if (vnodeHook = next.props && next.props.onVnodeBeforeUpdate) {
          invokeVNodeHook(vnodeHook, parent, next, vnode);
        }
        toggleRecurse(instance, true);
        const nextTree = renderComponentRoot(instance);
        const prevTree = instance.subTree;
        instance.subTree = nextTree;
        patch(
          prevTree,
          nextTree,
          // parent may have changed if it's in a teleport
          hostParentNode(prevTree.el),
          // anchor may have changed if it's in a fragment
          getNextHostNode(prevTree),
          instance,
          parentSuspense,
          namespace
        );
        next.el = nextTree.el;
        if (originNext === null) {
          updateHOCHostEl(instance, nextTree.el);
        }
        if (u) {
          queuePostRenderEffect(u, parentSuspense);
        }
        if (vnodeHook = next.props && next.props.onVnodeUpdated) {
          queuePostRenderEffect(
            () => invokeVNodeHook(vnodeHook, parent, next, vnode),
            parentSuspense
          );
        }
      }
    };
    instance.scope.on();
    const effect2 = instance.effect = new ReactiveEffect(componentUpdateFn);
    instance.scope.off();
    const update = instance.update = effect2.run.bind(effect2);
    const job = instance.job = effect2.runIfDirty.bind(effect2);
    job.i = instance;
    job.id = instance.uid;
    effect2.scheduler = () => queueJob(job);
    toggleRecurse(instance, true);
    update();
  };
  const updateComponentPreRender = (instance, nextVNode, optimized) => {
    nextVNode.component = instance;
    const prevProps = instance.vnode.props;
    instance.vnode = nextVNode;
    instance.next = null;
    updateProps(instance, nextVNode.props, prevProps, optimized);
    updateSlots(instance, nextVNode.children, optimized);
    pauseTracking();
    flushPreFlushCbs(instance);
    resetTracking();
  };
  const patchChildren = (n1, n2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized = false) => {
    const c1 = n1 && n1.children;
    const prevShapeFlag = n1 ? n1.shapeFlag : 0;
    const c2 = n2.children;
    const { patchFlag, shapeFlag } = n2;
    if (patchFlag > 0) {
      if (patchFlag & 128) {
        patchKeyedChildren(
          c1,
          c2,
          container,
          anchor,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized
        );
        return;
      } else if (patchFlag & 256) {
        patchUnkeyedChildren(
          c1,
          c2,
          container,
          anchor,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized
        );
        return;
      }
    }
    if (shapeFlag & 8) {
      if (prevShapeFlag & 16) {
        unmountChildren(c1, parentComponent, parentSuspense);
      }
      if (c2 !== c1) {
        hostSetElementText(container, c2);
      }
    } else {
      if (prevShapeFlag & 16) {
        if (shapeFlag & 16) {
          patchKeyedChildren(
            c1,
            c2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized
          );
        } else {
          unmountChildren(c1, parentComponent, parentSuspense, true);
        }
      } else {
        if (prevShapeFlag & 8) {
          hostSetElementText(container, "");
        }
        if (shapeFlag & 16) {
          mountChildren(
            c2,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized
          );
        }
      }
    }
  };
  const patchUnkeyedChildren = (c1, c2, container, anchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
    c1 = c1 || EMPTY_ARR;
    c2 = c2 || EMPTY_ARR;
    const oldLength = c1.length;
    const newLength = c2.length;
    const commonLength = Math.min(oldLength, newLength);
    let i;
    for (i = 0; i < commonLength; i++) {
      const nextChild = c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]);
      patch(
        c1[i],
        nextChild,
        container,
        null,
        parentComponent,
        parentSuspense,
        namespace,
        slotScopeIds,
        optimized
      );
    }
    if (oldLength > newLength) {
      unmountChildren(
        c1,
        parentComponent,
        parentSuspense,
        true,
        false,
        commonLength
      );
    } else {
      mountChildren(
        c2,
        container,
        anchor,
        parentComponent,
        parentSuspense,
        namespace,
        slotScopeIds,
        optimized,
        commonLength
      );
    }
  };
  const patchKeyedChildren = (c1, c2, container, parentAnchor, parentComponent, parentSuspense, namespace, slotScopeIds, optimized) => {
    let i = 0;
    const l2 = c2.length;
    let e1 = c1.length - 1;
    let e2 = l2 - 1;
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]);
      if (isSameVNodeType(n1, n2)) {
        patch(
          n1,
          n2,
          container,
          null,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized
        );
      } else {
        break;
      }
      i++;
    }
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2] = optimized ? cloneIfMounted(c2[e2]) : normalizeVNode(c2[e2]);
      if (isSameVNodeType(n1, n2)) {
        patch(
          n1,
          n2,
          container,
          null,
          parentComponent,
          parentSuspense,
          namespace,
          slotScopeIds,
          optimized
        );
      } else {
        break;
      }
      e1--;
      e2--;
    }
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1;
        const anchor = nextPos < l2 ? c2[nextPos].el : parentAnchor;
        while (i <= e2) {
          patch(
            null,
            c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]),
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized
          );
          i++;
        }
      }
    } else if (i > e2) {
      while (i <= e1) {
        unmount(c1[i], parentComponent, parentSuspense, true);
        i++;
      }
    } else {
      const s1 = i;
      const s2 = i;
      const keyToNewIndexMap = /* @__PURE__ */ new Map();
      for (i = s2; i <= e2; i++) {
        const nextChild = c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]);
        if (nextChild.key != null) {
          keyToNewIndexMap.set(nextChild.key, i);
        }
      }
      let j;
      let patched = 0;
      const toBePatched = e2 - s2 + 1;
      let moved = false;
      let maxNewIndexSoFar = 0;
      const newIndexToOldIndexMap = new Array(toBePatched);
      for (i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0;
      for (i = s1; i <= e1; i++) {
        const prevChild = c1[i];
        if (patched >= toBePatched) {
          unmount(prevChild, parentComponent, parentSuspense, true);
          continue;
        }
        let newIndex;
        if (prevChild.key != null) {
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          for (j = s2; j <= e2; j++) {
            if (newIndexToOldIndexMap[j - s2] === 0 && isSameVNodeType(prevChild, c2[j])) {
              newIndex = j;
              break;
            }
          }
        }
        if (newIndex === void 0) {
          unmount(prevChild, parentComponent, parentSuspense, true);
        } else {
          newIndexToOldIndexMap[newIndex - s2] = i + 1;
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }
          patch(
            prevChild,
            c2[newIndex],
            container,
            null,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized
          );
          patched++;
        }
      }
      const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : EMPTY_ARR;
      j = increasingNewIndexSequence.length - 1;
      for (i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = s2 + i;
        const nextChild = c2[nextIndex];
        const anchorVNode = c2[nextIndex + 1];
        const anchor = nextIndex + 1 < l2 ? (
          // #13559, #14173 fallback to el placeholder for unresolved async component
          anchorVNode.el || resolveAsyncComponentPlaceholder(anchorVNode)
        ) : parentAnchor;
        if (newIndexToOldIndexMap[i] === 0) {
          patch(
            null,
            nextChild,
            container,
            anchor,
            parentComponent,
            parentSuspense,
            namespace,
            slotScopeIds,
            optimized
          );
        } else if (moved) {
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            move(nextChild, container, anchor, 2);
          } else {
            j--;
          }
        }
      }
    }
  };
  const move = (vnode, container, anchor, moveType, parentSuspense = null) => {
    const { el, type, transition, children, shapeFlag } = vnode;
    if (shapeFlag & 6) {
      move(vnode.component.subTree, container, anchor, moveType);
      return;
    }
    if (shapeFlag & 128) {
      vnode.suspense.move(container, anchor, moveType);
      return;
    }
    if (shapeFlag & 64) {
      type.move(vnode, container, anchor, internals);
      return;
    }
    if (type === Fragment) {
      hostInsert(el, container, anchor);
      for (let i = 0; i < children.length; i++) {
        move(children[i], container, anchor, moveType);
      }
      hostInsert(vnode.anchor, container, anchor);
      return;
    }
    if (type === Static) {
      moveStaticNode(vnode, container, anchor);
      return;
    }
    const needTransition2 = moveType !== 2 && shapeFlag & 1 && transition;
    if (needTransition2) {
      if (moveType === 0) {
        if (transition.persisted && !el[leaveCbKey]) {
          hostInsert(el, container, anchor);
        } else {
          transition.beforeEnter(el);
          hostInsert(el, container, anchor);
          queuePostRenderEffect(() => transition.enter(el), parentSuspense);
        }
      } else {
        const { leave, delayLeave, afterLeave } = transition;
        const remove22 = () => {
          if (vnode.ctx.isUnmounted) {
            hostRemove(el);
          } else {
            hostInsert(el, container, anchor);
          }
        };
        const performLeave = () => {
          const wasLeaving = el._isLeaving || !!el[leaveCbKey];
          if (el._isLeaving) {
            el[leaveCbKey](
              true
              /* cancelled */
            );
          }
          if (transition.persisted && !wasLeaving) {
            remove22();
          } else {
            leave(el, () => {
              remove22();
              afterLeave && afterLeave();
            });
          }
        };
        if (delayLeave) {
          delayLeave(el, remove22, performLeave);
        } else {
          performLeave();
        }
      }
    } else {
      hostInsert(el, container, anchor);
    }
  };
  const unmount = (vnode, parentComponent, parentSuspense, doRemove = false, optimized = false) => {
    const {
      type,
      props,
      ref: ref3,
      children,
      dynamicChildren,
      shapeFlag,
      patchFlag,
      dirs,
      cacheIndex,
      memo
    } = vnode;
    if (patchFlag === -2 || dynamicChildren && dynamicChildren.hasOnce) {
      optimized = false;
    }
    if (ref3 != null) {
      pauseTracking();
      setRef(ref3, null, parentSuspense, vnode, true);
      resetTracking();
    }
    if (cacheIndex != null && (!vnode.ctx || vnode.ctx === parentComponent)) {
      parentComponent.renderCache[cacheIndex] = void 0;
    }
    if (shapeFlag & 256) {
      parentComponent.ctx.deactivate(vnode);
      return;
    }
    const shouldInvokeDirs = shapeFlag & 1 && dirs;
    const shouldInvokeVnodeHook = !isAsyncWrapper(vnode);
    let vnodeHook;
    if (shouldInvokeVnodeHook && (vnodeHook = props && props.onVnodeBeforeUnmount)) {
      invokeVNodeHook(vnodeHook, parentComponent, vnode);
    }
    if (shapeFlag & 6) {
      unmountComponent(vnode.component, parentSuspense, doRemove);
    } else {
      if (shapeFlag & 128) {
        vnode.suspense.unmount(parentSuspense, doRemove);
        return;
      }
      if (shouldInvokeDirs) {
        invokeDirectiveHook(vnode, null, parentComponent, "beforeUnmount");
      }
      if (shapeFlag & 64) {
        vnode.type.remove(
          vnode,
          parentComponent,
          parentSuspense,
          internals,
          doRemove
        );
      } else if (dynamicChildren && // #5154
      // when v-once is used inside a block, setBlockTracking(-1) marks the
      // parent block with hasOnce: true
      // so that it doesn't take the fast path during unmount - otherwise
      // components nested in v-once are never unmounted.
      !dynamicChildren.hasOnce && // #1153: fast path should not be taken for non-stable (v-for) fragments
      (type !== Fragment || patchFlag > 0 && patchFlag & 64)) {
        unmountChildren(
          dynamicChildren,
          parentComponent,
          parentSuspense,
          false,
          true
        );
      } else if (type === Fragment && patchFlag & (128 | 256) || !optimized && shapeFlag & 16) {
        unmountChildren(children, parentComponent, parentSuspense);
      }
      if (doRemove) {
        remove2(vnode);
      }
    }
    const shouldInvalidateMemo = memo != null && cacheIndex == null;
    if (shouldInvokeVnodeHook && (vnodeHook = props && props.onVnodeUnmounted) || shouldInvokeDirs || shouldInvalidateMemo) {
      queuePostRenderEffect(() => {
        vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode);
        shouldInvokeDirs && invokeDirectiveHook(vnode, null, parentComponent, "unmounted");
        if (shouldInvalidateMemo) {
          vnode.el = null;
        }
      }, parentSuspense);
    }
  };
  const remove2 = (vnode) => {
    const { type, el, anchor, transition } = vnode;
    if (type === Fragment) {
      {
        removeFragment(el, anchor);
      }
      return;
    }
    if (type === Static) {
      removeStaticNode(vnode);
      if (transition && !transition.persisted && transition.afterLeave) {
        transition.afterLeave();
      }
      return;
    }
    const performRemove = () => {
      hostRemove(el);
      if (transition && !transition.persisted && transition.afterLeave) {
        transition.afterLeave();
      }
    };
    if (vnode.shapeFlag & 1 && transition && !transition.persisted) {
      const { leave, delayLeave } = transition;
      const performLeave = () => leave(el, performRemove);
      if (delayLeave) {
        delayLeave(vnode.el, performRemove, performLeave);
      } else {
        performLeave();
      }
    } else {
      performRemove();
    }
  };
  const removeFragment = (cur, end) => {
    let next;
    while (cur !== end) {
      next = hostNextSibling(cur);
      hostRemove(cur);
      cur = next;
    }
    hostRemove(end);
  };
  const unmountComponent = (instance, parentSuspense, doRemove) => {
    const { bum, scope, job, subTree, um, m, a } = instance;
    invalidateMount(m);
    invalidateMount(a);
    if (bum) {
      invokeArrayFns(bum);
    }
    scope.stop();
    if (job) {
      job.flags |= 8;
      unmount(subTree, instance, parentSuspense, doRemove);
    } else if (instance.vnode.el && subTree) {
      subTree.transition = instance.vnode.transition;
      unmount(subTree, instance, parentSuspense, doRemove);
    }
    if (um) {
      queuePostRenderEffect(um, parentSuspense);
    }
    queuePostRenderEffect(() => {
      instance.isUnmounted = true;
    }, parentSuspense);
  };
  const unmountChildren = (children, parentComponent, parentSuspense, doRemove = false, optimized = false, start = 0) => {
    for (let i = start; i < children.length; i++) {
      unmount(children[i], parentComponent, parentSuspense, doRemove, optimized);
    }
  };
  const getNextHostNode = (vnode) => {
    if (vnode.shapeFlag & 6) {
      return getNextHostNode(vnode.component.subTree);
    }
    if (vnode.shapeFlag & 128) {
      return vnode.suspense.next();
    }
    const el = hostNextSibling(vnode.anchor || vnode.el);
    const teleportEnd = el && el[TeleportEndKey];
    return teleportEnd ? hostNextSibling(teleportEnd) : el;
  };
  let isFlushing = false;
  const render = (vnode, container, namespace) => {
    let instance;
    if (vnode == null) {
      if (container._vnode) {
        unmount(container._vnode, null, null, true);
        instance = container._vnode.component;
      }
    } else {
      patch(
        container._vnode || null,
        vnode,
        container,
        null,
        null,
        null,
        namespace
      );
    }
    container._vnode = vnode;
    if (!isFlushing) {
      isFlushing = true;
      flushPreFlushCbs(instance);
      flushPostFlushCbs();
      isFlushing = false;
    }
  };
  const internals = {
    p: patch,
    um: unmount,
    m: move,
    r: remove2,
    mt: mountComponent,
    mc: mountChildren,
    pc: patchChildren,
    pbc: patchBlockChildren,
    n: getNextHostNode,
    o: options
  };
  let hydrate;
  return {
    render,
    hydrate,
    createApp: createAppAPI(render)
  };
}
function resolveChildrenNamespace({ type, props }, currentNamespace) {
  return currentNamespace === "svg" && type === "foreignObject" || currentNamespace === "mathml" && type === "annotation-xml" && props && props.encoding && props.encoding.includes("html") ? void 0 : currentNamespace;
}
function toggleRecurse({ effect: effect2, job }, allowed) {
  if (allowed) {
    effect2.flags |= 32;
    job.flags |= 4;
  } else {
    effect2.flags &= -33;
    job.flags &= -5;
  }
}
function needTransition(parentSuspense, transition) {
  return (!parentSuspense || parentSuspense && !parentSuspense.pendingBranch) && transition && !transition.persisted;
}
function traverseStaticChildren(n1, n2, shallow = false) {
  const ch1 = n1.children;
  const ch2 = n2.children;
  if (isArray(ch1) && isArray(ch2)) {
    for (let i = 0; i < ch1.length; i++) {
      const c1 = ch1[i];
      let c2 = ch2[i];
      if (c2.shapeFlag & 1 && !c2.dynamicChildren) {
        if (c2.patchFlag <= 0 || c2.patchFlag === 32) {
          c2 = ch2[i] = cloneIfMounted(ch2[i]);
          c2.el = c1.el;
        }
        if (!shallow && c2.patchFlag !== -2)
          traverseStaticChildren(c1, c2);
      }
      if (c2.type === Text) {
        if (c2.patchFlag === -1) {
          c2 = ch2[i] = cloneIfMounted(c2);
        }
        c2.el = c1.el;
      }
      if (c2.type === Comment && !c2.el) {
        c2.el = c1.el;
      }
    }
  }
}
function getSequence(arr) {
  const p2 = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p2[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = u + v >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p2[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p2[v];
  }
  return result;
}
function locateNonHydratedAsyncRoot(instance) {
  const subComponent = instance.subTree.component;
  if (subComponent) {
    if (subComponent.asyncDep && !subComponent.asyncResolved) {
      return subComponent;
    } else {
      return locateNonHydratedAsyncRoot(subComponent);
    }
  }
}
function invalidateMount(hooks) {
  if (hooks) {
    for (let i = 0; i < hooks.length; i++)
      hooks[i].flags |= 8;
  }
}
function resolveAsyncComponentPlaceholder(anchorVnode) {
  if (anchorVnode.placeholder) {
    return anchorVnode.placeholder;
  }
  const instance = anchorVnode.component;
  if (instance) {
    return resolveAsyncComponentPlaceholder(instance.subTree);
  }
  return null;
}
const isSuspense = (type) => type.__isSuspense;
function queueEffectWithSuspense(fn, suspense) {
  if (suspense && suspense.pendingBranch) {
    if (isArray(fn)) {
      suspense.effects.push(...fn);
    } else {
      suspense.effects.push(fn);
    }
  } else {
    queuePostFlushCb(fn);
  }
}
const Fragment = /* @__PURE__ */ Symbol.for("v-fgt");
const Text = /* @__PURE__ */ Symbol.for("v-txt");
const Comment = /* @__PURE__ */ Symbol.for("v-cmt");
const Static = /* @__PURE__ */ Symbol.for("v-stc");
const blockStack = [];
let currentBlock = null;
function openBlock(disableTracking = false) {
  blockStack.push(currentBlock = disableTracking ? null : []);
}
function closeBlock() {
  blockStack.pop();
  currentBlock = blockStack[blockStack.length - 1] || null;
}
let isBlockTreeEnabled = 1;
function setBlockTracking(value, inVOnce = false) {
  isBlockTreeEnabled += value;
  if (value < 0 && currentBlock && inVOnce) {
    currentBlock.hasOnce = true;
  }
}
function setupBlock(vnode) {
  vnode.dynamicChildren = isBlockTreeEnabled > 0 ? currentBlock || EMPTY_ARR : null;
  closeBlock();
  if (isBlockTreeEnabled > 0 && currentBlock) {
    currentBlock.push(vnode);
  }
  return vnode;
}
function createElementBlock(type, props, children, patchFlag, dynamicProps, shapeFlag) {
  return setupBlock(
    createBaseVNode(
      type,
      props,
      children,
      patchFlag,
      dynamicProps,
      shapeFlag,
      true
    )
  );
}
function createBlock(type, props, children, patchFlag, dynamicProps) {
  return setupBlock(
    createVNode(
      type,
      props,
      children,
      patchFlag,
      dynamicProps,
      true
    )
  );
}
function isVNode(value) {
  return value ? value.__v_isVNode === true : false;
}
function isSameVNodeType(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}
const normalizeKey = ({ key }) => key != null ? key : null;
const normalizeRef = ({
  ref: ref3,
  ref_key,
  ref_for
}) => {
  if (typeof ref3 === "number") {
    ref3 = "" + ref3;
  }
  return ref3 != null ? isString(ref3) || /* @__PURE__ */ isRef(ref3) || isFunction(ref3) ? { i: currentRenderingInstance, r: ref3, k: ref_key, f: !!ref_for } : ref3 : null;
};
function createBaseVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, shapeFlag = type === Fragment ? 0 : 1, isBlockNode = false, needFullChildrenNormalization = false) {
  const vnode = {
    __v_isVNode: true,
    __v_skip: true,
    type,
    props,
    key: props && normalizeKey(props),
    ref: props && normalizeRef(props),
    scopeId: currentScopeId,
    slotScopeIds: null,
    children,
    component: null,
    suspense: null,
    ssContent: null,
    ssFallback: null,
    dirs: null,
    transition: null,
    el: null,
    anchor: null,
    target: null,
    targetStart: null,
    targetAnchor: null,
    staticCount: 0,
    shapeFlag,
    patchFlag,
    dynamicProps,
    dynamicChildren: null,
    appContext: null,
    ctx: currentRenderingInstance
  };
  if (needFullChildrenNormalization) {
    normalizeChildren(vnode, children);
    if (shapeFlag & 128) {
      type.normalize(vnode);
    }
  } else if (children) {
    vnode.shapeFlag |= isString(children) ? 8 : 16;
  }
  if (isBlockTreeEnabled > 0 && // avoid a block node from tracking itself
  !isBlockNode && // has current parent block
  currentBlock && // presence of a patch flag indicates this node needs patching on updates.
  // component nodes also should always be patched, because even if the
  // component doesn't need to update, it needs to persist the instance on to
  // the next vnode so that it can be properly unmounted later.
  (vnode.patchFlag > 0 || shapeFlag & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
  // vnode should not be considered dynamic due to handler caching.
  vnode.patchFlag !== 32) {
    currentBlock.push(vnode);
  }
  return vnode;
}
const createVNode = _createVNode;
function _createVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, isBlockNode = false) {
  if (!type || type === NULL_DYNAMIC_COMPONENT) {
    type = Comment;
  }
  if (isVNode(type)) {
    const cloned = cloneVNode(
      type,
      props,
      true
      /* mergeRef: true */
    );
    if (children) {
      normalizeChildren(cloned, children);
    }
    if (isBlockTreeEnabled > 0 && !isBlockNode && currentBlock) {
      if (cloned.shapeFlag & 6) {
        currentBlock[currentBlock.indexOf(type)] = cloned;
      } else {
        currentBlock.push(cloned);
      }
    }
    cloned.patchFlag = -2;
    return cloned;
  }
  if (isClassComponent(type)) {
    type = type.__vccOpts;
  }
  if (props) {
    props = guardReactiveProps(props);
    let { class: klass, style } = props;
    if (klass && !isString(klass)) {
      props.class = normalizeClass(klass);
    }
    if (isObject(style)) {
      if (/* @__PURE__ */ isProxy(style) && !isArray(style)) {
        style = extend({}, style);
      }
      props.style = normalizeStyle(style);
    }
  }
  const shapeFlag = isString(type) ? 1 : isSuspense(type) ? 128 : isTeleport(type) ? 64 : isObject(type) ? 4 : isFunction(type) ? 2 : 0;
  return createBaseVNode(
    type,
    props,
    children,
    patchFlag,
    dynamicProps,
    shapeFlag,
    isBlockNode,
    true
  );
}
function guardReactiveProps(props) {
  if (!props) return null;
  return /* @__PURE__ */ isProxy(props) || isInternalObject(props) ? extend({}, props) : props;
}
function cloneVNode(vnode, extraProps, mergeRef = false, cloneTransition = false) {
  const { props, ref: ref3, patchFlag, children, transition } = vnode;
  const mergedProps = extraProps ? mergeProps(props || {}, extraProps) : props;
  const cloned = {
    __v_isVNode: true,
    __v_skip: true,
    type: vnode.type,
    props: mergedProps,
    key: mergedProps && normalizeKey(mergedProps),
    ref: extraProps && extraProps.ref ? (
      // #2078 in the case of <component :is="vnode" ref="extra"/>
      // if the vnode itself already has a ref, cloneVNode will need to merge
      // the refs so the single vnode can be set on multiple refs
      mergeRef && ref3 ? isArray(ref3) ? ref3.concat(normalizeRef(extraProps)) : [ref3, normalizeRef(extraProps)] : normalizeRef(extraProps)
    ) : ref3,
    scopeId: vnode.scopeId,
    slotScopeIds: vnode.slotScopeIds,
    children,
    target: vnode.target,
    targetStart: vnode.targetStart,
    targetAnchor: vnode.targetAnchor,
    staticCount: vnode.staticCount,
    shapeFlag: vnode.shapeFlag,
    // if the vnode is cloned with extra props, we can no longer assume its
    // existing patch flag to be reliable and need to add the FULL_PROPS flag.
    // note: preserve flag for fragments since they use the flag for children
    // fast paths only.
    patchFlag: extraProps && vnode.type !== Fragment ? patchFlag === -1 ? 16 : patchFlag | 16 : patchFlag,
    dynamicProps: vnode.dynamicProps,
    dynamicChildren: vnode.dynamicChildren,
    appContext: vnode.appContext,
    dirs: vnode.dirs,
    transition,
    // These should technically only be non-null on mounted VNodes. However,
    // they *should* be copied for kept-alive vnodes. So we just always copy
    // them since them being non-null during a mount doesn't affect the logic as
    // they will simply be overwritten.
    component: vnode.component,
    suspense: vnode.suspense,
    ssContent: vnode.ssContent && cloneVNode(vnode.ssContent),
    ssFallback: vnode.ssFallback && cloneVNode(vnode.ssFallback),
    placeholder: vnode.placeholder,
    el: vnode.el,
    anchor: vnode.anchor,
    ctx: vnode.ctx,
    ce: vnode.ce,
    cacheIndex: vnode.cacheIndex
  };
  if (transition && cloneTransition) {
    setTransitionHooks(
      cloned,
      transition.clone(cloned)
    );
  }
  return cloned;
}
function createTextVNode(text = " ", flag = 0) {
  return createVNode(Text, null, text, flag);
}
function createCommentVNode(text = "", asBlock = false) {
  return asBlock ? (openBlock(), createBlock(Comment, null, text)) : createVNode(Comment, null, text);
}
function normalizeVNode(child) {
  if (child == null || typeof child === "boolean") {
    return createVNode(Comment);
  } else if (isArray(child)) {
    return createVNode(
      Fragment,
      null,
      // #3666, avoid reference pollution when reusing vnode
      child.slice()
    );
  } else if (isVNode(child)) {
    return cloneIfMounted(child);
  } else {
    return createVNode(Text, null, String(child));
  }
}
function cloneIfMounted(child) {
  return child.el === null && child.patchFlag !== -1 || child.memo ? child : cloneVNode(child);
}
function normalizeChildren(vnode, children) {
  let type = 0;
  const { shapeFlag } = vnode;
  if (children == null) {
    children = null;
  } else if (isArray(children)) {
    type = 16;
  } else if (typeof children === "object") {
    if (shapeFlag & (1 | 64)) {
      const slot = children.default;
      if (slot) {
        slot._c && (slot._d = false);
        normalizeChildren(vnode, slot());
        slot._c && (slot._d = true);
      }
      return;
    } else {
      type = 32;
      const slotFlag = children._;
      if (!slotFlag && !isInternalObject(children)) {
        children._ctx = currentRenderingInstance;
      } else if (slotFlag === 3 && currentRenderingInstance) {
        if (currentRenderingInstance.slots._ === 1) {
          children._ = 1;
        } else {
          children._ = 2;
          vnode.patchFlag |= 1024;
        }
      }
    }
  } else if (isFunction(children)) {
    if (shapeFlag & (1 | 64)) {
      normalizeChildren(vnode, { default: children });
      return;
    }
    children = { default: children, _ctx: currentRenderingInstance };
    type = 32;
  } else {
    children = String(children);
    if (shapeFlag & 64) {
      type = 16;
      children = [createTextVNode(children)];
    } else {
      type = 8;
    }
  }
  vnode.children = children;
  vnode.shapeFlag |= type;
}
function mergeProps(...args) {
  const ret = {};
  for (let i = 0; i < args.length; i++) {
    const toMerge = args[i];
    for (const key in toMerge) {
      if (key === "class") {
        if (ret.class !== toMerge.class) {
          ret.class = normalizeClass([ret.class, toMerge.class]);
        }
      } else if (key === "style") {
        ret.style = normalizeStyle([ret.style, toMerge.style]);
      } else if (isOn(key)) {
        const existing = ret[key];
        const incoming = toMerge[key];
        if (incoming && existing !== incoming && !(isArray(existing) && existing.includes(incoming))) {
          ret[key] = existing ? [].concat(existing, incoming) : incoming;
        } else if (incoming == null && existing == null && // mergeProps({ 'onUpdate:modelValue': undefined }) should not retain
        // the model listener.
        !isModelListener(key)) {
          ret[key] = incoming;
        }
      } else if (key !== "") {
        ret[key] = toMerge[key];
      }
    }
  }
  return ret;
}
function invokeVNodeHook(hook, instance, vnode, prevVNode = null) {
  callWithAsyncErrorHandling(hook, instance, 7, [
    vnode,
    prevVNode
  ]);
}
const emptyAppContext = createAppContext();
let uid = 0;
function createComponentInstance(vnode, parent, suspense) {
  const type = vnode.type;
  const appContext = (parent ? parent.appContext : vnode.appContext) || emptyAppContext;
  const instance = {
    uid: uid++,
    vnode,
    type,
    parent,
    appContext,
    root: null,
    // to be immediately set
    next: null,
    subTree: null,
    // will be set synchronously right after creation
    effect: null,
    update: null,
    // will be set synchronously right after creation
    job: null,
    scope: new EffectScope(
      true
      /* detached */
    ),
    render: null,
    proxy: null,
    exposed: null,
    exposeProxy: null,
    withProxy: null,
    provides: parent ? parent.provides : Object.create(appContext.provides),
    ids: parent ? parent.ids : ["", 0, 0],
    accessCache: null,
    renderCache: [],
    // local resolved assets
    components: null,
    directives: null,
    // resolved props and emits options
    propsOptions: normalizePropsOptions(type, appContext),
    emitsOptions: normalizeEmitsOptions(type, appContext),
    // emit
    emit: null,
    // to be set immediately
    emitted: null,
    // props default value
    propsDefaults: EMPTY_OBJ,
    // inheritAttrs
    inheritAttrs: type.inheritAttrs,
    // state
    ctx: EMPTY_OBJ,
    data: EMPTY_OBJ,
    props: EMPTY_OBJ,
    attrs: EMPTY_OBJ,
    slots: EMPTY_OBJ,
    refs: EMPTY_OBJ,
    setupState: EMPTY_OBJ,
    setupContext: null,
    // suspense related
    suspense,
    suspenseId: suspense ? suspense.pendingId : 0,
    asyncDep: null,
    asyncResolved: false,
    // lifecycle hooks
    // not using enums here because it results in computed properties
    isMounted: false,
    isUnmounted: false,
    isDeactivated: false,
    bc: null,
    c: null,
    bm: null,
    m: null,
    bu: null,
    u: null,
    um: null,
    bum: null,
    da: null,
    a: null,
    rtg: null,
    rtc: null,
    ec: null,
    sp: null
  };
  {
    instance.ctx = { _: instance };
  }
  instance.root = parent ? parent.root : instance;
  instance.emit = emit.bind(null, instance);
  if (vnode.ce) {
    vnode.ce(instance);
  }
  return instance;
}
let currentInstance = null;
const getCurrentInstance = () => currentInstance || currentRenderingInstance;
let internalSetCurrentInstance;
let setInSSRSetupState;
{
  const g = getGlobalThis();
  const registerGlobalSetter = (key, setter) => {
    let setters;
    if (!(setters = g[key])) setters = g[key] = [];
    setters.push(setter);
    return (v) => {
      if (setters.length > 1) setters.forEach((set) => set(v));
      else setters[0](v);
    };
  };
  internalSetCurrentInstance = registerGlobalSetter(
    `__VUE_INSTANCE_SETTERS__`,
    (v) => currentInstance = v
  );
  setInSSRSetupState = registerGlobalSetter(
    `__VUE_SSR_SETTERS__`,
    (v) => isInSSRComponentSetup = v
  );
}
const setCurrentInstance = (instance) => {
  const prev = currentInstance;
  internalSetCurrentInstance(instance);
  instance.scope.on();
  return () => {
    instance.scope.off();
    internalSetCurrentInstance(prev);
  };
};
const unsetCurrentInstance = () => {
  currentInstance && currentInstance.scope.off();
  internalSetCurrentInstance(null);
};
function isStatefulComponent(instance) {
  return instance.vnode.shapeFlag & 4;
}
let isInSSRComponentSetup = false;
function setupComponent(instance, isSSR = false, optimized = false) {
  isSSR && setInSSRSetupState(isSSR);
  const { props, children } = instance.vnode;
  const isStateful = isStatefulComponent(instance);
  initProps(instance, props, isStateful, isSSR);
  initSlots(instance, children, optimized || isSSR);
  const setupResult = isStateful ? setupStatefulComponent(instance, isSSR) : void 0;
  isSSR && setInSSRSetupState(false);
  return setupResult;
}
function setupStatefulComponent(instance, isSSR) {
  const Component = instance.type;
  instance.accessCache = /* @__PURE__ */ Object.create(null);
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);
  const { setup } = Component;
  if (setup) {
    pauseTracking();
    const setupContext = instance.setupContext = setup.length > 1 ? createSetupContext(instance) : null;
    const reset = setCurrentInstance(instance);
    const setupResult = callWithErrorHandling(
      setup,
      instance,
      0,
      [
        instance.props,
        setupContext
      ]
    );
    const isAsyncSetup = isPromise(setupResult);
    resetTracking();
    reset();
    if ((isAsyncSetup || instance.sp) && !isAsyncWrapper(instance)) {
      markAsyncBoundary(instance);
    }
    if (isAsyncSetup) {
      setupResult.then(unsetCurrentInstance, unsetCurrentInstance);
      if (isSSR) {
        return setupResult.then((resolvedResult) => {
          setInSSRSetupState(true);
          try {
            handleSetupResult(instance, resolvedResult, isSSR);
          } finally {
            setInSSRSetupState(false);
          }
        }).catch((e) => {
          handleError(e, instance, 0);
        });
      } else {
        instance.asyncDep = setupResult;
      }
    } else {
      handleSetupResult(instance, setupResult);
    }
  } else {
    finishComponentSetup(instance);
  }
}
function handleSetupResult(instance, setupResult, isSSR) {
  if (isFunction(setupResult)) {
    if (instance.type.__ssrInlineRender) {
      instance.ssrRender = setupResult;
    } else {
      instance.render = setupResult;
    }
  } else if (isObject(setupResult)) {
    instance.setupState = proxyRefs(setupResult);
  } else ;
  finishComponentSetup(instance);
}
function finishComponentSetup(instance, isSSR, skipOptions) {
  const Component = instance.type;
  if (!instance.render) {
    instance.render = Component.render || NOOP;
  }
  {
    const reset = setCurrentInstance(instance);
    pauseTracking();
    try {
      applyOptions(instance);
    } finally {
      resetTracking();
      reset();
    }
  }
}
const attrsProxyHandlers = {
  get(target, key) {
    track(target, "get", "");
    return target[key];
  }
};
function createSetupContext(instance) {
  const expose = (exposed) => {
    instance.exposed = exposed || {};
  };
  {
    return {
      attrs: new Proxy(instance.attrs, attrsProxyHandlers),
      slots: instance.slots,
      emit: instance.emit,
      expose
    };
  }
}
function getComponentPublicInstance(instance) {
  if (instance.exposed) {
    return instance.exposeProxy || (instance.exposeProxy = new Proxy(proxyRefs(markRaw(instance.exposed)), {
      get(target, key) {
        if (key in target) {
          return target[key];
        } else if (key in publicPropertiesMap) {
          return publicPropertiesMap[key](instance);
        }
      },
      has(target, key) {
        return key in target || key in publicPropertiesMap;
      }
    }));
  } else {
    return instance.proxy;
  }
}
const classifyRE = /(?:^|[-_])\w/g;
const classify = (str) => str.replace(classifyRE, (c) => c.toUpperCase()).replace(/[-_]/g, "");
function getComponentName(Component, includeInferred = true) {
  return isFunction(Component) ? Component.displayName || Component.name : Component.name || includeInferred && Component.__name;
}
function formatComponentName(instance, Component, isRoot = false) {
  let name = getComponentName(Component);
  if (!name && Component.__file) {
    const match = Component.__file.match(/([^/\\]+)\.\w+$/);
    if (match) {
      name = match[1];
    }
  }
  if (!name && instance) {
    const inferFromRegistry = (registry) => {
      for (const key in registry) {
        if (registry[key] === Component) {
          return key;
        }
      }
    };
    name = inferFromRegistry(instance.components) || instance.parent && inferFromRegistry(
      instance.parent.type.components
    ) || inferFromRegistry(instance.appContext.components);
  }
  return name ? classify(name) : isRoot ? `App` : `Anonymous`;
}
function isClassComponent(value) {
  return isFunction(value) && "__vccOpts" in value;
}
const computed = (getterOrOptions, debugOptions) => {
  const c = /* @__PURE__ */ computed$1(getterOrOptions, debugOptions, isInSSRComponentSetup);
  return c;
};
const version = "3.5.43";
let policy = void 0;
const tt = typeof window !== "undefined" && window.trustedTypes;
if (tt) {
  try {
    policy = /* @__PURE__ */ tt.createPolicy("vue", {
      createHTML: (val) => val
    });
  } catch (e) {
  }
}
const unsafeToTrustedHTML = policy ? (val) => policy.createHTML(val) : (val) => val;
const svgNS = "http://www.w3.org/2000/svg";
const mathmlNS = "http://www.w3.org/1998/Math/MathML";
const doc = typeof document !== "undefined" ? document : null;
const templateContainer = doc && /* @__PURE__ */ doc.createElement("template");
const nodeOps = {
  insert: (child, parent, anchor) => {
    parent.insertBefore(child, anchor || null);
  },
  remove: (child) => {
    const parent = child.parentNode;
    if (parent) {
      parent.removeChild(child);
    }
  },
  createElement: (tag, namespace, is, props) => {
    const el = namespace === "svg" ? doc.createElementNS(svgNS, tag) : namespace === "mathml" ? doc.createElementNS(mathmlNS, tag) : is ? doc.createElement(tag, { is }) : doc.createElement(tag);
    if (tag === "select" && props && props.multiple != null) {
      el.setAttribute("multiple", props.multiple);
    }
    return el;
  },
  createText: (text) => doc.createTextNode(text),
  createComment: (text) => doc.createComment(text),
  setText: (node, text) => {
    node.nodeValue = text;
  },
  setElementText: (el, text) => {
    el.textContent = text;
  },
  parentNode: (node) => node.parentNode,
  nextSibling: (node) => node.nextSibling,
  querySelector: (selector) => doc.querySelector(selector),
  setScopeId(el, id) {
    el.setAttribute(id, "");
  },
  // __UNSAFE__
  // Reason: innerHTML.
  // Static content here can only come from compiled templates.
  // As long as the user only uses trusted templates, this is safe.
  insertStaticContent(content, parent, anchor, namespace, start, end) {
    const before = anchor ? anchor.previousSibling : parent.lastChild;
    if (start && (start === end || start.nextSibling)) {
      while (true) {
        parent.insertBefore(start.cloneNode(true), anchor);
        if (start === end || !(start = start.nextSibling)) break;
      }
    } else {
      templateContainer.innerHTML = unsafeToTrustedHTML(
        namespace === "svg" ? `<svg>${content}</svg>` : namespace === "mathml" ? `<math>${content}</math>` : content
      );
      const template2 = templateContainer.content;
      if (namespace === "svg" || namespace === "mathml") {
        const wrapper = template2.firstChild;
        while (wrapper.firstChild) {
          template2.appendChild(wrapper.firstChild);
        }
        template2.removeChild(wrapper);
      }
      parent.insertBefore(template2, anchor);
    }
    return [
      // first
      before ? before.nextSibling : parent.firstChild,
      // last
      anchor ? anchor.previousSibling : parent.lastChild
    ];
  }
};
const vtcKey = /* @__PURE__ */ Symbol("_vtc");
function patchClass(el, value, isSVG) {
  const transitionClasses = el[vtcKey];
  if (transitionClasses) {
    value = (value ? [value, ...transitionClasses] : [...transitionClasses]).join(" ");
  }
  if (value == null) {
    el.removeAttribute("class");
  } else if (isSVG) {
    el.setAttribute("class", value);
  } else {
    el.className = value;
  }
}
const vShowOriginalDisplay = /* @__PURE__ */ Symbol("_vod");
const vShowHidden = /* @__PURE__ */ Symbol("_vsh");
const CSS_VAR_TEXT = /* @__PURE__ */ Symbol("");
const displayRE = /(?:^|;)\s*display\s*:/;
function patchStyle(el, prev, next) {
  const style = el.style;
  const isCssString = isString(next);
  let hasControlledDisplay = false;
  if (next && !isCssString) {
    if (prev) {
      if (!isString(prev)) {
        for (const key in prev) {
          if (next[key] == null) {
            setStyle(style, key, "");
          }
        }
      } else {
        for (const prevStyle of prev.split(";")) {
          const key = prevStyle.slice(0, prevStyle.indexOf(":")).trim();
          if (next[key] == null) {
            setStyle(style, key, "");
          }
        }
      }
    }
    for (const key in next) {
      if (key === "display") {
        hasControlledDisplay = true;
      }
      const value = next[key];
      if (value != null) {
        if (!shouldPreserveTextareaResizeStyle(
          el,
          key,
          !isString(prev) && prev ? prev[key] : void 0,
          value
        )) {
          setStyle(style, key, value);
        }
      } else {
        setStyle(style, key, "");
      }
    }
  } else {
    if (isCssString) {
      if (prev !== next) {
        const cssVarText = style[CSS_VAR_TEXT];
        if (cssVarText) {
          next += ";" + cssVarText;
        }
        style.cssText = next;
        hasControlledDisplay = displayRE.test(next);
      }
    } else if (prev) {
      el.removeAttribute("style");
    }
  }
  if (vShowOriginalDisplay in el) {
    el[vShowOriginalDisplay] = hasControlledDisplay ? style.display : "";
    if (el[vShowHidden]) {
      style.display = "none";
    }
  }
}
const importantRE = /\s*!important$/;
function setStyle(style, name, val) {
  if (isArray(val)) {
    val.forEach((v) => setStyle(style, name, v));
  } else {
    if (val == null) val = "";
    if (name.startsWith("--")) {
      if (importantRE.test(val)) {
        style.setProperty(name, val.replace(importantRE, ""), "important");
      } else {
        style.setProperty(name, val);
      }
    } else {
      const prefixed = autoPrefix(style, name);
      if (importantRE.test(val)) {
        style.setProperty(
          hyphenate(prefixed),
          val.replace(importantRE, ""),
          "important"
        );
      } else {
        style[prefixed] = val;
      }
    }
  }
}
const prefixes = ["Webkit", "Moz", "ms"];
const prefixCache = {};
function autoPrefix(style, rawName) {
  const cached = prefixCache[rawName];
  if (cached) {
    return cached;
  }
  let name = camelize(rawName);
  if (name !== "filter" && name in style) {
    return prefixCache[rawName] = name;
  }
  name = capitalize(name);
  for (let i = 0; i < prefixes.length; i++) {
    const prefixed = prefixes[i] + name;
    if (prefixed in style) {
      return prefixCache[rawName] = prefixed;
    }
  }
  return rawName;
}
function shouldPreserveTextareaResizeStyle(el, key, prev, next) {
  return el.tagName === "TEXTAREA" && (key === "width" || key === "height") && isString(next) && prev === next;
}
const xlinkNS = "http://www.w3.org/1999/xlink";
function patchAttr(el, key, value, isSVG, instance, isBoolean = isSpecialBooleanAttr(key)) {
  if (isSVG && key.startsWith("xlink:")) {
    if (value == null) {
      el.removeAttributeNS(xlinkNS, key.slice(6, key.length));
    } else {
      el.setAttributeNS(xlinkNS, key, value);
    }
  } else {
    if (value == null || isBoolean && !includeBooleanAttr(value)) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(
        key,
        isBoolean ? "" : isSymbol(value) ? String(value) : value
      );
    }
  }
}
function patchDOMProp(el, key, value, parentComponent, attrName) {
  if (key === "innerHTML" || key === "textContent") {
    if (value != null) {
      el[key] = key === "innerHTML" ? unsafeToTrustedHTML(value) : value;
    }
    return;
  }
  const tag = el.tagName;
  if (key === "value" && tag !== "PROGRESS" && // custom elements may use _value internally
  !tag.includes("-")) {
    const oldValue = tag === "OPTION" ? el.getAttribute("value") || "" : el.value;
    const newValue = value == null ? (
      // #11647: value should be set as empty string for null and undefined,
      // but <input type="checkbox"> should be set as 'on'.
      el.type === "checkbox" ? "on" : ""
    ) : String(value);
    if (oldValue !== newValue || !("_value" in el)) {
      el.value = newValue;
    }
    if (value == null) {
      el.removeAttribute(key);
    }
    el._value = value;
    return;
  }
  let needRemove = false;
  if (value === "" || value == null) {
    const type = typeof el[key];
    if (type === "boolean") {
      value = includeBooleanAttr(value);
    } else if (value == null && type === "string") {
      value = "";
      needRemove = true;
    } else if (type === "number") {
      value = 0;
      needRemove = true;
    }
  }
  try {
    el[key] = value;
  } catch (e) {
  }
  needRemove && el.removeAttribute(attrName || key);
}
function addEventListener(el, event, handler, options) {
  el.addEventListener(event, handler, options);
}
function removeEventListener(el, event, handler, options) {
  el.removeEventListener(event, handler, options);
}
const veiKey = /* @__PURE__ */ Symbol("_vei");
function patchEvent(el, rawName, prevValue, nextValue, instance = null) {
  const invokers = el[veiKey] || (el[veiKey] = {});
  const existingInvoker = invokers[rawName];
  if (nextValue && existingInvoker) {
    existingInvoker.value = nextValue;
  } else {
    const [name, options] = parseName(rawName);
    if (nextValue) {
      const invoker = invokers[rawName] = createInvoker(
        nextValue,
        instance
      );
      addEventListener(el, name, invoker, options);
    } else if (existingInvoker) {
      removeEventListener(el, name, existingInvoker, options);
      invokers[rawName] = void 0;
    }
  }
}
const optionsModifierRE = /(Once|Passive|Capture)$/;
const optionsModifierEventRE = /^on:?(?:Once|Passive|Capture)$/;
function parseName(name) {
  let options;
  let m;
  while ((m = name.match(optionsModifierRE)) && !optionsModifierEventRE.test(name)) {
    if (!options) options = {};
    name = name.slice(0, name.length - m[1].length);
    options[m[1].toLowerCase()] = true;
  }
  const event = name[2] === ":" ? name.slice(3) : hyphenate(name.slice(2));
  return [event, options];
}
let cachedNow = 0;
const p = /* @__PURE__ */ Promise.resolve();
const getNow = () => cachedNow || (p.then(() => cachedNow = 0), cachedNow = Date.now());
function createInvoker(initialValue, instance) {
  const invoker = (e) => {
    if (!e._vts) {
      e._vts = Date.now();
    } else if (e._vts <= invoker.attached) {
      return;
    }
    const value = invoker.value;
    if (isArray(value)) {
      const originalStop = e.stopImmediatePropagation;
      e.stopImmediatePropagation = () => {
        originalStop.call(e);
        e._stopped = true;
      };
      const handlers = value.slice();
      const args = [e];
      for (let i = 0; i < handlers.length; i++) {
        if (e._stopped) {
          break;
        }
        const handler = handlers[i];
        if (handler) {
          callWithAsyncErrorHandling(
            handler,
            instance,
            5,
            args
          );
        }
      }
    } else {
      callWithAsyncErrorHandling(
        value,
        instance,
        5,
        [e]
      );
    }
  };
  invoker.value = initialValue;
  invoker.attached = getNow();
  return invoker;
}
const isNativeOn = (key) => key.charCodeAt(0) === 111 && key.charCodeAt(1) === 110 && // lowercase letter
key.charCodeAt(2) > 96 && key.charCodeAt(2) < 123;
const patchProp = (el, key, prevValue, nextValue, namespace, parentComponent) => {
  const isSVG = namespace === "svg";
  if (key === "class") {
    patchClass(el, nextValue, isSVG);
  } else if (key === "style") {
    patchStyle(el, prevValue, nextValue);
  } else if (isOn(key)) {
    if (!isModelListener(key)) {
      patchEvent(el, key, prevValue, nextValue, parentComponent);
    }
  } else if (key[0] === "." ? (key = key.slice(1), true) : key[0] === "^" ? (key = key.slice(1), false) : shouldSetAsProp(el, key, nextValue, isSVG)) {
    patchDOMProp(el, key, nextValue);
    if (!el.tagName.includes("-") && (key === "value" || key === "checked" || key === "selected")) {
      patchAttr(el, key, nextValue, isSVG, parentComponent, key !== "value");
    }
  } else if (
    // #11081 force set props for possible async custom element
    el._isVueCE && // #12408 check if it's declared prop or it's async custom element
    (shouldSetAsPropForVueCE(el, key) || // @ts-expect-error _def is private
    el._def.__asyncLoader && (/[A-Z]/.test(key) || !isString(nextValue)))
  ) {
    patchDOMProp(el, camelize(key), nextValue, parentComponent, key);
  } else {
    if (key === "true-value") {
      el._trueValue = nextValue;
    } else if (key === "false-value") {
      el._falseValue = nextValue;
    }
    patchAttr(el, key, nextValue, isSVG);
  }
};
function shouldSetAsProp(el, key, value, isSVG) {
  if (isSVG) {
    if (key === "innerHTML" || key === "textContent") {
      return true;
    }
    if (key in el && isNativeOn(key) && isFunction(value)) {
      return true;
    }
    return false;
  }
  if (key === "spellcheck" || key === "draggable" || key === "translate" || key === "autocorrect") {
    return false;
  }
  if (key === "sandbox" && el.tagName === "IFRAME") {
    return false;
  }
  if (key === "form") {
    return false;
  }
  if (key === "list" && el.tagName === "INPUT") {
    return false;
  }
  if (key === "type" && el.tagName === "TEXTAREA") {
    return false;
  }
  if (key === "width" || key === "height") {
    const tag = el.tagName;
    if (tag === "IMG" || tag === "VIDEO" || tag === "CANVAS" || tag === "SOURCE") {
      return false;
    }
  }
  if (isNativeOn(key) && isString(value)) {
    return false;
  }
  return key in el;
}
function shouldSetAsPropForVueCE(el, key) {
  const props = (
    // @ts-expect-error _def is private
    el._def.props
  );
  if (!props) {
    return false;
  }
  const camelKey = camelize(key);
  return Array.isArray(props) ? props.some((prop) => camelize(prop) === camelKey) : Object.keys(props).some((prop) => camelize(prop) === camelKey);
}
const getModelAssigner = (vnode) => {
  const fn = vnode.props["onUpdate:modelValue"] || false;
  return isArray(fn) ? (value) => invokeArrayFns(fn, value) : fn;
};
const assignKey = /* @__PURE__ */ Symbol("_assign");
const vModelCheckbox = {
  // #4096 array checkboxes need to be deep traversed
  deep: true,
  created(el, _, vnode) {
    el[assignKey] = getModelAssigner(vnode);
    addEventListener(el, "change", () => {
      const modelValue = el._modelValue;
      const elementValue = getValue(el);
      const checked = el.checked;
      const assign = el[assignKey];
      if (isArray(modelValue)) {
        const index = looseIndexOf(modelValue, elementValue);
        const found = index !== -1;
        if (checked && !found) {
          assign(modelValue.concat(elementValue));
        } else if (!checked && found) {
          const filtered = [...modelValue];
          filtered.splice(index, 1);
          assign(filtered);
        }
      } else if (isSet(modelValue)) {
        const cloned = new Set(modelValue);
        if (checked) {
          cloned.add(elementValue);
        } else {
          cloned.delete(elementValue);
        }
        assign(cloned);
      } else {
        assign(getCheckboxValue(el, checked));
      }
    });
  },
  // set initial checked on mount to wait for true-value/false-value
  mounted: setChecked,
  beforeUpdate(el, binding, vnode) {
    el[assignKey] = getModelAssigner(vnode);
    setChecked(el, binding, vnode);
  }
};
function setChecked(el, { value, oldValue }, vnode) {
  el._modelValue = value;
  let checked;
  if (isArray(value)) {
    checked = looseIndexOf(value, vnode.props.value) > -1;
  } else if (isSet(value)) {
    checked = value.has(vnode.props.value);
  } else {
    if (value === oldValue) return;
    checked = looseEqual(value, getCheckboxValue(el, true));
  }
  if (el.checked !== checked) {
    el.checked = checked;
  }
}
const vModelSelect = {
  // <select multiple> value need to be deep traversed
  deep: true,
  created(el, { value, modifiers: { number } }, vnode) {
    el._modelValue = value;
    addEventListener(el, "change", () => {
      const selectedVal = Array.prototype.filter.call(el.options, (o) => o.selected).map(
        (o) => number ? looseToNumber(getValue(o)) : getValue(o)
      );
      const multiple = el.multiple;
      const assignedValue = multiple ? isSet(el._modelValue) ? new Set(selectedVal) : selectedVal : selectedVal[0];
      const pending = el._pendingValue = [
        multiple,
        multiple ? isArray(assignedValue) ? selectedVal.slice() : selectedVal : assignedValue
      ];
      try {
        el[assignKey](assignedValue);
      } finally {
        nextTick(() => {
          if (el._pendingValue === pending) {
            el._pendingValue = void 0;
          }
        });
      }
    });
    el[assignKey] = getModelAssigner(vnode);
  },
  // set value in mounted & updated because <select> relies on its children
  // <option>s.
  mounted(el, { value }) {
    setSelected(el, value);
  },
  beforeUpdate(el, { value }, vnode) {
    el._modelValue = value;
    el[assignKey] = getModelAssigner(vnode);
  },
  updated(el, { value }) {
    const pending = el._pendingValue;
    el._pendingValue = void 0;
    if (!pending || pending[0] !== el.multiple || !isSameSelectValue(value, pending[1], pending[0])) {
      setSelected(el, value);
    }
  }
};
function isSameSelectValue(value, assignedValue, multiple) {
  if (!multiple) return looseEqual(value, assignedValue);
  if (isArray(value)) return looseEqual(value, assignedValue);
  if (isSet(value)) {
    if (value.size !== assignedValue.length) return false;
    for (const item of assignedValue) {
      if (!value.has(item)) return false;
    }
    return true;
  }
  return false;
}
function setSelected(el, value) {
  const isMultiple = el.multiple;
  const isArrayValue = isArray(value);
  if (isMultiple && !isArrayValue && !isSet(value)) {
    return;
  }
  for (let i = 0, l = el.options.length; i < l; i++) {
    const option = el.options[i];
    const optionValue = getValue(option);
    if (isMultiple) {
      if (isArrayValue) {
        const optionType = typeof optionValue;
        if (optionType === "string" || optionType === "number") {
          option.selected = value.some((v) => String(v) === String(optionValue));
        } else {
          option.selected = looseIndexOf(value, optionValue) > -1;
        }
      } else {
        option.selected = value.has(optionValue);
      }
    } else if (looseEqual(getValue(option), value)) {
      if (el.selectedIndex !== i) el.selectedIndex = i;
      return;
    }
  }
  if (!isMultiple && el.selectedIndex !== -1) {
    el.selectedIndex = -1;
  }
}
function getValue(el) {
  return "_value" in el ? el._value : el.value;
}
function getCheckboxValue(el, checked) {
  const key = checked ? "_trueValue" : "_falseValue";
  return key in el ? el[key] : checked;
}
const systemModifiers = ["ctrl", "shift", "alt", "meta"];
const modifierGuards = {
  stop: (e) => e.stopPropagation(),
  prevent: (e) => e.preventDefault(),
  self: (e) => e.target !== e.currentTarget,
  ctrl: (e) => !e.ctrlKey,
  shift: (e) => !e.shiftKey,
  alt: (e) => !e.altKey,
  meta: (e) => !e.metaKey,
  left: (e) => "button" in e && e.button !== 0,
  middle: (e) => "button" in e && e.button !== 1,
  right: (e) => "button" in e && e.button !== 2,
  exact: (e, modifiers) => systemModifiers.some((m) => e[`${m}Key`] && !modifiers.includes(m))
};
const withModifiers = (fn, modifiers) => {
  if (!fn) return fn;
  const cache2 = fn._withMods || (fn._withMods = {});
  const cacheKey = modifiers.join(".");
  return cache2[cacheKey] || (cache2[cacheKey] = ((event, ...args) => {
    for (let i = 0; i < modifiers.length; i++) {
      const guard = modifierGuards[modifiers[i]];
      if (guard && guard(event, modifiers)) return;
    }
    return fn(event, ...args);
  }));
};
const keyNames = {
  esc: "escape",
  space: " ",
  up: "arrow-up",
  left: "arrow-left",
  right: "arrow-right",
  down: "arrow-down",
  delete: "backspace"
};
const withKeys = (fn, modifiers) => {
  const cache2 = fn._withKeys || (fn._withKeys = {});
  const cacheKey = modifiers.join(".");
  return cache2[cacheKey] || (cache2[cacheKey] = ((event) => {
    if (!("key" in event)) {
      return;
    }
    const eventKey = hyphenate(event.key);
    if (modifiers.some(
      (k) => k === eventKey || keyNames[k] === eventKey
    )) {
      return fn(event);
    }
  }));
};
const rendererOptions = /* @__PURE__ */ extend({ patchProp }, nodeOps);
let renderer;
function ensureRenderer() {
  return renderer || (renderer = createRenderer(rendererOptions));
}
const createApp = ((...args) => {
  const app = ensureRenderer().createApp(...args);
  const { mount } = app;
  app.mount = (containerOrSelector) => {
    const container = normalizeContainer(containerOrSelector);
    if (!container) return;
    const component = app._component;
    if (!isFunction(component) && !component.render && !component.template) {
      component.template = container.innerHTML;
    }
    if (container.nodeType === 1) {
      container.textContent = "";
    }
    const proxy = mount(container, false, resolveRootNamespace(container));
    if (container instanceof Element) {
      container.removeAttribute("v-cloak");
      container.setAttribute("data-v-app", "");
    }
    return proxy;
  };
  return app;
});
function resolveRootNamespace(container) {
  if (container instanceof SVGElement) {
    return "svg";
  }
  if (typeof MathMLElement === "function" && container instanceof MathMLElement) {
    return "mathml";
  }
}
function normalizeContainer(container) {
  if (isString(container)) {
    const res = document.querySelector(container);
    return res;
  }
  return container;
}
function useAppI18n() {
  const locale2 = /* @__PURE__ */ ref(currentAppLocale());
  const unsubscribe = onAppLocaleChange(() => {
    locale2.value = currentAppLocale();
  });
  onUnmounted(unsubscribe);
  return {
    locale: locale2,
    t: (value, values) => {
      void locale2.value;
      return translate(value, values);
    }
  };
}
const kana = {
  "あ": ["M31.01,33c0.88,0.88,2.75,1.82,5.25,1.75c8.62-0.25,20-2.12,29.5-4.25c1.51-0.34,4.62-0.88,6.62-0.5", "M49.76,17.62c0.88,1,1.82,3.26,1.38,5.25c-3.75,16.75-6.25,38.13-5.13,53.63c0.41,5.7,1.88,10.88,3.38,13.62", "M65.63,44.12c0.75,1.12,1.16,4.39,0.5,6.12c-4.62,12.26-11.24,23.76-25.37,35.76c-6.86,5.83-15.88,3.75-16.25-8.38c-0.34-10.87,13.38-23.12,32.38-26.74c12.42-2.37,27,1.38,30.5,12.75c4.05,13.18-3.76,26.37-20.88,30.49"],
  "い": ["M21.5,29.66c2.01,2.17,2.61,4.68,2.17,7.43c-3.09,19.16-1.03,32.01,7.93,41.45c6.12,6.45,6.26,3.14,7.04-5.21", "M72.96,36.51c9.44,8.05,17.79,18.82,18.41,33.83"],
  "う": ["M42,15.5c5.62,2.12,9.62,3,12.88,3c8.27,0,8,1.12-0.38,5.5", "M33,42.38c2.12,1.12,4.12,2.88,8.5,1.38c4.38-1.5,12.75-7.12,18.5-7c5.75,0.12,10.25,5,10.25,18c0,15.49-8.25,30.24-24.37,41.24"],
  "え": ["M40.52,13.25c5.62,2.12,10,3,14.12,3c8.27,0,8,1.12-0.38,5.5", "M32.52,45.12c1.88,1.25,4.5,1.75,7.38,0.62c3.29-1.29,17-7.88,21.25-9.88c4.25-2,8.32,0.04,4.38,4.62c-12.26,14.27-27.26,31.52-39.51,44.4c-3.26,3.42-0.58,3.54,1.5,1.37c13.5-14.12,18.12-20.12,23.62-20.12c7.13,0,3.5,16.75,6.75,22.38c3.25,5.63,19.12,3.75,26.12,2.12"],
  "お": ["M22.88,35.12c1.38,1,3.62,2.38,6,2.12c2.38-0.26,19.62-5.12,21.12-5.74c1.5-0.62,4-1.25,5.88-2", "M41.5,16.12c2.25,1,3.59,4.39,3.12,7.38c-2.5,16.12-3.37,45.53-2.25,58.38c0.75,8.62-0.64,10.45-7.12,7.12c-5.13-2.62-13.75-8-13.75-12.38c0-7.5,24.38-23.62,44.75-23.62c17.25,0,25,8.25,25,17.25c0,8.25-9.38,18.88-26.75,21", "M73,22.12c5.38,2.62,8.88,5.88,10.62,8.25c2.27,3.08,0.38,4.5-1.12,5"],
  "か": ["M24.62,38.62c1.88,1.62,4.65,2.33,8.62,1c25.5-8.5,29.5-4.13,29.5,7.62c0,9.38-1.24,17.46-4.25,25.25c-7.62,19.76-10.87,17.39-16.12,10.89", "M48.5,17.5c1,1.38,1.29,4.7,0.5,7.12c-5,15.25-18.02,40.93-19.62,43.88c-3.12,5.75-6.38,11.88-9.38,16.25", "M77.37,31.62c7.5,6.88,13.25,15.75,15,24.88"],
  "き": ["M30.5,30.25c1.88,0.75,4.64,1.06,5.88,0.88c6.75-1,22.25-4.5,26.5-6c2.17-0.76,3.5-1.25,4.88-2.12", "M36.25,48.7c2.01,0.85,4.97,1.2,6.29,0.99c7.23-1.13,23.82-5.09,28.37-6.79c2.32-0.86,3.75-1.41,5.22-2.4", "M42,14.12c1.5,0.88,3.13,2.94,4,5.12c5.5,13.76,16,29.26,26.37,40.76c7.64,8.47,9.12,9.38-6,3.88", "M33.75,83.25c10.62,9.75,27.25,8.62,38.12,5"],
  "く": ["M60.66,15c0.5,1.62,0.35,5.44-1,7.38c-6.75,9.62-14.3,19.08-18.62,24.5c-4,5-3.79,7.03-0.88,11c5.5,7.5,12.75,18.75,17.62,27.25c1.48,2.59,2.75,4.75,4.5,8.62"],
  "け": ["M24.67,19.75c1.25,1.5,2.62,3.75,2.12,6.38c-3,15.88-6.5,29.5-4.88,44.62c2.02,18.84,2.25,4.75,6.75-3.5", "M53.67,38.62c2.12,1.38,4.28,1.89,6.88,1.5c8.25-1.25,15.39-2.57,20.62-4c2.76-0.74,5.26-1.12,6.88-1.12", "M71.67,14.38c2.13,1.37,2.88,3.35,2.88,5.12c0,11.62,0.12,20.38,0.12,30.12c0,20.75-0.62,30.88-12.5,42.25"],
  "こ": ["M34.75,26.75c1.12,0.88,2.91,2.01,6,1.5c7.62-1.25,14.11-2.56,22.38-2.62c15.5-0.12,5.88,5-5.75,9", "M30,68.12c2.25,14.5,15.26,17.96,31,16.75c6.5-0.5,11.88-1.25,17.62-2.88"],
  "さ": ["M27,38.9c2.42,1.33,5.38,1.47,8.32,1.06c8.79-1.24,28.67-7.76,34.15-10.43c2.79-1.36,3.78-1.91,6.28-3.53", "M41.5,13.88c1.5,0.88,3.63,2.94,4.5,5.12c5.5,13.75,15.25,27.62,26.87,39.5c7.98,8.15,6.38,10-6,3.12", "M35.25,80.5c4.5,11.75,20.88,12.5,38.38,7.5"],
  "し": ["M39.12,17.5c1.25,3.12,0.93,6.74,0.38,10.25c-2.12,13.5-3,26.5-3,39.12c0,27.38,19.88,30.12,45.5,17.25"],
  "す": ["M15.5,37.12c2.88,2.12,6.94,1.51,12.75,0.25c16.12-3.5,36.14-5.38,46.62-6.5c7-0.75,11.88-0.62,17.75,0.12", "M57.62,13.38c2,1.5,2.75,3.25,2.75,5.88c0,10.38,0,35.12,0,40.75c0,14.62-15.62,16.38-15.62,1.75c0-14.25,18-14.12,18,6.38c0,13.25-7.75,21.5-16,28.38"],
  "せ": ["M16.5,49.93c2.88,2.42,6.86,1.57,12.75,0.53c19-3.34,33-5.72,47.12-7.64c6.99-0.95,11.88-1.21,17.75-0.36", "M69.74,17.75c2,1.5,2.75,3.25,2.75,5.88c0,10.38,0,17.88,0,23.5c0,25.62-5.75,23.25-11.88,19", "M35.62,26.25c2,1.5,2.75,3.25,2.75,5.88c0,10.38,0,28.38,0,34c0,14.5,6.38,19.55,20.14,19.55c10.24,0,13.74,0.07,22.61-1.68"],
  "そ": ["M38.4,22c1.88,1.25,4.98,1.05,7.5,0.38c6.5-1.75,13.25-3.75,19.38-5.38c4.63-1.23,7.18,2.06,3.62,5.25c-12.12,10.87-31.14,24.4-40,30.25c-6.25,4.12-5.88,5.75,1.38,3.88c17.08-4.42,35.96-8.68,50.12-10.38c9.38-1.12,9.62,0.12,0.5,1.38c-15.82,2.17-34.38,14.25-34.38,26.5c0,12.88,11.62,20.38,31.5,16.62"],
  "た": ["M24.38,35.38c1.38,0.62,3.88,1.51,6.38,1.12c6.5-1,16.25-2.88,24.88-4.75c2.64-0.57,5.38-1.5,7.62-2.38", "M45,16.88c0.75,1.25,0.87,3.62,0.38,5.25c-6.35,20.94-12.75,36.37-18.88,52.37c-1.36,3.56-4.75,11.75-6,14.62", "M56.38,53.25c12.38-2.75,18.25-3.7,23.62-3.12c15.12,1.62-1.12,2.25-4.25,4.88", "M54.13,82.25c4.38,7,14.25,8.12,34.5,5.62"],
  "ち": ["M24.5,32.62c1.38,0.62,3.88,1.51,6.38,1.12c6.5-1,18.25-4.12,26.88-6c2.64-0.57,5.38-1.5,7.62-2.38", "M45.62,15.62c0.75,1.25,0.71,3.58,0.38,5.25c-3,15-4.25,22.59-8.38,38.62c-3.25,12.62-5.38,11.12,3.62,4.38c8.29-6.21,19.75-9.5,28.5-9.5c8.62,0,14.58,5.88,14.5,14.5c-0.12,13.5-16.5,20.62-29.88,23.25"],
  "つ": ["M14,44.75c1.88,1.62,4.68,2.09,8.12,0.62c17.88-7.62,30-11.12,44.88-10.88c12.56,0.21,22.98,7.17,22.87,19.17c-0.18,18.77-24.75,28.71-45.01,32.08"],
  "て": ["M20.5,26.38c1.87,1.62,4.42,1.97,8.12,1.37c21.75-3.5,33-5.12,50.12-8.38c12.34-2.34,13-0.88,0.38,1.38c-17.89,3.19-33.78,19.12-33.78,37.62c0,20.5,17.91,30.25,35.16,30.25"],
  "と": ["M35.5,18.38c1.74,0.74,3.62,2.62,4.12,5.37c0.5,2.75,4.75,25,5.38,28.12", "M78.12,25.5c0.25,1.88,0.04,4.09-2.25,5.75c-6.37,4.63-13.22,8.49-22.75,15.25c-12.88,9.12-21.62,18.38-21.62,27.5c0,10.12,8.5,13.88,26.88,13.88c6.25,0,14.75-0.12,21.62-1.25"],
  "な": ["M22.88,28.96c1.18,0.58,3.3,1.1,5.47,1.05c5.53-0.13,10.9-0.98,16.52-2.42c4.82-1.23,9.13-3.12,11.38-4.22", "M42.99,14c0.63,0.89,0.56,2.52,0.31,3.72c-2.96,14.16-7.95,26.56-14.25,37.87c-2.05,3.69-4.25,7.24-6.55,10.65", "M72.26,23.25c6.88,2.5,12.62,5.62,14.75,9.5c4.06,7.41-0.25,3.38-3.5,3.88", "M68.88,44.62c-1,1.88-2.14,5.24-1.88,8.25c0.62,7,1.5,13.12,1.5,20.62c0,20-27.88,19.75-27.88,9.38c0-5.62,8.25-8.25,13.88-8.25c8.75,0,21.5,3.25,29.75,11.5"],
  "に": ["M24.53,22.75c1.25,1.5,1.62,3.75,1.12,6.38c-3,15.88-9,32.5-7.38,47.62c2.02,18.84,4.5,5.75,8.5-3.5", "M53.2,30.64c0.96,0.79,2.44,1.58,5.1,1.35c6.98-0.61,15.01-3.3,22.04-3.36c13.19-0.11,1.5,3.75-8.39,7.35", "M52.53,68c1.76,12.92,11.92,16.01,24.23,14.93c5.08-0.45,8.9-0.8,14.27-2.06"],
  "ぬ": ["M25.38,28.5c2,1.38,2.97,3.23,3.38,5.88c1.87,12.18,4.12,23.92,8.54,34.67c1.79,4.36,3.96,8.33,6.84,12.46", "M57.12,19.25c0.88,2.12,1.06,3.79,0.62,5.88c-3.12,15-13.14,39.81-18.12,48.62c-11.87,21-20.62,1.25-20.62-4.5c0-22.63,43.75-44.25,62.36-29.59c7.66,6.03,9.8,14.58,9.14,23.34c-2,26.75-32.88,28.38-32.88,16.88c0-9.38,17.38-7.12,27.12-1.12c3.1,1.91,7.25,5.25,9.5,7.5"],
  "ね": ["M33.29,14.5c1.62,1.62,2.1,3.21,1.88,5.88c-1.03,11.93-2.06,31.66-2.53,53.12c-0.1,4.62-0.18,9.31-0.22,14", "M17.16,37.88c1.62,0.88,3.25,1.38,5.62,0.75c2.14-0.56,7.8-2.31,12.37-4.03c6.26-2.35,6.88-1.47,3.12,3.63c-5.56,7.53-13.02,17.38-18.48,26.77c-5.6,9.62-3.45,8.3,2,3c19.12-18.62,38.5-39.12,54.12-39.12c11.38,0,12.88,11.25,12.88,32.5c0,28.62-30.18,24.88-30.18,16.26c0-9.63,18.73-7.82,28.06-1.88c2.75,1.75,5.88,4.88,7.5,6.75"],
  "の": ["M53.82,28.62c1,1.5,1.34,4.12,0.88,6.62c-1.75,9.5-6.89,25-10.75,33.12c-9.63,20.26-16.55,14.74-24.38-1.98c-9.13-19.5,23.5-48.88,50.63-40.38c32.38,10.15,28,54.62-4.75,60.88"],
  "は": ["M24.51,18c1.25,1.5,2.15,4,1.62,6.62c-3.5,17.62-6.98,36.4-4,54.88c2.5,15.5,1.12,2,5.62-6.25", "M49.64,37.89c2.41,1.57,4.85,2.16,7.8,1.71c9.36-1.43,17.46-2.94,23.4-4.57c3.12-0.86,5.96-1.29,7.8-1.29", "M69.77,16.5c2.25,2.12,2.88,4.12,2.88,6.5c0,2.38,1.5,38.62,1.5,48c0,22.5-30.62,19.62-30.62,10.5c0-9.75,23.88-5.62,29.5-2.88c5.62,2.74,11.98,8.26,13.36,9.38"],
  "ひ": ["M20,25.12c1.25,0.88,3.75,2.25,6.5,1.38c2.75-0.87,7.31-2.38,11.38-4.5c6-3.12,8.42-1.01,4.25,4c-27.13,32.62-23.76,58.5-1.52,62.88c18.07,3.56,37.63-16.38,35.63-56.51c-0.72-14.5-0.17-14.78,4.12-1.75c3.76,11.38,10.26,20.76,16.14,26.5"],
  "ふ": ["M42.63,15.62c3.62,3.38,7.5,5.38,12.74,6.13c9.59,1.37,3.5,3.38-1.88,6.12", "M43.63,46.88c1.88,4.62,7.5,9.41,14.25,17.5c10.62,12.74,0.49,30-19.13,21.62", "M16.5,73.38c0.75,4,1.88,8.12,5,10.12c1.16,0.74,0.12-3.38,13.25-9.12", "M80.13,61.88c5.12,3.38,10.28,7.49,11.38,8.88c6.75,8.5-0.25,4.62-4.62,7.12"],
  "へ": ["M15,48.75c2.25,1.62,4.67,1.96,7-0.38c3.62-3.62,7.46-6.54,11.25-10.5c5.5-5.75,8.48-4.75,13.12-0.88c12.12,10.12,30.38,25.12,33.38,27.38c3,2.26,12.37,10.38,13.87,11.63"],
  "ほ": ["M24.51,18.75c1.25,1.5,2.15,4,1.62,6.62c-3.5,17.63-6.98,37.4-4,55.88c2.5,15.5,1.12,2,5.62-6.25", "M53.08,21.13c1.9,1.28,3.82,1.76,6.14,1.4c7.36-1.17,13.73-2.4,18.41-3.73c2.46-0.7,4.69-1.05,6.13-1.05", "M53.83,44.3c2.21,1.44,4.46,1.98,7.16,1.57c8.59-1.31,15.78-2.44,21.23-3.94c2.87-0.79,5.72-1.18,7.41-1.18", "M72.51,23c1.38,1.62,1.62,4.12,1.62,6.5c0,2.38,2,35.12,2,44.5c0,17.5-29.88,17.12-29.88,8c0-9.75,21.38-7.88,29.5-2.88c5.33,3.28,12,8.25,13.38,9.38"],
  "ま": ["M29.83,32.28c2.2,1.15,4.43,1.5,7.14,1.26c11.54-1.04,25.94-3.12,34.66-4.85c2.87-0.57,5.45-0.44,7.13-0.44", "M33.83,51.84c2.45,1.61,4.94,1.72,7.94,1.26c9.52-1.46,17.87-3.1,27.03-5.16c3.22-0.72,6.34-1.32,8.21-1.32", "M55.81,14c1.52,1.8,1.8,4.57,1.8,7.19c0,2.63,0.46,43.88,0.46,54.25c0,21.3-30.07,19.96-30.07,9.86c0-10.79,25.88-9.93,38.57-3.18c6.12,3.25,11.55,6.38,14.8,9.13"],
  "み": ["M32.5,26c1.88,1.75,4.06,1.7,6.88,1.25c3.88-0.62,7.62-1.75,11.88-3.12c4.26-1.37,6.25-0.12,4.5,5.12c-1.75,5.24-6.66,17.39-12,30.12c-13.63,32.51-29.26,29.26-29.26,18.63c0-14.25,20.48-15.36,33-13.5c18.5,2.75,30,6.62,44.38,14.25", "M79.38,54.75c0.75,2.38,0.49,4.37,0,6.25c-2.12,8.12-7.5,25-22.12,33.75"],
  "む": ["M19.59,31.65c2.1,1.55,4.24,1.66,6.81,1.21c8.17-1.41,15.33-2.98,23.19-4.96c2.76-0.69,5.44-1.27,7.05-1.27", "M37.02,15.5c1.62,1.25,2.31,2.88,2.12,5.25c-0.88,11.12-1.5,20.75-4,34.88c-3.61,20.44-19.25,16.99-18.62,7.37c0.5-7.74,6.25-12.86,12.62-13.5c5-0.5,14.28,1.93,5.88,15c-12.62,19.62-11.42,24.51,5.11,25.54c10.98,0.68,19.26,0.72,28.49-0.92c14.15-2.5,7.4-2.63,7.4-11.13", "M78.52,36.25c6.88,3.12,11.71,5.95,14.88,10.12c6.25,8.25-1.38,3.62-4.5,4.5"],
  "め": ["M27.48,31.75c1.75,1,2.41,3.09,2.5,5.25c0.5,11.62,2.75,23.5,7.25,31.38c1.39,2.44,5.38,8.5,7.25,10.38", "M59.6,19.38c1,1.5,1.35,4.12,0.88,6.62c-2.75,14.62-13.62,37.75-20.1,47.24c-12.28,17.14-16.78,13.14-22.28,0.64c-5.38-15.38,26.4-42.18,53.42-35.28c29.08,8.27,23.96,46.02-7.98,50.15"],
  "も": ["M49.17,14.75c1.88,1.88,1.86,4.52,1.12,8c-3,14.25-5,26.62-7,42.12c-2.55,19.73-0.75,29.88,17,29.86c20.25-0.02,28.63-13.11,20.01-35.73", "M26.54,34.62c1.12,0.88,2.87,2.21,6,2c11.12-0.75,20-2.12,27.74-3.46c3.88-0.67,5.88-1.17,8.88-1.04", "M26.42,53.38c-1.5,4,1,6.75,7.75,6.75c8.75,0,17.62-1,22.88-1.88c2.01-0.33,5.38-1,7.5-1.75"],
  "や": ["M18,49.38c1.88,1.62,5.25,2.5,8.62,0.88c18.51-8.88,35.76-19.38,50.83-19.26c9.02,0.14,16.01,4.13,15.93,12.29c0,8.33-10.88,16.58-24.5,17.83", "M47.13,15.88c5.12,0.88,10.41,4.05,11.5,6.62c2.12,5-1,2.38-2.88,2.62", "M30,24.38c2.38,1.88,3.28,2.87,3.88,5.25c2.62,10.5,11.12,41.12,14.75,52.5c0.65,2.04,1.88,6.25,2.88,9.38"],
  "ゆ": ["M21.05,25.38c1.38,1.5,2.02,4.13,1.5,6.25c-2.88,11.75-4,22.25-2.12,35c2.77,18.85,1.12,3.88,3.25-1.5c9-22.75,27.24-34.5,44.38-34.5c16.88,0,21.88,11.38,21.88,20.25c0,27.38-30.88,29.62-43,16.75", "M58.42,16.75c2.62,1.75,3.17,3.13,3.5,7.12c0.88,10.5,1.4,18.72,1.62,29.38c0.5,24-6.25,32-12.38,39.25"],
  "よ": ["M58.24,35.38c7.5-1.28,13.74-2.63,18.5-4.1c2.5-0.77,4.77-1.15,6.25-1.15", "M54.62,13.88c2.25,2.12,2.98,4.13,2.88,6.5c-0.75,17-0.12,34.88,1.39,53.5c1.88,23.07-34.89,20.88-34.89,11.5c0-12,26.25-8,35.98-4.12c8.1,3.23,11.52,4.88,18.52,10.38"],
  "ら": ["M35.33,15c3.75,3,9.22,4.41,16.5,4.25c11.12-0.25-0.25,2.38-1.25,3.5", "M35.83,35.75c-2.14,4.34-2.79,8.67-3.11,13.24c-0.42,5.84-0.31,12.05-2.14,19.13c-3.16,12.27,1.49,4.77,3,3.5c11.88-10,21.7-12.67,32.61-12.49c9.21,0.15,16.85,5.19,16.76,13.88c-0.12,13.6-14.24,21.49-32.49,22.49"],
  "り": ["M38.75,25.25c1.25,1.5,2.24,4.03,1.62,6.62c-2.88,12.13-6.29,29.65-4.25,42.38c2,12.5,1.75-0.75,5.62-6.25", "M69.37,18.75c2.25,2.12,2.88,4.12,2.88,6.5c0,2.38,0,26.38,0,35.75c0,16.5-5,25.75-12.62,33.12"],
  "る": ["M34.31,20.38c1.75,1.25,4.62,2.62,8.5,1.5c3.88-1.12,9.62-2.5,15.62-4.62c6-2.12,7.5-0.12,4.38,4.25c-3.12,4.37-18.89,24.62-27.75,34c-8.5,9-13.09,11.89,0.75,3.25c15.62-9.75,43-10.88,43,13.38c0,22.5-40.88,24.5-40.88,12.62c0-11.25,18.12-8.75,24.38-0.38"],
  "れ": ["M34.48,13c1.5,1.38,2.83,3.74,2.5,6.38c-0.5,4-2.75,44.5-2.75,52.88c0,8.38,0.12,16.62,0.12,19.5", "M16.98,40.75c2.12,1.38,3.74,1.46,7.5,0c4.5-1.75,6.55-2.66,13-5.5c4.25-1.88,4.4,0.24,2.5,3.5c-5.25,9-10.5,16.75-18.88,27.62c-7.55,9.81-6.93,12.85,3.25,3.12c14-13.38,20.34-19.76,33.88-32.5c6.38-6,19.39-12.09,18.14,0.88c-1.02,10.63-1.89,22.13-2.29,30.75c-1.02,21.71,11.53,18,20.15,8.63"],
  "ろ": ["M36.95,21.88c1.5,2,4.62,3.62,8.5,2.5c3.88-1.12,8.12-2.25,14.12-4.38c6-2.13,6.53-0.1,3.38,4.25c-7.88,10.88-18,22.75-27.5,35.25c-7.49,9.86-10.68,11.32,2.88,2.25c17.38-11.62,46.62-14,46.62,8.12c0,15.62-16,22.5-32.12,25.12"],
  "わ": ["M38.53,14.75c1.5,1.38,2.22,3.73,2,6.38c-1,11.87-2.75,44.49-2.75,52.87c0,8.38-0.62,16.62-0.62,19.5", "M17.53,40.75c2.12,1.38,3.68,1.3,7.5,0c5.88-2,9.8-3.16,16.25-6c4.25-1.88,6.12,0,2.75,4c-6.72,7.96-13,16.5-22.12,27.88c-7.75,9.66-7.54,12.21,3,2.88c21.88-19.38,49.75-35.62,63.5-21c14.36,15.27,1.62,36.62-23.38,42.62"],
  "を": ["M28.56,27.87c1.62,1.13,3.17,1.64,6.01,1.12c10.86-1.99,16.74-3.37,24.71-4.72c3.64-0.62,5.65-0.93,8.4-0.75", "M49.93,14.38c0.75,1,1.48,3.22,0.38,5.62c-4.62,10.12-10,20.75-17.12,30.25c-9.25,12.33-9.25,11.19,2.12,2.5c9-6.88,23.75-12.12,22.88,19.88", "M83.06,39.88c0.62,1.75,0,4-3,5.75c-3,1.75-49.62,24.16-44.75,38.25c3.28,9.48,17.93,9.12,29.98,7.75c4.48-0.51,9.15-1.12,12.4-1.75"],
  "ん": ["M56.35,16.5c0.75,1.75,1.13,5.83-0.38,8.25c-7,11.25-27.22,43.47-33.88,54.37c-9,14.75-7.62,16.25,1.5,1.25c17.86-29.36,32-23.76,32-6.75c0,25,19,26.5,34.25-5"],
  "ア": ["M23.5,26.25c2.41,1.56,3.98,1.44,8.51,0.75c11.4-1.75,37.77-5.5,48.28-6.78c5.23-0.64,7.99,2.06,2.62,6.04c-6.75,5-13.12,9.5-23.25,16", "M53.12,41.12c0.79,1.5,1.02,3.24,0.58,5.28c-4.04,18.48-9.92,31.85-19.92,45.48"],
  "イ": ["M69.75,16.75c0.12,1.75-0.34,3.86-1.62,5.5c-10.13,12.87-23.75,29.63-45.63,42.87", "M56.38,43.88c1,1.12,1.25,3,1.25,4.62c0,1.62,0,32.75,0,34.62c0,1.87-0.13,9.13-0.13,11.76"],
  "ウ": ["M53.25,14.62c1,1.12,1.25,3,1.25,4.62c0,1.62,0,10.76,0,12.64", "M26.5,31.25c1,1.12,1.22,3,1.25,4.62c0.09,4.45,0.29,10.95,0.45,16.37c0.07,2.5,0.14,4.77,0.18,6.5", "M29.12,35.88c19.38-2.25,40.25-4.25,49-5.5c8.75-1.25,8.28,0.84,6.25,6.88c-5,14.88-20.12,43.5-41,56.62"],
  "エ": ["M31.87,35.68c2.32,0.71,5.14,0.66,7.48,0.29c8.57-1.35,22.4-2.85,33.66-3.85c2.26-0.2,4.52-0.19,6.77,0.22", "M53.34,38.13c1,1.12,1.31,3,1.25,4.62c-0.18,4.74-0.51,12.89-0.83,22.25c-0.08,2.31-0.16,4.7-0.23,7.12", "M19,75.46c3.41,0.94,7.57,0.88,11.01,0.39c17.78-2.48,34.53-3.86,50.55-3.9c3.34-0.01,7.23,0.42,10.46,1.8"],
  "オ": ["M19.5,37.85c3.91,1.78,7.55,1.55,11.01,1.02c18.03-2.75,34.4-4.5,50.55-5.41c3.34-0.19,6.35,0.17,10.46,1.38", "M60.38,16.38c1.32,1.49,1.65,3.97,1.65,6.12c0,8-0.25,46.23-0.25,58.63c0,20.38-5.88,7.5-9.25,5.5", "M60.29,36.38c0,1.62-1.64,3.61-3.62,6c-7.88,9.5-21.12,22.75-34.62,33"],
  "カ": ["M25.5,40.62c1.88,1.25,4.51,1.87,7.12,1.5c17.88-2.5,32.78-4.51,42.5-5.88c7.12-1,10.59,0.24,8.62,7.88c-2.12,8.25-4.47,17.81-9.25,29.12c-10.49,24.88-14.11,14.51-19.24,11.88", "M55.88,17.12c0.88,1.62,1.29,3.83,0.75,6.75c-4.25,22.88-15.88,45.25-30.25,58.88"],
  "キ": ["M27,40.5c1.75,0.62,4.77,1.09,7.25,0.38c11.75-3.38,30.62-8.13,37.5-9.88c2.62-0.67,6.75-1.12,9-1", "M19.5,65.8c2.28,0.84,6.24,1.18,9.46,0.17c17.79-5.59,32.67-9.09,49.17-12.99c3.43-0.81,8.81-1.52,11.74-1.35", "M48.87,16.75c2.5,1.75,3.43,3.24,3.88,6.12c2.12,13.62,6.38,45.38,8.25,59.25c0.4,3,1,8.38,1.38,11.12"],
  "ク": ["M50,19.62c0.38,1.5,0.34,3.48-0.5,5.12c-4.12,8.12-7.88,15.5-16.12,24.12", "M51.25,28.62c2.62,0.25,5.67-0.39,7.62-0.88c6-1.5,9.75-2.38,15.12-3.88c5.79-1.62,7.53-0.42,5.12,4.88c-10.36,22.88-26.24,44.14-48.61,60.51"],
  "ケ": ["M40.96,17.88c0.44,1.9,0.39,4.42-0.59,6.5c-4.82,10.31-9.21,19.67-18.87,30.62", "M37.88,37.62c2.12,0.88,4.15,1.04,6.62,0.5c12.62-2.75,25.5-4.88,35.75-6.5c3.61-0.57,6.25-0.75,9.25-0.5", "M64.46,38.88c0.44,1.9,0.5,4.27-0.08,6.5c-3.63,13.75-9.25,31.25-24.63,43.87"],
  "コ": ["M30.13,35c1.75,1,3.01,2.18,6.5,1.62c14.25-2.25,29.62-4.25,37.38-5.5c9.37-1.51,9.88,0.25,8,7.5c-2.77,10.71-5.25,22.12-7,34.88", "M27.5,77.38c2.62,1.12,4.38,1.51,8.25,1c11.38-1.5,22.62-3,33.75-3.38c4-0.13,5.88,0,9.62,0.5"],
  "サ": ["M16.5,44.34c2.84,1.27,4.77,1.91,8.93,1.13c17.2-3.22,40.45-5.35,58.53-5.34c4.33,0,6.92,0.37,10.42,0.82", "M36.63,23.38c1.12,1.38,1.19,2.5,1.25,4.75c0.25,9,0.38,20.25,0.75,28.88c0.14,3.25,0.38,7.12,0.38,9.25", "M69.63,16.62c1.5,2,1.62,2.87,1.62,6.25c0,8.25-0.16,9-0.16,15.88c0,23.25-9.34,42.5-23.21,53"],
  "シ": ["M39.87,19.75c5.14,1.57,9.79,6.01,11.5,8.62", "M26,42.62c3.25,0.88,10.25,5.5,12.25,8.13", "M33,85c3.75,0.88,7.12,0.49,10.38-1.38c17.87-10.24,32.37-23.87,46.12-42.87"],
  "ス": ["M30.13,29.38c1.75,1.5,4.15,1.98,6.62,1.38c13.25-3.25,24.25-5.62,31.25-7.38c7-1.76,8.64,1.16,6.5,5.75c-11.24,24.12-28.37,45.87-53.5,57.25", "M61,57.25c11,7.38,21,17,28,28.62"],
  "セ": ["M17,49.38c3.12,1.5,5.04,2.18,8.62,1.38c23.5-5.25,31.24-7.43,50.62-11.62c23.12-5,6.5,7.75-3.25,18.12", "M42.38,19.5c2,2.25,2.15,3.5,2.12,6.62c-0.12,17.5-0.88,31.75-0.88,41.12c0,14,3.13,16.99,12.38,17.12c8.38,0.12,14.12,0.12,18,0.12c3.88,0,7.5-0.5,10.5-1.12"],
  "ソ": ["M23.5,25.5c3.92,4.1,7.71,9.93,10.75,17.88", "M83.5,21c1.25,2.5,1.3,4.44,0.12,8.5c-5.87,20.38-26.24,49.5-45.62,61.25"],
  "タ": ["M48.83,19.75c0.43,1.72,0.39,4-0.58,5.89c-4.77,9.34-9.1,17.82-18.63,27.73", "M49.75,30.38c2.75,0.5,5,0,7.62-0.62c6.02-1.43,10.5-2.62,15.88-4.12c5.79-1.62,8.22,0.31,5.88,5.62c-10.88,24.62-22.13,43.99-50.13,59.99", "M43.38,45.62c6.75,3.5,10.62,7.88,14.75,15.25"],
  "チ": ["M69.76,15.25c-0.38,2.62-2.01,4.37-3.88,5.38c-7.88,4.25-18.62,9.75-35.5,13.25", "M18.5,51.5c2.88,0.88,4.39,1.65,7.88,1.25c22-2.5,36.38-4.25,56.12-4.88c4.88-0.15,7.88,0.51,10.88,1.51", "M54.88,30.75c0.88,0.75,1.75,2.49,1.75,4.75c0,6.03,0.03,11.25,0.03,18.27c0,14.98-5.03,29.48-16.53,39.23"],
  "ツ": ["M21.5,31.38c2.38,3,4.5,9.38,4.88,13.88", "M45.62,23.75c3.38,3.5,6.62,9.5,7,14.88", "M84.62,27.88c0.75,2.25,0.39,5.26-0.75,8c-7.63,18.37-21.25,41.12-46,52.5"],
  "テ": ["M36.5,21.5c2.12,1.25,4.38,1.59,7.25,1.25c10.62-1.25,16.88-2.25,24.62-3.25c3.73-0.48,5.63-0.5,8.13-0.25", "M20,44.12c2.88,1,5.26,1.05,7.5,0.75c22.38-3,37-5.62,54.13-6.12c5.62-0.16,7.75,0,10.38,0.62", "M58,43.25c0.88,1,1.32,2.63,1.12,4.38c-1.74,15.37-11.62,34.99-24.62,41.87"],
  "ト": ["M44,16.38c1.25,1.12,2.12,3.25,2.12,5.5c0,26.12,0,53.5,0,57.62c0,4.12,0,10.5,0,13.38", "M49.24,43.12c11.75,4.12,18.25,10.62,24.5,18.75"],
  "ナ": ["M18.5,44.12c2.62,1,4.77,1.17,9.12,0.5c19.38-3,37.75-4.75,52.38-5.62c3.75-0.22,8.88-0.25,11.88,0.12", "M53.26,14.5c1.75,1.25,2.75,3,2.75,6c0,3,0.12,21.5,0.12,24.25c0,20-6,37.62-18.38,49.12"],
  "ニ": ["M32.63,34.69c2.5,1.19,4.33,1.6,7.45,1.35c11.55-0.91,18.3-2.41,27.04-3.18c2.64-0.23,6.27-0.16,8.39,0.08", "M20,74.88c2.62,1,4.78,1.45,9.12,0.75c20.25-3.25,36.5-3.88,52.38-3.88c3.75,0,8,1,11.12,2.38"],
  "ヌ": ["M33.38,27.62c2.75,1.25,5.38,1.16,8.5,0.62c10.12-1.75,19-3.12,28.62-5c6.67-1.3,7.75-0.12,5.38,5.62c-6.7,16.22-20.63,40.52-48.88,57.89", "M44.88,46.38c12,6.75,22.38,15.38,30.62,28.12"],
  "ネ": ["M51.38,12.38c3.38,2.12,8,5.88,11,10.88", "M26.88,36.16c2.62,1.46,5.45,1.93,8.5,1.19c10.75-2.6,20.75-4.98,30.88-7.5c6.53-1.62,7.81,1.27,4.62,4.68c-11.63,12.47-22.76,23.35-48.88,37.97", "M54.38,54.12c1.38,1.75,1.62,3.5,1.62,6c0,2.5,0,27.5,0,29.38c0,1.88,0,4,0,6.88", "M65.38,53.62c12.5,6,19.88,11.75,24.88,18.88"],
  "ノ": ["M72.37,25.25c0.75,2,0.92,4.89,0.25,7.25c-7.12,25-25.38,44.75-43.62,56.88"],
  "ハ": ["M39.33,36.88c0.38,1.14,0.46,2.88-0.12,4.14c-6.33,13.73-13.33,23.86-22.21,32.23", "M65.5,36.38c13,9.12,23.12,22.62,28,33.38"],
  "ヒ": ["M35.38,44.5c1.75,1.38,4.51,2.19,6.88,1.88c10.24-1.38,17.24-2.88,24.24-4.26c3.01-0.59,7.12-1,9.38-0.88", "M31,17.62c1.38,1.26,1.88,3.38,1.88,6.13c0,2.75-0.88,44-0.88,47.25c0,9.75,4,14.62,13.75,14.62c6,0,16.38,0.12,21.38,0c5-0.12,9.5-0.62,13.5-1.5"],
  "フ": ["M24.5,30c1.88,1.88,3.5,2.04,6.5,1.62c14.5-2,29-4.38,43.75-6.88c6.82-1.16,10.58,2.29,6.88,9.12c-10.38,19.14-21.25,39.52-50.01,53.64"],
  "ヘ": ["M15.5,49.02c2.78,1.55,5.39,0.64,6.95-0.9c4.05-4.01,9.47-8.3,12-10.88c3.16-3.23,7.32-5.26,12.01-1.16c11.25,9.82,25.03,21.45,35.78,30.36c4.28,3.55,7.71,6.85,11.25,9.56"],
  "ホ": ["M22.63,40.38c2.62,1,4.75,1.71,9.12,1.25c17.75-1.88,29.25-2.75,45.38-3.88c3.74-0.26,7.38-0.12,11.12,0.62", "M53.75,17.12c1.38,1.88,1.38,4.5,1.38,7.38c0,2.88-0.12,46.62-0.12,51.88c0,23.12-6.25,11.25-9.75,9.62", "M27.38,59.38c0.5,9.25-1.38,16.62-6.38,21.88", "M73.25,52.75c10.88,9.63,15.5,17.63,16.63,24.87"],
  "マ": ["M21.5,33.75c1.88,1.88,3.5,1.99,6.5,1.62c19.62-2.38,33.5-4,51.25-6.38c6.85-0.92,9.37,1.67,4.38,7.62c-7.12,8.5-17.88,20-28.75,31.62", "M43.38,58.88c8.43,6.5,16.6,15.93,20.25,26.25"],
  "ミ": ["M41.87,20c10.4,2.57,20.5,6.3,25,10.38", "M42,46.88c10.72,2.69,21.11,6.6,25.75,10.88", "M36.5,75c15.71,4.49,30.95,11,37.75,18.12"],
  "ム": ["M53.84,22.5c0.88,1.75,0.78,4.57-0.38,6.88c-9.25,18.38-16.19,30.96-25.25,45.75c-3.75,6.12-3,8.38,4.38,7.12c7.38-1.26,46.62-8.12,49.62-8.88", "M72.21,60.12c6.88,6.38,13.62,14.88,16,25.38"],
  "メ": ["M73.38,19.12c0.88,1.75,0.48,4.44-0.38,6.88c-7.75,22.12-21.75,47.62-45,62.88", "M39.51,39.5c16.54,7.76,32.12,18,38.5,30.88"],
  "モ": ["M27.88,26.19c2.5,1.19,4.33,1.6,7.45,1.35c11.55-0.91,21.93-2.16,32.79-3.93c2.62-0.42,6.27-0.41,8.39-0.17", "M17.5,54.38c2.62,1,4.78,1.45,9.12,0.75c20.26-3.25,33.88-5.38,51.64-6.13c3.75-0.16,7.38,0.25,11.12,0.88", "M48.76,29.88c1.12,1.62,1.42,3.62,1.42,6.12c0,6.53-0.65,33.56-0.65,35.88c0,7.67,3.09,11.08,10.53,11.76c5.33,0.49,12.31,0.24,16.37,0c4.46-0.26,6.52-0.74,9.59-1.43"],
  "ヤ": ["M18,45.75c2.12,1.62,6.15,2.35,10.12,1.38c18.88-4.62,33.39-7.83,48.88-11.88c22-5.75,1.5,14.25-2.75,20", "M38.47,19.38c1.65,1.4,2.54,2.67,3.18,5.21c0.64,2.54,11.95,52.9,12.59,55.57c0.64,2.67,2.16,9.16,3.05,12.46"],
  "ユ": ["M29.5,35.38c2.38,1.5,5.14,2.08,9.25,1.5c13.25-1.88,18.02-2.4,27.62-4c6.75-1.12,7.78,0.16,6.5,6.38c-2.38,11.5-4.88,24.5-6.5,34.5", "M17,76.88c2.75,1.5,4.76,2.05,9.12,1.5c22.62-2.88,36-3.88,54.12-3.88c3.75,0,7.38,0.5,11.12,1.12"],
  "ヨ": ["M29.13,30.12c2.38,1.5,5.12,1.98,9.25,1.5c14-1.62,26.71-3.04,36.38-4.25c6-0.75,6.88,0.5,6.5,6.38c-1,15.51-1.89,30.63-3.01,42.25", "M29.25,52.88c2.38,1.5,5.12,1.98,9.25,1.5c10.5-1.22,22.81-2.29,31.11-3.04c2.77-0.25,5.27,0.04,7.77,0.54", "M23.5,78.84c2.75,1.3,4.74,1.68,9.12,1.3c12.5-1.08,29.37-2.9,41.38-2.9c3.38,0,5.62,0,9.38,0.54"],
  "ラ": ["M38.63,21.06c2.07,1.86,4.43,2.53,8.05,2.15c9.2-0.96,14.34-2.01,21.57-2.95c2.41-0.31,4.13-0.53,6.51-0.19", "M26,41.89c2.38,1.7,5.12,2.24,9.25,1.7c14-1.84,31.21-4.95,40.88-6.32c6-0.85,8.14,0.62,6.25,5.72c-6.88,18.62-22,38.25-45.25,48.62"],
  "リ": ["M35,18.38c1.12,1.5,1.62,3,1.62,4.88c0,1.88,0,25,0,27c0,2,0,6.12,0,7.75", "M71,15.38c1.5,1.25,2.38,3.12,2.38,5.38c0,2.26-0.12,28.88-0.12,32.88c0,19.62-9.5,32.25-21.75,40.38"],
  "ル": ["M34.38,31.88c1.12,1.5,1.72,3,1.62,4.88c-1.12,22.88-8.88,40.62-17.5,49.5", "M56.51,19.62c1.5,1.25,2.38,3.12,2.38,5.38c0,2.26-0.12,47.62-0.12,51.62c0,10.5,0.52,10.21,9.38,2.75c9.5-8,16.5-14.62,26.38-25.62"],
  "レ": ["M34.5,19.75c1.5,1.25,2.38,3.12,2.38,5.38c0,2.26-0.12,50.12-0.12,54.12c-0.02,8.75-0.14,8.63,9.36,3.75c13.23-6.79,33.38-22.5,43.25-33.5"],
  "ロ": ["M25,33.25c1.5,1.25,2.16,3.14,2.38,5.38c0.96,10.07,2.14,23.67,3.14,34.88c0.31,3.4,0.59,6.58,0.86,9.38", "M28.13,36.12c9.25-1,37.62-3.12,45.62-4.25c8-1.13,9.57,0.53,8.38,6.62c-2.13,10.89-4.13,21.89-6.75,34.89", "M32,78.12c5.38-0.5,33.62-3,36.5-3c2.88,0,7.88-0.25,11.5,0.25"],
  "ワ": ["M25,23.62c1.5,1.25,2.16,3.14,2.38,5.38c0.96,10.07,0.89,8.17,1.89,19.38c0.31,3.4,0.59,6.58,0.86,9.38", "M27.75,26.38c3.12,0.38,5.16,0.22,8.23-0.06c13.77-1.29,27.15-2.32,41.65-3.7c8.04-0.76,9.44,0.51,8.38,6.62c-4.76,27.26-20.64,47.64-43.88,61.51"],
  "ヲ": ["M30.24,25.14c2.38,1.7,5.11,2.13,9.25,1.7c12.32-1.29,21.94-2.6,30.48-3.64c2.81-0.34,5.51-0.65,8.14-0.93", "M29,46.69c2.25,1.44,4.44,1.9,8.05,1.4c8.19-1.15,19.93-2.64,28.56-3.79c2.38-0.31,4.65-0.62,6.75-0.92", "M78,22.88c0.88,2,0.62,4.64,0.12,7c-4.88,22.5-23.5,47.12-44.12,60.74"],
  "ン": ["M26.5,24.88c5.76,2.15,12.68,8.47,15.75,14.25", "M28.62,83.75c2.5,1.62,5.12,0.96,7.75-0.62c20.13-12.13,35-24.63,49.63-41.13"]
};
const supportsWriting = (language) => ["ja", "ru", "el"].includes(language);
const languages = [
  { id: "ja", name: "日语", subtitle: "从五十音开始", sample: "あ" },
  { id: "ru", name: "俄语", subtitle: "认识流畅的手写体", sample: "д" },
  { id: "el", name: "希腊语", subtitle: "写下新的字母", sample: "α" },
  { id: "hy", name: "亚美尼亚语", subtitle: "", sample: "ա" },
  { id: "ka", name: "格鲁吉亚语", subtitle: "", sample: "ა" },
  { id: "ko", name: "韩语", subtitle: "", sample: "ㄱ" },
  { id: "vi", name: "越南语", subtitle: "", sample: "ă" }
];
const hiragana = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん";
const readings = "a i u e o ka ki ku ke ko sa shi su se so ta chi tsu te to na ni nu ne no ha hi fu he ho ma mi mu me mo ya yu yo ra ri ru re ro wa wo n".split(
  " "
);
const russian = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя";
const greek = "αβγδεζηθικλμνξοπρστυφχψω";
const greekNames = "alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omicron pi rho sigma tau upsilon phi chi psi omega".split(
  " "
);
const russianHints = {
  д: "注意手写体的环形与下伸部分，不要照抄印刷体。",
  т: "当前范字采用短横加下行笔的写法；拱形连笔也是常见变体。",
  п: "留意起笔与拱形，不要与 т、и 混淆。",
  и: "留意两侧笔画与中间连接的走向。",
  ш: "数清连续起伏，注意与 и、щ 的区别。",
  щ: "末端有下伸部分，注意与 ш 区分。",
  й: "上方短弧是字母的一部分，不要漏写。",
  ё: "上方两点是字母的一部分，不要漏写。",
  ь: "留意竖画与下方的环形。",
  ы: "注意两部分的间距与比例。"
};
const referenceGlyphs = [];
function addLetters(language, letters, names, capitals = false) {
  letters.forEach((text, i) => {
    referenceGlyphs.push({
      id: `${language}-${text}`,
      text,
      language,
      group: "lower",
      name: names[i],
      hint: ""
    });
    if (capitals) {
      const upper2 = text === "և" ? "ԵՎ" : text === "ու" ? "Ու" : text.toUpperCase();
      referenceGlyphs.push({
        id: `${language}-${upper2}`,
        text: upper2,
        language,
        group: "upper",
        name: names[i],
        hint: ""
      });
    }
  });
}
addLetters(
  "hy",
  "ա բ գ դ ե զ է ը թ ժ ի լ խ ծ կ հ ձ ղ ճ մ յ ն շ ո չ պ ջ ռ ս վ տ ր ց ու փ ք և օ ֆ".split(" "),
  "ayb ben gim da yech za e yt to zhe ini lyun khe tsa ken ho dza ghat che men hi nu sha vo cha pe je ra se vev tyun re tso u pyur ke yev o fe".split(
    " "
  ),
  true
);
addLetters(
  "ka",
  [..."აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ"],
  "an ban gan don en vin zen tan in kan las man nar on par zhan rae san tar un phar khar ghan qar shin chin tsan dzil tsil char khan jhan hae".split(
    " "
  )
);
addLetters(
  "ko",
  [..."ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ"],
  "giyeok ssanggiyeok nieun digeut ssangdigeut rieul mieum bieup ssangbieup siot ssangsiot ieung jieut ssangjieut chieut kieuk tieut pieup hieut a ae ya yae eo e yeo ye o wa wae oe yo u wo we wi yu eu ui i".split(
    " "
  )
);
addLetters(
  "vi",
  [..."aăâbcdđeêghiklmnoôơpqrstuưvxy"],
  [
    "a",
    "á",
    "ớ",
    "bê",
    "xê",
    "dê",
    "đê",
    "e",
    "ê",
    "giê",
    "hát",
    "i",
    "ca",
    "e-lờ",
    "em-mờ",
    "en-nờ",
    "o",
    "ô",
    "ơ",
    "pê",
    "cu",
    "e-rờ",
    "ét-sì",
    "tê",
    "u",
    "ư",
    "vê",
    "ích-xì",
    "i dài"
  ],
  true
);
const glyphs = [
  ...referenceGlyphs,
  ...[...hiragana].flatMap(
    (c, i) => [c, String.fromCharCode(c.charCodeAt(0) + 96)].map((text, j) => ({
      id: `ja-${text}`,
      text,
      language: "ja",
      group: j ? "katakana" : "hiragana",
      name: readings[i],
      hint: "观察笔画的先后、方向与位置，再独立书写。",
      paths: kana[text]
    }))
  ),
  ...[...russian].flatMap(
    (c) => [c, c.toUpperCase()].map((text, i) => ({
      id: `ru-${text}`,
      text,
      language: "ru",
      group: i ? "upper" : "lower",
      name: `${c.toUpperCase()} · ${c}`,
      hint: russianHints[c] || "对照手写范字，留意转折、连接与整体比例。"
    }))
  ),
  ...[...greek, "ς"].flatMap(
    (c, i) => (c === "ς" ? [c] : [c, c.toUpperCase()]).map((text, j) => ({
      id: `el-${text}`,
      text,
      language: "el",
      group: j ? "upper" : "lower",
      name: c === "ς" ? "sigma · 词尾形式" : greekNames[i],
      hint: c === "ς" ? "ς 是小写 sigma 位于词尾时的形式。" : "观察手写字形的弧线、开口与上下伸展。"
    }))
  )
];
const groups = (language) => language === "ja" ? [
  { id: "hiragana", name: "平假名" },
  { id: "katakana", name: "片假名" }
] : [
  { id: "lower", name: "小写" },
  { id: "upper", name: "大写" },
  { id: "mixed", name: "大小写混合" }
];
const poolFor = (language, group) => glyphs.filter((g) => g.language === language && (group === "mixed" || g.group === group));
const fontFor = (g) => g.language === "ru" ? "Bad Script" : "Playpen Sans";
function validAnswer(a) {
  return !!a && glyphs.some((g) => g.id === a.id) && typeof a.text === "string" && Number.isFinite(a.score) && a.score >= 0 && a.score <= 100 && typeof a.correct === "boolean" && ["match", "different", "uncertain", "skipped"].includes(a.status) && (a.type === "write" ? Array.isArray(a.strokes) && a.strokes.length <= 128 && a.strokes.every(
    (s) => Array.isArray(s) && s.length <= 2048 && s.every(
      (p2) => p2 && Number.isFinite(p2.x) && Number.isFinite(p2.y) && p2.x >= 0 && p2.x <= 1 && p2.y >= 0 && p2.y <= 1
    )
  ) : a.type === "choice" && (a.chosenID === null ? a.status === "skipped" : glyphs.some((g) => g.id === a.chosenID)));
}
function shuffle(values, random = Math.random) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function makeRound(pool, reviewIDs = [], random = Math.random, distractorPool = pool) {
  if (!pool.length) throw new Error("请先学习字母，或选择全部字母测试");
  if (distractorPool.length < 4) throw new Error("至少需要四个字形作为选项");
  const review = shuffle(
    pool.filter((g) => reviewIDs.includes(g.id)),
    random
  );
  const rest = shuffle(
    pool.filter((g) => !reviewIDs.includes(g.id)),
    random
  );
  const ordered = [...review, ...rest];
  const targets = Array.from({ length: 10 }, (_, i) => ordered[i % ordered.length]);
  return targets.map((glyph, i) => {
    const future = new Set(targets.slice(i + 1).map((g) => g.id));
    const candidates = distractorPool.filter((g) => g.id !== glyph.id && !future.has(g.id));
    return {
      glyph,
      type: i % 2 === 0 ? "write" : "choice",
      options: i % 2 === 0 ? [] : shuffle([glyph, ...shuffle(candidates, random).slice(0, 3)], random)
    };
  });
}
function summarize(answers) {
  const writing = answers.filter((a) => a.type === "write");
  const choices = answers.filter((a) => a.type === "choice");
  return {
    writing: writing.length ? Math.round(writing.reduce((n, a) => n + a.score, 0) / writing.length) : 0,
    choices: choices.filter((a) => a.correct).length,
    choiceCount: choices.length,
    wrong: answers.filter((a) => !a.correct).map((a) => a.id)
  };
}
const SIZE = 40;
function maskFromAlpha(alpha, width, height) {
  let left = width, top = height, right = -1, bottom = -1;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      if (alpha[y * width + x] > 70) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
  if (right < left) return { points: [], ratio: 1, density: 0 };
  const w = right - left + 1, h = bottom - top + 1, scale = (SIZE - 4) / Math.max(w, h);
  const occupied = /* @__PURE__ */ new Set();
  for (let y = top; y <= bottom; y++)
    for (let x = left; x <= right; x++)
      if (alpha[y * width + x] > 70) {
        const px = Math.round((x - left) * scale + (SIZE - w * scale) / 2), py = Math.round((y - top) * scale + (SIZE - h * scale) / 2);
        occupied.add(py * SIZE + px);
      }
  return {
    points: [...occupied].map((v) => ({ x: v % SIZE, y: Math.floor(v / SIZE) })),
    ratio: w / h,
    density: occupied.size / (w * h * scale * scale)
  };
}
const fields = /* @__PURE__ */ new WeakMap();
function distanceField(mask2) {
  const cached = fields.get(mask2);
  if (cached) return cached;
  const field = new Float32Array(SIZE * SIZE).fill(9);
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) {
      let d = 9;
      for (const p2 of mask2.points) d = Math.min(d, Math.hypot(x - p2.x, y - p2.y));
      field[y * SIZE + x] = d;
    }
  fields.set(mask2, field);
  return field;
}
const distance = (a, b) => {
  const field = distanceField(b);
  return a.points.reduce((sum, p2) => sum + field[p2.y * SIZE + p2.x], 0) / a.points.length;
};
function similarity(a, b) {
  if (!a.points.length || !b.points.length) return 0;
  const shape = (distance(a, b) + distance(b, a)) / 2;
  const ratio = Math.min(1, Math.abs(Math.log(a.ratio / b.ratio)));
  const excess = Math.max(0, a.density - b.density - 0.12);
  return Math.max(0, Math.round(100 - shape * 14 - ratio * 14 - excess * 80));
}
function assess(input, target, alternatives, targetID) {
  const score = similarity(input, target);
  const other = Math.max(
    0,
    ...alternatives.filter((a) => a.id !== targetID).map((a) => similarity(input, a.mask))
  );
  if (!input.points.length)
    return {
      score: 0,
      correct: false,
      status: "uncertain",
      feedback: "还没有写下字形，请先书写。"
    };
  if (score >= 78 && score - other >= 4)
    return {
      score,
      correct: true,
      status: "match",
      feedback: "字形与范字较接近。可叠加对照，继续留意比例与转折。"
    };
  if (score < 50 || other > score + 10)
    return {
      score,
      correct: false,
      status: "different",
      feedback: "与目标范字差异较大。请检查是否写成其他字母，或遗漏了笔画。"
    };
  return {
    score,
    correct: false,
    status: "uncertain",
    feedback: "暂时无法可靠判断。请对照范字重写；合理的手写变体也可能出现这种情况。"
  };
}
const cache = /* @__PURE__ */ new Map();
async function loadFonts() {
  const result = await Promise.all([
    document.fonts.load("100px Bad Script", "д"),
    document.fonts.load("100px Playpen Sans", "α")
  ]);
  if (result.some((r) => !r.length)) throw new Error("范字加载失败，请重新打开。");
}
function template(g) {
  if (cache.has(g.id)) return cache.get(g.id);
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#A95524";
  ctx.strokeStyle = "#A95524";
  if (g.paths) {
    ctx.scale(256 / 109, 256 / 109);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    g.paths.forEach((p2) => ctx.stroke(new Path2D(p2)));
  } else {
    let size = 170;
    ctx.font = `${size}px ${fontFor(g)}`;
    let m = ctx.measureText(g.text);
    const extent = Math.max(
      m.actualBoundingBoxLeft + m.actualBoundingBoxRight,
      m.actualBoundingBoxAscent + m.actualBoundingBoxDescent
    );
    if (extent > 224) {
      size *= 224 / extent;
      ctx.font = `${size}px ${fontFor(g)}`;
      m = ctx.measureText(g.text);
    }
    const width = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
    const height = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    ctx.fillText(
      g.text,
      (256 - width) / 2 + m.actualBoundingBoxLeft,
      (256 - height) / 2 + m.actualBoundingBoxAscent
    );
  }
  cache.set(g.id, canvas);
  return canvas;
}
function raster(strokes2) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.strokeStyle = "#A95524";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const stroke of strokes2) {
    if (!stroke.length) continue;
    ctx.beginPath();
    ctx.moveTo(stroke[0].x * 256, stroke[0].y * 256);
    for (const p2 of stroke.slice(1)) ctx.lineTo(p2.x * 256, p2.y * 256);
    if (stroke.length === 1) ctx.lineTo(stroke[0].x * 256 + 0.1, stroke[0].y * 256);
    ctx.stroke();
  }
  return canvas;
}
function mask(canvas) {
  const image = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
  const alpha = new Uint8Array(canvas.width * canvas.height);
  for (let i = 0; i < alpha.length; i++) alpha[i] = image.data[i * 4 + 3];
  return maskFromAlpha(alpha, canvas.width, canvas.height);
}
const store$1 = moduleStorage("alphi");
async function loadHistory() {
  const data = await store$1.get("history");
  if (!data) return { practices: [], rounds: [] };
  const validIDs = new Set(glyphs.map((g) => g.id));
  const validScore = (p2) => p2 && validIDs.has(p2.id) && Number.isFinite(p2.score) && p2.score >= 0 && p2.score <= 100 && typeof p2.correct === "boolean";
  const validDate = (value) => typeof value === "string" && Number.isFinite(Date.parse(value));
  if (!Array.isArray(data.practices) || !Array.isArray(data.rounds) || !data.practices.every(
    (p2) => validScore(p2) && typeof p2.tracing === "boolean" && validDate(p2.at)
  ) || !data.rounds.every(
    (r) => r && typeof r.id === "string" && typeof r.language === "string" && groups(glyphs.find((g) => g.id === r.answers?.[0]?.id)?.language ?? "ru").some(
      (g) => g.id === r.group
    ) && validDate(r.at) && Array.isArray(r.answers) && r.answers.length === 10 && r.answers.every(validAnswer)
  ))
    throw new Error("练习记录格式异常，暂不写入新记录。");
  return data;
}
const saveHistory = (data) => store$1.set("history", { practices: data.practices.slice(-500), rounds: data.rounds.slice(-50) });
const _hoisted_1$6 = ["aria-label"];
const _hoisted_2$5 = ["d"];
const _hoisted_3$5 = ["aria-label"];
const _sfc_main$6 = /* @__PURE__ */ defineComponent({
  __name: "GlyphView",
  props: {
    glyph: {},
    animate: { type: Boolean }
  },
  setup(__props) {
    const { t } = useAppI18n();
    const props = __props;
    const generation = /* @__PURE__ */ ref(0);
    watch(
      () => props.glyph.id,
      () => generation.value++
    );
    const label = computed(() => `手写范字 ${props.glyph.text}`);
    return (_ctx, _cache) => {
      return __props.glyph.paths ? (openBlock(), createElementBlock("svg", {
        key: `${__props.glyph.id}-${generation.value}-${__props.animate}`,
        viewBox: "0 0 109 109",
        class: "glyph-svg",
        role: "img",
        "aria-label": unref(t)(label.value)
      }, [
        (openBlock(true), createElementBlock(Fragment, null, renderList(__props.glyph.paths, (path, i) => {
          return openBlock(), createElementBlock("path", {
            key: i,
            d: path,
            fill: "none",
            stroke: "currentColor",
            "stroke-width": "2.8",
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            pathLength: "1",
            class: normalizeClass({ animated: __props.animate }),
            style: normalizeStyle({ "--delay": `${i * 0.8}s` })
          }, null, 14, _hoisted_2$5);
        }), 128))
      ], 8, _hoisted_1$6)) : (openBlock(), createElementBlock("span", {
        key: 1,
        class: "handwritten",
        style: normalizeStyle({ fontFamily: unref(fontFor)(__props.glyph) }),
        "aria-label": unref(t)(label.value)
      }, toDisplayString(__props.glyph.text), 13, _hoisted_3$5));
    };
  }
});
function segmentDistance(point, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / length)) : 0;
  return Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy);
}
function eraseAt(strokes2, point, radius = 0.035) {
  return strokes2.filter(
    (stroke) => !stroke.some((p2, i) => segmentDistance(point, stroke[Math.max(0, i - 1)], p2) <= radius)
  );
}
const copyStrokes = (strokes2) => strokes2.map((stroke) => stroke.map((p2) => ({ ...p2 })));
const _hoisted_1$5 = { class: "writing-pad" };
const _hoisted_2$4 = { class: "paper" };
const _hoisted_3$4 = ["aria-label"];
const _hoisted_4$4 = { class: "pad-tools" };
const _hoisted_5$4 = ["disabled"];
const _hoisted_6$4 = ["disabled"];
const _hoisted_7$4 = ["aria-pressed", "disabled"];
const _hoisted_8$4 = ["disabled"];
const _hoisted_9$4 = {
  key: 0,
  class: "pad-actions"
};
const _hoisted_10$3 = ["disabled"];
const _hoisted_11$3 = ["disabled"];
const _hoisted_12$3 = { class: "pad-hint" };
const _hoisted_13$3 = {
  key: 1,
  role: "alert",
  class: "error"
};
const _hoisted_14$3 = ["disabled"];
const _sfc_main$5 = /* @__PURE__ */ defineComponent({
  __name: "WritingPad",
  props: {
    glyph: {},
    tracing: { type: Boolean },
    disabled: { type: Boolean },
    obscured: { type: Boolean },
    compactTools: { type: Boolean },
    inlineActions: { type: Boolean },
    initialStrokes: {},
    initialDrawing: {}
  },
  emits: ["submit", "change", "ink"],
  setup(__props, { expose: __expose, emit: __emit }) {
    const { t } = useAppI18n();
    const props = __props;
    const emit2 = __emit;
    const strokes2 = /* @__PURE__ */ ref(copyStrokes(props.initialStrokes ?? [])), canvas = /* @__PURE__ */ ref(), finger = /* @__PURE__ */ ref(false), eraser = /* @__PURE__ */ ref(false), undoStack = /* @__PURE__ */ ref([]), error = /* @__PURE__ */ ref("");
    const nativeFailed = /* @__PURE__ */ ref(false);
    const native = /* @__PURE__ */ ref(isNative()), nativeUndo = /* @__PURE__ */ ref(false);
    const sessionID = createID();
    let alive = true;
    let nativeDrawing = props.initialDrawing;
    let resize;
    let frame = 0;
    function nativeCall(action, params = {}) {
      return invoke(
        "handwriting.inline",
        JSON.parse(JSON.stringify({ id: sessionID, action, ...params }))
      );
    }
    function placement() {
      const rect = canvas.value.getBoundingClientRect();
      const bottom = document.querySelector(".bottom-tabs")?.getBoundingClientRect().height ?? 0;
      return { rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }, bottom };
    }
    function layout() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (alive && native.value && canvas.value)
          void nativeCall("layout", placement()).catch(() => {
          });
      });
    }
    watch(
      () => [finger.value, eraser.value, props.disabled, props.obscured],
      () => {
        if (native.value)
          void nativeCall("configure", {
            finger: finger.value,
            eraser: eraser.value,
            locked: !!props.disabled,
            hidden: !!props.obscured
          }).catch((e) => {
            error.value = String(e);
          });
      }
    );
    onBeforeUnmount(() => {
      alive = false;
      resize?.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", layout);
      window.removeEventListener("resize", layout);
      streams.delete(sessionID);
      if (isNative()) void nativeCall("detach").catch(() => {
      });
    });
    let pointer = null;
    let beforeGesture = null;
    function paint() {
      const ctx = canvas.value?.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, 256, 256);
      if (props.tracing) {
        ctx.globalAlpha = 0.18;
        ctx.drawImage(template(props.glyph), 0, 0);
        ctx.globalAlpha = 1;
      }
      ctx.drawImage(raster(strokes2.value), 0, 0);
    }
    function clear() {
      if (native.value) {
        void nativeCall("clear").catch((e) => {
          error.value = String(e);
        });
        return;
      }
      strokes2.value = [];
      pointer = null;
      beforeGesture = null;
      undoStack.value = [];
      error.value = "";
      emit2("ink", []);
      paint();
      emit2("change");
    }
    function undo() {
      if (native.value) {
        void nativeCall("undo").catch((e) => {
          error.value = String(e);
        });
        return;
      }
      const previous = undoStack.value.pop();
      if (!previous) return;
      strokes2.value = previous;
      emit2("ink", copyStrokes(strokes2.value));
      paint();
      emit2("change");
    }
    function point(event) {
      const r = canvas.value.getBoundingClientRect();
      return {
        x: Math.min(1, Math.max(0, (event.clientX - r.left) / r.width)),
        y: Math.min(1, Math.max(0, (event.clientY - r.top) / r.height))
      };
    }
    function erase(point2) {
      const remaining = eraseAt(strokes2.value, point2);
      if (remaining.length === strokes2.value.length) return;
      if (beforeGesture) {
        remember(beforeGesture);
        beforeGesture = null;
      }
      strokes2.value = remaining;
      paint();
      emit2("change");
    }
    function remember(previous) {
      undoStack.value.push(previous);
      if (undoStack.value.length > 30) undoStack.value.shift();
    }
    function down(event) {
      if (native.value || props.disabled || pointer !== null || event.pointerType === "touch" && !finger.value)
        return;
      if (!eraser.value && strokes2.value.length >= 128) {
        error.value = "笔画较多，请清空后重新书写。";
        return;
      }
      pointer = event.pointerId;
      canvas.value.setPointerCapture(pointer);
      beforeGesture = copyStrokes(strokes2.value);
      if (eraser.value) {
        erase(point(event));
        return;
      }
      remember(beforeGesture);
      beforeGesture = null;
      strokes2.value.push([point(event)]);
      paint();
      emit2("change");
    }
    function move(event) {
      if (pointer !== event.pointerId || props.disabled) return;
      const samples2 = event.getCoalescedEvents?.();
      for (const e of samples2?.length ? samples2 : [event]) {
        if (eraser.value) erase(point(e));
        else {
          const stroke = strokes2.value.at(-1);
          if (stroke.length < 2048) stroke.push(point(e));
        }
      }
      paint();
    }
    function up(event) {
      if (event.pointerId !== pointer) return;
      move(event);
      emit2("ink", copyStrokes(strokes2.value));
      pointer = null;
      beforeGesture = null;
    }
    function cancel(event) {
      if (event.pointerId === pointer) {
        emit2("ink", copyStrokes(strokes2.value));
        pointer = null;
        beforeGesture = null;
      }
    }
    watch(() => [props.glyph.id, props.tracing], clear);
    onMounted(async () => {
      paint();
      if (!isNative()) return;
      streams.set(sessionID, (chunk) => {
        if (!alive) return;
        const value = JSON.parse(chunk);
        strokes2.value = value.strokes;
        nativeDrawing = value.drawing;
        nativeUndo.value = value.canUndo;
        emit2("ink", copyStrokes(strokes2.value), nativeDrawing);
        emit2("change");
      });
      try {
        await nextTick();
        await nativeCall("attach", {
          ...placement(),
          reference: props.tracing ? template(props.glyph).toDataURL() : void 0,
          drawing: nativeDrawing,
          strokes: strokes2.value,
          locked: !!props.disabled,
          hidden: !!props.obscured
        });
        if (!alive) {
          await nativeCall("detach");
          return;
        }
        native.value = true;
        await nativeCall("configure", {
          finger: finger.value,
          eraser: eraser.value,
          locked: !!props.disabled,
          hidden: !!props.obscured
        });
        resize = new ResizeObserver(layout);
        resize.observe(canvas.value);
        window.addEventListener("scroll", layout, { passive: true });
        window.addEventListener("resize", layout);
      } catch (e) {
        console.warn("Inline PencilKit unavailable", e);
        streams.delete(sessionID);
        await nativeCall("detach").catch(() => {
        });
        nativeFailed.value = true;
        error.value = "书写区域加载失败，请重新打开。";
      }
    });
    __expose({ clear });
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1$5, [
        createBaseVNode("div", _hoisted_2$4, [
          createBaseVNode("canvas", {
            ref_key: "canvas",
            ref: canvas,
            width: "256",
            height: "256",
            "aria-label": unref(t)("手写练习区域"),
            onPointerdown: withModifiers(down, ["prevent"]),
            onPointermove: withModifiers(move, ["prevent"]),
            onPointerup: withModifiers(up, ["prevent"]),
            onPointercancel: cancel,
            onLostpointercapture: cancel,
            class: normalizeClass({
              locked: __props.disabled || nativeFailed.value || native.value,
              erasing: eraser.value,
              "native-placeholder": native.value
            })
          }, null, 42, _hoisted_3$4)
        ]),
        createBaseVNode("div", _hoisted_4$4, [
          !__props.compactTools ? (openBlock(), createElementBlock("button", {
            key: 0,
            onClick: undo,
            disabled: __props.disabled || nativeFailed.value || (native.value ? !nativeUndo.value : !undoStack.value.length)
          }, toDisplayString(unref(t)("撤销")), 9, _hoisted_5$4)) : createCommentVNode("", true),
          !__props.inlineActions ? (openBlock(), createElementBlock("button", {
            key: 1,
            onClick: clear,
            disabled: __props.disabled || nativeFailed.value || !strokes2.value.length
          }, toDisplayString(unref(t)("清空")), 9, _hoisted_6$4)) : createCommentVNode("", true),
          !__props.compactTools ? (openBlock(), createElementBlock("button", {
            key: 2,
            "aria-pressed": eraser.value,
            class: normalizeClass({ selected: eraser.value }),
            onClick: _cache[0] || (_cache[0] = ($event) => eraser.value = !eraser.value),
            disabled: __props.disabled || nativeFailed.value
          }, toDisplayString(unref(t)(eraser.value ? "切换为笔" : "橡皮")), 11, _hoisted_7$4)) : createCommentVNode("", true),
          createBaseVNode("label", null, [
            withDirectives(createBaseVNode("input", {
              type: "checkbox",
              "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => finger.value = $event),
              disabled: __props.disabled || nativeFailed.value
            }, null, 8, _hoisted_8$4), [
              [vModelCheckbox, finger.value]
            ]),
            createTextVNode(toDisplayString(unref(t)("允许手指")), 1)
          ])
        ]),
        __props.inlineActions ? (openBlock(), createElementBlock("div", _hoisted_9$4, [
          createBaseVNode("button", {
            onClick: clear,
            disabled: __props.disabled || nativeFailed.value || !strokes2.value.length
          }, toDisplayString(unref(t)("清空")), 9, _hoisted_10$3),
          createBaseVNode("button", {
            class: "primary",
            disabled: __props.disabled || nativeFailed.value || !strokes2.value.length,
            onClick: _cache[2] || (_cache[2] = ($event) => emit2("submit", unref(copyStrokes)(strokes2.value)))
          }, [
            createTextVNode(toDisplayString(unref(t)("评分")) + " ", 1),
            _cache[4] || (_cache[4] = createBaseVNode("span", null, "→", -1))
          ], 8, _hoisted_11$3)
        ])) : createCommentVNode("", true),
        createBaseVNode("p", _hoisted_12$3, toDisplayString(unref(t)("直接用 Apple Pencil 在格内书写；可在画板外滑动页面。")), 1),
        error.value ? (openBlock(), createElementBlock("p", _hoisted_13$3, toDisplayString(unref(t)(error.value)), 1)) : createCommentVNode("", true),
        !__props.inlineActions ? (openBlock(), createElementBlock("button", {
          key: 2,
          class: "primary wide",
          disabled: __props.disabled || nativeFailed.value || !strokes2.value.length,
          onClick: _cache[3] || (_cache[3] = ($event) => emit2("submit", unref(copyStrokes)(strokes2.value)))
        }, [
          createTextVNode(toDisplayString(unref(t)("评分")) + " ", 1),
          _cache[5] || (_cache[5] = createBaseVNode("span", null, "→", -1))
        ], 8, _hoisted_14$3)) : createCommentVNode("", true)
      ]);
    };
  }
});
const strokes = {
  α: [
    [
      "M55 37 C38 28 28 70 44 72 C63 78 69 42 55 37",
      "从右上向左绕过左侧与底部，回到起点闭合椭圆。"
    ],
    ["M70 35 C67 48 53 80 74 70", "从右上沿椭圆右侧下行，在基线处向右弯出。"]
  ],
  β: [
    [
      "M40 79 C36 61 37 26 58 25 C83 22 68 55 42 55 C78 46 77 85 52 83 Q40 82 40 70",
      "从下部向上绕出长环，在中腰向右绕出下部圆腹，回到左侧收笔。"
    ]
  ],
  γ: [
    [
      "M38 25 C43 38 55 59 56 74 C58 91 39 87 47 69 L69 24",
      "从左上弯向右下，越过基线绕出窄环，再向右上收笔。"
    ]
  ],
  δ: [
    [
      "M70 29 C41 15 33 34 55 47 C77 60 71 83 53 83 C29 83 31 48 52 48",
      "从顶部右侧向左弯入，再向右下绕过字身右侧和底部，沿左侧回到字身上沿闭合。"
    ]
  ],
  ε: [
    [
      "M64 41 C40 29 33 55 56 54 C32 49 31 81 66 67",
      "从右上向左绕出上半弧，回到中部，再向左下绕出下半弧，在右下收笔。"
    ]
  ],
  ζ: [
    [
      "M39 16 Q52 20 67 15 C34 38 28 50 54 64 C75 75 63 98 49 91",
      "从左向右写顶横，转向左下，再向右绕出下部弧线，末端向左弯成下伸钩。"
    ]
  ],
  η: [
    ["M36 28 Q49 20 46 39 L45 62", "从字身上沿向下写左竖。"],
    ["M45 47 C49 24 71 17 73 39 Q74 58 70 82", "从左竖中部向右上拱起，再沿右侧向下越过基线。"]
  ],
  θ: [
    [
      "M55 25 C32 24 33 82 51 84 C76 87 79 22 55 25",
      "从顶部向左下绕出狭长椭圆，经底部与右侧回到起点。"
    ],
    ["M39 55 Q53 59 68 54", "抬笔，从左向右写中横。"]
  ],
  ι: [["M49 36 L47 61 Q47 80 62 69", "从上方向下写短竖，在基线处向右轻弯收笔，不加点。"]],
  κ: [
    ["M39 36 L37 72", "先写左侧短竖。"],
    ["M67 36 L46 51 C56 51 51 83 72 68", "从右上斜向左侧中腰，再折向右下。"]
  ],
  λ: [
    ["M42 31 C71 15 70 43 67 84", "从左上向右绕出顶部弧线，再沿右侧向下写长竖。"],
    ["M67 62 C61 40 40 41 40 82", "从右侧中部向左绕出拱形，沿左侧下行收笔。"]
  ],
  μ: [
    ["M36 26 L34 84", "从字身上沿向下写越过基线的长竖。"],
    [
      "M36 30 L34 51 C36 76 60 66 62 27 L61 53 Q61 68 74 61",
      "回到字身上沿，下行后圆转向右上，再沿右侧下行并向右收笔。"
    ]
  ],
  ν: [["M40 36 Q48 55 51 74 Q71 59 68 35", "从左上向下略弯，到底部后转向右上。"]],
  ξ: [
    [
      "M41 18 Q54 21 67 17 C38 22 32 41 63 40 C32 36 34 62 59 70 C76 83 63 96 51 91",
      "从左向右写顶部短弧，回绕出中部弧线，再回绕出下部弧线，末端向下弯出。"
    ]
  ],
  ο: [
    [
      "M57 37 C35 29 33 72 51 73 C79 73 75 36 57 37",
      "从右上向左绕过左侧与底部，经右侧回到起点闭合。"
    ]
  ],
  π: [
    ["M35 36 L75 36", "从左向右写顶横。"],
    ["M45 37 L41 72", "从顶横左部向下写左侧笔画。"],
    ["M64 37 C61 57 58 79 75 70", "从顶横右部下行，在底部向右轻弯。"]
  ],
  ρ: [
    ["M39 52 Q38 69 44 83", "从字身中部向下写越过基线的长竖。"],
    [
      "M39 52 C38 16 69 16 70 39 C77 70 36 73 39 52",
      "从竖画上端向上绕出完整圆腹，经右侧与底部回到起点。"
    ]
  ],
  σ: [
    [
      "M55 36 C26 32 30 74 52 73 C76 73 70 38 55 36 L71 36",
      "从右上向左绕出圆腹，经底部与右侧回到起点，再向右写顶部短横。"
    ]
  ],
  ς: [
    [
      "M68 31 C43 10 27 52 53 62 C69 65 63 77 49 83",
      "从右上向左绕过圆腹，转向右下写弯尾，末端向左收笔。"
    ]
  ],
  τ: [
    ["M40 36 L69 36", "从左向右写顶横。"],
    ["M53 37 C50 57 45 84 67 68", "从顶横中部向下，在底部向右轻弯。"]
  ],
  υ: [["M43 36 C29 87 76 85 67 35", "从左上向下弯到基线，再圆转向右上，形成开口向上的字形。"]],
  φ: [
    ["M55 16 L55 93", "先从顶部向下写越过基线的长竖。"],
    [
      "M55 36 C22 30 25 76 54 75 C88 78 80 31 55 36",
      "从长竖与字身上沿的交点向左绕出椭圆，经底部与右侧闭合。"
    ]
  ],
  χ: [
    ["M36 26 Q44 21 49 37 L63 79 Q67 88 74 79", "从左上斜向右下，越过基线。"],
    ["M71 25 L36 84", "抬笔，从右上斜向左下，与第一笔相交。"]
  ],
  ψ: [
    ["M36 34 C23 84 85 86 72 34", "从左上向下绕成杯形，再沿右侧回升到字身上沿。"],
    ["M55 15 L53 92", "抬笔，从中间向下写越过基线的长竖。"]
  ],
  ω: [
    [
      "M39 35 C22 71 44 87 53 66 Q57 27 54 59 C50 90 91 77 73 35",
      "从左上向下绕出左侧圆腹，向上回转形成中间短竖，再绕出右侧圆腹，向右上收笔。"
    ]
  ],
  Α: [
    ["M31 82 Q47 49 58 27 L80 82", "从左下斜向顶点，再斜向右下。"],
    ["M39 62 L76 62", "抬笔，从左向右补中横。"]
  ],
  Β: [
    ["M40 29 L38 83", "从上到下写左侧主干。"],
    ["M39 28 C86 14 80 55 41 54 C87 44 81 88 38 83", "从主干顶部向右依次绕出上、下两个圆腹。"]
  ],
  Γ: [
    ["M42 28 L40 82", "从上到下写左竖。"],
    ["M41 27 Q57 28 70 28", "抬笔，从左上向右写顶横。"]
  ],
  Δ: [["M56 26 L32 82 L77 82 L56 26", "从顶点斜向左下，再向右写底边，最后斜回顶点闭合三角形。"]],
  Ε: [
    ["M42 27 L38 82", "从上到下写左竖。"],
    ["M42 27 L72 27", "从左向右写顶横。"],
    ["M40 53 L64 53", "从左向右写中横。"],
    ["M38 82 L73 82", "从左向右写底横。"]
  ],
  Ζ: [["M39 27 L73 27 L34 82 Q54 80 74 82", "从左向右写顶横，斜向左下，再向右写底横。"]],
  Η: [
    ["M35 26 L33 82", "从上到下写左竖。"],
    ["M75 26 L73 82", "从上到下写右竖。"],
    ["M35 52 Q55 50 74 52", "从左向右补中横。"]
  ],
  Θ: [
    [
      "M55 26 C23 24 23 81 52 82 C85 85 89 27 55 26",
      "从顶部向左绕出大椭圆，经底部与右侧回到起点。"
    ],
    ["M46 55 L64 54", "抬笔，从左向右写中横。"]
  ],
  Ι: [["M56 26 L52 82", "从顶部向下写直竖；这里采用不加上下短横的写法。"]],
  Κ: [
    ["M37 26 L34 82", "先从上到下写左竖。"],
    ["M68 27 L39 51 Q53 76 74 82", "从右上斜向左侧中腰，再折向右下。"]
  ],
  Λ: [["M31 83 L55 27 L79 83", "从左下斜向顶点，再斜向右下，不加中横。"]],
  Μ: [
    [
      "M27 82 L31 27 L54 66 L82 27 L82 83",
      "从左下向上写左竖，斜向中部低点，再斜向右上，最后下行写右竖。"
    ]
  ],
  Ν: [["M34 82 L37 27 L69 81 L74 27", "从左下向上写左竖，斜向右下，再向上写右竖。"]],
  Ξ: [
    ["M38 27 Q55 28 72 25", "从左向右写顶横。"],
    ["M40 55 L69 54", "抬笔，从左向右写较短的中横。"],
    ["M37 82 L72 81", "抬笔，从左向右写底横。"]
  ],
  Ο: [
    [
      "M62 28 C27 12 17 80 54 83 C82 84 87 48 73 33",
      "从右上向左绕过顶部、左侧和底部，沿右侧回升，顶部保留字体中的小开口。"
    ]
  ],
  Π: [
    ["M35 28 L34 82", "从上到下写左竖。"],
    ["M35 27 L74 27 L73 82", "从左上向右写顶横，再向下写右竖。"]
  ],
  Ρ: [
    ["M39 28 L37 82", "从上到下写左竖。"],
    ["M40 28 C77 20 86 61 39 57", "从左竖顶部向右绕出圆腹，回到中腰。"]
  ],
  Σ: [
    [
      "M72 27 L38 28 L60 53 L36 83 L73 82",
      "从右向左写顶横，斜向中部，再斜向左下，最后向右写底横。"
    ]
  ],
  Τ: [
    ["M33 27 Q53 31 76 27", "从左向右写顶横。"],
    ["M55 29 L51 83", "从顶横中间向下写主干。"]
  ],
  Υ: [
    ["M37 28 L52 55 L72 28", "从左上斜向中部交汇点，再斜向右上。"],
    ["M52 55 L52 82", "从交汇点向下写竖画。"]
  ],
  Φ: [
    ["M55 24 L52 84", "先从顶部向下写长竖。"],
    ["M54 33 C16 28 17 74 52 72 C93 77 96 29 54 33", "从长竖上部向左绕出椭圆，经底部与右侧闭合。"]
  ],
  Χ: [
    ["M37 28 L72 84", "从左上斜向右下。"],
    ["M73 27 L36 83", "抬笔，从右上斜向左下。"]
  ],
  Ψ: [
    ["M31 28 C14 81 91 80 79 28", "从左上向下绕成杯形，再沿右侧回升到顶部。"],
    ["M55 27 L55 83", "从中间顶部向下写长竖，穿过杯形底部。"]
  ],
  Ω: [
    [
      "M54 27 C19 24 22 66 54 68 C87 71 86 27 54 27",
      "从圆圈顶部向左绕过左侧与底部，再沿右侧回到起点，闭合圆圈。"
    ],
    ["M33 84 L76 83", "抬笔，在圆圈下方从左向右写一横，与圆圈留出间隙。"]
  ]
};
const greekPaths = Object.fromEntries(
  Object.entries(strokes).map(([letter, entries]) => [letter, entries.map(([path]) => path)])
);
const greekSteps = Object.fromEntries(
  Object.entries(strokes).map(([letter, entries]) => [letter, entries.map(([, text]) => text)])
);
const ruLower = {
  а: ["从右上向左绕出小椭圆，回到起点。", "沿右侧下行至基线，向右上轻挑收笔。"],
  б: ["从上方起笔，弯向左下形成字身。", "顺势围出下部椭圆，顶部保留向右的短钩。"],
  в: ["从基线向上绕出长环，再回到字身。", "接写下方的小圆腹，向右收笔。"],
  г: ["从左上向右写圆弧肩部。", "斜向左下回转，在基线向右弯出。"],
  д: ["先写字身的小椭圆。", "右侧向下越过基线，绕出下伸环并向右上收笔。"],
  е: ["从中部向右上起笔，绕出小环。", "向左下转成圆腹，向右开口收笔。"],
  ё: ["先按 е 的走向写好字身。", "抬笔，在上方加左点。", "抬笔，在上方加右点。"],
  ж: [
    "先写左侧弯曲支臂，到中部连接。",
    "抬笔，从上向下写中间主干。",
    "抬笔，从右上弯向中部，再绕向右下。"
  ],
  з: ["由左上向右绕出上半圆。", "回到中腰，再向右下绕出下半圆并收笔。"],
  и: ["从左上斜下到基线，圆转向右上。", "从第二个高点下行，再向右上挑出。"],
  й: ["先写 и 的两个下行笔和连接。", "抬笔，在上方从左到右加短弧。"],
  к: ["先写左侧下行笔。", "从右上接向中腰，再从中腰弯向右下。"],
  л: ["从基线写小入笔钩，上行至尖顶。", "斜下到基线，向右上挑出。"],
  м: ["从基线入笔，上行到第一个尖顶，再回到基线。", "接写第二个尖顶，末端向右上挑出。"],
  н: ["写左侧下行笔。", "抬笔，从中部向右写连接横画。", "抬笔，写右侧下行笔，在基线向右挑出。"],
  о: ["从右上向左逆时针绕出椭圆。", "回到顶部闭合，留出向右的连接。"],
  п: ["先下行写左竖，再沿竖回到上部。", "向右拱起，下行写右竖，基线处挑出。"],
  р: ["从字身上沿向下，写越过基线的长竖。", "回到字身上部，向右拱起，下行并收笔。"],
  с: ["从右上向左弯入。", "绕过左侧与底部，在右侧开口收笔。"],
  т: ["从左向右写略带倾斜的短横。", "从横画中部斜向下写主干，到基线轻挑收笔。"],
  у: ["先写左侧下行弧，回升到右上。", "沿右侧向下越过基线，绕出下伸环。"],
  ф: ["从中部先绕出左侧小椭圆。", "抬笔，从上到下写中间长竖。", "抬笔，绕出右侧小椭圆。"],
  х: ["从左上弯向中间，再到左下。", "抬笔，从右上经过中间弯到右下。"],
  ц: ["先按 и 写出两个下行笔。", "末端向下越过基线，补一个短尾钩。"],
  ч: ["从左上写短下行弧，弯向右上。", "从右上向下写右竖，在基线挑出。"],
  ш: ["连续写三个下行笔，笔间从基线回升。", "第三笔在基线圆转，向右上收笔。"],
  щ: ["先写 ш 的三个下行笔。", "末端补越过基线的短尾钩。"],
  ъ: ["从左上向右写短肩部。", "向下写主干，在下部向右绕出圆腹。"],
  ы: ["先写左侧竖与下部圆腹，形成 ь。", "向右上连接，再写右侧下行笔。"],
  ь: ["从上方下行到基线。", "向右绕出下部圆腹，再接回主干。"],
  э: ["从左上向右绕出向左开口的弧形。", "抬笔，从中部向右补短横。"],
  ю: ["先写左侧下行笔。", "抬笔，在中部从左向右写连接横画。", "抬笔，在右侧绕出椭圆并闭合。"],
  я: [
    "从右上向左绕出上部圆腹。",
    "从中腰斜向左下写支腿。",
    "抬笔，从右上写下行主干，在基线向右挑出。"
  ]
};
const upper = {
  А: ["从左下斜向上到顶点，再斜向右下。", "抬笔，在中部从左到右加横。"],
  Б: ["从左上向下写主干。", "抬笔，回到顶部向右写帽檐。", "抬笔，从中腰向右绕出下部圆腹。"],
  В: ["先从顶部下行写左侧主干。", "从上方向右依次绕出上、下两个圆腹。"],
  Г: ["先写从上到下的左侧主干。", "抬笔，从左上向右写顶横。"],
  Д: [
    "从顶部斜向左下，形成左侧支撑。",
    "抬笔，从顶部向右弯下形成字身，绕向左下收笔。",
    "抬笔，在下方补向右弯出的连接。"
  ],
  Е: [
    "先写左侧从上到下的主干。",
    "抬笔，从左向右写顶横。",
    "抬笔，从左向右写中横。",
    "抬笔，从左向右写底横。"
  ],
  Ё: [
    "先写左侧从上到下的主干。",
    "抬笔，从左向右写顶横。",
    "抬笔，从左向右写中横。",
    "抬笔，从左向右写底横。",
    "抬笔，在上方加左点。",
    "抬笔，在上方加右点。"
  ],
  Ж: ["先写中间主干。", "抬笔，写左侧上下两支，经过中腰。", "抬笔，写右侧上下两支，经过中腰。"],
  З: ["从左上向右写上半圆。", "顺势写下半圆，左下收笔。"],
  И: ["从左上写下行笔。", "由左下斜向右上，再下行到右下。"],
  Й: ["先写 И。", "抬笔，在顶部加从左到右的短弧。"],
  К: ["先写左侧主干。", "从右上写到中腰，再由中腰向右下展开。"],
  Л: ["从左下上行至顶部。", "从顶部斜向右下，在基线处收笔。"],
  М: ["从左下向上，再斜向中部低点。", "上行到右侧高点，再下行至右下。"],
  Н: ["从上到下写左侧主干。", "抬笔，从上到下写右侧主干。", "抬笔，从左到右补中横。"],
  О: ["从右上向左绕过顶端与左侧。", "经底部返回右上，闭合椭圆。"],
  П: ["写左侧下行主干。", "从左上向右写顶横，再写右侧下行主干。"],
  Р: ["先写从上到下的左侧主干。", "回到顶部，向右绕出上部圆腹并接回中腰。"],
  С: ["从右上向左弯入。", "经左侧和底部，在右下开口收笔。"],
  Т: ["从左到右写顶部横画。", "从顶部中间向下写主干。"],
  У: ["从左上斜向中间。", "从右上斜下经过交汇点，再延伸至左下。"],
  Ф: ["先写中间长竖。", "抬笔，围绕中部写左右对称的椭圆。"],
  Х: ["从左上写到右下。", "抬笔，从右上写到左下。"],
  Ц: ["先写左侧下行笔，沿基线连向右侧。", "写右侧下行笔，末端补短尾。"],
  Ч: ["从左上写下弯，到中腰向右连接。", "从右上写到底部，形成右侧主干。"],
  Ш: ["连续写左、中、右三个下行笔，底部相连。", "最后在右下向右收笔。"],
  Щ: ["先写 Ш。", "右下补越过基线的短尾。"],
  Ъ: ["从左向右写顶部肩部，再向下写主干。", "在下部向右绕出圆腹。"],
  Ы: ["先写左侧主干及下部圆腹。", "在右侧另写下行主干。"],
  Ь: ["先写左侧主干。", "从中腰向右绕出下部圆腹。"],
  Э: ["从左上向右写半圆，回到左下。", "抬笔，补中间向右的横画。"],
  Ю: ["先写左侧主干。", "抬笔，在中部向右写连接横画。", "抬笔，在右侧绕出闭合椭圆。"],
  Я: ["从右上向左绕写上部圆腹。", "从右上向下写右侧主干。", "抬笔，从中腰斜向左下写支腿。"]
};
function strokeSteps(g) {
  if (g.language === "el") return greekSteps[g.text] ?? [];
  if (g.paths)
    return g.paths.map((_, i) => `第 ${i + 1} 笔：沿高亮轨迹，从圆点起笔，跟随动画方向书写。`);
  return (g.language === "ru" ? g.group === "upper" ? upper : ruLower : greekSteps)[g.text] ?? [];
}
const russianPaths = {
  а: ["M70 43 C45 29 28 48 31 65 C34 83 60 76 67 44", "M70 40 L61 72 Q63 83 80 67"],
  б: ["M78 24 C55 30 42 20 35 49", "M35 49 C19 85 70 90 71 59 C70 39 44 39 35 49"],
  в: ["M35 76 C39 54 41 14 56 20 C76 29 28 65 35 76", "M43 51 C76 28 84 64 60 76 Q44 84 35 76"],
  г: ["M31 48 Q54 26 66 43", "M66 43 C73 51 29 62 39 74 Q48 84 75 66"],
  д: ["M69 43 C45 30 26 51 34 69 Q48 89 66 47", "M70 40 L56 91 C42 113 25 86 59 77 L80 66"],
  е: ["M32 60 C72 59 78 30 51 40", "M51 40 C22 48 25 90 76 68"],
  ё: ["M32 60 C72 59 78 30 51 40 C22 48 25 90 76 68", "M48 26 L49 27", "M65 26 L66 27"],
  ж: ["M22 40 Q53 53 20 76 L51 57", "M59 39 L48 77", "M85 40 Q55 53 83 76"],
  з: ["M35 44 C60 26 88 46 52 58", "M52 58 C89 51 69 88 34 75"],
  и: ["M37 39 L29 65 Q26 88 52 67 L65 39", "M65 39 L57 70 Q57 83 79 66"],
  й: ["M37 39 L29 65 Q26 88 52 67 L65 39 L57 70 Q57 83 79 66", "M44 24 Q55 35 69 24"],
  к: ["M40 39 L30 78", "M76 39 Q55 61 36 59 Q60 51 65 74 Q70 80 81 69"],
  л: ["M23 72 Q31 84 37 62 L52 39", "M52 39 L57 72 Q62 82 80 67"],
  м: ["M17 74 Q23 85 30 64 L43 39 L45 75", "M45 75 L65 39 L69 71 Q74 83 91 67"],
  н: ["M39 39 L29 77", "M35 59 L65 56", "M71 39 L61 72 Q62 82 80 66"],
  о: ["M69 42 C40 25 22 62 38 76", "M38 76 C59 91 80 48 69 42 Q69 54 83 44"],
  п: ["M36 40 L27 77 L35 48", "M35 48 C48 29 72 35 65 55 L61 71 Q63 82 80 66"],
  р: ["M43 39 L26 99", "M40 49 C63 23 86 53 62 74 Q48 82 37 71"],
  с: ["M74 44 Q65 29 46 42", "M46 42 C18 69 36 93 77 67"],
  т: ["M28 43 Q53 38 80 41", "M56 41 L47 73 Q48 81 60 73"],
  у: ["M37 39 L29 64 Q26 86 53 68 L66 39", "M66 39 L51 92 C38 112 21 91 54 77 L80 65"],
  ф: ["M54 43 C21 24 15 86 46 75", "M64 21 L42 99", "M55 49 C88 19 93 74 62 78 Q49 78 51 62"],
  х: ["M28 40 C68 32 53 76 23 77", "M80 40 C48 34 42 78 75 77"],
  ц: [
    "M34 39 L26 65 Q25 86 50 67 L63 39",
    "M63 39 L55 70 Q64 79 70 71 Q78 85 65 90 Q57 92 66 76 L84 65"
  ],
  ч: ["M35 39 Q19 69 60 55", "M67 39 L58 72 Q60 83 82 66"],
  ш: ["M28 39 L20 66 Q18 86 42 66 L50 39 L42 67 Q41 85 65 66 L73 39", "M73 39 L65 72 Q69 81 87 66"],
  щ: [
    "M24 39 L16 66 Q14 86 38 66 L46 39 L38 67 Q37 85 61 66 L69 39 L61 72",
    "M61 72 Q81 69 72 87 Q58 99 65 78 L89 65"
  ],
  ъ: ["M23 42 L43 40 L34 69", "M34 69 C64 37 83 67 60 77 Q32 89 34 69"],
  ы: ["M28 39 L20 68 C45 42 65 68 40 77 Q17 84 20 68", "M43 77 L72 39 L65 71 Q69 82 87 65"],
  ь: ["M44 39 L34 70", "M34 70 C64 37 83 67 60 77 Q32 89 34 70"],
  э: ["M35 43 C81 19 85 90 31 75", "M42 58 L69 58"],
  ю: ["M29 39 L19 77", "M25 58 L47 57", "M76 42 C45 27 34 77 59 78 C82 82 89 38 76 42"],
  я: ["M72 41 C33 22 23 69 62 59", "M62 59 L26 78", "M72 41 L62 72 Q63 83 83 65"],
  А: ["M22 80 L57 23 L77 80", "M33 59 L71 59"],
  Б: ["M41 25 L29 80", "M39 26 Q57 20 79 25", "M35 52 C87 39 90 86 29 80"],
  В: ["M40 24 L29 81", "M40 24 C91 9 88 53 35 53 C94 31 88 93 29 81"],
  Г: ["M40 24 L29 81", "M40 24 Q62 18 83 25"],
  Д: ["M62 24 Q39 45 29 76", "M62 24 C97 59 76 92 35 80 Q13 74 21 66", "M29 79 Q37 96 61 90"],
  Е: ["M42 24 L29 81", "M42 24 L81 24", "M36 51 L68 51", "M29 81 L74 81"],
  Ё: [
    "M42 24 L29 81",
    "M42 24 L81 24",
    "M36 51 L68 51",
    "M29 81 L74 81",
    "M53 12 L54 13",
    "M72 12 L73 13"
  ],
  Ж: ["M59 24 L47 82", "M23 24 Q56 46 51 53 Q31 58 20 82", "M88 24 Q60 48 51 53 Q73 56 80 82"],
  З: ["M30 30 C76 3 91 47 53 51", "M53 51 C98 45 78 101 26 77"],
  И: ["M39 24 L27 73 Q29 87 41 75", "M41 75 L78 24 L66 75 Q68 86 83 74"],
  Й: ["M39 24 L27 73 Q29 87 41 75 L78 24 L66 75 Q68 86 83 74", "M49 12 Q61 21 74 12"],
  К: ["M41 24 L29 81", "M83 24 L36 54 Q61 47 68 74 Q73 86 85 75"],
  Л: ["M18 77 Q27 87 35 65 L59 23", "M59 23 L71 75 Q77 86 90 73"],
  М: ["M18 81 L35 24 L48 69", "M48 69 L78 24 L75 81"],
  Н: ["M39 24 L27 81", "M79 24 L67 81", "M33 53 L73 53"],
  О: ["M75 28 C52 8 18 38 25 67", "M25 67 C43 110 100 57 75 28"],
  П: ["M40 24 L28 81", "M40 24 L81 24 L69 81"],
  Р: ["M40 24 L28 81", "M40 24 C95 8 88 63 34 54"],
  С: ["M83 30 C67 11 38 24 28 45", "M28 45 C5 90 56 98 78 72"],
  Т: ["M24 25 Q56 20 89 25", "M57 24 L45 81"],
  У: ["M28 24 L51 54", "M84 24 L51 72 Q36 95 24 77"],
  Ф: ["M62 15 L44 94", "M57 31 C12 11 6 83 51 74 C95 94 103 22 57 31"],
  Х: ["M30 24 L75 81", "M84 24 L21 81"],
  Ц: ["M38 24 L26 79 L68 79", "M80 24 L68 79 Q88 69 77 94"],
  Ч: ["M35 24 Q16 61 66 51", "M79 24 L67 81"],
  Ш: ["M31 24 L19 80 L46 80 L58 24 L46 80 L73 80 L85 24", "M73 80 Q81 86 91 73"],
  Щ: ["M28 24 L16 80 L43 80 L55 24 L43 80 L70 80 L82 24", "M70 80 Q90 69 80 95"],
  Ъ: ["M20 25 L46 25 L34 80", "M40 51 C91 33 91 92 34 80"],
  Ы: ["M30 24 L18 80 C76 93 72 37 24 52", "M83 24 L71 81"],
  Ь: ["M42 24 L30 80", "M36 51 C90 31 88 92 30 80"],
  Э: ["M31 29 C93 0 96 108 25 78", "M42 53 L78 53"],
  Ю: ["M31 24 L19 81", "M25 53 L47 53", "M80 25 C48 10 32 85 62 83 C94 88 105 23 80 25"],
  Я: ["M80 25 C24 6 17 64 73 54", "M80 25 L68 81", "M73 54 L24 81"]
};
const _hoisted_1$4 = { class: "stroke-order" };
const _hoisted_2$3 = { class: "order-example" };
const _hoisted_3$3 = {
  key: 0,
  class: "order-print"
};
const _hoisted_4$3 = ["aria-label"];
const _hoisted_5$3 = ["d", "opacity"];
const _hoisted_6$3 = ["d"];
const _hoisted_7$3 = ["cx", "cy"];
const _hoisted_8$3 = {
  key: 0,
  class: "fine-print"
};
const _hoisted_9$3 = {
  key: 1,
  class: "fine-print"
};
const _hoisted_10$2 = {
  key: 2,
  class: "order-controls"
};
const _hoisted_11$2 = ["disabled"];
const _hoisted_12$2 = ["disabled"];
const _hoisted_13$2 = { class: "stroke-steps" };
const _hoisted_14$2 = ["onClick"];
const _hoisted_15$2 = { key: 1 };
const _sfc_main$4 = /* @__PURE__ */ defineComponent({
  __name: "StrokeOrder",
  props: {
    glyph: {},
    autoplay: { type: Boolean }
  },
  setup(__props) {
    const { t } = useAppI18n();
    const props = __props;
    const paths = computed(
      () => props.glyph.paths ?? (props.glyph.language === "ru" ? russianPaths[props.glyph.text] : greekPaths[props.glyph.text])
    );
    const hasAnimation = /* @__PURE__ */ ref(false);
    const step = /* @__PURE__ */ ref(0), playing = /* @__PURE__ */ ref(false), cycle = /* @__PURE__ */ ref(0);
    const steps = computed(() => strokeSteps(props.glyph));
    let timer;
    function stop() {
      playing.value = false;
      clearInterval(timer);
    }
    function play() {
      if (playing.value) {
        stop();
        return;
      }
      if (step.value >= steps.value.length - 1) step.value = 0;
      hasAnimation.value = true;
      playing.value = true;
      cycle.value++;
      timer = setInterval(() => {
        if (step.value >= steps.value.length - 1) stop();
        else step.value++;
      }, 1800);
    }
    function select(index) {
      stop();
      hasAnimation.value = false;
      step.value = index;
      cycle.value++;
    }
    watch(
      () => props.glyph.id,
      () => select(0)
    );
    onMounted(() => {
      if (props.autoplay && paths.value) play();
    });
    onBeforeUnmount(stop);
    const start = computed(() => {
      const match = paths.value?.[step.value]?.match(/^M\s*([\d.-]+)[,\s]+([\d.-]+)/i);
      return match ? { x: Number(match[1]), y: Number(match[2]) } : null;
    });
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1$4, [
        createBaseVNode("div", _hoisted_2$3, [
          __props.glyph.language !== "ja" ? (openBlock(), createElementBlock("div", _hoisted_3$3, [
            createBaseVNode("small", null, toDisplayString(unref(t)("印刷体")), 1),
            createBaseVNode("b", null, toDisplayString(__props.glyph.text), 1)
          ])) : createCommentVNode("", true),
          paths.value ? (openBlock(), createElementBlock("svg", {
            key: 1,
            viewBox: "0 0 109 109",
            class: "order-canvas",
            role: "img",
            "aria-label": unref(t)(`${__props.glyph.text} 第 ${step.value + 1} 笔`)
          }, [
            (openBlock(true), createElementBlock(Fragment, null, renderList(paths.value, (path, i) => {
              return openBlock(), createElementBlock("path", {
                key: i,
                d: path,
                fill: "none",
                stroke: "currentColor",
                "stroke-width": "2.8",
                "stroke-linecap": "round",
                opacity: i < step.value ? 1 : 0.14
              }, null, 8, _hoisted_5$3);
            }), 128)),
            (openBlock(), createElementBlock("path", {
              key: `${step.value}-${cycle.value}`,
              d: paths.value[step.value],
              fill: "none",
              stroke: "var(--accent)",
              "stroke-width": "3",
              "stroke-linecap": "round",
              pathLength: "1",
              class: normalizeClass({ "order-active": hasAnimation.value }),
              style: normalizeStyle({ animationPlayState: playing.value ? "running" : "paused" })
            }, null, 14, _hoisted_6$3)),
            start.value ? (openBlock(), createElementBlock("circle", {
              key: 0,
              cx: start.value.x,
              cy: start.value.y,
              r: "2.5",
              fill: "var(--accent)"
            }, null, 8, _hoisted_7$3)) : createCommentVNode("", true)
          ], 8, _hoisted_4$3)) : (openBlock(), createBlock(_sfc_main$6, {
            key: 2,
            glyph: __props.glyph
          }, null, 8, ["glyph"]))
        ]),
        __props.glyph.language !== "ja" && paths.value ? (openBlock(), createElementBlock("p", _hoisted_8$3, toDisplayString(unref(t)("动画为一种手写笔顺示意，连笔与字帖字体可有差异。")), 1)) : createCommentVNode("", true),
        !paths.value ? (openBlock(), createElementBlock("p", _hoisted_9$3, toDisplayString(unref(t)("一种参考书写顺序；实际连笔与起收笔可有合理变体。下方逐步说明笔的走向。")), 1)) : createCommentVNode("", true),
        paths.value ? (openBlock(), createElementBlock("div", _hoisted_10$2, [
          createBaseVNode("button", { onClick: play }, toDisplayString(unref(t)(playing.value ? "暂停" : "播放")), 1),
          createBaseVNode("button", {
            disabled: step.value === 0,
            onClick: _cache[0] || (_cache[0] = ($event) => select(step.value - 1))
          }, toDisplayString(unref(t)("上一笔")), 9, _hoisted_11$2),
          createBaseVNode("button", {
            disabled: step.value === steps.value.length - 1,
            onClick: _cache[1] || (_cache[1] = ($event) => select(step.value + 1))
          }, toDisplayString(unref(t)("下一笔")), 9, _hoisted_12$2)
        ])) : createCommentVNode("", true),
        createBaseVNode("ol", _hoisted_13$2, [
          (openBlock(true), createElementBlock(Fragment, null, renderList(steps.value, (text, i) => {
            return openBlock(), createElementBlock("li", {
              key: i,
              class: normalizeClass({ current: paths.value && step.value === i })
            }, [
              paths.value ? (openBlock(), createElementBlock("button", {
                key: 0,
                onClick: ($event) => select(i)
              }, toDisplayString(unref(t)(text)), 9, _hoisted_14$2)) : (openBlock(), createElementBlock("span", _hoisted_15$2, toDisplayString(unref(t)(text)), 1))
            ], 2);
          }), 128))
        ]),
        createBaseVNode("p", null, toDisplayString(unref(t)(__props.glyph.hint)), 1)
      ]);
    };
  }
});
const scriptRel = "modulepreload";
const assetsURL = function(dep, importerUrl) {
  return new URL(dep, importerUrl).href;
};
const seen = {};
const __vitePreload = function preload(baseModule, deps, importerUrl) {
  let promise = Promise.resolve();
  if (deps && deps.length > 0) {
    let allSettled = function(promises$2) {
      return Promise.all(promises$2.map((p2) => Promise.resolve(p2).then((value$1) => ({
        status: "fulfilled",
        value: value$1
      }), (reason) => ({
        status: "rejected",
        reason
      }))));
    };
    const links = document.getElementsByTagName("link");
    const cspNonceMeta = document.querySelector("meta[property=csp-nonce]");
    const cspNonce = cspNonceMeta?.nonce || cspNonceMeta?.getAttribute("nonce");
    promise = allSettled(deps.map((dep) => {
      dep = assetsURL(dep, importerUrl);
      if (dep in seen) return;
      seen[dep] = true;
      const isCss = dep.endsWith(".css");
      const cssSelector = isCss ? '[rel="stylesheet"]' : "";
      if (!!importerUrl) for (let i$1 = links.length - 1; i$1 >= 0; i$1--) {
        const link$1 = links[i$1];
        if (link$1.href === dep && (!isCss || link$1.rel === "stylesheet")) return;
      }
      else if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) return;
      const link = document.createElement("link");
      link.rel = isCss ? "stylesheet" : scriptRel;
      if (!isCss) link.as = "script";
      link.crossOrigin = "";
      link.href = dep;
      if (cspNonce) link.setAttribute("nonce", cspNonce);
      document.head.appendChild(link);
      if (isCss) return new Promise((res, rej) => {
        link.addEventListener("load", res);
        link.addEventListener("error", () => rej(/* @__PURE__ */ new Error(`Unable to preload CSS for ${dep}`)));
      });
    }));
  }
  function handlePreloadError(err$2) {
    const e$1 = new Event("vite:preloadError", { cancelable: true });
    e$1.payload = err$2;
    window.dispatchEvent(e$1);
    if (!e$1.defaultPrevented) throw err$2;
  }
  return promise.then((res) => {
    for (const item of res || []) {
      if (item.status !== "rejected") continue;
      handlePreloadError(item.reason);
    }
    return baseModule().catch(handlePreloadError);
  });
};
const samples = /* @__PURE__ */ JSON.parse('[{"id":"ja-u","glyphs":["ja-う","ja-ウ"],"text":"う","recording":"tofugu/ja-u.mp3","kind":"假名读音"},{"id":"ja-o","glyphs":["ja-お","ja-オ"],"text":"お","recording":"tofugu/ja-o.mp3","kind":"假名读音"},{"id":"ja-shi","glyphs":["ja-し","ja-シ"],"text":"し","recording":"tofugu/ja-shi.mp3","kind":"假名读音"},{"id":"ja-tsu","glyphs":["ja-つ","ja-ツ"],"text":"つ","recording":"tofugu/ja-tsu.mp3","kind":"假名读音"},{"id":"ja-hi","glyphs":["ja-ひ","ja-ヒ"],"text":"ひ","recording":"tofugu/ja-hi.mp3","kind":"假名读音"},{"id":"ja-ra","glyphs":["ja-ら","ja-ラ"],"text":"ら","recording":"tofugu/ja-ra.mp3","kind":"假名读音"},{"id":"ja-ri","glyphs":["ja-り","ja-リ"],"text":"り","recording":"tofugu/ja-ri.mp3","kind":"假名读音"},{"id":"ja-ru","glyphs":["ja-る","ja-ル"],"text":"る","recording":"tofugu/ja-ru.mp3","kind":"假名读音"},{"id":"ja-re","glyphs":["ja-れ","ja-レ"],"text":"れ","recording":"tofugu/ja-re.mp3","kind":"假名读音"},{"id":"ja-ro","glyphs":["ja-ろ","ja-ロ"],"text":"ろ","recording":"tofugu/ja-ro.mp3","kind":"假名读音"},{"id":"ja-a","glyphs":["ja-あ","ja-ア"],"text":"あ","recording":"tofugu/ja-a.mp3","kind":"假名读音"},{"id":"ja-i","glyphs":["ja-い","ja-イ"],"text":"い","recording":"tofugu/ja-i.mp3","kind":"假名读音"},{"id":"ja-e","glyphs":["ja-え","ja-エ"],"text":"え","recording":"tofugu/ja-e.mp3","kind":"假名读音"},{"id":"ja-ka","glyphs":["ja-か","ja-カ"],"text":"か","recording":"tofugu/ja-ka.mp3","kind":"假名读音"},{"id":"ja-ki","glyphs":["ja-き","ja-キ"],"text":"き","recording":"tofugu/ja-ki.mp3","kind":"假名读音"},{"id":"ja-ku","glyphs":["ja-く","ja-ク"],"text":"く","recording":"tofugu/ja-ku.mp3","kind":"假名读音"},{"id":"ja-ke","glyphs":["ja-け","ja-ケ"],"text":"け","recording":"tofugu/ja-ke.mp3","kind":"假名读音"},{"id":"ja-ko","glyphs":["ja-こ","ja-コ"],"text":"こ","recording":"tofugu/ja-ko.mp3","kind":"假名读音"},{"id":"ja-sa","glyphs":["ja-さ","ja-サ"],"text":"さ","recording":"tofugu/ja-sa.mp3","kind":"假名读音"},{"id":"ja-su","glyphs":["ja-す","ja-ス"],"text":"す","recording":"tofugu/ja-su.mp3","kind":"假名读音"},{"id":"ja-se","glyphs":["ja-せ","ja-セ"],"text":"せ","recording":"tofugu/ja-se.mp3","kind":"假名读音"},{"id":"ja-so","glyphs":["ja-そ","ja-ソ"],"text":"そ","recording":"tofugu/ja-so.mp3","kind":"假名读音"},{"id":"ja-ta","glyphs":["ja-た","ja-タ"],"text":"た","recording":"tofugu/ja-ta.mp3","kind":"假名读音"},{"id":"ja-chi","glyphs":["ja-ち","ja-チ"],"text":"ち","recording":"tofugu/ja-chi.mp3","kind":"假名读音"},{"id":"ja-te","glyphs":["ja-て","ja-テ"],"text":"て","recording":"tofugu/ja-te.mp3","kind":"假名读音"},{"id":"ja-to","glyphs":["ja-と","ja-ト"],"text":"と","recording":"tofugu/ja-to.mp3","kind":"假名读音"},{"id":"ja-na","glyphs":["ja-な","ja-ナ"],"text":"な","recording":"tofugu/ja-na.mp3","kind":"假名读音"},{"id":"ja-ni","glyphs":["ja-に","ja-ニ"],"text":"に","recording":"tofugu/ja-ni.mp3","kind":"假名读音"},{"id":"ja-nu","glyphs":["ja-ぬ","ja-ヌ"],"text":"ぬ","recording":"tofugu/ja-nu.mp3","kind":"假名读音"},{"id":"ja-ne","glyphs":["ja-ね","ja-ネ"],"text":"ね","recording":"tofugu/ja-ne.mp3","kind":"假名读音"},{"id":"ja-no","glyphs":["ja-の","ja-ノ"],"text":"の","recording":"tofugu/ja-no.mp3","kind":"假名读音"},{"id":"ja-ha","glyphs":["ja-は","ja-ハ"],"text":"は","recording":"tofugu/ja-ha.mp3","kind":"假名读音"},{"id":"ja-fu","glyphs":["ja-ふ","ja-フ"],"text":"ふ","recording":"tofugu/ja-fu.mp3","kind":"假名读音"},{"id":"ja-he","glyphs":["ja-へ","ja-ヘ"],"text":"へ","recording":"tofugu/ja-he.mp3","kind":"假名读音"},{"id":"ja-ho","glyphs":["ja-ほ","ja-ホ"],"text":"ほ","recording":"tofugu/ja-ho.mp3","kind":"假名读音"},{"id":"ja-ma","glyphs":["ja-ま","ja-マ"],"text":"ま","recording":"tofugu/ja-ma.mp3","kind":"假名读音"},{"id":"ja-mi","glyphs":["ja-み","ja-ミ"],"text":"み","recording":"tofugu/ja-mi.mp3","kind":"假名读音"},{"id":"ja-mu","glyphs":["ja-む","ja-ム"],"text":"む","recording":"tofugu/ja-mu.mp3","kind":"假名读音"},{"id":"ja-me","glyphs":["ja-め","ja-メ"],"text":"め","recording":"tofugu/ja-me.mp3","kind":"假名读音"},{"id":"ja-mo","glyphs":["ja-も","ja-モ"],"text":"も","recording":"tofugu/ja-mo.mp3","kind":"假名读音"},{"id":"ja-ya","glyphs":["ja-や","ja-ヤ"],"text":"や","recording":"tofugu/ja-ya.mp3","kind":"假名读音"},{"id":"ja-yu","glyphs":["ja-ゆ","ja-ユ"],"text":"ゆ","recording":"tofugu/ja-yu.mp3","kind":"假名读音"},{"id":"ja-yo","glyphs":["ja-よ","ja-ヨ"],"text":"よ","recording":"tofugu/ja-yo.mp3","kind":"假名读音"},{"id":"ja-wa","glyphs":["ja-わ","ja-ワ"],"text":"わ","recording":"tofugu/ja-wa.mp3","kind":"假名读音"},{"id":"ja-wo","glyphs":["ja-を","ja-ヲ"],"text":"を","recording":"tofugu/ja-wo.mp3","kind":"假名读音"},{"id":"ja-n","glyphs":["ja-ん","ja-ン"],"text":"ん","recording":"tofugu/ja-n.mp3","kind":"假名读音"},{"id":"ru-a","glyphs":["ru-а","ru-А"],"text":"а","recording":"ru-01.mp3","kind":"字母名称","clip":[0.54,1.04]},{"id":"ru-be","glyphs":["ru-б","ru-Б"],"text":"бэ","recording":"ru-02.mp3","kind":"字母名称","clip":[0.07,0.62]},{"id":"ru-03","glyphs":["ru-в","ru-В"],"text":"вэ","recording":"ru-03.mp3","kind":"字母名称","clip":[0,0.62]},{"id":"ru-04","glyphs":["ru-г","ru-Г"],"text":"гэ","recording":"ru-04.mp3","kind":"字母名称","clip":[0.05,0.64]},{"id":"ru-05","glyphs":["ru-д","ru-Д"],"text":"дэ","recording":"ru-05.mp3","kind":"字母名称","clip":[0.05,0.66]},{"id":"ru-06","glyphs":["ru-е","ru-Е"],"text":"е","recording":"ru-06.mp3","kind":"字母名称","clip":[0,0.69]},{"id":"ru-07","glyphs":["ru-ё","ru-Ё"],"text":"ё","recording":"ru-07.mp3","kind":"字母名称","clip":[0,0.69]},{"id":"ru-zhe","glyphs":["ru-ж","ru-Ж"],"text":"жэ","recording":"ru-08.mp3","kind":"字母名称","clip":[0,0.68]},{"id":"ru-09","glyphs":["ru-з","ru-З"],"text":"зэ","recording":"ru-09.mp3","kind":"字母名称","clip":[0,0.77]},{"id":"ru-10","glyphs":["ru-и","ru-И"],"text":"и","recording":"ru-10.mp3","kind":"字母名称","clip":[0.05,0.7]},{"id":"ru-11","glyphs":["ru-й","ru-Й"],"text":"и краткое","recording":"ru-11.mp3","kind":"字母名称","clip":[0.03,1.24]},{"id":"ru-12","glyphs":["ru-к","ru-К"],"text":"ка","recording":"ru-12.mp3","kind":"字母名称","clip":[0.01,0.69]},{"id":"ru-13","glyphs":["ru-л","ru-Л"],"text":"эль","recording":"ru-13.mp3","kind":"字母名称","clip":[0.04,0.66]},{"id":"ru-14","glyphs":["ru-м","ru-М"],"text":"эм","recording":"ru-14.mp3","kind":"字母名称","clip":[0.05,0.74]},{"id":"ru-15","glyphs":["ru-н","ru-Н"],"text":"эн","recording":"ru-15.mp3","kind":"字母名称","clip":[0.06,0.75]},{"id":"ru-16","glyphs":["ru-о","ru-О"],"text":"о","recording":"ru-16.mp3","kind":"字母名称","clip":[0.04,0.71]},{"id":"ru-17","glyphs":["ru-п","ru-П"],"text":"пэ","recording":"ru-17.mp3","kind":"字母名称","clip":[0.06,0.7]},{"id":"ru-18","glyphs":["ru-р","ru-Р"],"text":"эр","recording":"ru-18.mp3","kind":"字母名称","clip":[0.05,0.7]},{"id":"ru-19","glyphs":["ru-с","ru-С"],"text":"эс","recording":"ru-19.mp3","kind":"字母名称","clip":[0.04,0.84]},{"id":"ru-20","glyphs":["ru-т","ru-Т"],"text":"тэ","recording":"ru-20.mp3","kind":"字母名称","clip":[0.05,0.69]},{"id":"ru-21","glyphs":["ru-у","ru-У"],"text":"у","recording":"ru-21.mp3","kind":"字母名称","clip":[0.07,0.68]},{"id":"ru-22","glyphs":["ru-ф","ru-Ф"],"text":"эф","recording":"ru-22.mp3","kind":"字母名称","clip":[0.04,0.81]},{"id":"ru-23","glyphs":["ru-х","ru-Х"],"text":"ха","recording":"ru-23.mp3","kind":"字母名称","clip":[0,0.64]},{"id":"ru-24","glyphs":["ru-ц","ru-Ц"],"text":"цэ","recording":"ru-24.mp3","kind":"字母名称","clip":[0,0.7]},{"id":"ru-25","glyphs":["ru-ч","ru-Ч"],"text":"че","recording":"ru-25.mp3","kind":"字母名称","clip":[0.02,0.76]},{"id":"ru-26","glyphs":["ru-ш","ru-Ш"],"text":"ша","recording":"ru-26.mp3","kind":"字母名称","clip":[0,0.77]},{"id":"ru-27","glyphs":["ru-щ","ru-Щ"],"text":"ща","recording":"ru-27.mp3","kind":"字母名称","clip":[0,0.93]},{"id":"ru-28","glyphs":["ru-ъ","ru-Ъ"],"text":"твёрдый знак","recording":"ru-28.mp3","kind":"字母名称","clip":[0,1.15]},{"id":"ru-29","glyphs":["ru-ы","ru-Ы"],"text":"ы","recording":"ru-29.mp3","kind":"字母名称","clip":[0.05,0.66]},{"id":"ru-30","glyphs":["ru-ь","ru-Ь"],"text":"мягкий знак","recording":"ru-30.mp3","kind":"字母名称","clip":[0.04,1.08]},{"id":"ru-31","glyphs":["ru-э","ru-Э"],"text":"э","recording":"ru-31.mp3","kind":"字母名称","clip":[0.04,0.67]},{"id":"ru-32","glyphs":["ru-ю","ru-Ю"],"text":"ю","recording":"ru-32.mp3","kind":"字母名称","clip":[0,0.67]},{"id":"ru-33","glyphs":["ru-я","ru-Я"],"text":"я","recording":"ru-33.mp3","kind":"字母名称","clip":[0,0.64]},{"id":"el-alpha","glyphs":["el-α","el-Α"],"text":"άλφα","recording":"el-alphabet.mp3","clip":[1.82,2.5],"kind":"字母名称"},{"id":"el-vita","glyphs":["el-β","el-Β"],"text":"βήτα","recording":"el-alphabet.mp3","clip":[2.67,3.33],"kind":"字母名称"},{"id":"el-gamma","glyphs":["el-γ","el-Γ"],"text":"γάμμα","recording":"el-alphabet.mp3","clip":[3.51,4.18],"kind":"字母名称"},{"id":"el-delta","glyphs":["el-δ","el-Δ"],"text":"δέλτα","recording":"el-alphabet.mp3","clip":[4.34,5.06],"kind":"字母名称"},{"id":"el-epsilon","glyphs":["el-ε","el-Ε"],"text":"έψιλον","recording":"el-alphabet.mp3","clip":[5.22,5.98],"kind":"字母名称"},{"id":"el-zeta","glyphs":["el-ζ","el-Ζ"],"text":"ζήτα","recording":"el-alphabet.mp3","clip":[6.1,6.78],"kind":"字母名称"},{"id":"el-eta","glyphs":["el-η","el-Η"],"text":"ήτα","recording":"el-alphabet.mp3","clip":[6.97,7.57],"kind":"字母名称"},{"id":"el-theta","glyphs":["el-θ","el-Θ"],"text":"θήτα","recording":"el-alphabet.mp3","clip":[7.69,8.42],"kind":"字母名称"},{"id":"el-iota","glyphs":["el-ι","el-Ι"],"text":"γιώτα","recording":"el-alphabet.mp3","clip":[8.56,9.28],"kind":"字母名称"},{"id":"el-kappa","glyphs":["el-κ","el-Κ"],"text":"κάππα","recording":"el-alphabet.mp3","clip":[9.41,10.08],"kind":"字母名称"},{"id":"el-lambda","glyphs":["el-λ","el-Λ"],"text":"λάμδα","recording":"el-alphabet.mp3","clip":[10.21,10.95],"kind":"字母名称"},{"id":"el-mu","glyphs":["el-μ","el-Μ"],"text":"μι","recording":"el-alphabet.mp3","clip":[11.06,11.55],"kind":"字母名称"},{"id":"el-nu","glyphs":["el-ν","el-Ν"],"text":"νι","recording":"el-alphabet.mp3","clip":[11.8,12.26],"kind":"字母名称"},{"id":"el-xi","glyphs":["el-ξ","el-Ξ"],"text":"ξι","recording":"el-alphabet.mp3","clip":[12.54,13.3],"kind":"字母名称"},{"id":"el-omicron","glyphs":["el-ο","el-Ο"],"text":"όμικρον","recording":"el-alphabet.mp3","clip":[13.38,14.17],"kind":"字母名称"},{"id":"el-pi","glyphs":["el-π","el-Π"],"text":"πι","recording":"el-alphabet.mp3","clip":[14.34,14.73],"kind":"字母名称"},{"id":"el-rho","glyphs":["el-ρ","el-Ρ"],"text":"ρο","recording":"el-alphabet.mp3","clip":[14.98,15.5],"kind":"字母名称"},{"id":"el-sigma","glyphs":["el-σ","el-Σ","el-ς"],"text":"σίγμα","recording":"el-alphabet.mp3","clip":[15.55,16.37],"kind":"字母名称"},{"id":"el-tau","glyphs":["el-τ","el-Τ"],"text":"ταυ","recording":"el-alphabet.mp3","clip":[16.57,17.12],"kind":"字母名称"},{"id":"el-upsilon","glyphs":["el-υ","el-Υ"],"text":"ύψιλον","recording":"el-alphabet.mp3","clip":[17.29,18.09],"kind":"字母名称"},{"id":"el-phi","glyphs":["el-φ","el-Φ"],"text":"φι","recording":"el-alphabet.mp3","clip":[18.1,18.61],"kind":"字母名称"},{"id":"el-chi","glyphs":["el-χ","el-Χ"],"text":"χι","recording":"el-alphabet.mp3","clip":[18.77,19.27],"kind":"字母名称"},{"id":"el-psi","glyphs":["el-ψ","el-Ψ"],"text":"ψι","recording":"el-alphabet.mp3","clip":[19.44,19.95],"kind":"字母名称"},{"id":"el-omega","glyphs":["el-ω","el-Ω"],"text":"ωμέγα","recording":"el-alphabet.mp3","clip":[20.05,20.77],"kind":"字母名称"},{"id":"hy-00","glyphs":["hy-ա","hy-Ա"],"text":"ա","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[0.454,1.007],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-01","glyphs":["hy-բ","hy-Բ"],"text":"բ","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[1.356,1.931],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-02","glyphs":["hy-գ","hy-Գ"],"text":"գ","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[2.436,2.991],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-03","glyphs":["hy-դ","hy-Դ"],"text":"դ","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[3.567,4.085],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-04","glyphs":["hy-ե","hy-Ե"],"text":"ե","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[4.448,5.097],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-05","glyphs":["hy-զ","hy-Զ"],"text":"զ","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[5.331,6.037],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-06","glyphs":["hy-է","hy-Է"],"text":"է","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[6.486,7.03],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-07","glyphs":["hy-ը","hy-Ը"],"text":"ը","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[7.51,8.055],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-08","glyphs":["hy-թ","hy-Թ"],"text":"թ","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[8.549,9.174],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-09","glyphs":["hy-ժ","hy-Ժ"],"text":"ժ","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[9.525,10.217],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-10","glyphs":["hy-ի","hy-Ի"],"text":"ի","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[10.621,11.167],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-11","glyphs":["hy-լ","hy-Լ"],"text":"լ","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[11.654,12.31],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-12","glyphs":["hy-խ","hy-Խ"],"text":"խ","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[12.68,13.356],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-13","glyphs":["hy-ծ","hy-Ծ"],"text":"ծ","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[13.921,14.459],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-14","glyphs":["hy-կ","hy-Կ"],"text":"կ","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[14.977,15.573],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-15","glyphs":["hy-հ","hy-Հ"],"text":"հ","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[16.119,16.658],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-16","glyphs":["hy-ձ","hy-Ձ"],"text":"ձ","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[17.225,17.837],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-17","glyphs":["hy-ղ","hy-Ղ"],"text":"ղ","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[18.199,18.812],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-18","glyphs":["hy-ճ","hy-Ճ"],"text":"ճ","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[19.307,19.907],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-19","glyphs":["hy-մ","hy-Մ"],"text":"մ","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[20.33,20.987],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-20","glyphs":["hy-յ","hy-Յ"],"text":"յ","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[21.525,22.199],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-21","glyphs":["hy-ն","hy-Ն"],"text":"ն","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[22.548,23.224],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-22","glyphs":["hy-շ","hy-Շ"],"text":"շ","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[23.679,24.368],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-23","glyphs":["hy-ո","hy-Ո"],"text":"ո","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[24.704,25.391],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-24","glyphs":["hy-չ","hy-Չ"],"text":"չ","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[25.93,26.541],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-25","glyphs":["hy-պ","hy-Պ"],"text":"պ","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[27.074,27.62],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-26","glyphs":["hy-ջ","hy-Ջ"],"text":"ջ","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[28.207,28.762],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-27","glyphs":["hy-ռ","hy-Ռ"],"text":"ռ","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[29.288,29.961],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-28","glyphs":["hy-ս","hy-Ս"],"text":"ս","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[30.641,31.18],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-29","glyphs":["hy-վ","hy-Վ"],"text":"վ","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[31.834,32.46],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-30","glyphs":["hy-տ","hy-Տ"],"text":"տ","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[33.045,33.593],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-31","glyphs":["hy-ր","hy-Ր"],"text":"ր","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[34.087,34.789],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-32","glyphs":["hy-ց","hy-Ց"],"text":"ց","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[35.253,35.91],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-34","glyphs":["hy-փ","hy-Փ"],"text":"փ","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[37.432,38.009],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-35","glyphs":["hy-ք","hy-Ք"],"text":"ք","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[38.383,39.022],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-36","glyphs":["hy-օ","hy-Օ"],"text":"օ","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[39.538,40.098],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-37","glyphs":["hy-ֆ","hy-Ֆ"],"text":"ֆ","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[40.663,41.206],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-38","glyphs":["hy-ու","hy-Ու"],"text":"ու","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[41.772,42.323],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"hy-39","glyphs":["hy-և","hy-ԵՎ"],"text":"և","recording":"hy-alphabet.ogg","kind":"字母读音","clip":[42.752,43.43],"filter":"highpass=f=100,afftdn=nf=-20"},{"id":"ka-00","glyphs":["ka-ა"],"text":"ა","recording":"ka-ა.m4a","kind":"字母读音"},{"id":"ka-01","glyphs":["ka-ბ"],"text":"ბ","recording":"ka-ბ.m4a","kind":"字母读音"},{"id":"ka-02","glyphs":["ka-გ"],"text":"გ","recording":"ka-გ.m4a","kind":"字母读音"},{"id":"ka-03","glyphs":["ka-დ"],"text":"დ","recording":"ka-დ.m4a","kind":"字母读音"},{"id":"ka-04","glyphs":["ka-ე"],"text":"ე","recording":"ka-ე.m4a","kind":"字母读音"},{"id":"ka-05","glyphs":["ka-ვ"],"text":"ვ","recording":"ka-ვ.m4a","kind":"字母读音"},{"id":"ka-06","glyphs":["ka-ზ"],"text":"ზ","recording":"ka-ზ.m4a","kind":"字母读音"},{"id":"ka-07","glyphs":["ka-თ"],"text":"თ","recording":"ka-თ.m4a","kind":"字母读音"},{"id":"ka-08","glyphs":["ka-ი"],"text":"ი","recording":"ka-ი.m4a","kind":"字母读音"},{"id":"ka-09","glyphs":["ka-კ"],"text":"კ","recording":"ka-კ.m4a","kind":"字母读音"},{"id":"ka-10","glyphs":["ka-ლ"],"text":"ლ","recording":"ka-ლ.m4a","kind":"字母读音"},{"id":"ka-11","glyphs":["ka-მ"],"text":"მ","recording":"ka-მ.m4a","kind":"字母读音"},{"id":"ka-12","glyphs":["ka-ნ"],"text":"ნ","recording":"ka-ნ.m4a","kind":"字母读音"},{"id":"ka-13","glyphs":["ka-ო"],"text":"ო","recording":"ka-ო.m4a","kind":"字母读音"},{"id":"ka-14","glyphs":["ka-პ"],"text":"პ","recording":"ka-პ.m4a","kind":"字母读音"},{"id":"ka-15","glyphs":["ka-ჟ"],"text":"ჟ","recording":"ka-ჟ.m4a","kind":"字母读音"},{"id":"ka-16","glyphs":["ka-რ"],"text":"რ","recording":"ka-რ.m4a","kind":"字母读音"},{"id":"ka-17","glyphs":["ka-ს"],"text":"ს","recording":"ka-ს.m4a","kind":"字母读音"},{"id":"ka-18","glyphs":["ka-ტ"],"text":"ტ","recording":"ka-ტ.m4a","kind":"字母读音"},{"id":"ka-19","glyphs":["ka-უ"],"text":"უ","recording":"ka-უ.m4a","kind":"字母读音"},{"id":"ka-20","glyphs":["ka-ფ"],"text":"ფ","recording":"ka-ფ.m4a","kind":"字母读音"},{"id":"ka-21","glyphs":["ka-ქ"],"text":"ქ","recording":"ka-ქ.m4a","kind":"字母读音"},{"id":"ka-22","glyphs":["ka-ღ"],"text":"ღ","recording":"ka-ღ.m4a","kind":"字母读音"},{"id":"ka-23","glyphs":["ka-ყ"],"text":"ყ","recording":"ka-ყ.m4a","kind":"字母读音"},{"id":"ka-24","glyphs":["ka-შ"],"text":"შ","recording":"ka-შ.m4a","kind":"字母读音"},{"id":"ka-25","glyphs":["ka-ჩ"],"text":"ჩ","recording":"ka-ჩ.m4a","kind":"字母读音"},{"id":"ka-26","glyphs":["ka-ც"],"text":"ც","recording":"ka-ც.m4a","kind":"字母读音"},{"id":"ka-27","glyphs":["ka-ძ"],"text":"ძ","recording":"ka-ძ.m4a","kind":"字母读音"},{"id":"ka-28","glyphs":["ka-წ"],"text":"წ","recording":"ka-წ.m4a","kind":"字母读音"},{"id":"ka-29","glyphs":["ka-ჭ"],"text":"ჭ","recording":"ka-ჭ.m4a","kind":"字母读音"},{"id":"ka-30","glyphs":["ka-ხ"],"text":"ხ","recording":"ka-ხ.m4a","kind":"字母读音"},{"id":"ka-31","glyphs":["ka-ჯ"],"text":"ჯ","recording":"ka-ჯ.m4a","kind":"字母读音"},{"id":"ka-32","glyphs":["ka-ჰ"],"text":"ჰ","recording":"ka-ჰ.m4a","kind":"字母读音"},{"id":"ko-00","glyphs":["ko-ㄱ"],"text":"ㄱ","recording":"ko-ㄱ.mp3","kind":"字母名称与读音"},{"id":"ko-01","glyphs":["ko-ㄲ"],"text":"ㄲ","recording":"ko-ㄲ.mp3","kind":"字母名称与读音"},{"id":"ko-02","glyphs":["ko-ㄴ"],"text":"ㄴ","recording":"ko-ㄴ.mp3","kind":"字母名称与读音"},{"id":"ko-03","glyphs":["ko-ㄷ"],"text":"ㄷ","recording":"ko-ㄷ.mp3","kind":"字母名称与读音"},{"id":"ko-04","glyphs":["ko-ㄸ"],"text":"ㄸ","recording":"ko-ㄸ.mp3","kind":"字母名称与读音"},{"id":"ko-05","glyphs":["ko-ㄹ"],"text":"ㄹ","recording":"ko-ㄹ.mp3","kind":"字母名称与读音"},{"id":"ko-06","glyphs":["ko-ㅁ"],"text":"ㅁ","recording":"ko-ㅁ.mp3","kind":"字母名称与读音"},{"id":"ko-07","glyphs":["ko-ㅂ"],"text":"ㅂ","recording":"ko-ㅂ.mp3","kind":"字母名称与读音"},{"id":"ko-08","glyphs":["ko-ㅃ"],"text":"ㅃ","recording":"ko-ㅃ.mp3","kind":"字母名称与读音"},{"id":"ko-09","glyphs":["ko-ㅅ"],"text":"ㅅ","recording":"ko-ㅅ.mp3","kind":"字母名称与读音"},{"id":"ko-10","glyphs":["ko-ㅆ"],"text":"ㅆ","recording":"ko-ㅆ.mp3","kind":"字母名称与读音"},{"id":"ko-11","glyphs":["ko-ㅇ"],"text":"ㅇ","recording":"ko-ㅇ.mp3","kind":"字母名称与读音"},{"id":"ko-12","glyphs":["ko-ㅈ"],"text":"ㅈ","recording":"ko-ㅈ.mp3","kind":"字母名称与读音"},{"id":"ko-13","glyphs":["ko-ㅉ"],"text":"ㅉ","recording":"ko-ㅉ.mp3","kind":"字母名称与读音"},{"id":"ko-14","glyphs":["ko-ㅊ"],"text":"ㅊ","recording":"ko-ㅊ.mp3","kind":"字母名称与读音"},{"id":"ko-15","glyphs":["ko-ㅋ"],"text":"ㅋ","recording":"ko-ㅋ.mp3","kind":"字母名称与读音"},{"id":"ko-16","glyphs":["ko-ㅌ"],"text":"ㅌ","recording":"ko-ㅌ.mp3","kind":"字母名称与读音"},{"id":"ko-17","glyphs":["ko-ㅍ"],"text":"ㅍ","recording":"ko-ㅍ.mp3","kind":"字母名称与读音"},{"id":"ko-18","glyphs":["ko-ㅎ"],"text":"ㅎ","recording":"ko-ㅎ.mp3","kind":"字母名称与读音"},{"id":"ko-19","glyphs":["ko-ㅏ"],"text":"ㅏ","recording":"ko-ㅏ.mp3","kind":"字母读音"},{"id":"ko-20","glyphs":["ko-ㅐ"],"text":"ㅐ","recording":"ko-ㅐ.mp3","kind":"字母读音"},{"id":"ko-21","glyphs":["ko-ㅑ"],"text":"ㅑ","recording":"ko-ㅑ.mp3","kind":"字母读音"},{"id":"ko-22","glyphs":["ko-ㅒ"],"text":"ㅒ","recording":"ko-ㅒ.mp3","kind":"字母读音"},{"id":"ko-23","glyphs":["ko-ㅓ"],"text":"ㅓ","recording":"ko-ㅓ.mp3","kind":"字母读音"},{"id":"ko-24","glyphs":["ko-ㅔ"],"text":"ㅔ","recording":"ko-ㅔ.mp3","kind":"字母读音"},{"id":"ko-25","glyphs":["ko-ㅕ"],"text":"ㅕ","recording":"ko-ㅕ.mp3","kind":"字母读音"},{"id":"ko-26","glyphs":["ko-ㅖ"],"text":"ㅖ","recording":"ko-ㅖ.mp3","kind":"字母读音"},{"id":"ko-27","glyphs":["ko-ㅗ"],"text":"ㅗ","recording":"ko-ㅗ.mp3","kind":"字母读音"},{"id":"ko-28","glyphs":["ko-ㅘ"],"text":"ㅘ","recording":"ko-ㅘ.mp3","kind":"字母读音"},{"id":"ko-29","glyphs":["ko-ㅙ"],"text":"ㅙ","recording":"ko-ㅙ.mp3","kind":"字母读音"},{"id":"ko-30","glyphs":["ko-ㅚ"],"text":"ㅚ","recording":"ko-ㅚ.mp3","kind":"字母读音"},{"id":"ko-31","glyphs":["ko-ㅛ"],"text":"ㅛ","recording":"ko-ㅛ.mp3","kind":"字母读音"},{"id":"ko-32","glyphs":["ko-ㅜ"],"text":"ㅜ","recording":"ko-ㅜ.mp3","kind":"字母读音"},{"id":"ko-33","glyphs":["ko-ㅝ"],"text":"ㅝ","recording":"ko-ㅝ.mp3","kind":"字母读音"},{"id":"ko-34","glyphs":["ko-ㅞ"],"text":"ㅞ","recording":"ko-ㅞ.mp3","kind":"字母读音"},{"id":"ko-35","glyphs":["ko-ㅟ"],"text":"ㅟ","recording":"ko-ㅟ.mp3","kind":"字母读音"},{"id":"ko-36","glyphs":["ko-ㅠ"],"text":"ㅠ","recording":"ko-ㅠ.mp3","kind":"字母读音"},{"id":"ko-37","glyphs":["ko-ㅡ"],"text":"ㅡ","recording":"ko-ㅡ.mp3","kind":"字母读音"},{"id":"ko-38","glyphs":["ko-ㅢ"],"text":"ㅢ","recording":"ko-ㅢ.mp3","kind":"字母读音"},{"id":"ko-39","glyphs":["ko-ㅣ"],"text":"ㅣ","recording":"ko-ㅣ.mp3","kind":"字母读音"},{"id":"vi-00","glyphs":["vi-a","vi-A"],"text":"a","recording":"niu/a1.mp3","kind":"字母名称"},{"id":"vi-01","glyphs":["vi-ă","vi-Ă"],"text":"á","recording":"niu/a2.mp3","kind":"字母名称"},{"id":"vi-02","glyphs":["vi-â","vi-Â"],"text":"ớ","recording":"niu/a3.mp3","kind":"字母名称"},{"id":"vi-03","glyphs":["vi-b","vi-B"],"text":"bê","recording":"niu/b.mp3","kind":"字母名称"},{"id":"vi-04","glyphs":["vi-c","vi-C"],"text":"xê","recording":"niu/c.mp3","kind":"字母名称"},{"id":"vi-05","glyphs":["vi-d","vi-D"],"text":"dê","recording":"niu/d1.mp3","kind":"字母名称"},{"id":"vi-06","glyphs":["vi-đ","vi-Đ"],"text":"đê","recording":"niu/d2.mp3","kind":"字母名称"},{"id":"vi-07","glyphs":["vi-e","vi-E"],"text":"e","recording":"niu/e1.mp3","kind":"字母名称"},{"id":"vi-08","glyphs":["vi-ê","vi-Ê"],"text":"ê","recording":"niu/e2.mp3","kind":"字母名称"},{"id":"vi-09","glyphs":["vi-g","vi-G"],"text":"giê","recording":"niu/g.mp3","kind":"字母名称"},{"id":"vi-10","glyphs":["vi-h","vi-H"],"text":"hát","recording":"niu/h.mp3","kind":"字母名称"},{"id":"vi-11","glyphs":["vi-i","vi-I"],"text":"i","recording":"niu/i.mp3","kind":"字母名称"},{"id":"vi-12","glyphs":["vi-k","vi-K"],"text":"ca","recording":"niu/k.mp3","kind":"字母名称"},{"id":"vi-13","glyphs":["vi-l","vi-L"],"text":"e-lờ","recording":"niu/l.mp3","kind":"字母名称"},{"id":"vi-14","glyphs":["vi-m","vi-M"],"text":"em-mờ","recording":"niu/m.mp3","kind":"字母名称"},{"id":"vi-15","glyphs":["vi-n","vi-N"],"text":"en-nờ","recording":"niu/n.mp3","kind":"字母名称"},{"id":"vi-16","glyphs":["vi-o","vi-O"],"text":"o","recording":"niu/o1.mp3","kind":"字母名称"},{"id":"vi-17","glyphs":["vi-ơ","vi-Ơ"],"text":"ơ","recording":"niu/o3.mp3","kind":"字母名称"},{"id":"vi-18","glyphs":["vi-ô","vi-Ô"],"text":"ô","recording":"niu/o2.mp3","kind":"字母名称"},{"id":"vi-19","glyphs":["vi-p","vi-P"],"text":"pê","recording":"niu/p.mp3","kind":"字母名称"},{"id":"vi-20","glyphs":["vi-q","vi-Q"],"text":"cu","recording":"niu/q.mp3","kind":"字母名称"},{"id":"vi-21","glyphs":["vi-r","vi-R"],"text":"e-rờ","recording":"niu/r.mp3","kind":"字母名称"},{"id":"vi-22","glyphs":["vi-s","vi-S"],"text":"ét-sì","recording":"niu/s.mp3","kind":"字母名称"},{"id":"vi-23","glyphs":["vi-t","vi-T"],"text":"tê","recording":"niu/t.mp3","kind":"字母名称"},{"id":"vi-24","glyphs":["vi-u","vi-U"],"text":"u","recording":"niu/u1.mp3","kind":"字母名称"},{"id":"vi-25","glyphs":["vi-ư","vi-Ư"],"text":"ư","recording":"niu/u2.mp3","kind":"字母名称"},{"id":"vi-26","glyphs":["vi-v","vi-V"],"text":"vê","recording":"niu/v.mp3","kind":"字母名称"},{"id":"vi-27","glyphs":["vi-x","vi-X"],"text":"ích-xì","recording":"niu/x.mp3","kind":"字母名称"},{"id":"vi-28","glyphs":["vi-y","vi-Y"],"text":"i dài","recording":"niu/y.mp3","kind":"字母名称"}]');
let audioSources = {};
const audioState = /* @__PURE__ */ ref("loading");
let loadingAudio = null;
function loadPronunciations() {
  if (audioState.value === "ready") return Promise.resolve();
  if (loadingAudio) return loadingAudio;
  audioState.value = "loading";
  loadingAudio = __vitePreload(() => import("./pronunciation-audio-DUwlV7Uq.js"), true ? [] : void 0, import.meta.url).then(
    (module) => {
      audioSources = module.default;
      audioState.value = "ready";
    },
    (error) => {
      loadingAudio = null;
      audioState.value = "failed";
      throw error;
    }
  );
  return loadingAudio;
}
const pronunciationFor = (id) => samples.find((sample) => sample.glyphs.includes(id));
const speaking = /* @__PURE__ */ ref("");
const playbackError = /* @__PURE__ */ ref("");
let player = null;
function stopPronunciation() {
  const previous = player;
  player = null;
  speaking.value = "";
  if (previous) {
    previous.onended = null;
    previous.onerror = null;
    previous.pause();
  }
}
async function playPronunciation(id) {
  const sample = pronunciationFor(id);
  if (!sample || audioState.value !== "ready") return;
  stopPronunciation();
  playbackError.value = "";
  const audio = new Audio(audioSources[sample.id]);
  player = audio;
  speaking.value = sample.id;
  const failed = () => {
    if (player !== audio) return;
    playbackError.value = sample.id;
    stopPronunciation();
  };
  audio.onended = () => {
    if (player === audio) stopPronunciation();
  };
  audio.onerror = failed;
  try {
    await audio.play();
  } catch {
    failed();
  }
}
const _hoisted_1$3 = ["aria-label", "aria-busy", "disabled", "title"];
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "PronunciationButton",
  props: {
    glyph: {},
    compact: { type: Boolean }
  },
  setup(__props) {
    const { t } = useAppI18n();
    const props = __props;
    const sample = computed(() => pronunciationFor(props.glyph.id));
    const playing = computed(() => !!sample.value && speaking.value === sample.value.id);
    const failed = computed(
      () => !!sample.value && (audioState.value === "failed" || playbackError.value === sample.value.id)
    );
    onBeforeUnmount(() => {
      if (playing.value) stopPronunciation();
    });
    return (_ctx, _cache) => {
      return sample.value ? (openBlock(), createElementBlock("div", {
        key: 0,
        class: normalizeClass(["pronunciation-control", { compact: __props.compact }])
      }, [
        createBaseVNode("button", {
          type: "button",
          class: normalizeClass(["pronunciation-button", { playing: playing.value, failed: failed.value }]),
          "aria-label": unref(t)("{0} {1} 的{2}", [
            unref(t)(
              unref(audioState) === "loading" ? "正在加载录音" : failed.value ? "播放失败，重试" : playing.value ? "正在播放" : "播放"
            ),
            __props.glyph.text,
            unref(t)(sample.value.kind)
          ]),
          "aria-busy": playing.value || unref(audioState) === "loading",
          disabled: unref(audioState) === "loading",
          title: unref(audioState) === "loading" ? unref(t)("正在加载录音") : failed.value ? unref(t)("播放失败，点击重试") : `${playing.value ? unref(t)("正在播放：") : ""}${unref(t)(sample.value.kind)}: ${sample.value.text}`,
          onClick: _cache[0] || (_cache[0] = withModifiers(($event) => unref(audioState) === "ready" ? unref(playPronunciation)(__props.glyph.id) : unref(loadPronunciations)().catch(() => {
          }), ["stop"]))
        }, [..._cache[1] || (_cache[1] = [
          createBaseVNode("svg", {
            viewBox: "0 0 24 24",
            "aria-hidden": "true"
          }, [
            createBaseVNode("path", { d: "M11 5 6 9H3v6h3l5 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" })
          ], -1)
        ])], 10, _hoisted_1$3)
      ], 2)) : createCommentVNode("", true);
    };
  }
});
const sources = /* @__PURE__ */ JSON.parse(`[{"id":"ja-u","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%81%86_v2.mp3","downloadSha256":"346a450f0721d1f58401740f3704298a31cad6b6ca396afe0a7f75f6be918cb8","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: う","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-o","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%81%8A_v2.mp3","downloadSha256":"30b107314842b9ee0c933313770570c29fef6892c0d7deb1eb2554ece0630294","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: お","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-shi","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%81%97_v2.mp3","downloadSha256":"331c15697a9d90d0345011bb1e38017dd2926018cf7f83160c6e0466f10caa34","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: し","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-tsu","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%81%A4_v2.mp3","downloadSha256":"f7d9196434092e6880a2976eabdbe17e39baf79b0bd0f770573e80501c00cfe3","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: つ","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-hi","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%81%B2_v2.mp3","downloadSha256":"379e12c67f41990183facda18b0f699d93413f79b5eb5b6a808b8f8c6a579f42","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: ひ","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-ra","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%82%89_v2.mp3","downloadSha256":"b83aa3c82503a8bd6bac7fd941bad63b3d17833f44f98a8e4d2f0b8162954884","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: ら","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-ri","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%82%8A_v2.mp3","downloadSha256":"af99287007fe99c0802d7af099424f92bc8aa36a650294ca4c89f9168a4ce244","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: り","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-ru","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%82%8B_v2.mp3","downloadSha256":"2b4720f164289f6dd4f8de68dd7cb37fa999d74e95f6e726a613502ebb3022e0","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: る","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-re","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%82%8C_v2.mp3","downloadSha256":"e9a1cb79ed59d2cad39eb43582ecbfccdc6daf48e2fe6d72f2ddd1c28c5315e5","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: れ","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-ro","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%82%8D_v2.mp3","downloadSha256":"960c53ccd997f927630947945104568d02ea15df31156a1d623ec68dead14edf","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: ろ","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-a","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%81%82_v2.mp3","downloadSha256":"7643df90ec7a620a3eba8a1f8c3b77ece541982358b2094360e51625db8349ef","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: あ","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-i","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%81%84_v2.mp3","downloadSha256":"76abcb53d1ccaa47ca7fd799610f092735810cec0d31a274e5a5e682aed417fe","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: い","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-e","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%81%88_v2.mp3","downloadSha256":"ed1125426ad375ce404cbdb9d20acf718aa1a6bb83f6a4d783b7b98008eccebc","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: え","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-ka","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%81%8B_v2.mp3","downloadSha256":"63f157b2b0bfc855ddc1d80712055a9aed35e58952269010f318c4531372cd8c","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: か","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-ki","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%81%8D_v2.mp3","downloadSha256":"d1cf2f0828e49a6a7a572d85d878ad7f8b88cd5c40f576301dd2d58d0e93c54e","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: き","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-ku","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%81%8F_v2.mp3","downloadSha256":"ce52240c4c17d7a2e52dda8e80c863f29926164939609c8e7c053147a073a484","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: く","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-ke","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%81%91_v2.mp3","downloadSha256":"53c9901a4ddadc4fa5b461f1f768e856867acf8c0dc43fb4503a4978b0ec8c4a","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: け","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-ko","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%81%93_v2.mp3","downloadSha256":"a0d4db5ed4e2db5405f83556c9ccb63a7ce9f57b99dfb522d439d2a726024efe","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: こ","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-sa","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%81%95_v2.mp3","downloadSha256":"489e88fda9c60fa77d2408c0a745d0e7f56fe9294e4647eeef1a97125660f773","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: さ","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-su","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%81%99_v2.mp3","downloadSha256":"09d0f77b473a11650a45ec1b14febb7f038dc4a6a62a89e02164738595f29b0a","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: す","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-se","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%81%9B_v2.mp3","downloadSha256":"83aa5574fb817cf9b947a1c613b0223541aab08fae590accd4148a12b715be9f","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: せ","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-so","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%81%9D_v2.mp3","downloadSha256":"87e8f4192a545e6c32e6b4178cff05d42653a560b304cec16c8e2b61ee5d71a1","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: そ","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-ta","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%81%9F_v2.mp3","downloadSha256":"a08e34e5728bfd63c90e5ab7de1d100a6739544c99caaf04ecf05ad8893d4820","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: た","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-chi","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%81%A1_v2.mp3","downloadSha256":"15fd0e1022bf0016209a2fe77bd3b5482b01ecd2209285540d44c33c32303281","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: ち","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-te","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%81%A6_v2.mp3","downloadSha256":"0eedf04f0f3e00d2040fdbd1c2379e0ae1c5c82c75ae7988939cd4497ce2ef95","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: て","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-to","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%81%A8_v2.mp3","downloadSha256":"912aa811eea70d7d49e7793d9170a244663238b530620fdc498e8e35fcdc6092","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: と","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-na","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%81%AA_v2.mp3","downloadSha256":"bcb230f51940ac2cbab5a2e963232c68c8e7e5820f07d71c93260d53eea1ea3d","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: な","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-ni","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%81%AB_v2.mp3","downloadSha256":"28748e07e80a43ed59c4f9893dda8f4a1bf9a758c6c34fe5cbcadccdaeb9cec4","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: に","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-nu","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%81%AC_v2.mp3","downloadSha256":"3c14835f9c22f6a422f75e2811bb3b17ce3f489725584cd2c629538e2b70e13e","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: ぬ","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-ne","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%81%AD_v2.mp3","downloadSha256":"cc247873f3b285f5e5795ca7934bde9564bc57d2b67d481c278b311fca6b1b98","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: ね","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-no","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%81%AE_v2.mp3","downloadSha256":"25933059f03ae4cffdb969c7c089eb3973ddf84f4b53b3b548c91fe60a59cb42","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: の","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-ha","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%81%AF_v2.mp3","downloadSha256":"8c6b898c075662e1d6e5893709c1275f680b19d5aeedcdc648cbb9a5e5da18a3","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: は","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-fu","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%81%B5_v2.mp3","downloadSha256":"b760df564967f83a8b816f32a100bb72a928057c4182937fbff832d416db13a7","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: ふ","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-he","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%81%B8_v2.mp3","downloadSha256":"5a70736096dd7e048001d8982c8fc73cb2778c4bb51897ad82c227cd7b44133c","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: へ","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-ho","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%81%BB_v2.mp3","downloadSha256":"1a951f5e6cf4c24bd6b9afff709dd3213d3fc80199d685ac12051c46d58254be","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: ほ","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-ma","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%81%BE_v2.mp3","downloadSha256":"65607270664e73bbbc2305750465b7c47ab69dfdaccbcb7d1543c31d79295ff3","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: ま","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-mi","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%81%BF_v2.mp3","downloadSha256":"9ab9074f442d5550d9bd36c0e6c12778802ffbdc941fa8604677c7d9aaf26c54","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: み","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-mu","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%82%80_v2.mp3","downloadSha256":"34c7b4981b087d291fbb1e983880b3dca8266cb1c6fc409bd2a24f1b2b8b473b","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: む","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-me","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%82%81_v2.mp3","downloadSha256":"62b43711b6bf12770f5eb3d5d9827e13a1328a968227260cab5e2d3dd551a814","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: め","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-mo","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%82%82_v2.mp3","downloadSha256":"796eacd8fbeaaf09cc445ac6e987a87d839c67eb0da1f82635eb94514f5caab8","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: も","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-ya","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%82%84_v2.mp3","downloadSha256":"df4f912cbd3c64a5a908c889fe12564a812274fa449f50a97e9bc561001036b1","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: や","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-yu","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%82%86_v2.mp3","downloadSha256":"d2a4f3bda6f726d491e3e84e9f885e8c83a6015d48a83d8cfce2d54e181e7735","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: ゆ","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-yo","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%82%88_v2.mp3","downloadSha256":"21f637764d49b9136fbb885a4fa429dc690f12b0814660f0c34cddd335167764","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: よ","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-wa","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%82%8F_v2.mp3","downloadSha256":"23998ccfbc6e9b3fd8a2d761c05d97b28b2d2e35574864964b10b9d399ad867b","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: わ","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-wo","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%82%92_v2.mp3","downloadSha256":"081aa6426c21aede4a4c6af561f1ad4f48ba5c780a581047a7def9935e7bcb05","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: を","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ja-n","sourcePage":"https://www.tofugu.com/japanese/learn-hiragana/","downloadUrl":"https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%82%93_v2.mp3","downloadSha256":"5d2bacbeab58ec644b2ce02e2bdb94c7a2626af03055a94dd0882a872a2001e0","license":"No public redistribution license verified","licenseStatement":"Sourced for the user's personal study at their request; no public-domain or open-license claim.","author":"Tofugu","description":"Learn Hiragana teaching audio: ん","retrieved":"2026-10-04","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"ru-a","sourcePage":"https://commons.wikimedia.org/wiki/File:Ru-01-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%90.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/6/6a/Ru-01-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%90.ogg/Ru-01-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%90.ogg.mp3","originalSha1":"55427e894b82f262adaafc5c02d6716d04046a74","downloadSha256":"1f48ae906024938a9580001e2e15511ec28c2020dafc716343663fc4c85ba6fb","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/","licenseStatement":"Attribution-ShareAlike 3.0 Unported. Credit Cherus, link the license and source, and indicate modifications. Adapted audio is distributed under CC BY-SA 3.0.","author":"Cherus","description":"Russian letter name recording","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; leading/trailing silence trimmed, no pitch/speed adjustment","clipSeconds":[0.54,1.04]},{"id":"ru-be","sourcePage":"https://commons.wikimedia.org/wiki/File:Ru-02-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%91.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/e/e5/Ru-02-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%91.ogg/Ru-02-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%91.ogg.mp3","originalSha1":"59b9f660d79055cb7ce5f175bd7cef5c7cb4adaf","downloadSha256":"4d7d583e15da493a3ea56f0f394c8443816a2cfd448e5f11bca4669931332bb7","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/","licenseStatement":"Attribution-ShareAlike 3.0 Unported. Credit Cherus, link the license and source, and indicate modifications. Adapted audio is distributed under CC BY-SA 3.0.","author":"Cherus","description":"Russian letter name recording","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; leading/trailing silence trimmed, no pitch/speed adjustment","clipSeconds":[0.07,0.62]},{"id":"ru-03","sourcePage":"https://commons.wikimedia.org/wiki/File:Ru-03-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%92.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/4/46/Ru-03-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%92.ogg/Ru-03-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%92.ogg.mp3","originalSha1":"37c6c073e6515dbf82c891bc12e809b092cc16b8","downloadSha256":"b2a6c1c7459229ba76f1edb79054ee325f713ed1adf60d226f111ebc08481dd4","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/","licenseStatement":"Attribution-ShareAlike 3.0 Unported. Credit Cherus, link the license and source, and indicate modifications. Adapted audio is distributed under CC BY-SA 3.0.","author":"Cherus","description":"Russian letter name recording","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; leading/trailing silence trimmed, no pitch/speed adjustment","clipSeconds":[0,0.62]},{"id":"ru-04","sourcePage":"https://commons.wikimedia.org/wiki/File:Ru-04-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%93.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/4/43/Ru-04-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%93.ogg/Ru-04-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%93.ogg.mp3","originalSha1":"2f2dc57a10305d297cfa676d3f5a34e5feae7c81","downloadSha256":"5734d36aa3ca8738916ab4ce62a63b43074c080627c7ed495c557d255c8d7cbf","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/","licenseStatement":"Attribution-ShareAlike 3.0 Unported. Credit Cherus, link the license and source, and indicate modifications. Adapted audio is distributed under CC BY-SA 3.0.","author":"Cherus","description":"Russian letter name recording","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; leading/trailing silence trimmed, no pitch/speed adjustment","clipSeconds":[0.05,0.64]},{"id":"ru-05","sourcePage":"https://commons.wikimedia.org/wiki/File:Ru-05-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%94.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/c/cd/Ru-05-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%94.ogg/Ru-05-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%94.ogg.mp3","originalSha1":"5dc66f87f3c16e52c01fb09d24c36e9c3e83ad06","downloadSha256":"ba47dfa91467f1efaa0b4eb8a268a84ff073a08d7a8030bb90434e39eb46a45e","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/","licenseStatement":"Attribution-ShareAlike 3.0 Unported. Credit Cherus, link the license and source, and indicate modifications. Adapted audio is distributed under CC BY-SA 3.0.","author":"Cherus","description":"Russian letter name recording","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; leading/trailing silence trimmed, no pitch/speed adjustment","clipSeconds":[0.05,0.66]},{"id":"ru-06","sourcePage":"https://commons.wikimedia.org/wiki/File:Ru-06-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%95.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/0/05/Ru-06-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%95.ogg/Ru-06-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%95.ogg.mp3","originalSha1":"e04f47dccfcf9d9db11c290d9728386c767857be","downloadSha256":"9d4b1d7fa6638b7e5b298c792828dcdaf3f2eeb3bbe5a9c315bacc20a9cbed01","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/","licenseStatement":"Attribution-ShareAlike 3.0 Unported. Credit Cherus, link the license and source, and indicate modifications. Adapted audio is distributed under CC BY-SA 3.0.","author":"Cherus","description":"Russian letter name recording","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; leading/trailing silence trimmed, no pitch/speed adjustment","clipSeconds":[0,0.69]},{"id":"ru-07","sourcePage":"https://commons.wikimedia.org/wiki/File:Ru-07-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%81.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/e/ed/Ru-07-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%81.ogg/Ru-07-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%81.ogg.mp3","originalSha1":"298fad180a3b4f9f5117e0a1278498af1bc16b95","downloadSha256":"7545c96a8be8befc5e338134a1a5dac3490e1fed2669e836f1dcbb4315c3d921","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/","licenseStatement":"Attribution-ShareAlike 3.0 Unported. Credit Cherus, link the license and source, and indicate modifications. Adapted audio is distributed under CC BY-SA 3.0.","author":"Cherus","description":"Russian letter name recording","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; leading/trailing silence trimmed, no pitch/speed adjustment","clipSeconds":[0,0.69]},{"id":"ru-zhe","sourcePage":"https://commons.wikimedia.org/wiki/File:Ru-08-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%96.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/6/6c/Ru-08-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%96.ogg/Ru-08-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%96.ogg.mp3","originalSha1":"56ba88ceaa481f3e522627375653dba73e591f3b","downloadSha256":"cd491dcfa14bc3cba640a92d5510572e1eaf7352ba99f430af511800f525c560","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/","licenseStatement":"Attribution-ShareAlike 3.0 Unported. Credit Cherus, link the license and source, and indicate modifications. Adapted audio is distributed under CC BY-SA 3.0.","author":"Cherus","description":"Russian letter name recording","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; leading/trailing silence trimmed, no pitch/speed adjustment","clipSeconds":[0,0.68]},{"id":"ru-09","sourcePage":"https://commons.wikimedia.org/wiki/File:Ru-09-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%97.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/4/43/Ru-09-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%97.ogg/Ru-09-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%97.ogg.mp3","originalSha1":"db2eac0d6125dc561122e087868f2856cec35d28","downloadSha256":"adeeda87715757c7e9c83a6c32c6cc6eb0e169897ce500c66fddc98ec90530d7","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/","licenseStatement":"Attribution-ShareAlike 3.0 Unported. Credit Cherus, link the license and source, and indicate modifications. Adapted audio is distributed under CC BY-SA 3.0.","author":"Cherus","description":"Russian letter name recording","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; leading/trailing silence trimmed, no pitch/speed adjustment","clipSeconds":[0,0.77]},{"id":"ru-10","sourcePage":"https://commons.wikimedia.org/wiki/File:Ru-10-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%98.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/d/d5/Ru-10-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%98.ogg/Ru-10-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%98.ogg.mp3","originalSha1":"6c0b30becee187ccd02e98192cc350da3e1b928f","downloadSha256":"e13542e6546bda57443cb1f733abd624ba961b6ac3dd3a28f9bb556466036890","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/","licenseStatement":"Attribution-ShareAlike 3.0 Unported. Credit Cherus, link the license and source, and indicate modifications. Adapted audio is distributed under CC BY-SA 3.0.","author":"Cherus","description":"Russian letter name recording","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; leading/trailing silence trimmed, no pitch/speed adjustment","clipSeconds":[0.05,0.7]},{"id":"ru-11","sourcePage":"https://commons.wikimedia.org/wiki/File:Ru-11-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%99.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/0/08/Ru-11-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%99.ogg/Ru-11-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%99.ogg.mp3","originalSha1":"a3b0841bbccc7d562c675abf20a369bde55d36d7","downloadSha256":"ec7925426da50f1e429cb7680bfee4059752a2061d949a2f47cabd5e7886155d","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/","licenseStatement":"Attribution-ShareAlike 3.0 Unported. Credit Cherus, link the license and source, and indicate modifications. Adapted audio is distributed under CC BY-SA 3.0.","author":"Cherus","description":"Russian letter name recording","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; leading/trailing silence trimmed, no pitch/speed adjustment","clipSeconds":[0.03,1.24]},{"id":"ru-12","sourcePage":"https://commons.wikimedia.org/wiki/File:Ru-12-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%9A.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/9/97/Ru-12-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%9A.ogg/Ru-12-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%9A.ogg.mp3","originalSha1":"9d7ef2c6d7afab156ad9d96d30742f932a97b408","downloadSha256":"0ac7326d128d7d63f79973b7d2de4d609e8b60eddde9cec6587e041953b88789","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/","licenseStatement":"Attribution-ShareAlike 3.0 Unported. Credit Cherus, link the license and source, and indicate modifications. Adapted audio is distributed under CC BY-SA 3.0.","author":"Cherus","description":"Russian letter name recording","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; leading/trailing silence trimmed, no pitch/speed adjustment","clipSeconds":[0.01,0.69]},{"id":"ru-13","sourcePage":"https://commons.wikimedia.org/wiki/File:Ru-13-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%9B.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/3/36/Ru-13-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%9B.ogg/Ru-13-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%9B.ogg.mp3","originalSha1":"cdb78bd484d3baf54b62327d47de76205f8f9cd8","downloadSha256":"f4076c021f2d0af8207eaa7403d3575fd342b497f55cf34c6a9c2db1541d8039","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/","licenseStatement":"Attribution-ShareAlike 3.0 Unported. Credit Cherus, link the license and source, and indicate modifications. Adapted audio is distributed under CC BY-SA 3.0.","author":"Cherus","description":"Russian letter name recording","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; leading/trailing silence trimmed, no pitch/speed adjustment","clipSeconds":[0.04,0.66]},{"id":"ru-14","sourcePage":"https://commons.wikimedia.org/wiki/File:Ru-14-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%9C.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/3/37/Ru-14-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%9C.ogg/Ru-14-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%9C.ogg.mp3","originalSha1":"c3c53d7ee052bcb77bda0bb9bff713f3a516b6c2","downloadSha256":"4ef2f0f7734966f7990462b3e9313f790e4e2eefb0aa19e9d0f465fd219a93a4","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/","licenseStatement":"Attribution-ShareAlike 3.0 Unported. Credit Cherus, link the license and source, and indicate modifications. Adapted audio is distributed under CC BY-SA 3.0.","author":"Cherus","description":"Russian letter name recording","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; leading/trailing silence trimmed, no pitch/speed adjustment","clipSeconds":[0.05,0.74]},{"id":"ru-15","sourcePage":"https://commons.wikimedia.org/wiki/File:Ru-15-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%9D.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/1/17/Ru-15-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%9D.ogg/Ru-15-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%9D.ogg.mp3","originalSha1":"e72203dfd287fdaa4cd5da14e4dbfe6f17f0de1a","downloadSha256":"126cc1081b4c074dcc45a99479738d6906a4d29ce0026f5a157baa816ebfb610","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/","licenseStatement":"Attribution-ShareAlike 3.0 Unported. Credit Cherus, link the license and source, and indicate modifications. Adapted audio is distributed under CC BY-SA 3.0.","author":"Cherus","description":"Russian letter name recording","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; leading/trailing silence trimmed, no pitch/speed adjustment","clipSeconds":[0.06,0.75]},{"id":"ru-16","sourcePage":"https://commons.wikimedia.org/wiki/File:Ru-16-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%9E.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/1/1d/Ru-16-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%9E.ogg/Ru-16-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%9E.ogg.mp3","originalSha1":"8767b653ecfa1fb05c098b40d3c3562ef402aec6","downloadSha256":"6c58570bc0717ef391fbdc841862f8c1f39f0671ad29bc6b80705f7c2c075406","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/","licenseStatement":"Attribution-ShareAlike 3.0 Unported. Credit Cherus, link the license and source, and indicate modifications. Adapted audio is distributed under CC BY-SA 3.0.","author":"Cherus","description":"Russian letter name recording","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; leading/trailing silence trimmed, no pitch/speed adjustment","clipSeconds":[0.04,0.71]},{"id":"ru-17","sourcePage":"https://commons.wikimedia.org/wiki/File:Ru-17-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%9F.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/1/11/Ru-17-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%9F.ogg/Ru-17-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%9F.ogg.mp3","originalSha1":"2dc0430836190f8e40b39f1129e7674368ab1f6a","downloadSha256":"630e8516ca02786935c917a34a022d50b2923dc53a22e09749d01b81c1efc069","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/","licenseStatement":"Attribution-ShareAlike 3.0 Unported. Credit Cherus, link the license and source, and indicate modifications. Adapted audio is distributed under CC BY-SA 3.0.","author":"Cherus","description":"Russian letter name recording","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; leading/trailing silence trimmed, no pitch/speed adjustment","clipSeconds":[0.06,0.7]},{"id":"ru-18","sourcePage":"https://commons.wikimedia.org/wiki/File:Ru-18-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%A0.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/4/4b/Ru-18-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%A0.ogg/Ru-18-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%A0.ogg.mp3","originalSha1":"6e7ed70ddc4c86c68d2495043bde68f7d77d5916","downloadSha256":"5c5f70a8a57625b475163aeca2e3ee04c22c30a4826daa7c0ac04645c70af542","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/","licenseStatement":"Attribution-ShareAlike 3.0 Unported. Credit Cherus, link the license and source, and indicate modifications. Adapted audio is distributed under CC BY-SA 3.0.","author":"Cherus","description":"Russian letter name recording","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; leading/trailing silence trimmed, no pitch/speed adjustment","clipSeconds":[0.05,0.7]},{"id":"ru-19","sourcePage":"https://commons.wikimedia.org/wiki/File:Ru-19-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%A1.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/3/37/Ru-19-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%A1.ogg/Ru-19-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%A1.ogg.mp3","originalSha1":"4815ab443b7308dcbfa9dd8f6221df07bf972285","downloadSha256":"523286d7166cd5ebc306340bc76d00160745f628a8e542a088e6af0cc4db140b","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/","licenseStatement":"Attribution-ShareAlike 3.0 Unported. Credit Cherus, link the license and source, and indicate modifications. Adapted audio is distributed under CC BY-SA 3.0.","author":"Cherus","description":"Russian letter name recording","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; leading/trailing silence trimmed, no pitch/speed adjustment","clipSeconds":[0.04,0.84]},{"id":"ru-20","sourcePage":"https://commons.wikimedia.org/wiki/File:Ru-20-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%A2.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/3/33/Ru-20-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%A2.ogg/Ru-20-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%A2.ogg.mp3","originalSha1":"aba70c6503cf5d0ebb68ead6cc4171911196d02d","downloadSha256":"236eb9a22212105362e462b6591af102105db1eb73ff5097de0a8b092180ec15","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/","licenseStatement":"Attribution-ShareAlike 3.0 Unported. Credit Cherus, link the license and source, and indicate modifications. Adapted audio is distributed under CC BY-SA 3.0.","author":"Cherus","description":"Russian letter name recording","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; leading/trailing silence trimmed, no pitch/speed adjustment","clipSeconds":[0.05,0.69]},{"id":"ru-21","sourcePage":"https://commons.wikimedia.org/wiki/File:Ru-21-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%A3.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/3/30/Ru-21-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%A3.ogg/Ru-21-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%A3.ogg.mp3","originalSha1":"33852833290869e113b661f5be349550926d778d","downloadSha256":"049af6e717d802fd8417472ff65f4e30b470b4ca28d8a4a2d7ece8e35905f255","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/","licenseStatement":"Attribution-ShareAlike 3.0 Unported. Credit Cherus, link the license and source, and indicate modifications. Adapted audio is distributed under CC BY-SA 3.0.","author":"Cherus","description":"Russian letter name recording","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; leading/trailing silence trimmed, no pitch/speed adjustment","clipSeconds":[0.07,0.68]},{"id":"ru-22","sourcePage":"https://commons.wikimedia.org/wiki/File:Ru-22-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%A4.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/b/b4/Ru-22-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%A4.ogg/Ru-22-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%A4.ogg.mp3","originalSha1":"229f653babd3165344836c8506b5d1bf693c29d6","downloadSha256":"396dcbf5db3d50fd53e56223c45252bce84822058096b79afc5283e67df7efd1","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/","licenseStatement":"Attribution-ShareAlike 3.0 Unported. Credit Cherus, link the license and source, and indicate modifications. Adapted audio is distributed under CC BY-SA 3.0.","author":"Cherus","description":"Russian letter name recording","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; leading/trailing silence trimmed, no pitch/speed adjustment","clipSeconds":[0.04,0.81]},{"id":"ru-23","sourcePage":"https://commons.wikimedia.org/wiki/File:Ru-23-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%A5.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/a/a6/Ru-23-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%A5.ogg/Ru-23-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%A5.ogg.mp3","originalSha1":"85a960b4f3200e8bda250b0f54ce4f6327e50c09","downloadSha256":"2b77ac0beb702e2d36ca58227b7482496eedda7c0fa8a60cfd8b6ec29464b189","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/","licenseStatement":"Attribution-ShareAlike 3.0 Unported. Credit Cherus, link the license and source, and indicate modifications. Adapted audio is distributed under CC BY-SA 3.0.","author":"Cherus","description":"Russian letter name recording","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; leading/trailing silence trimmed, no pitch/speed adjustment","clipSeconds":[0,0.64]},{"id":"ru-24","sourcePage":"https://commons.wikimedia.org/wiki/File:Ru-24-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%A6.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/4/40/Ru-24-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%A6.ogg/Ru-24-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%A6.ogg.mp3","originalSha1":"6354267a01e2b4302d81ad3108b5f9e1b3f65ea9","downloadSha256":"d0fc382a80b6139ebf2de7bd2aea1eba41d40eaf608f3758ad050cedd45fe18b","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/","licenseStatement":"Attribution-ShareAlike 3.0 Unported. Credit Cherus, link the license and source, and indicate modifications. Adapted audio is distributed under CC BY-SA 3.0.","author":"Cherus","description":"Russian letter name recording","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; leading/trailing silence trimmed, no pitch/speed adjustment","clipSeconds":[0,0.7]},{"id":"ru-25","sourcePage":"https://commons.wikimedia.org/wiki/File:Ru-25-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%A7.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/1/15/Ru-25-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%A7.ogg/Ru-25-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%A7.ogg.mp3","originalSha1":"a456beb3761fbba0cbe6a1bb29472270725df6cf","downloadSha256":"e89861862caceaa2a896f532644f240e1e14dea8ad8a1aed7603dadb829e55b3","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/","licenseStatement":"Attribution-ShareAlike 3.0 Unported. Credit Cherus, link the license and source, and indicate modifications. Adapted audio is distributed under CC BY-SA 3.0.","author":"Cherus","description":"Russian letter name recording","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; leading/trailing silence trimmed, no pitch/speed adjustment","clipSeconds":[0.02,0.76]},{"id":"ru-26","sourcePage":"https://commons.wikimedia.org/wiki/File:Ru-26-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%A8.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/a/a5/Ru-26-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%A8.ogg/Ru-26-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%A8.ogg.mp3","originalSha1":"261cba7f4e866490ec8ce478caccb11a0b099bad","downloadSha256":"5f983ea880cd863919661a5fe85ecf988a1d44eb847c2f5fb2a634104635307b","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/","licenseStatement":"Attribution-ShareAlike 3.0 Unported. Credit Cherus, link the license and source, and indicate modifications. Adapted audio is distributed under CC BY-SA 3.0.","author":"Cherus","description":"Russian letter name recording","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; leading/trailing silence trimmed, no pitch/speed adjustment","clipSeconds":[0,0.77]},{"id":"ru-27","sourcePage":"https://commons.wikimedia.org/wiki/File:Ru-27-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%A9.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/0/0b/Ru-27-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%A9.ogg/Ru-27-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%A9.ogg.mp3","originalSha1":"636276b0568556864c07e6b0cd04af9207625a43","downloadSha256":"24408c3dff89922209e27b548b011e178f51b69e878063d4fa49ad408475a10f","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/","licenseStatement":"Attribution-ShareAlike 3.0 Unported. Credit Cherus, link the license and source, and indicate modifications. Adapted audio is distributed under CC BY-SA 3.0.","author":"Cherus","description":"Russian letter name recording","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; leading/trailing silence trimmed, no pitch/speed adjustment","clipSeconds":[0,0.93]},{"id":"ru-28","sourcePage":"https://commons.wikimedia.org/wiki/File:Ru-28-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%AA.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/e/e7/Ru-28-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%AA.ogg/Ru-28-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%AA.ogg.mp3","originalSha1":"ec9ed4b225d217b26d568bf247d38ca1c557672c","downloadSha256":"bba2fed34f402388c8b3772221a0fa53e61f08a3d8eb30ecb895fe6e8ab43436","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/","licenseStatement":"Attribution-ShareAlike 3.0 Unported. Credit Cherus, link the license and source, and indicate modifications. Adapted audio is distributed under CC BY-SA 3.0.","author":"Cherus","description":"Russian letter name recording","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; leading/trailing silence trimmed, no pitch/speed adjustment","clipSeconds":[0,1.15]},{"id":"ru-29","sourcePage":"https://commons.wikimedia.org/wiki/File:Ru-29-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%AB.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/8/8d/Ru-29-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%AB.ogg/Ru-29-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%AB.ogg.mp3","originalSha1":"8e76fedc9dc22d06d3f3dafe1b4cffe51bee330d","downloadSha256":"2750e24db78947f9545eaa37143c1e419bfd8fc26930ae0da2590ae1d64dcf4b","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/","licenseStatement":"Attribution-ShareAlike 3.0 Unported. Credit Cherus, link the license and source, and indicate modifications. Adapted audio is distributed under CC BY-SA 3.0.","author":"Cherus","description":"Russian letter name recording","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; leading/trailing silence trimmed, no pitch/speed adjustment","clipSeconds":[0.05,0.66]},{"id":"ru-30","sourcePage":"https://commons.wikimedia.org/wiki/File:Ru-30-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%AC.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/6/6b/Ru-30-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%AC.ogg/Ru-30-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%AC.ogg.mp3","originalSha1":"f6c203717e698fbf3c2424f50e455151788bdb1d","downloadSha256":"d585b56067a82c35ddb723b46bd1aedbedf273b25fcecc307d15fc8b298b9bf1","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/","licenseStatement":"Attribution-ShareAlike 3.0 Unported. Credit Cherus, link the license and source, and indicate modifications. Adapted audio is distributed under CC BY-SA 3.0.","author":"Cherus","description":"Russian letter name recording","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; leading/trailing silence trimmed, no pitch/speed adjustment","clipSeconds":[0.04,1.08]},{"id":"ru-31","sourcePage":"https://commons.wikimedia.org/wiki/File:Ru-31-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%AD.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/1/15/Ru-31-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%AD.ogg/Ru-31-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%AD.ogg.mp3","originalSha1":"e293ac60cb549fe2a23ab49f6d566290e836d09d","downloadSha256":"856ff11414f1cd213a1c51fb77e6f221814089e9dbd1557c12e5167eb5b07341","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/","licenseStatement":"Attribution-ShareAlike 3.0 Unported. Credit Cherus, link the license and source, and indicate modifications. Adapted audio is distributed under CC BY-SA 3.0.","author":"Cherus","description":"Russian letter name recording","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; leading/trailing silence trimmed, no pitch/speed adjustment","clipSeconds":[0.04,0.67]},{"id":"ru-32","sourcePage":"https://commons.wikimedia.org/wiki/File:Ru-32-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%AE.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/9/98/Ru-32-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%AE.ogg/Ru-32-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%AE.ogg.mp3","originalSha1":"96ab3d15b4035c7d77f08f19ce8c7d43a597c3eb","downloadSha256":"7cd9233e2ded9af57c67e0801655abfa1cddee93f216000a18fc66a5a1717fde","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/","licenseStatement":"Attribution-ShareAlike 3.0 Unported. Credit Cherus, link the license and source, and indicate modifications. Adapted audio is distributed under CC BY-SA 3.0.","author":"Cherus","description":"Russian letter name recording","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; leading/trailing silence trimmed, no pitch/speed adjustment","clipSeconds":[0,0.67]},{"id":"ru-33","sourcePage":"https://commons.wikimedia.org/wiki/File:Ru-33-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%AF.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/5/5b/Ru-33-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%AF.ogg/Ru-33-%D0%B1%D1%83%D0%BA%D0%B2%D0%B0-%D0%AF.ogg.mp3","originalSha1":"65986dbff42c4bfd539d95058e7abf3fdbb3ae76","downloadSha256":"7e762a7630b154309faa12f3e9705e2d86aa9ab16f65bf42a10f3d71c8c02e07","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/","licenseStatement":"Attribution-ShareAlike 3.0 Unported. Credit Cherus, link the license and source, and indicate modifications. Adapted audio is distributed under CC BY-SA 3.0.","author":"Cherus","description":"Russian letter name recording","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; leading/trailing silence trimmed, no pitch/speed adjustment","clipSeconds":[0,0.64]},{"id":"el-alpha","sourcePage":"https://commons.wikimedia.org/wiki/File:Ell-AlphabitosUpload.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/1/17/Ell-AlphabitosUpload.ogg/Ell-AlphabitosUpload.ogg.mp3","originalSha1":"84fcf58f5f8f130e579cafdfb7aecdb07f857958","downloadSha256":"7735a12410d46e9b27ffad080b8028061910612407ab027a74ee168c01bba112","license":"Public domain (PD-self)","licenseUrl":"https://commons.wikimedia.org/wiki/Template:PD-self","licenseStatement":"I, the copyright holder of this work, release this work into the public domain. This applies worldwide. In some countries this may not be legally possible; if so: I grant anyone the right to use this work for any purpose, without any conditions, unless such conditions are required by law.","author":"CuteHappyBrute (noise reduction and EQ by RoB)","description":"Modern Greek alphabet recitation; letter excerpt","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; letter excerpt with no pitch/speed adjustment","clipSeconds":[1.82,2.5]},{"id":"el-vita","sourcePage":"https://commons.wikimedia.org/wiki/File:Ell-AlphabitosUpload.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/1/17/Ell-AlphabitosUpload.ogg/Ell-AlphabitosUpload.ogg.mp3","originalSha1":"84fcf58f5f8f130e579cafdfb7aecdb07f857958","downloadSha256":"7735a12410d46e9b27ffad080b8028061910612407ab027a74ee168c01bba112","license":"Public domain (PD-self)","licenseUrl":"https://commons.wikimedia.org/wiki/Template:PD-self","licenseStatement":"I, the copyright holder of this work, release this work into the public domain. This applies worldwide. In some countries this may not be legally possible; if so: I grant anyone the right to use this work for any purpose, without any conditions, unless such conditions are required by law.","author":"CuteHappyBrute (noise reduction and EQ by RoB)","description":"Modern Greek alphabet recitation; letter excerpt","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; letter excerpt with no pitch/speed adjustment","clipSeconds":[2.67,3.33]},{"id":"el-gamma","sourcePage":"https://commons.wikimedia.org/wiki/File:Ell-AlphabitosUpload.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/1/17/Ell-AlphabitosUpload.ogg/Ell-AlphabitosUpload.ogg.mp3","originalSha1":"84fcf58f5f8f130e579cafdfb7aecdb07f857958","downloadSha256":"7735a12410d46e9b27ffad080b8028061910612407ab027a74ee168c01bba112","license":"Public domain (PD-self)","licenseUrl":"https://commons.wikimedia.org/wiki/Template:PD-self","licenseStatement":"I, the copyright holder of this work, release this work into the public domain. This applies worldwide. In some countries this may not be legally possible; if so: I grant anyone the right to use this work for any purpose, without any conditions, unless such conditions are required by law.","author":"CuteHappyBrute (noise reduction and EQ by RoB)","description":"Modern Greek alphabet recitation; letter excerpt","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; letter excerpt with no pitch/speed adjustment","clipSeconds":[3.51,4.18]},{"id":"el-delta","sourcePage":"https://commons.wikimedia.org/wiki/File:Ell-AlphabitosUpload.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/1/17/Ell-AlphabitosUpload.ogg/Ell-AlphabitosUpload.ogg.mp3","originalSha1":"84fcf58f5f8f130e579cafdfb7aecdb07f857958","downloadSha256":"7735a12410d46e9b27ffad080b8028061910612407ab027a74ee168c01bba112","license":"Public domain (PD-self)","licenseUrl":"https://commons.wikimedia.org/wiki/Template:PD-self","licenseStatement":"I, the copyright holder of this work, release this work into the public domain. This applies worldwide. In some countries this may not be legally possible; if so: I grant anyone the right to use this work for any purpose, without any conditions, unless such conditions are required by law.","author":"CuteHappyBrute (noise reduction and EQ by RoB)","description":"Modern Greek alphabet recitation; letter excerpt","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; letter excerpt with no pitch/speed adjustment","clipSeconds":[4.34,5.06]},{"id":"el-epsilon","sourcePage":"https://commons.wikimedia.org/wiki/File:Ell-AlphabitosUpload.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/1/17/Ell-AlphabitosUpload.ogg/Ell-AlphabitosUpload.ogg.mp3","originalSha1":"84fcf58f5f8f130e579cafdfb7aecdb07f857958","downloadSha256":"7735a12410d46e9b27ffad080b8028061910612407ab027a74ee168c01bba112","license":"Public domain (PD-self)","licenseUrl":"https://commons.wikimedia.org/wiki/Template:PD-self","licenseStatement":"I, the copyright holder of this work, release this work into the public domain. This applies worldwide. In some countries this may not be legally possible; if so: I grant anyone the right to use this work for any purpose, without any conditions, unless such conditions are required by law.","author":"CuteHappyBrute (noise reduction and EQ by RoB)","description":"Modern Greek alphabet recitation; letter excerpt","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; letter excerpt with no pitch/speed adjustment","clipSeconds":[5.22,5.98]},{"id":"el-zeta","sourcePage":"https://commons.wikimedia.org/wiki/File:Ell-AlphabitosUpload.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/1/17/Ell-AlphabitosUpload.ogg/Ell-AlphabitosUpload.ogg.mp3","originalSha1":"84fcf58f5f8f130e579cafdfb7aecdb07f857958","downloadSha256":"7735a12410d46e9b27ffad080b8028061910612407ab027a74ee168c01bba112","license":"Public domain (PD-self)","licenseUrl":"https://commons.wikimedia.org/wiki/Template:PD-self","licenseStatement":"I, the copyright holder of this work, release this work into the public domain. This applies worldwide. In some countries this may not be legally possible; if so: I grant anyone the right to use this work for any purpose, without any conditions, unless such conditions are required by law.","author":"CuteHappyBrute (noise reduction and EQ by RoB)","description":"Modern Greek alphabet recitation; letter excerpt","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; letter excerpt with no pitch/speed adjustment","clipSeconds":[6.1,6.78]},{"id":"el-eta","sourcePage":"https://commons.wikimedia.org/wiki/File:Ell-AlphabitosUpload.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/1/17/Ell-AlphabitosUpload.ogg/Ell-AlphabitosUpload.ogg.mp3","originalSha1":"84fcf58f5f8f130e579cafdfb7aecdb07f857958","downloadSha256":"7735a12410d46e9b27ffad080b8028061910612407ab027a74ee168c01bba112","license":"Public domain (PD-self)","licenseUrl":"https://commons.wikimedia.org/wiki/Template:PD-self","licenseStatement":"I, the copyright holder of this work, release this work into the public domain. This applies worldwide. In some countries this may not be legally possible; if so: I grant anyone the right to use this work for any purpose, without any conditions, unless such conditions are required by law.","author":"CuteHappyBrute (noise reduction and EQ by RoB)","description":"Modern Greek alphabet recitation; letter excerpt","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; letter excerpt with no pitch/speed adjustment","clipSeconds":[6.97,7.57]},{"id":"el-theta","sourcePage":"https://commons.wikimedia.org/wiki/File:Ell-AlphabitosUpload.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/1/17/Ell-AlphabitosUpload.ogg/Ell-AlphabitosUpload.ogg.mp3","originalSha1":"84fcf58f5f8f130e579cafdfb7aecdb07f857958","downloadSha256":"7735a12410d46e9b27ffad080b8028061910612407ab027a74ee168c01bba112","license":"Public domain (PD-self)","licenseUrl":"https://commons.wikimedia.org/wiki/Template:PD-self","licenseStatement":"I, the copyright holder of this work, release this work into the public domain. This applies worldwide. In some countries this may not be legally possible; if so: I grant anyone the right to use this work for any purpose, without any conditions, unless such conditions are required by law.","author":"CuteHappyBrute (noise reduction and EQ by RoB)","description":"Modern Greek alphabet recitation; letter excerpt","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; letter excerpt with no pitch/speed adjustment","clipSeconds":[7.69,8.42]},{"id":"el-iota","sourcePage":"https://commons.wikimedia.org/wiki/File:Ell-AlphabitosUpload.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/1/17/Ell-AlphabitosUpload.ogg/Ell-AlphabitosUpload.ogg.mp3","originalSha1":"84fcf58f5f8f130e579cafdfb7aecdb07f857958","downloadSha256":"7735a12410d46e9b27ffad080b8028061910612407ab027a74ee168c01bba112","license":"Public domain (PD-self)","licenseUrl":"https://commons.wikimedia.org/wiki/Template:PD-self","licenseStatement":"I, the copyright holder of this work, release this work into the public domain. This applies worldwide. In some countries this may not be legally possible; if so: I grant anyone the right to use this work for any purpose, without any conditions, unless such conditions are required by law.","author":"CuteHappyBrute (noise reduction and EQ by RoB)","description":"Modern Greek alphabet recitation; letter excerpt","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; letter excerpt with no pitch/speed adjustment","clipSeconds":[8.56,9.28]},{"id":"el-kappa","sourcePage":"https://commons.wikimedia.org/wiki/File:Ell-AlphabitosUpload.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/1/17/Ell-AlphabitosUpload.ogg/Ell-AlphabitosUpload.ogg.mp3","originalSha1":"84fcf58f5f8f130e579cafdfb7aecdb07f857958","downloadSha256":"7735a12410d46e9b27ffad080b8028061910612407ab027a74ee168c01bba112","license":"Public domain (PD-self)","licenseUrl":"https://commons.wikimedia.org/wiki/Template:PD-self","licenseStatement":"I, the copyright holder of this work, release this work into the public domain. This applies worldwide. In some countries this may not be legally possible; if so: I grant anyone the right to use this work for any purpose, without any conditions, unless such conditions are required by law.","author":"CuteHappyBrute (noise reduction and EQ by RoB)","description":"Modern Greek alphabet recitation; letter excerpt","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; letter excerpt with no pitch/speed adjustment","clipSeconds":[9.41,10.08]},{"id":"el-lambda","sourcePage":"https://commons.wikimedia.org/wiki/File:Ell-AlphabitosUpload.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/1/17/Ell-AlphabitosUpload.ogg/Ell-AlphabitosUpload.ogg.mp3","originalSha1":"84fcf58f5f8f130e579cafdfb7aecdb07f857958","downloadSha256":"7735a12410d46e9b27ffad080b8028061910612407ab027a74ee168c01bba112","license":"Public domain (PD-self)","licenseUrl":"https://commons.wikimedia.org/wiki/Template:PD-self","licenseStatement":"I, the copyright holder of this work, release this work into the public domain. This applies worldwide. In some countries this may not be legally possible; if so: I grant anyone the right to use this work for any purpose, without any conditions, unless such conditions are required by law.","author":"CuteHappyBrute (noise reduction and EQ by RoB)","description":"Modern Greek alphabet recitation; letter excerpt","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; letter excerpt with no pitch/speed adjustment","clipSeconds":[10.21,10.95]},{"id":"el-mu","sourcePage":"https://commons.wikimedia.org/wiki/File:Ell-AlphabitosUpload.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/1/17/Ell-AlphabitosUpload.ogg/Ell-AlphabitosUpload.ogg.mp3","originalSha1":"84fcf58f5f8f130e579cafdfb7aecdb07f857958","downloadSha256":"7735a12410d46e9b27ffad080b8028061910612407ab027a74ee168c01bba112","license":"Public domain (PD-self)","licenseUrl":"https://commons.wikimedia.org/wiki/Template:PD-self","licenseStatement":"I, the copyright holder of this work, release this work into the public domain. This applies worldwide. In some countries this may not be legally possible; if so: I grant anyone the right to use this work for any purpose, without any conditions, unless such conditions are required by law.","author":"CuteHappyBrute (noise reduction and EQ by RoB)","description":"Modern Greek alphabet recitation; letter excerpt","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; letter excerpt with no pitch/speed adjustment","clipSeconds":[11.06,11.55]},{"id":"el-nu","sourcePage":"https://commons.wikimedia.org/wiki/File:Ell-AlphabitosUpload.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/1/17/Ell-AlphabitosUpload.ogg/Ell-AlphabitosUpload.ogg.mp3","originalSha1":"84fcf58f5f8f130e579cafdfb7aecdb07f857958","downloadSha256":"7735a12410d46e9b27ffad080b8028061910612407ab027a74ee168c01bba112","license":"Public domain (PD-self)","licenseUrl":"https://commons.wikimedia.org/wiki/Template:PD-self","licenseStatement":"I, the copyright holder of this work, release this work into the public domain. This applies worldwide. In some countries this may not be legally possible; if so: I grant anyone the right to use this work for any purpose, without any conditions, unless such conditions are required by law.","author":"CuteHappyBrute (noise reduction and EQ by RoB)","description":"Modern Greek alphabet recitation; letter excerpt","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; letter excerpt with no pitch/speed adjustment","clipSeconds":[11.8,12.26]},{"id":"el-xi","sourcePage":"https://commons.wikimedia.org/wiki/File:Ell-AlphabitosUpload.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/1/17/Ell-AlphabitosUpload.ogg/Ell-AlphabitosUpload.ogg.mp3","originalSha1":"84fcf58f5f8f130e579cafdfb7aecdb07f857958","downloadSha256":"7735a12410d46e9b27ffad080b8028061910612407ab027a74ee168c01bba112","license":"Public domain (PD-self)","licenseUrl":"https://commons.wikimedia.org/wiki/Template:PD-self","licenseStatement":"I, the copyright holder of this work, release this work into the public domain. This applies worldwide. In some countries this may not be legally possible; if so: I grant anyone the right to use this work for any purpose, without any conditions, unless such conditions are required by law.","author":"CuteHappyBrute (noise reduction and EQ by RoB)","description":"Modern Greek alphabet recitation; letter excerpt","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; letter excerpt with no pitch/speed adjustment","clipSeconds":[12.54,13.3]},{"id":"el-omicron","sourcePage":"https://commons.wikimedia.org/wiki/File:Ell-AlphabitosUpload.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/1/17/Ell-AlphabitosUpload.ogg/Ell-AlphabitosUpload.ogg.mp3","originalSha1":"84fcf58f5f8f130e579cafdfb7aecdb07f857958","downloadSha256":"7735a12410d46e9b27ffad080b8028061910612407ab027a74ee168c01bba112","license":"Public domain (PD-self)","licenseUrl":"https://commons.wikimedia.org/wiki/Template:PD-self","licenseStatement":"I, the copyright holder of this work, release this work into the public domain. This applies worldwide. In some countries this may not be legally possible; if so: I grant anyone the right to use this work for any purpose, without any conditions, unless such conditions are required by law.","author":"CuteHappyBrute (noise reduction and EQ by RoB)","description":"Modern Greek alphabet recitation; letter excerpt","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; letter excerpt with no pitch/speed adjustment","clipSeconds":[13.38,14.17]},{"id":"el-pi","sourcePage":"https://commons.wikimedia.org/wiki/File:Ell-AlphabitosUpload.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/1/17/Ell-AlphabitosUpload.ogg/Ell-AlphabitosUpload.ogg.mp3","originalSha1":"84fcf58f5f8f130e579cafdfb7aecdb07f857958","downloadSha256":"7735a12410d46e9b27ffad080b8028061910612407ab027a74ee168c01bba112","license":"Public domain (PD-self)","licenseUrl":"https://commons.wikimedia.org/wiki/Template:PD-self","licenseStatement":"I, the copyright holder of this work, release this work into the public domain. This applies worldwide. In some countries this may not be legally possible; if so: I grant anyone the right to use this work for any purpose, without any conditions, unless such conditions are required by law.","author":"CuteHappyBrute (noise reduction and EQ by RoB)","description":"Modern Greek alphabet recitation; letter excerpt","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; letter excerpt with no pitch/speed adjustment","clipSeconds":[14.34,14.73]},{"id":"el-rho","sourcePage":"https://commons.wikimedia.org/wiki/File:Ell-AlphabitosUpload.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/1/17/Ell-AlphabitosUpload.ogg/Ell-AlphabitosUpload.ogg.mp3","originalSha1":"84fcf58f5f8f130e579cafdfb7aecdb07f857958","downloadSha256":"7735a12410d46e9b27ffad080b8028061910612407ab027a74ee168c01bba112","license":"Public domain (PD-self)","licenseUrl":"https://commons.wikimedia.org/wiki/Template:PD-self","licenseStatement":"I, the copyright holder of this work, release this work into the public domain. This applies worldwide. In some countries this may not be legally possible; if so: I grant anyone the right to use this work for any purpose, without any conditions, unless such conditions are required by law.","author":"CuteHappyBrute (noise reduction and EQ by RoB)","description":"Modern Greek alphabet recitation; letter excerpt","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; letter excerpt with no pitch/speed adjustment","clipSeconds":[14.98,15.5]},{"id":"el-sigma","sourcePage":"https://commons.wikimedia.org/wiki/File:Ell-AlphabitosUpload.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/1/17/Ell-AlphabitosUpload.ogg/Ell-AlphabitosUpload.ogg.mp3","originalSha1":"84fcf58f5f8f130e579cafdfb7aecdb07f857958","downloadSha256":"7735a12410d46e9b27ffad080b8028061910612407ab027a74ee168c01bba112","license":"Public domain (PD-self)","licenseUrl":"https://commons.wikimedia.org/wiki/Template:PD-self","licenseStatement":"I, the copyright holder of this work, release this work into the public domain. This applies worldwide. In some countries this may not be legally possible; if so: I grant anyone the right to use this work for any purpose, without any conditions, unless such conditions are required by law.","author":"CuteHappyBrute (noise reduction and EQ by RoB)","description":"Modern Greek alphabet recitation; letter excerpt","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; letter excerpt with no pitch/speed adjustment","clipSeconds":[15.55,16.37]},{"id":"el-tau","sourcePage":"https://commons.wikimedia.org/wiki/File:Ell-AlphabitosUpload.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/1/17/Ell-AlphabitosUpload.ogg/Ell-AlphabitosUpload.ogg.mp3","originalSha1":"84fcf58f5f8f130e579cafdfb7aecdb07f857958","downloadSha256":"7735a12410d46e9b27ffad080b8028061910612407ab027a74ee168c01bba112","license":"Public domain (PD-self)","licenseUrl":"https://commons.wikimedia.org/wiki/Template:PD-self","licenseStatement":"I, the copyright holder of this work, release this work into the public domain. This applies worldwide. In some countries this may not be legally possible; if so: I grant anyone the right to use this work for any purpose, without any conditions, unless such conditions are required by law.","author":"CuteHappyBrute (noise reduction and EQ by RoB)","description":"Modern Greek alphabet recitation; letter excerpt","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; letter excerpt with no pitch/speed adjustment","clipSeconds":[16.57,17.12]},{"id":"el-upsilon","sourcePage":"https://commons.wikimedia.org/wiki/File:Ell-AlphabitosUpload.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/1/17/Ell-AlphabitosUpload.ogg/Ell-AlphabitosUpload.ogg.mp3","originalSha1":"84fcf58f5f8f130e579cafdfb7aecdb07f857958","downloadSha256":"7735a12410d46e9b27ffad080b8028061910612407ab027a74ee168c01bba112","license":"Public domain (PD-self)","licenseUrl":"https://commons.wikimedia.org/wiki/Template:PD-self","licenseStatement":"I, the copyright holder of this work, release this work into the public domain. This applies worldwide. In some countries this may not be legally possible; if so: I grant anyone the right to use this work for any purpose, without any conditions, unless such conditions are required by law.","author":"CuteHappyBrute (noise reduction and EQ by RoB)","description":"Modern Greek alphabet recitation; letter excerpt","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; letter excerpt with no pitch/speed adjustment","clipSeconds":[17.29,18.09]},{"id":"el-phi","sourcePage":"https://commons.wikimedia.org/wiki/File:Ell-AlphabitosUpload.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/1/17/Ell-AlphabitosUpload.ogg/Ell-AlphabitosUpload.ogg.mp3","originalSha1":"84fcf58f5f8f130e579cafdfb7aecdb07f857958","downloadSha256":"7735a12410d46e9b27ffad080b8028061910612407ab027a74ee168c01bba112","license":"Public domain (PD-self)","licenseUrl":"https://commons.wikimedia.org/wiki/Template:PD-self","licenseStatement":"I, the copyright holder of this work, release this work into the public domain. This applies worldwide. In some countries this may not be legally possible; if so: I grant anyone the right to use this work for any purpose, without any conditions, unless such conditions are required by law.","author":"CuteHappyBrute (noise reduction and EQ by RoB)","description":"Modern Greek alphabet recitation; letter excerpt","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; letter excerpt with no pitch/speed adjustment","clipSeconds":[18.1,18.61]},{"id":"el-chi","sourcePage":"https://commons.wikimedia.org/wiki/File:Ell-AlphabitosUpload.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/1/17/Ell-AlphabitosUpload.ogg/Ell-AlphabitosUpload.ogg.mp3","originalSha1":"84fcf58f5f8f130e579cafdfb7aecdb07f857958","downloadSha256":"7735a12410d46e9b27ffad080b8028061910612407ab027a74ee168c01bba112","license":"Public domain (PD-self)","licenseUrl":"https://commons.wikimedia.org/wiki/Template:PD-self","licenseStatement":"I, the copyright holder of this work, release this work into the public domain. This applies worldwide. In some countries this may not be legally possible; if so: I grant anyone the right to use this work for any purpose, without any conditions, unless such conditions are required by law.","author":"CuteHappyBrute (noise reduction and EQ by RoB)","description":"Modern Greek alphabet recitation; letter excerpt","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; letter excerpt with no pitch/speed adjustment","clipSeconds":[18.77,19.27]},{"id":"el-psi","sourcePage":"https://commons.wikimedia.org/wiki/File:Ell-AlphabitosUpload.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/1/17/Ell-AlphabitosUpload.ogg/Ell-AlphabitosUpload.ogg.mp3","originalSha1":"84fcf58f5f8f130e579cafdfb7aecdb07f857958","downloadSha256":"7735a12410d46e9b27ffad080b8028061910612407ab027a74ee168c01bba112","license":"Public domain (PD-self)","licenseUrl":"https://commons.wikimedia.org/wiki/Template:PD-self","licenseStatement":"I, the copyright holder of this work, release this work into the public domain. This applies worldwide. In some countries this may not be legally possible; if so: I grant anyone the right to use this work for any purpose, without any conditions, unless such conditions are required by law.","author":"CuteHappyBrute (noise reduction and EQ by RoB)","description":"Modern Greek alphabet recitation; letter excerpt","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; letter excerpt with no pitch/speed adjustment","clipSeconds":[19.44,19.95]},{"id":"el-omega","sourcePage":"https://commons.wikimedia.org/wiki/File:Ell-AlphabitosUpload.ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/transcoded/1/17/Ell-AlphabitosUpload.ogg/Ell-AlphabitosUpload.ogg.mp3","originalSha1":"84fcf58f5f8f130e579cafdfb7aecdb07f857958","downloadSha256":"7735a12410d46e9b27ffad080b8028061910612407ab027a74ee168c01bba112","license":"Public domain (PD-self)","licenseUrl":"https://commons.wikimedia.org/wiki/Template:PD-self","licenseStatement":"I, the copyright holder of this work, release this work into the public domain. This applies worldwide. In some countries this may not be legally possible; if so: I grant anyone the right to use this work for any purpose, without any conditions, unless such conditions are required by law.","author":"CuteHappyBrute (noise reduction and EQ by RoB)","description":"Modern Greek alphabet recitation; letter excerpt","retrieved":"2026-10-04","conversion":"Commons MP3 converted to mono 24 kHz PCM WAV; letter excerpt with no pitch/speed adjustment","clipSeconds":[20.05,20.77]},{"id":"hy-00","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of ա","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-01","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of բ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-02","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of գ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-03","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of դ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-04","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of ե","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-05","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of զ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-06","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of է","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-07","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of ը","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-08","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of թ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-09","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of ժ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-10","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of ի","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-11","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of լ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-12","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of խ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-13","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of ծ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-14","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of կ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-15","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of հ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-16","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of ձ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-17","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of ղ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-18","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of ճ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-19","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of մ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-20","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of յ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-21","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of ն","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-22","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of շ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-23","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of ո","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-24","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of չ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-25","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of պ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-26","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of ջ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-27","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of ռ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-28","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of ս","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-29","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of վ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-30","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of տ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-31","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of ր","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-32","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of ց","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-34","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of փ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-35","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of ք","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-36","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of օ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-37","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of ֆ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-38","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of ու","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"hy-39","sourcePage":"https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg","downloadUrl":"https://upload.wikimedia.org/wikipedia/commons/4/4d/Armenian_alphabet_%28Eastern_Armenian%29.ogg?download=1","downloadSha256":"b24a356adde0ea8d652cb021bb525aeec16130760b3ddff1e86f73eace3da56d","license":"CC BY-SA 3.0","licenseStatement":"CC BY-SA 3.0; extracted and denoised clips retain the same license.","author":"Vahagn Petrosyan (native Eastern Armenian speaker)","description":"Human recording of և","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment; extracted a single letter; high-pass and FFT noise reduction"},{"id":"ka-00","sourcePage":"https://learnkartuli.com/georgian-alphabet/","downloadUrl":"https://ik.imagekit.io/yefslmhxy/kartuli/sounds/ka/10D0_ka.m4a","downloadSha256":"05157aa712d3be0c1326269243fb87d96bd0e1a89c2db7a605b6a6837c5f39f1","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"Learn Kartuli (native Georgian speaker)","description":"Human recording of ა","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ka-01","sourcePage":"https://learnkartuli.com/georgian-alphabet/","downloadUrl":"https://ik.imagekit.io/yefslmhxy/kartuli/sounds/ka/10D1_ka.m4a","downloadSha256":"15b14c69cefdd76f39cc9bd3fa8ce5c0e45f6d42c287d33aeb57ebe4a960d6fb","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"Learn Kartuli (native Georgian speaker)","description":"Human recording of ბ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ka-02","sourcePage":"https://learnkartuli.com/georgian-alphabet/","downloadUrl":"https://ik.imagekit.io/yefslmhxy/kartuli/sounds/ka/10D2_ka.m4a","downloadSha256":"bb90f7a569377df60e89f3961e745779fd545900215cc05b411c040984496f8f","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"Learn Kartuli (native Georgian speaker)","description":"Human recording of გ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ka-03","sourcePage":"https://learnkartuli.com/georgian-alphabet/","downloadUrl":"https://ik.imagekit.io/yefslmhxy/kartuli/sounds/ka/10D3_ka.m4a","downloadSha256":"67f929bc5fc6cdd64f6fd9988bad2ad253ef54adf48a2a9a0ff55994500b652b","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"Learn Kartuli (native Georgian speaker)","description":"Human recording of დ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ka-04","sourcePage":"https://learnkartuli.com/georgian-alphabet/","downloadUrl":"https://ik.imagekit.io/yefslmhxy/kartuli/sounds/ka/10D4_ka.m4a","downloadSha256":"714c95520402a60f441c08ea950adfdfd8f7f4fb1e028f266184f9cae6d61100","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"Learn Kartuli (native Georgian speaker)","description":"Human recording of ე","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ka-05","sourcePage":"https://learnkartuli.com/georgian-alphabet/","downloadUrl":"https://ik.imagekit.io/yefslmhxy/kartuli/sounds/ka/10D5_ka.m4a","downloadSha256":"c737728f7f9dbf201d5cbe2132803e003815394d2f00c2c9a76d46204a7d4e8a","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"Learn Kartuli (native Georgian speaker)","description":"Human recording of ვ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ka-06","sourcePage":"https://learnkartuli.com/georgian-alphabet/","downloadUrl":"https://ik.imagekit.io/yefslmhxy/kartuli/sounds/ka/10D6_ka.m4a","downloadSha256":"18fe50b187e8332ef547fe2883ab00ac2dc2a01bcc8a54a977bbced676b41787","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"Learn Kartuli (native Georgian speaker)","description":"Human recording of ზ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ka-07","sourcePage":"https://learnkartuli.com/georgian-alphabet/","downloadUrl":"https://ik.imagekit.io/yefslmhxy/kartuli/sounds/ka/10D7_ka.m4a","downloadSha256":"74241c71a32bda1911146ca39f5d3afece3745de213144438ea78b6649d3f242","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"Learn Kartuli (native Georgian speaker)","description":"Human recording of თ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ka-08","sourcePage":"https://learnkartuli.com/georgian-alphabet/","downloadUrl":"https://ik.imagekit.io/yefslmhxy/kartuli/sounds/ka/10D8_ka.m4a","downloadSha256":"5abc4902ebdf4262225fd66ae2ba6005a84f1dc9a92303f803607f358fb55f78","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"Learn Kartuli (native Georgian speaker)","description":"Human recording of ი","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ka-09","sourcePage":"https://learnkartuli.com/georgian-alphabet/","downloadUrl":"https://ik.imagekit.io/yefslmhxy/kartuli/sounds/ka/10D9_ka.m4a","downloadSha256":"22bbab0fcf7e7629de1859e7f6ad4012f1ace223a414dc61f9bbc9c43f2d45a2","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"Learn Kartuli (native Georgian speaker)","description":"Human recording of კ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ka-10","sourcePage":"https://learnkartuli.com/georgian-alphabet/","downloadUrl":"https://ik.imagekit.io/yefslmhxy/kartuli/sounds/ka/10DA_ka.m4a","downloadSha256":"0dea81fb77529398a5af6473a407af8eed2c1022400f987c431faa8129d27f71","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"Learn Kartuli (native Georgian speaker)","description":"Human recording of ლ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ka-11","sourcePage":"https://learnkartuli.com/georgian-alphabet/","downloadUrl":"https://ik.imagekit.io/yefslmhxy/kartuli/sounds/ka/10DB_ka.m4a","downloadSha256":"38fced15c9f0cbc1226ab5823667fe7819fab295210e45abcd5899174e7a55da","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"Learn Kartuli (native Georgian speaker)","description":"Human recording of მ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ka-12","sourcePage":"https://learnkartuli.com/georgian-alphabet/","downloadUrl":"https://ik.imagekit.io/yefslmhxy/kartuli/sounds/ka/10DC_ka.m4a","downloadSha256":"0e8af979baf0d6d50cf93738e9d442d4be55384747b5dce3ce3525c5d386eae0","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"Learn Kartuli (native Georgian speaker)","description":"Human recording of ნ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ka-13","sourcePage":"https://learnkartuli.com/georgian-alphabet/","downloadUrl":"https://ik.imagekit.io/yefslmhxy/kartuli/sounds/ka/10DD_ka.m4a","downloadSha256":"ae5ce939e05778b7fe9a141ee550d91892267e15cf22b787dc75160526ca757e","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"Learn Kartuli (native Georgian speaker)","description":"Human recording of ო","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ka-14","sourcePage":"https://learnkartuli.com/georgian-alphabet/","downloadUrl":"https://ik.imagekit.io/yefslmhxy/kartuli/sounds/ka/10DE_ka.m4a","downloadSha256":"a155898400dd2abb641d5cd9702a428fa4d659a068c1195b2c5446d4be1463be","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"Learn Kartuli (native Georgian speaker)","description":"Human recording of პ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ka-15","sourcePage":"https://learnkartuli.com/georgian-alphabet/","downloadUrl":"https://ik.imagekit.io/yefslmhxy/kartuli/sounds/ka/10DF_ka.m4a","downloadSha256":"b7ff9f245c30da57d316d76a794fff12ec8be29dc4f747a34a06b6d8dbd92d64","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"Learn Kartuli (native Georgian speaker)","description":"Human recording of ჟ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ka-16","sourcePage":"https://learnkartuli.com/georgian-alphabet/","downloadUrl":"https://ik.imagekit.io/yefslmhxy/kartuli/sounds/ka/10E0_ka.m4a","downloadSha256":"fbc594555bef99a21ea4009fd69d85f6bd965e07962e169d598c40826b3514b5","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"Learn Kartuli (native Georgian speaker)","description":"Human recording of რ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ka-17","sourcePage":"https://learnkartuli.com/georgian-alphabet/","downloadUrl":"https://ik.imagekit.io/yefslmhxy/kartuli/sounds/ka/10E1_ka.m4a","downloadSha256":"2923ebc3376e41418712e3d39b5ccc553f1c29b5f6966ddb50ad0aa3a4665992","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"Learn Kartuli (native Georgian speaker)","description":"Human recording of ს","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ka-18","sourcePage":"https://learnkartuli.com/georgian-alphabet/","downloadUrl":"https://ik.imagekit.io/yefslmhxy/kartuli/sounds/ka/10E2_ka.m4a","downloadSha256":"d499a97e0797c4ccaef068dea185b5f1789e4ac7e4ee9291b87483a5a43f805e","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"Learn Kartuli (native Georgian speaker)","description":"Human recording of ტ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ka-19","sourcePage":"https://learnkartuli.com/georgian-alphabet/","downloadUrl":"https://ik.imagekit.io/yefslmhxy/kartuli/sounds/ka/10E3_ka.m4a","downloadSha256":"0420b551f03b2a95afcd19322e82cae362fdfad0867f39c376680842316c866c","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"Learn Kartuli (native Georgian speaker)","description":"Human recording of უ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ka-20","sourcePage":"https://learnkartuli.com/georgian-alphabet/","downloadUrl":"https://ik.imagekit.io/yefslmhxy/kartuli/sounds/ka/10E4_ka.m4a","downloadSha256":"bb0eb743655581df5c198d6a017be5c39639cebd69bc04348457a83811718722","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"Learn Kartuli (native Georgian speaker)","description":"Human recording of ფ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ka-21","sourcePage":"https://learnkartuli.com/georgian-alphabet/","downloadUrl":"https://ik.imagekit.io/yefslmhxy/kartuli/sounds/ka/10E5_ka.m4a","downloadSha256":"6bcb18238787657afab10d5fe0849023baedfd1020a6422305140ab722a44a5c","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"Learn Kartuli (native Georgian speaker)","description":"Human recording of ქ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ka-22","sourcePage":"https://learnkartuli.com/georgian-alphabet/","downloadUrl":"https://ik.imagekit.io/yefslmhxy/kartuli/sounds/ka/10E6_ka.m4a","downloadSha256":"14118ad4794e022baaa02fdab6d083e6e97a916ee89efae97f8d96b8becc1215","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"Learn Kartuli (native Georgian speaker)","description":"Human recording of ღ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ka-23","sourcePage":"https://learnkartuli.com/georgian-alphabet/","downloadUrl":"https://ik.imagekit.io/yefslmhxy/kartuli/sounds/ka/10E7_ka.m4a","downloadSha256":"072522450275e4e95afc6b55f8a822dfe96748d1df92bf7215666ffe53bcbac0","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"Learn Kartuli (native Georgian speaker)","description":"Human recording of ყ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ka-24","sourcePage":"https://learnkartuli.com/georgian-alphabet/","downloadUrl":"https://ik.imagekit.io/yefslmhxy/kartuli/sounds/ka/10E8_ka.m4a","downloadSha256":"8172d1c9179b63a1504d7168ce98d13f6c51573a8d23da68f4344ca31b6f4f58","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"Learn Kartuli (native Georgian speaker)","description":"Human recording of შ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ka-25","sourcePage":"https://learnkartuli.com/georgian-alphabet/","downloadUrl":"https://ik.imagekit.io/yefslmhxy/kartuli/sounds/ka/10E9_ka.m4a","downloadSha256":"d911100b20fa209038f9f9d5787dafaec811fe55907913bc0647f89114bc39ba","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"Learn Kartuli (native Georgian speaker)","description":"Human recording of ჩ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ka-26","sourcePage":"https://learnkartuli.com/georgian-alphabet/","downloadUrl":"https://ik.imagekit.io/yefslmhxy/kartuli/sounds/ka/10EA_ka.m4a","downloadSha256":"8bc58934ba4dc606efcbba384e01db02c5ab01614892e1af46cd434deee8b58b","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"Learn Kartuli (native Georgian speaker)","description":"Human recording of ც","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ka-27","sourcePage":"https://learnkartuli.com/georgian-alphabet/","downloadUrl":"https://ik.imagekit.io/yefslmhxy/kartuli/sounds/ka/10EB_ka.m4a","downloadSha256":"d18683e947cfec035e4371df13819fdf34154503697d29a8056e97874f31206e","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"Learn Kartuli (native Georgian speaker)","description":"Human recording of ძ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ka-28","sourcePage":"https://learnkartuli.com/georgian-alphabet/","downloadUrl":"https://ik.imagekit.io/yefslmhxy/kartuli/sounds/ka/10EC_ka.m4a","downloadSha256":"ca3def603555d86277a7e38f82fcbe70661a4cdfc11266943523249f4ad7e60f","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"Learn Kartuli (native Georgian speaker)","description":"Human recording of წ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ka-29","sourcePage":"https://learnkartuli.com/georgian-alphabet/","downloadUrl":"https://ik.imagekit.io/yefslmhxy/kartuli/sounds/ka/10ED_ka.m4a","downloadSha256":"35b35fe016fc9217e7288bb617112ea41c9c7655df95a455dbf358e470c73353","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"Learn Kartuli (native Georgian speaker)","description":"Human recording of ჭ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ka-30","sourcePage":"https://learnkartuli.com/georgian-alphabet/","downloadUrl":"https://ik.imagekit.io/yefslmhxy/kartuli/sounds/ka/10EE_ka.m4a","downloadSha256":"41ad13f7760a114596aaea766072ad71d8fb4ac51f1d88be0521b5efff4d297c","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"Learn Kartuli (native Georgian speaker)","description":"Human recording of ხ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ka-31","sourcePage":"https://learnkartuli.com/georgian-alphabet/","downloadUrl":"https://ik.imagekit.io/yefslmhxy/kartuli/sounds/ka/10EF_ka.m4a","downloadSha256":"c8992b42882124ebce35941f08bbadd2d4d00a1157a426f080eb6fee8d325a53","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"Learn Kartuli (native Georgian speaker)","description":"Human recording of ჯ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ka-32","sourcePage":"https://learnkartuli.com/georgian-alphabet/","downloadUrl":"https://ik.imagekit.io/yefslmhxy/kartuli/sounds/ka/10F0_ka.m4a","downloadSha256":"59fda4e933932ed9aaa54a7e80ec20df594ce25b85178a4733604a2dc941adae","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"Learn Kartuli (native Georgian speaker)","description":"Human recording of ჰ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-00","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/bd67bd87e2c64d7e6664bdb05a84ff1d266f2f9993e86839500a5c420772fe48_1.mp3","downloadSha256":"e9fb95d58950f5d9f978e2910da8f1c8c55fae646da96c027a96afca7d23bc11","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㄱ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-01","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/bd67bd87e2c64d7e6664bdb05a84ff1d68615a9386663ec835f24d730ca87124_2.mp3","downloadSha256":"3cf0e0b227b02a458516af02267b4614861066fbea60b52b43bb52c801b69dc1","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㄲ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-02","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/bd67bd87e2c64d7e6664bdb05a84ff1d44d07656275fc0c466ef025ee7dd505a_3.mp3","downloadSha256":"fea3994bfff2a5132a670881c89e3219b68543b45e0953efea0cb722f5e57493","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㄴ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-03","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/bd67bd87e2c64d7e6664bdb05a84ff1d857a3c69cd961caa1e076975226f606a_4.mp3","downloadSha256":"f1a50090426fe894472b6e6997ba43add63f1f90e82f5f25b5e66242da7ceae4","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㄷ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-04","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/bd67bd87e2c64d7e6664bdb05a84ff1dc06c81807bfc41d4ee3eefad0ff2494a_5.mp3","downloadSha256":"ea183fab39c7d7e2c8f955dc6d5c7cbb94a9ab08d4644df0335c99354b51a288","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㄸ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-05","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/bd67bd87e2c64d7e6664bdb05a84ff1d1d9dfa5545a9c46c7da61c0399c4eac6_6.mp3","downloadSha256":"a611f90fbdf01e6c8def652b606d81c345db0864a1aabd1e576a1aebad533a92","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㄹ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-06","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/bd67bd87e2c64d7e6664bdb05a84ff1dd3e8dd7356889f71aaed8d84881cf877_7.mp3","downloadSha256":"a60398e1a2462524b4eb304da168a771b1aefac3a2d7f105e27281c539e40f67","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㅁ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-07","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/bd67bd87e2c64d7e6664bdb05a84ff1d7b1272148e17919b8bf1bd7b4e51c6c1_8.mp3","downloadSha256":"009edbe8bde1e61f841fee5a7d542f6ee60fd6b7d43c9af83b82276590adf195","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㅂ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-08","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/bd67bd87e2c64d7e6664bdb05a84ff1d3986c4af873bbaba93c3702b3b40dcc7_9.mp3","downloadSha256":"56fa107c9918b33650ed2c19811356b730d3fa90072bec43944323a8d638c7a4","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㅃ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-09","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/bd67bd87e2c64d7e6664bdb05a84ff1dca303fbade9b44d72c413cc06cbb7e74_10.mp3","downloadSha256":"94b09f54ef70c99cb402b7cdd864f5e11d792826d7cc90847faf9dec858e3e0e","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㅅ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-10","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/bd67bd87e2c64d7e6664bdb05a84ff1d6c0597b4d87ca0d0e3165cca6ad0c86d_11.mp3","downloadSha256":"0a1dce12da4e74f4db0231d98c70f8ea3c01da90b23930d1a471c1bac593277c","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㅆ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-11","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/bd67bd87e2c64d7e6664bdb05a84ff1df5cc82ce8f1854afe0dc35357d1c3301_12.mp3","downloadSha256":"9ebf8bd74051098edb436748e6b479f811c9e30a357548534fb80784474270b1","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㅇ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-12","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/bd67bd87e2c64d7e6664bdb05a84ff1d756d46a2ec8c4bb5ff438b86a65575eb_13.mp3","downloadSha256":"9b810c4ee97a0daa01e37fe0fbd2bdd208ba9850c01bf1e9d6e10efbc938ba7a","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㅈ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-13","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/bd67bd87e2c64d7e6664bdb05a84ff1dfccc41e233c3ad1853e65f9e57f42dd7_14.mp3","downloadSha256":"8c553166d64f95c359a9c1cf3571ee1cc958ca6633904a60e161090d92d4a601","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㅉ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-14","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/bd67bd87e2c64d7e6664bdb05a84ff1d94cda55deb5800cf941b4e09506785b2_15.mp3","downloadSha256":"0a0d9f82d69b38ebada43a09cb950eb505eb379a3397c67e6bbaccc0cf726928","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㅊ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-15","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/bd67bd87e2c64d7e6664bdb05a84ff1dc402b4daecf37f315c316e1b89443ff4_16.mp3","downloadSha256":"eac1c5ca378d99520b2fc1736fe68754aefa3cdec47243fa848941d00d9b57a6","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㅋ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-16","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/bd67bd87e2c64d7e6664bdb05a84ff1d4f8b1517eef7813489643bbb6af8f5d9_17.mp3","downloadSha256":"61a087e7c4624732f685a5bacd0deaddba1b1e49cf37e068f1bf41ae97e7b01e","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㅌ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-17","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/bd67bd87e2c64d7e6664bdb05a84ff1d437ab5e7ed3bb1d646ebde72579d881d_18.mp3","downloadSha256":"80457a4c8e9c6156a5ba8de973db5b2cf00050a6805cb2dbfe8cec24ab6e9d8e","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㅍ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-18","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/bd67bd87e2c64d7e6664bdb05a84ff1d262323afcf7b62413cca9c89be46943b_19.mp3","downloadSha256":"b284e15fcc11a8eaa2333878bef3dd66e9d257ca05d5bc2de9216890f8095a72","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㅎ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-19","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/170fe09ec7464561fbf58058651c81335b6e239e9c53a42d_20.mp3","downloadSha256":"b7cd19e46eda96a439fdc8bf1e8feb9159dd490c40bd3ffb8c846d203001fb5c","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㅏ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-20","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/170fe09ec746456195d095b7bb33ad4278a1844f0bdaf70a_26.mp3","downloadSha256":"6ac5fe435041f8d8f28ffb272610c612cf9daf994931e3a23cd25fdebcd6d6be","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㅐ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-21","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/170fe09ec74645617a6d0ab84785d740ce93a0d5acebf59a_28.mp3","downloadSha256":"8d4628ba94761a6695da0f120be64fc3ed23e232eaa35e1709a4b56a04174173","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㅑ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-22","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/170fe09ec7464561564b5308200c0ac0c9f878a4f585ded6_32.mp3","downloadSha256":"a2ee1bdf1414545e8a5f9abf47428c65ad16530eb741ee25c6b3c9da5ed5b6fb","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㅒ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-23","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/170fe09ec7464561a651f112bcc34c74d3a29963db135e55_21.mp3","downloadSha256":"1a1caa604dca845e6817cf03099d0ef11ec3471f707cf58abc97930bdacdb7fe","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㅓ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-24","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/170fe09ec7464561f0908e7b59996d3d60283734532dd751_27.mp3","downloadSha256":"7767e0b8cde48991d77736a13a6e4031a7b332b4573845cf4eebb3757c86111d","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㅔ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-25","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/170fe09ec746456101755731cb5f1d1e7b63d174fd75cc8f_29.mp3","downloadSha256":"70c527f164ffeb64d2f49086effa5d94ac445ce4ac3441f2f1cc579f2fba22c7","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㅕ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-26","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/170fe09ec74645617fd01901606b14eb04d8b00f3c02c8e6_33.mp3","downloadSha256":"4d03304623b2286889e85da0d4b4112ba4ea8c213f4d5ebb17ae74add76ab3be","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㅖ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-27","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/170fe09ec7464561b5540a40dc0e06cc2d916ecbb6ce058f_22.mp3","downloadSha256":"3b7c33100bc96ad19dc4ffa6983dd38f14d42b3985a7391a43ce27beecaa9699","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㅗ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-28","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/170fe09ec7464561184dc556ddf7a995508fb05eef0fa96b_34.mp3","downloadSha256":"63355575dbe61d00af2c2e61dd32e023cbd191a169cd1eaa57a4afaf830ea815","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㅘ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-29","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/170fe09ec746456160f872aafb59da5390e9668a3c2d5939_35.mp3","downloadSha256":"f0f58dfc709db0f1b639aa4928ee1d4e2a17732f1ac0b0948602fa05ba0386eb","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㅙ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-30","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/170fe09ec74645613a8b5cb0b31eebf56f33a11c4b784028_38.mp3","downloadSha256":"6f54c982d5e10930181c7040ccc701e9bf3f08e2ba1f7b0d7a3fc871bf58093d","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㅚ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-31","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/170fe09ec74645615db4e42d90eaed61e62652db128a3655_30.mp3","downloadSha256":"378caa0fd7eb87b9ed7bc173dc35905fd10b9a851dded8eb129d20217494ae40","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㅛ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-32","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/170fe09ec7464561f81f693716f67119de4bd0f10ca29201_23.mp3","downloadSha256":"4e664dab9d17c535854c9e6bc1ddfbe1430bd5a2170e82c8cb5bcd6317cc898e","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㅜ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-33","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/170fe09ec7464561e1a2064663b774871aa42272376a3575_36.mp3","downloadSha256":"e4a1d920c03592eec467f9a01bbf3c1b024f1c1204b5b8da41aefbb11470e26a","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㅝ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-34","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/170fe09ec7464561ba72605178a313a8727d8f5f59538dc1_37.mp3","downloadSha256":"573bc2524b57a3c7fecec2f6e1adc5b0044d24efcf6ae33d6a869eef668c3369","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㅞ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-35","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/170fe09ec74645618a7018ad366f148018e361e4631ad217_39.mp3","downloadSha256":"24753f3209e9d5567c13307bc32b7665ee92cdd3e12207c96141a8c2be98d35a","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㅟ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-36","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/170fe09ec7464561767cd75cf19968695a3db02e2cf1caec_31.mp3","downloadSha256":"d1557a3bc654a0e245ad598e7d54d1d86ac30020cd55780d9b3565901328e005","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㅠ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-37","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/170fe09ec74645610c33962c2f630f89cf091f74d90cee47_24.mp3","downloadSha256":"66009b5adf5b733e54dba74307705af8d38e6a026a5e09bd71559021fbd9bb28","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㅡ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-38","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/170fe09ec7464561717d20ea15a7a39c49efc6a10c895164_40.mp3","downloadSha256":"0aa9e9cebc916a89185b92561bf841d955f0e657a48cf19d3ba127d1a3c2d016","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㅢ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"ko-39","sourcePage":"https://zkorean.com/hangul/appearance","downloadUrl":"https://zkorean.com/study/serve_audio_public/170fe09ec746456110b311bd491b88df8961f6994b5ad4f3_25.mp3","downloadSha256":"a30a8a4568316f8b339c05486dc70ebf1c19b56e844461a488e190be2734ee8d","license":"No public redistribution license verified","licenseStatement":"Sourced for personal study; no open-license claim.","author":"zKorean / ReadyPrompt, LLC","description":"Human recording of ㅣ","retrieved":"2026-10-23","conversion":"Mono 24 kHz PCM WAV; no pitch or speed adjustment"},{"id":"vi-00","sourcePage":"https://seasite.niu.edu/vietnamese/Guide_to_Pronunciation/alphabet/alphabet_table.htm","downloadUrl":"https://seasite.niu.edu/vietnamese/Alphabet/LettersAudio/a1.mp3","downloadSha256":"12db9c1b9b414c26b1a65a5540a906812a80ffcfb61e324adaf25b1f94d02e7d","license":"No public redistribution license verified","licenseStatement":"NIU SEAsite educational audio retained for personal study; no public-domain or open-license claim.","author":"Northern Illinois University · SEAsite Vietnamese","description":"Vietnamese alphabet teaching audio: a","retrieved":"2026-10-23","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"vi-01","sourcePage":"https://seasite.niu.edu/vietnamese/Guide_to_Pronunciation/alphabet/alphabet_table.htm","downloadUrl":"https://seasite.niu.edu/vietnamese/Alphabet/LettersAudio/a2.mp3","downloadSha256":"154bf2694f0beb1a42d60680e17300c90e5d3f46d47dcff180d7b42f053e867f","license":"No public redistribution license verified","licenseStatement":"NIU SEAsite educational audio retained for personal study; no public-domain or open-license claim.","author":"Northern Illinois University · SEAsite Vietnamese","description":"Vietnamese alphabet teaching audio: ă","retrieved":"2026-10-23","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"vi-02","sourcePage":"https://seasite.niu.edu/vietnamese/Guide_to_Pronunciation/alphabet/alphabet_table.htm","downloadUrl":"https://seasite.niu.edu/vietnamese/Alphabet/LettersAudio/a3.mp3","downloadSha256":"8a03cc4e82fa863fab93e2b8bf32bccc9990cbb36fc6d0426ddfa84bd35c8be0","license":"No public redistribution license verified","licenseStatement":"NIU SEAsite educational audio retained for personal study; no public-domain or open-license claim.","author":"Northern Illinois University · SEAsite Vietnamese","description":"Vietnamese alphabet teaching audio: â","retrieved":"2026-10-23","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"vi-03","sourcePage":"https://seasite.niu.edu/vietnamese/Guide_to_Pronunciation/alphabet/alphabet_table.htm","downloadUrl":"https://seasite.niu.edu/vietnamese/Alphabet/LettersAudio/b.mp3","downloadSha256":"5bcded7a3e0064c913036314122dee75751ad29349a7c0bb5a412cf5f1f1299b","license":"No public redistribution license verified","licenseStatement":"NIU SEAsite educational audio retained for personal study; no public-domain or open-license claim.","author":"Northern Illinois University · SEAsite Vietnamese","description":"Vietnamese alphabet teaching audio: b","retrieved":"2026-10-23","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"vi-04","sourcePage":"https://seasite.niu.edu/vietnamese/Guide_to_Pronunciation/alphabet/alphabet_table.htm","downloadUrl":"https://seasite.niu.edu/vietnamese/Alphabet/LettersAudio/c.mp3","downloadSha256":"0e2a5c9c9b0e73b343bb60a69d14de5bc0590b9938cfe0cbe00c4ba951b9c33a","license":"No public redistribution license verified","licenseStatement":"NIU SEAsite educational audio retained for personal study; no public-domain or open-license claim.","author":"Northern Illinois University · SEAsite Vietnamese","description":"Vietnamese alphabet teaching audio: c","retrieved":"2026-10-23","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"vi-05","sourcePage":"https://seasite.niu.edu/vietnamese/Guide_to_Pronunciation/alphabet/alphabet_table.htm","downloadUrl":"https://seasite.niu.edu/vietnamese/Alphabet/LettersAudio/d1.mp3","downloadSha256":"4702d1a33a0f725f0e5e5bb21e1f97d2eee45eaae2e392384f9eeb2307bda37b","license":"No public redistribution license verified","licenseStatement":"NIU SEAsite educational audio retained for personal study; no public-domain or open-license claim.","author":"Northern Illinois University · SEAsite Vietnamese","description":"Vietnamese alphabet teaching audio: d","retrieved":"2026-10-23","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"vi-06","sourcePage":"https://seasite.niu.edu/vietnamese/Guide_to_Pronunciation/alphabet/alphabet_table.htm","downloadUrl":"https://seasite.niu.edu/vietnamese/Alphabet/LettersAudio/d2.mp3","downloadSha256":"a24e57bef579d55f607cd391938560cda375b7ae98f0ca33db1a5e4a18359981","license":"No public redistribution license verified","licenseStatement":"NIU SEAsite educational audio retained for personal study; no public-domain or open-license claim.","author":"Northern Illinois University · SEAsite Vietnamese","description":"Vietnamese alphabet teaching audio: đ","retrieved":"2026-10-23","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"vi-07","sourcePage":"https://seasite.niu.edu/vietnamese/Guide_to_Pronunciation/alphabet/alphabet_table.htm","downloadUrl":"https://seasite.niu.edu/vietnamese/Alphabet/LettersAudio/e1.mp3","downloadSha256":"92f6d6f8b178c50dac902bbbca6fe80c12a58a2839b3e88f66a6d951a94d49ad","license":"No public redistribution license verified","licenseStatement":"NIU SEAsite educational audio retained for personal study; no public-domain or open-license claim.","author":"Northern Illinois University · SEAsite Vietnamese","description":"Vietnamese alphabet teaching audio: e","retrieved":"2026-10-23","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"vi-08","sourcePage":"https://seasite.niu.edu/vietnamese/Guide_to_Pronunciation/alphabet/alphabet_table.htm","downloadUrl":"https://seasite.niu.edu/vietnamese/Alphabet/LettersAudio/e2.mp3","downloadSha256":"2e1002a6c694f09a509b6fd3e6d1e24e1b196cc714a026ae1def74acb6fba4d7","license":"No public redistribution license verified","licenseStatement":"NIU SEAsite educational audio retained for personal study; no public-domain or open-license claim.","author":"Northern Illinois University · SEAsite Vietnamese","description":"Vietnamese alphabet teaching audio: ê","retrieved":"2026-10-23","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"vi-09","sourcePage":"https://seasite.niu.edu/vietnamese/Guide_to_Pronunciation/alphabet/alphabet_table.htm","downloadUrl":"https://seasite.niu.edu/vietnamese/Alphabet/LettersAudio/g.mp3","downloadSha256":"ab706c3a2f40f1f6a4e96d951d7ace29bab80e12101615806e6c4569cf7facfd","license":"No public redistribution license verified","licenseStatement":"NIU SEAsite educational audio retained for personal study; no public-domain or open-license claim.","author":"Northern Illinois University · SEAsite Vietnamese","description":"Vietnamese alphabet teaching audio: g","retrieved":"2026-10-23","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"vi-10","sourcePage":"https://seasite.niu.edu/vietnamese/Guide_to_Pronunciation/alphabet/alphabet_table.htm","downloadUrl":"https://seasite.niu.edu/vietnamese/Alphabet/LettersAudio/h.mp3","downloadSha256":"8153f45d24a73adb6bcc66d7530763097d2f62dccd5262f63ad68c8fa7dcaf96","license":"No public redistribution license verified","licenseStatement":"NIU SEAsite educational audio retained for personal study; no public-domain or open-license claim.","author":"Northern Illinois University · SEAsite Vietnamese","description":"Vietnamese alphabet teaching audio: h","retrieved":"2026-10-23","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"vi-11","sourcePage":"https://seasite.niu.edu/vietnamese/Guide_to_Pronunciation/alphabet/alphabet_table.htm","downloadUrl":"https://seasite.niu.edu/vietnamese/Alphabet/LettersAudio/i.mp3","downloadSha256":"2012e459f8e292790c0a776160086b998a06c24e0bab4fad81180024c9bcc372","license":"No public redistribution license verified","licenseStatement":"NIU SEAsite educational audio retained for personal study; no public-domain or open-license claim.","author":"Northern Illinois University · SEAsite Vietnamese","description":"Vietnamese alphabet teaching audio: i","retrieved":"2026-10-23","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"vi-12","sourcePage":"https://seasite.niu.edu/vietnamese/Guide_to_Pronunciation/alphabet/alphabet_table.htm","downloadUrl":"https://seasite.niu.edu/vietnamese/Alphabet/LettersAudio/k.mp3","downloadSha256":"36119f35556a5902e46f433575de262bd568da4375f294fb89d9eea171bc6f6f","license":"No public redistribution license verified","licenseStatement":"NIU SEAsite educational audio retained for personal study; no public-domain or open-license claim.","author":"Northern Illinois University · SEAsite Vietnamese","description":"Vietnamese alphabet teaching audio: k","retrieved":"2026-10-23","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"vi-13","sourcePage":"https://seasite.niu.edu/vietnamese/Guide_to_Pronunciation/alphabet/alphabet_table.htm","downloadUrl":"https://seasite.niu.edu/vietnamese/Alphabet/LettersAudio/l.mp3","downloadSha256":"2b21b328ad55ce8d35a3e644218f5031ffd07aa9cc134b0d4ec283ca5e8ebd85","license":"No public redistribution license verified","licenseStatement":"NIU SEAsite educational audio retained for personal study; no public-domain or open-license claim.","author":"Northern Illinois University · SEAsite Vietnamese","description":"Vietnamese alphabet teaching audio: l","retrieved":"2026-10-23","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"vi-14","sourcePage":"https://seasite.niu.edu/vietnamese/Guide_to_Pronunciation/alphabet/alphabet_table.htm","downloadUrl":"https://seasite.niu.edu/vietnamese/Alphabet/LettersAudio/m.mp3","downloadSha256":"12b252f7feef9bd4fdd274688d7a0279f681e3598a812edbd1990780c3748fb8","license":"No public redistribution license verified","licenseStatement":"NIU SEAsite educational audio retained for personal study; no public-domain or open-license claim.","author":"Northern Illinois University · SEAsite Vietnamese","description":"Vietnamese alphabet teaching audio: m","retrieved":"2026-10-23","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"vi-15","sourcePage":"https://seasite.niu.edu/vietnamese/Guide_to_Pronunciation/alphabet/alphabet_table.htm","downloadUrl":"https://seasite.niu.edu/vietnamese/Alphabet/LettersAudio/n.mp3","downloadSha256":"118342341eab78e2793d38d1287527d77d9a48da065855ea4d8f40c632836c88","license":"No public redistribution license verified","licenseStatement":"NIU SEAsite educational audio retained for personal study; no public-domain or open-license claim.","author":"Northern Illinois University · SEAsite Vietnamese","description":"Vietnamese alphabet teaching audio: n","retrieved":"2026-10-23","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"vi-16","sourcePage":"https://seasite.niu.edu/vietnamese/Guide_to_Pronunciation/alphabet/alphabet_table.htm","downloadUrl":"https://seasite.niu.edu/vietnamese/Alphabet/LettersAudio/o1.mp3","downloadSha256":"3016ea192f1b51d771b84011e0cfd449d1e2563a11be9dff555ea75029babc2c","license":"No public redistribution license verified","licenseStatement":"NIU SEAsite educational audio retained for personal study; no public-domain or open-license claim.","author":"Northern Illinois University · SEAsite Vietnamese","description":"Vietnamese alphabet teaching audio: o","retrieved":"2026-10-23","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"vi-17","sourcePage":"https://seasite.niu.edu/vietnamese/Guide_to_Pronunciation/alphabet/alphabet_table.htm","downloadUrl":"https://seasite.niu.edu/vietnamese/Alphabet/LettersAudio/o3.mp3","downloadSha256":"227a4c4edd32153f2885946ef07be8f75d40da95b977989c576dad9aed495ada","license":"No public redistribution license verified","licenseStatement":"NIU SEAsite educational audio retained for personal study; no public-domain or open-license claim.","author":"Northern Illinois University · SEAsite Vietnamese","description":"Vietnamese alphabet teaching audio: ơ","retrieved":"2026-10-23","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"vi-18","sourcePage":"https://seasite.niu.edu/vietnamese/Guide_to_Pronunciation/alphabet/alphabet_table.htm","downloadUrl":"https://seasite.niu.edu/vietnamese/Alphabet/LettersAudio/o2.mp3","downloadSha256":"dbecff9ac391e9d65e0e440cdcc23dbea4954eb5aa6a54127d86e3a0a2311146","license":"No public redistribution license verified","licenseStatement":"NIU SEAsite educational audio retained for personal study; no public-domain or open-license claim.","author":"Northern Illinois University · SEAsite Vietnamese","description":"Vietnamese alphabet teaching audio: ô","retrieved":"2026-10-23","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"vi-19","sourcePage":"https://seasite.niu.edu/vietnamese/Guide_to_Pronunciation/alphabet/alphabet_table.htm","downloadUrl":"https://seasite.niu.edu/vietnamese/Alphabet/LettersAudio/p.mp3","downloadSha256":"239caa7728e2053b5a67df61c6b68d470a49c1f496f4c379ed7f2ff1eed5366d","license":"No public redistribution license verified","licenseStatement":"NIU SEAsite educational audio retained for personal study; no public-domain or open-license claim.","author":"Northern Illinois University · SEAsite Vietnamese","description":"Vietnamese alphabet teaching audio: p","retrieved":"2026-10-23","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"vi-20","sourcePage":"https://seasite.niu.edu/vietnamese/Guide_to_Pronunciation/alphabet/alphabet_table.htm","downloadUrl":"https://seasite.niu.edu/vietnamese/Alphabet/LettersAudio/q.mp3","downloadSha256":"daec4b9c1a0a9a2f0201a9f3178dd5c4239539330a30741e6385dd93711d34e9","license":"No public redistribution license verified","licenseStatement":"NIU SEAsite educational audio retained for personal study; no public-domain or open-license claim.","author":"Northern Illinois University · SEAsite Vietnamese","description":"Vietnamese alphabet teaching audio: q","retrieved":"2026-10-23","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"vi-21","sourcePage":"https://seasite.niu.edu/vietnamese/Guide_to_Pronunciation/alphabet/alphabet_table.htm","downloadUrl":"https://seasite.niu.edu/vietnamese/Alphabet/LettersAudio/r.mp3","downloadSha256":"43dbaf41bef33a7940d08ca1b527bf3f2ac9a24ef961aa293cb92ef54d3553f5","license":"No public redistribution license verified","licenseStatement":"NIU SEAsite educational audio retained for personal study; no public-domain or open-license claim.","author":"Northern Illinois University · SEAsite Vietnamese","description":"Vietnamese alphabet teaching audio: r","retrieved":"2026-10-23","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"vi-22","sourcePage":"https://seasite.niu.edu/vietnamese/Guide_to_Pronunciation/alphabet/alphabet_table.htm","downloadUrl":"https://seasite.niu.edu/vietnamese/Alphabet/LettersAudio/s.mp3","downloadSha256":"75c4178d52779d8765cf76087c06860eca17df6b013149920a66e7030b484cf6","license":"No public redistribution license verified","licenseStatement":"NIU SEAsite educational audio retained for personal study; no public-domain or open-license claim.","author":"Northern Illinois University · SEAsite Vietnamese","description":"Vietnamese alphabet teaching audio: s","retrieved":"2026-10-23","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"vi-23","sourcePage":"https://seasite.niu.edu/vietnamese/Guide_to_Pronunciation/alphabet/alphabet_table.htm","downloadUrl":"https://seasite.niu.edu/vietnamese/Alphabet/LettersAudio/t.mp3","downloadSha256":"1bffa20afba42def4bead05605ae580c87381eef065acda5f88d4ef3d5cf6487","license":"No public redistribution license verified","licenseStatement":"NIU SEAsite educational audio retained for personal study; no public-domain or open-license claim.","author":"Northern Illinois University · SEAsite Vietnamese","description":"Vietnamese alphabet teaching audio: t","retrieved":"2026-10-23","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"vi-24","sourcePage":"https://seasite.niu.edu/vietnamese/Guide_to_Pronunciation/alphabet/alphabet_table.htm","downloadUrl":"https://seasite.niu.edu/vietnamese/Alphabet/LettersAudio/u1.mp3","downloadSha256":"58f2c51318d46aaa8c0e40d5bd3916f2383edc8debe1647cdbf4da556e7ba8f1","license":"No public redistribution license verified","licenseStatement":"NIU SEAsite educational audio retained for personal study; no public-domain or open-license claim.","author":"Northern Illinois University · SEAsite Vietnamese","description":"Vietnamese alphabet teaching audio: u","retrieved":"2026-10-23","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"vi-25","sourcePage":"https://seasite.niu.edu/vietnamese/Guide_to_Pronunciation/alphabet/alphabet_table.htm","downloadUrl":"https://seasite.niu.edu/vietnamese/Alphabet/LettersAudio/u2.mp3","downloadSha256":"eda7ec9c0836de202c502ef6edacb09a67294146623a688b67e1c8646d2d5eee","license":"No public redistribution license verified","licenseStatement":"NIU SEAsite educational audio retained for personal study; no public-domain or open-license claim.","author":"Northern Illinois University · SEAsite Vietnamese","description":"Vietnamese alphabet teaching audio: ư","retrieved":"2026-10-23","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"vi-26","sourcePage":"https://seasite.niu.edu/vietnamese/Guide_to_Pronunciation/alphabet/alphabet_table.htm","downloadUrl":"https://seasite.niu.edu/vietnamese/Alphabet/LettersAudio/v.mp3","downloadSha256":"999150e120586e2845cd8e0d813fdd8133f887c3d488b544c87637d91c64b399","license":"No public redistribution license verified","licenseStatement":"NIU SEAsite educational audio retained for personal study; no public-domain or open-license claim.","author":"Northern Illinois University · SEAsite Vietnamese","description":"Vietnamese alphabet teaching audio: v","retrieved":"2026-10-23","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"vi-27","sourcePage":"https://seasite.niu.edu/vietnamese/Guide_to_Pronunciation/alphabet/alphabet_table.htm","downloadUrl":"https://seasite.niu.edu/vietnamese/Alphabet/LettersAudio/x.mp3","downloadSha256":"0496f574dee029c60af9ef730f4d49ced96475da53b5e5ac10d83b7442190f8a","license":"No public redistribution license verified","licenseStatement":"NIU SEAsite educational audio retained for personal study; no public-domain or open-license claim.","author":"Northern Illinois University · SEAsite Vietnamese","description":"Vietnamese alphabet teaching audio: x","retrieved":"2026-10-23","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"},{"id":"vi-28","sourcePage":"https://seasite.niu.edu/vietnamese/Guide_to_Pronunciation/alphabet/alphabet_table.htm","downloadUrl":"https://seasite.niu.edu/vietnamese/Alphabet/LettersAudio/y.mp3","downloadSha256":"383eddd5e9dde2399ca5a6773e1d94474521abf0592e8e76fe246f1500e2d3d0","license":"No public redistribution license verified","licenseStatement":"NIU SEAsite educational audio retained for personal study; no public-domain or open-license claim.","author":"Northern Illinois University · SEAsite Vietnamese","description":"Vietnamese alphabet teaching audio: y","retrieved":"2026-10-23","conversion":"Full MP3 converted to mono 24 kHz PCM WAV; no clipping or pitch/speed adjustment"}]`);
const _hoisted_1$2 = { class: "pronunciation-credits" };
const _hoisted_2$2 = { key: 0 };
const _hoisted_3$2 = { key: 1 };
const _hoisted_4$2 = { key: 2 };
const _hoisted_5$2 = { key: 3 };
const _hoisted_6$2 = { key: 4 };
const _hoisted_7$2 = { key: 5 };
const _hoisted_8$2 = { class: "pronunciation-source-links" };
const _hoisted_9$2 = ["href"];
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "PronunciationCredits",
  props: {
    language: {}
  },
  setup(__props) {
    const { t } = useAppI18n();
    const props = __props;
    const entries = computed(
      () => sources.filter((source) => source.id.startsWith(`${props.language}-`)).map((source) => ({
        ...source,
        text: samples.find((sample) => sample.id === source.id)?.text
      }))
    );
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("details", _hoisted_1$2, [
        createBaseVNode("summary", null, toDisplayString(unref(t)("发音来源与许可")), 1),
        ["hy", "ka", "ko"].includes(__props.language) ? (openBlock(), createElementBlock("p", _hoisted_2$2, toDisplayString(unref(t)(
          "新增字母真人录音：亚美尼亚语由母语者 Vahagn Petrosyan 录制（CC BY-SA 3.0），已截取单字母并降噪，修改后的音频沿用该许可。格鲁吉亚语来自 Learn Kartuli 母语者录音；韩语来自 zKorean 字母教学录音，辅音包含名称与读音。后两者仅供个人学习，未确认公开再分发许可。"
        )), 1)) : __props.language === "vi" ? (openBlock(), createElementBlock("p", _hoisted_3$2, toDisplayString(unref(t)(
          "越南语录音来自北伊利诺伊大学 SEAsite 字母教材，大小写共用字母读音。音频仅供个人学习，保留原始来源；未确认公开再分发许可。"
        )), 1)) : __props.language === "ja" ? (openBlock(), createElementBlock("p", _hoisted_4$2, [
          createTextVNode(toDisplayString(unref(t)("日语录音来自")) + " ", 1),
          _cache[0] || (_cache[0] = createBaseVNode("a", {
            href: "https://www.tofugu.com/japanese/learn-hiragana/",
            target: "_blank",
            rel: "noopener noreferrer"
          }, "Tofugu · Learn Hiragana", -1)),
          createTextVNode(" " + toDisplayString(unref(t)("的假名教学音频。本地个人学习使用，保留原站来源信息。")), 1)
        ])) : __props.language === "ru" ? (openBlock(), createElementBlock("p", _hoisted_5$2, [
          createTextVNode(toDisplayString(unref(t)("俄语录音：Cherus / Wikimedia Commons，")) + " ", 1),
          _cache[1] || (_cache[1] = createBaseVNode("a", {
            href: "https://creativecommons.org/licenses/by-sa/3.0/",
            target: "_blank",
            rel: "noopener noreferrer"
          }, "CC BY-SA 3.0", -1)),
          createTextVNode(toDisplayString(unref(t)("。 转换格式并裁去首尾空白；修改后的音频继续按 CC BY-SA 3.0 提供。")), 1)
        ])) : __props.language === "el" ? (openBlock(), createElementBlock("p", _hoisted_6$2, toDisplayString(unref(t)(
          "现代希腊语录音：CuteHappyBrute / Wikimedia Commons，RoB 降噪及均衡处理，公有领域（PD-self）。 从完整字母表朗读中截取各字母；σ 与词尾 ς 共用字母名称。"
        )), 1)) : createCommentVNode("", true),
        entries.value.length ? (openBlock(), createElementBlock("p", _hoisted_7$2, toDisplayString(unref(t)("音频已转换为离线格式，部分截取单次发音；未调整语速或音高。各录音的原始页面：")), 1)) : createCommentVNode("", true),
        createBaseVNode("div", _hoisted_8$2, [
          (openBlock(true), createElementBlock(Fragment, null, renderList(entries.value, (entry) => {
            return openBlock(), createElementBlock("a", {
              key: entry.id,
              href: entry.sourcePage,
              target: "_blank",
              rel: "noopener noreferrer"
            }, toDisplayString(entry.text), 9, _hoisted_9$2);
          }), 128))
        ])
      ]);
    };
  }
});
const introductions = {
  ja: {
    nativeName: "日本語",
    summary: "日语属于日琉语系，主要在日本使用。句子通常以谓语收尾，助词标示词语的作用，敬语则体现说话人与听话人的关系。",
    facts: {
      family: "日琉语系",
      region: "日本及海外日语社群",
      script: "汉字、平假名与片假名"
    },
    writingNote: "现代日语混用三种文字。汉字多承载词义，平假名常写助词、词尾等，片假名常写外来语和拟声词。假名主要表示拍，长音、促音和拗音也参与词语的节奏。",
    history: [
      {
        period: "8 世纪",
        title: "以汉字记录日语",
        description: "《古事记》和《万叶集》等早期文献留下上代日语的记录，万叶假名借用汉字的读音来记音。"
      },
      {
        period: "9—10 世纪",
        title: "两种假名逐渐成形",
        description: "平假名从汉字的草写演变，片假名多取自汉字的一部分，逐渐形成与汉字并用的书写方式。"
      },
      {
        period: "19—20 世纪",
        title: "现代书面语与教育普及",
        description: "言文一致运动推动书面语接近口语，学校教育、出版和媒体促进了现代标准日语的传播。"
      }
    ],
    tip: "先把平假名和片假名的字形与读音配对，再用短词练习长音、促音和拗音。本应用的字母页各收录 46 个基本假名。",
    sources: [
      {
        label: "Japan Foundation · Origins of the written language",
        url: "https://classroomresources.sydney.jpf.go.jp/jpfmedia/Teachers_Notes_Origin_of_the_written_language.pdf"
      },
      {
        label: "NINJAL · Japanese language structure",
        url: "https://www.ninjal.ac.jp/research/cr-project/project/pubpro/acquisition/pdf/acquistion_paper03.pdf"
      },
      {
        label: "Nippon.com · Modern Japanese prose",
        url: "https://www.nippon.com/en/people/e00001/"
      },
      {
        label: "Japonic language family · Oxford Academic",
        url: "https://doi.org/10.1093/jole/lzaf002"
      }
    ]
  },
  ru: {
    nativeName: "Русский",
    summary: "俄语属于印欧语系斯拉夫语族的东斯拉夫语支。它主要在俄罗斯使用，也在许多跨地区社群中承担交流功能；名词变格、动词体和重音是学习重点。",
    facts: {
      family: "印欧语系 · 东斯拉夫语支",
      region: "俄罗斯及跨地区俄语社群",
      script: "西里尔字母 · 33 个字母"
    },
    writingNote: "俄语字母有大小写，印刷体与手写体的差异较明显。软音符 ь 和硬音符 ъ 本身不表示独立元音；重音位置还会影响元音的实际读法。",
    history: [
      {
        period: "10—11 世纪",
        title: "东斯拉夫书面传统发展",
        description: "随着基督教传播，西里尔文字和教会斯拉夫语书面传统进入东斯拉夫地区，并与当地语言相互影响。"
      },
      {
        period: "18—19 世纪",
        title: "现代文学语言形成",
        description: "彼得一世时期的民用字体改革改变了世俗印刷面貌，随后文学、教育和出版共同塑造现代标准俄语。"
      },
      {
        period: "1917—1918 年",
        title: "正字法改革",
        description: "改革移除部分旧字母，并取消词末辅音后常写的硬音符，使书写规则进一步简化。"
      }
    ],
    tip: "不要只按外形猜读音：例如 В 的读音与拉丁字母 B 不同。先熟悉印刷体，再对照手写体，并尽早连同重音一起记词。",
    sources: [
      {
        label: "University of Kansas · Russian orthographic reform",
        url: "https://olrc.ku.edu/russian_orthography"
      },
      {
        label: "Russian language · Overview and references",
        url: "https://en.wikipedia.org/wiki/Russian_language"
      }
    ]
  },
  el: {
    nativeName: "Ελληνικά",
    summary: "希腊语是印欧语系中的独立分支，拥有延续数千年的文字记录。现代希腊语主要用于希腊和塞浦路斯，经历了古希腊语、通用希腊语和中世纪希腊语等发展阶段。",
    facts: {
      family: "印欧语系 · 希腊语支",
      region: "希腊、塞浦路斯及海外社群",
      script: "希腊字母 · 24 个字母"
    },
    writingNote: "希腊字母有大小写，小写 σ 在词尾通常写作 ς。现代读音与古代读音有明显差异，字母组合也会共同表示一个音；本应用录音采用现代希腊语。",
    history: [
      {
        period: "约公元前 8 世纪",
        title: "字母体系出现",
        description: "希腊人改造腓尼基字母，明确用字母表示元音。早期各地区字形并不完全统一。"
      },
      {
        period: "希腊化时代",
        title: "通用希腊语传播",
        description: "亚历山大征服之后，以阿提卡语为重要基础的通用希腊语在更广阔地区传播，并成为后续语言演变的重要基础。"
      },
      {
        period: "1976 年",
        title: "现代标准语确立",
        description: "经过长期书面语争论，以民众日常语言为基础的现代希腊语确立为官方和教育语言。"
      }
    ],
    tip: "先练习大小写配对和词尾 ς，再把字母放入短词中学习。数学、物理里熟悉的字母名称，不一定与现代希腊语的实际读法相同。",
    sources: [
      {
        label: "Scuola Normale Superiore · Greek alphabets",
        url: "https://mnamon.sns.it/index.php?id=12&lang=en&page=Scrittura"
      },
      {
        label: "Harvard CHS · A brief history of Greek",
        url: "https://www-current.chs.harvard.edu/the-greek-language-a-brief-history/"
      }
    ]
  },
  hy: {
    nativeName: "Հայերեն",
    summary: "亚美尼亚语在印欧语系中自成一支。它是亚美尼亚的重要日常与文化语言，海外社群也长期使用；现代书面语主要有东亚美尼亚语和西亚美尼亚语两种标准。",
    facts: {
      family: "印欧语系 · 亚美尼亚语支",
      region: "亚美尼亚及海外亚美尼亚社群",
      script: "亚美尼亚字母 · 本应用收录 39 项"
    },
    writingNote: "亚美尼亚字母有大小写。现代教学中常把 ու 和 և 作为独立项目排列；传统正字法与改革正字法存在差别，字母计数也可能因口径不同而变化。",
    history: [
      {
        period: "约 405 年",
        title: "马什托茨创制字母",
        description: "梅斯罗普·马什托茨创制最初的 36 个字母，为翻译、教育和古典亚美尼亚语文学的发展提供基础。"
      },
      {
        period: "中世纪",
        title: "文字持续扩充",
        description: "օ 和 ֆ 等字母在后来的使用中加入，书体也逐步发展为多种抄写与印刷传统。"
      },
      {
        period: "19—20 世纪",
        title: "现代标准与正字法分化",
        description: "东、西两种现代书面标准逐渐发展；20 世纪的正字法改革又使部分社群采用不同拼写传统。"
      }
    ],
    tip: "先成对认识大小写，注意 ու 是由两个字符组成的字母项目。本应用的真人录音采用东亚美尼亚语，西部标准的部分辅音读法有所不同。",
    sources: [
      {
        label: "Yerevan State University · Eastern Armenian",
        url: "https://lib.armedu.am/files/resource/files/2023-01-26/6ea102f4eca086199c186f54c1aecfc3.pdf"
      },
      {
        label: "Armenian script history · Scholarly reference",
        url: "https://arar.sci.am/Content/276462/191-.pdf"
      },
      {
        label: "Armenian alphabet · Orthography and references",
        url: "https://en.wikipedia.org/wiki/Armenian_alphabet"
      }
    ]
  },
  ka: {
    nativeName: "ქართული",
    summary: "格鲁吉亚语属于卡特维尔语系，是格鲁吉亚的主要公共生活语言。它拥有独立的书写传统，辅音组合丰富，动词形式能表达多层语法信息。",
    facts: {
      family: "卡特维尔语系",
      region: "格鲁吉亚及海外格鲁吉亚社群",
      script: "现代骑士体 · 33 个字母"
    },
    writingNote: "现代常用的骑士体（Mkhedruli）包含 33 个字母，基本按语音拼写。日常文字使用单一套字形；排版中也会见到 Mtavruli 大写形式。本应用展示常用骑士体。",
    history: [
      {
        period: "5 世纪",
        title: "早期文字记录",
        description: "现存早期格鲁吉亚语铭文可追溯到 5 世纪，古老的圆体字母见证了书写传统的形成。"
      },
      {
        period: "中世纪",
        title: "三种书体演进",
        description: "圆体、教会小写体和骑士体在不同阶段发展，并分别延续于宗教、文化和日常书写之中。"
      },
      {
        period: "2016 年",
        title: "书写文化列入非遗",
        description: "格鲁吉亚字母三种书写体系的活态文化列入联合国教科文组织人类非物质文化遗产代表作名录。"
      }
    ],
    tip: "先把字母与录音逐个对应，再区分送气音、浊音和挤喉音。遇到连续辅音时放慢分解练习，不要自行插入元音。",
    sources: [
      {
        label: "UNESCO · Three Georgian writing systems",
        url: "https://ich.unesco.org/en/RL/living-culture-of-three-writing-systems-of-the-georgian-alphabet-01205"
      },
      {
        label: "Malmö scholars · The Georgian script",
        url: "https://georgian.se/kartuli/GeoGrammar/Script/IntrScr2.html"
      },
      {
        label: "Georgian language · Overview and references",
        url: "https://en.wikipedia.org/wiki/Georgian_language"
      }
    ]
  },
  ko: {
    nativeName: "한국어",
    summary: "韩语属于朝鲜语系，主要在朝鲜半岛及海外社群中使用。它通常把谓语放在句末，用词尾变化和敬语表达时间、语气以及人际关系。",
    facts: {
      family: "朝鲜语系",
      region: "朝鲜半岛及海外韩语社群",
      script: "谚文 · 24 个基本字母"
    },
    writingNote: "谚文是字母文字，字母按音节组合成方块，而不是沿直线逐个排列。例如 한 由 ㅎ、ㅏ、ㄴ 组成。本应用列出 19 个辅音和 21 个元音，共 40 项，包含双辅音和复合元音。",
    history: [
      {
        period: "15 世纪以前",
        title: "汉字与借字书写",
        description: "正式书面活动长期使用汉文，也发展出借用汉字记录本地语言的方式，但学习门槛较高。"
      },
      {
        period: "1443 年",
        title: "世宗创制新文字",
        description: "世宗创制用于记录本地语言的新文字，最初有 28 个字母，旨在让更多人能够读写。"
      },
      {
        period: "1446 年至今",
        title: "公布与逐步普及",
        description: "《训民正音》公布并解释造字原理。经过长期传播与近现代规范化，谚文成为日常教育、出版和数字交流的主要文字。"
      }
    ],
    tip: "先认基本辅音和元音，再练习组装音节。辅音名称与词中的发音用途不同；本应用辅音录音保留名称和发音示范，后续还需结合收音与音变练习。",
    sources: [
      {
        label: "National Institute of Korean Language · Hangeul origins",
        url: "https://www.korean.go.kr/hangeul/origin/001.html"
      },
      {
        label: "National Archives of Korea · Hangeul",
        url: "https://theme.archives.go.kr/next/koreaOfRecord/hangul.do"
      },
      {
        label: "Korean language · Overview and references",
        url: "https://en.wikipedia.org/wiki/Korean_language"
      }
    ]
  },
  vi: {
    nativeName: "Tiếng Việt",
    summary: "越南语属于南亚语系，主要在越南及海外社群中使用。声调和元音的区别会改变词义。",
    facts: {
      family: "南亚语系 · 越语支",
      region: "越南及海外越南语社群",
      script: "国语字 · 29 个字母"
    },
    writingNote: "ă、â、đ、ê、ô、ơ、ư 是独立字母。声调另用五种符号标记，无标记也是一种声调；不要把声调变体当作新字母。",
    toneGuide: {
      introduction: "越南语有六个书写声调：一个无标记，五个用符号标在元音上。声调会改变词义。以下以北部常见读法为参考，各地区的音高和发声方式会有差异。",
      tones: [
        {
          name: "ngang",
          sample: "a · ba",
          meaning: "三",
          description: "无标记。音高居中或略高，单独读时通常较平稳。"
        },
        {
          name: "huyền",
          sample: "à · và",
          meaning: "和",
          description: "左斜符号。音高较低，轻缓下降，常带一点气声。"
        },
        {
          name: "sắc",
          sample: "á · cá",
          meaning: "鱼",
          description: "右斜符号。音高向上升，发音较紧。"
        },
        {
          name: "hỏi",
          sample: "ả · cả",
          meaning: "年长的；大的",
          description: "上方钩号。音高先向中低处降，单独读时末尾常回升。"
        },
        {
          name: "ngã",
          sample: "ã · đã",
          meaning: "表示过去",
          description: "上方波浪号。音高上升，中间常有喉部收紧或短暂中断。"
        },
        {
          name: "nặng",
          sample: "ạ · mạ",
          meaning: "稻秧",
          description: "下方圆点。音高较低并急降，发音短促，收尾常有喉部收紧。"
        }
      ],
      note: "先认字母，再认声调：ắ 是 ă 加 sắc，ầ 是 â 加 huyền，ợ 是 ơ 加 nặng。字母符号决定元音，声调符号决定声调；同一个元音上可以同时出现两种符号。练习时结合词语听辨，不要直接套用普通话四声。"
    },
    history: [
      {
        period: "早期书写传统",
        title: "汉文与字喃",
        description: "汉文长期用于正式文书，字喃则借用和改造汉字来记录越南语。"
      },
      {
        period: "17 世纪",
        title: "拉丁字母记音发展",
        description: "传教士与本地使用者参与发展拉丁字母记音；1651 年出版的越葡拉词典留下重要记录。"
      },
      {
        period: "19—20 世纪",
        title: "国语字逐步普及",
        description: "报刊、教育与文学推动国语字传播，逐渐形成今天通行的书写体系。"
      }
    ],
    tip: "先区分 a、ă、â 和 o、ô、ơ，再结合短词练习声调。字母名称不等于词中的实际发音，不同地区的读法也有差异。",
    sources: [
      {
        label: "NIU SEAsite · Vietnamese alphabet",
        url: "https://seasite.niu.edu/vietnamese/Guide_to_Pronunciation/alphabet/alphabet_table.htm"
      },
      {
        label: "NIU SEAsite · Vietnamese tones",
        url: "https://seasite.niu.edu/vietnamese/Guide_to_Pronunciation/tone_table.htm"
      },
      {
        label: "Donny Trương · Vietnamese Typography",
        url: "https://vietnamesetypography.com/alphabet/"
      },
      {
        label: "Donny Trương · History of Quốc ngữ",
        url: "https://vietnamesetypography.com/history/"
      },
      {
        label: "Languages · Austroasiatic components of Vietnamese",
        url: "https://www.mdpi.com/2226-471X/9/12/377"
      }
    ]
  }
};
const _hoisted_1$1 = ["aria-label"];
const _hoisted_2$1 = { class: "introduction-header" };
const _hoisted_3$1 = { class: "eyebrow" };
const _hoisted_4$1 = ["lang"];
const _hoisted_5$1 = { class: "introduction-facts" };
const _hoisted_6$1 = { class: "introduction-section" };
const _hoisted_7$1 = {
  key: 0,
  class: "introduction-section introduction-tones"
};
const _hoisted_8$1 = { class: "introduction-tone-list" };
const _hoisted_9$1 = { lang: "vi" };
const _hoisted_10$1 = { class: "introduction-tone-example" };
const _hoisted_11$1 = { lang: "vi" };
const _hoisted_12$1 = { class: "introduction-section" };
const _hoisted_13$1 = { class: "introduction-timeline" };
const _hoisted_14$1 = { class: "introduction-period" };
const _hoisted_15$1 = { class: "introduction-tip" };
const _hoisted_16$1 = { class: "introduction-section introduction-sources" };
const _hoisted_17$1 = ["href"];
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "LanguageIntroduction",
  props: {
    language: {}
  },
  setup(__props) {
    const props = __props;
    const { t } = useAppI18n();
    const introduction = computed(() => introductions[props.language]);
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("article", {
        class: "language-introduction",
        "aria-label": unref(t)("语言概况")
      }, [
        createBaseVNode("header", _hoisted_2$1, [
          createBaseVNode("span", _hoisted_3$1, toDisplayString(unref(t)("语言概况")), 1),
          createBaseVNode("h1", { lang: __props.language }, toDisplayString(introduction.value.nativeName), 9, _hoisted_4$1),
          createBaseVNode("p", null, toDisplayString(unref(t)(introduction.value.summary)), 1)
        ]),
        createBaseVNode("dl", _hoisted_5$1, [
          (openBlock(true), createElementBlock(Fragment, null, renderList(introduction.value.facts, (value, key) => {
            return openBlock(), createElementBlock("div", { key }, [
              createBaseVNode("dt", null, toDisplayString(unref(t)({ family: "语系", region: "主要使用地区", script: "文字系统" }[key])), 1),
              createBaseVNode("dd", null, toDisplayString(unref(t)(value)), 1)
            ]);
          }), 128))
        ]),
        createBaseVNode("section", _hoisted_6$1, [
          createBaseVNode("h2", null, toDisplayString(unref(t)("文字与读音")), 1),
          createBaseVNode("p", null, toDisplayString(unref(t)(introduction.value.writingNote)), 1)
        ]),
        introduction.value.toneGuide ? (openBlock(), createElementBlock("section", _hoisted_7$1, [
          createBaseVNode("h2", null, toDisplayString(unref(t)("六个声调")), 1),
          createBaseVNode("p", null, toDisplayString(unref(t)(introduction.value.toneGuide.introduction)), 1),
          createBaseVNode("dl", _hoisted_8$1, [
            (openBlock(true), createElementBlock(Fragment, null, renderList(introduction.value.toneGuide.tones, (tone) => {
              return openBlock(), createElementBlock("div", {
                key: tone.name
              }, [
                createBaseVNode("dt", _hoisted_9$1, toDisplayString(tone.name), 1),
                createBaseVNode("dd", null, [
                  createBaseVNode("p", _hoisted_10$1, [
                    createBaseVNode("span", _hoisted_11$1, toDisplayString(tone.sample), 1),
                    createTextVNode(" — " + toDisplayString(unref(t)(tone.meaning)), 1)
                  ]),
                  createBaseVNode("p", null, toDisplayString(unref(t)(tone.description)), 1)
                ])
              ]);
            }), 128))
          ]),
          createBaseVNode("p", null, toDisplayString(unref(t)(introduction.value.toneGuide.note)), 1)
        ])) : createCommentVNode("", true),
        createBaseVNode("section", _hoisted_12$1, [
          createBaseVNode("h2", null, toDisplayString(unref(t)("发展历史")), 1),
          createBaseVNode("ol", _hoisted_13$1, [
            (openBlock(true), createElementBlock(Fragment, null, renderList(introduction.value.history, (event) => {
              return openBlock(), createElementBlock("li", {
                key: event.period
              }, [
                createBaseVNode("span", _hoisted_14$1, toDisplayString(unref(t)(event.period)), 1),
                createBaseVNode("h3", null, toDisplayString(unref(t)(event.title)), 1),
                createBaseVNode("p", null, toDisplayString(unref(t)(event.description)), 1)
              ]);
            }), 128))
          ])
        ]),
        createBaseVNode("aside", _hoisted_15$1, [
          createBaseVNode("h2", null, toDisplayString(unref(t)("学习提示")), 1),
          createBaseVNode("p", null, toDisplayString(unref(t)(introduction.value.tip)), 1)
        ]),
        createBaseVNode("section", _hoisted_16$1, [
          createBaseVNode("h2", null, toDisplayString(unref(t)("资料来源")), 1),
          createBaseVNode("ul", null, [
            (openBlock(true), createElementBlock(Fragment, null, renderList(introduction.value.sources, (source) => {
              return openBlock(), createElementBlock("li", {
                key: source.url
              }, [
                createBaseVNode("a", {
                  href: source.url,
                  target: "_blank",
                  rel: "noopener noreferrer"
                }, toDisplayString(source.label), 9, _hoisted_17$1)
              ]);
            }), 128))
          ])
        ])
      ], 8, _hoisted_1$1);
    };
  }
});
const emptyProgress = () => ({
  lastGroups: {},
  language: "ru",
  tab: "study",
  learned: [],
  cursors: {},
  drafts: {}
});
const store = moduleStorage("alphi");
const known = new Map(glyphs.map((g) => [g.id, g]));
const knownLanguages = new Set(languages.map((language) => language.id));
function validInk(value) {
  return Array.isArray(value) && value.length <= 128 && value.every(
    (s) => Array.isArray(s) && s.length <= 2048 && s.every(
      (p2) => p2 && Number.isFinite(p2.x) && Number.isFinite(p2.y) && p2.x >= 0 && p2.x <= 1 && p2.y >= 0 && p2.y <= 1
    )
  );
}
function validFeedback(v) {
  return v === null || v && Number.isFinite(v.score) && v.score >= 0 && v.score <= 100 && typeof v.correct === "boolean" && ["match", "different", "uncertain"].includes(v.status) && typeof v.feedback === "string";
}
function validDrawing(v) {
  return v === void 0 || typeof v === "string" && v.length < 2e6;
}
async function loadProgress() {
  const p2 = await store.get("progress");
  if (!p2) return emptyProgress();
  const invalid = () => {
    throw new Error("学习进度格式异常，原始记录已保留。");
  };
  if (!p2.lastGroups || Array.isArray(p2.lastGroups) || typeof p2.lastGroups !== "object" || !knownLanguages.has(p2.language) || !["study", "tests", "letters", "about"].includes(p2.tab) || !Array.isArray(p2.learned) || !p2.learned.every((id) => known.has(id)) || !p2.cursors || !p2.drafts)
    return invalid();
  for (const [lang, group] of Object.entries(p2.lastGroups))
    if (!knownLanguages.has(lang) || !groups(lang).some((g) => g.id === group))
      return invalid();
  for (const [key, c] of Object.entries(p2.cursors)) {
    const g = known.get(c?.id);
    if (!g || key !== `${g.language}:mixed` || !["observe", "trace", "write"].includes(c.stage) || !validInk(c.strokes) || !validDrawing(c.drawing) || !validFeedback(c.feedback))
      return invalid();
  }
  for (const [lang, d] of Object.entries(p2.drafts)) {
    if (!knownLanguages.has(lang) || !d || typeof d.id !== "string" || !groups(lang).some((g) => g.id === d.group) || !Array.isArray(d.questions) || d.questions.length !== 10 || !Number.isInteger(d.index) || d.index < 0 || d.index > 9 || !Array.isArray(d.answers) || d.answers.length !== d.index || !validInk(d.strokes) || !validDrawing(d.drawing) || !validFeedback(d.feedback))
      return invalid();
    if (!d.questions.every(
      (q, i) => known.get(q.glyph?.id)?.language === lang && (d.group === "mixed" || known.get(q.glyph.id)?.group === d.group) && q.type === (i % 2 ? "choice" : "write") && Array.isArray(q.options) && (q.type === "write" ? q.options.length === 0 : q.options.length === 4 && new Set(q.options.map((g) => g.id)).size === 4 && q.options.some((g) => g.id === q.glyph.id)) && q.options.every((g) => known.get(g.id)?.language === lang)
    ))
      return invalid();
    if (!d.answers.every(
      (a, i) => validAnswer(a) && a.id === d.questions[i].glyph.id && a.type === d.questions[i].type && Number.isFinite(a.score) && a.score >= 0 && a.score <= 100 && typeof a.correct === "boolean" && typeof a.status === "string"
    ))
      return invalid();
    if (d.selected !== null && !d.questions[d.index].options.some((g) => g.id === d.selected))
      return invalid();
    d.questions = d.questions.map((q) => ({
      ...q,
      glyph: known.get(q.glyph.id),
      options: q.options.map((g) => known.get(g.id))
    }));
  }
  return p2;
}
let queue = Promise.resolve();
function saveProgress(p2) {
  const snapshot = JSON.parse(JSON.stringify(p2));
  const write = queue.catch(() => {
  }).then(() => store.set("progress", snapshot));
  queue = write;
  return write;
}
const _hoisted_1 = ["aria-label", "inert"];
const _hoisted_2 = ["aria-label", "disabled"];
const _hoisted_3 = {
  key: 0,
  class: "title-actions"
};
const _hoisted_4 = ["disabled"];
const _hoisted_5 = ["aria-label", "value", "disabled"];
const _hoisted_6 = ["value"];
const _hoisted_7 = ["inert"];
const _hoisted_8 = {
  key: 0,
  class: "loading"
};
const _hoisted_9 = {
  key: 1,
  role: "alert",
  class: "error"
};
const _hoisted_10 = ["disabled"];
const _hoisted_11 = {
  key: 2,
  role: "status",
  class: "notice"
};
const _hoisted_12 = { class: "study-card" };
const _hoisted_13 = { class: "eyebrow" };
const _hoisted_14 = { class: "progress-track" };
const _hoisted_15 = { class: "paired-glyphs" };
const _hoisted_16 = { class: "study-actions" };
const _hoisted_17 = ["aria-label"];
const _hoisted_18 = { class: "fine-print" };
const _hoisted_19 = { class: "tab-intro" };
const _hoisted_20 = ["aria-label"];
const _hoisted_21 = { class: "progress-grid" };
const _hoisted_22 = ["aria-label", "onClick"];
const _hoisted_23 = { class: "progress-letter" };
const _hoisted_24 = { class: "tab-intro" };
const _hoisted_25 = { class: "eyebrow" };
const _hoisted_26 = {
  key: 0,
  class: "segments"
};
const _hoisted_27 = ["onClick"];
const _hoisted_28 = { class: "test-entry" };
const _hoisted_29 = ["aria-label"];
const _hoisted_30 = { value: "learned" };
const _hoisted_31 = { value: "all" };
const _hoisted_32 = { key: 0 };
const _hoisted_33 = { key: 1 };
const _hoisted_34 = ["disabled"];
const _hoisted_35 = { class: "test-stats" };
const _hoisted_36 = { class: "section-heading" };
const _hoisted_37 = {
  key: 1,
  class: "empty-state"
};
const _hoisted_38 = { class: "review-list" };
const _hoisted_39 = ["onClick"];
const _hoisted_40 = {
  key: 0,
  class: "segments"
};
const _hoisted_41 = ["onClick"];
const _hoisted_42 = { class: "section-heading" };
const _hoisted_43 = {
  key: 0,
  class: "handwriting-toggle"
};
const _hoisted_44 = {
  key: 0,
  class: "kana-empty",
  "aria-hidden": "true"
};
const _hoisted_45 = ["onClick", "disabled", "aria-label"];
const _hoisted_46 = {
  key: 0,
  class: "print-small"
};
const _hoisted_47 = { class: "paired-glyphs" };
const _hoisted_48 = {
  key: 1,
  class: "library-print-glyph"
};
const _hoisted_49 = { key: 1 };
const _hoisted_50 = {
  key: 0,
  class: "exercise-heading"
};
const _hoisted_51 = { class: "eyebrow" };
const _hoisted_52 = {
  key: 0,
  class: "question-counter"
};
const _hoisted_53 = {
  key: 1,
  class: "progress-track"
};
const _hoisted_54 = {
  key: 0,
  class: "reference-panel"
};
const _hoisted_55 = { class: "letter-examples" };
const _hoisted_56 = { class: "printed-example" };
const _hoisted_57 = { class: "eyebrow" };
const _hoisted_58 = { class: "print-glyph" };
const _hoisted_59 = {
  key: 0,
  class: "handwritten-example"
};
const _hoisted_60 = { class: "eyebrow" };
const _hoisted_61 = { class: "reference-glyph" };
const _hoisted_62 = { key: 0 };
const _hoisted_63 = { class: "work-panel" };
const _hoisted_64 = { class: "section-heading" };
const _hoisted_65 = { key: 1 };
const _hoisted_66 = {
  key: 0,
  class: "practice-toolbar"
};
const _hoisted_67 = ["aria-label"];
const _hoisted_68 = ["aria-pressed", "disabled"];
const _hoisted_69 = ["aria-pressed", "disabled"];
const _hoisted_70 = ["aria-label"];
const _hoisted_71 = ["disabled", "aria-pressed", "onClick"];
const _hoisted_72 = {
  key: 1,
  class: "choice-grid"
};
const _hoisted_73 = ["onClick", "disabled", "aria-label"];
const _hoisted_74 = { class: "feedback-top" };
const _hoisted_75 = { key: 0 };
const _hoisted_76 = { key: 0 };
const _hoisted_77 = {
  key: 0,
  class: "comparison"
};
const _hoisted_78 = ["src"];
const _hoisted_79 = ["src"];
const _hoisted_80 = {
  key: 2,
  class: "correct-answer"
};
const _hoisted_81 = {
  key: 3,
  class: "feedback-actions"
};
const _hoisted_82 = ["disabled"];
const _hoisted_83 = ["disabled"];
const _hoisted_84 = {
  key: 4,
  class: "feedback-actions"
};
const _hoisted_85 = ["disabled"];
const _hoisted_86 = ["disabled"];
const _hoisted_87 = ["disabled"];
const _hoisted_88 = {
  key: 4,
  class: "fine-print"
};
const _hoisted_89 = { class: "summary-hero" };
const _hoisted_90 = { class: "summary-stats" };
const _hoisted_91 = { class: "summary-actions" };
const _hoisted_92 = { class: "section-heading" };
const _hoisted_93 = { class: "review-list" };
const _hoisted_94 = ["onClick"];
const _hoisted_95 = { key: 0 };
const _hoisted_96 = ["aria-label", "inert"];
const _hoisted_97 = ["aria-current", "disabled", "onClick"];
const _hoisted_98 = {
  viewBox: "0 0 24 24",
  "aria-hidden": "true"
};
const _hoisted_99 = ["d"];
const _hoisted_100 = ["aria-label"];
const _hoisted_101 = { class: "letter-dialog-header" };
const _hoisted_102 = {
  key: 0,
  class: "writing-sheet-handle",
  "aria-hidden": "true"
};
const _hoisted_103 = ["aria-label"];
const _hoisted_104 = { class: "letter-dialog-content" };
const _hoisted_105 = { class: "eyebrow" };
const _hoisted_106 = { class: "order-example" };
const _hoisted_107 = ["src"];
const _hoisted_108 = { key: 1 };
const _hoisted_109 = { key: 1 };
const _hoisted_110 = { class: "writing-sheet-toolbar" };
const _hoisted_111 = ["aria-label"];
const _hoisted_112 = ["aria-pressed", "onClick"];
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "App",
  setup(__props) {
    const { t, locale: locale2 } = useAppI18n();
    const progress = /* @__PURE__ */ ref(emptyProgress());
    const progressWritable = /* @__PURE__ */ ref(false);
    const tab = /* @__PURE__ */ ref("study");
    const libraryHandwriting = /* @__PURE__ */ ref(false);
    const learnParent = /* @__PURE__ */ ref("home");
    const detail = /* @__PURE__ */ ref(null);
    const reviewAnswer = /* @__PURE__ */ ref(null);
    function variants(current) {
      if (current.language === "hy") {
        return glyphs.filter((g) => g.language === "hy" && g.name === current.name).slice().reverse();
      }
      if (current.language === "ja") {
        return glyphs.filter((g) => g.language === "ja" && g.name === current.name);
      }
      return [current.text.toUpperCase(), current.text.toLowerCase()].map((text) => glyphs.find((g) => g.language === current.language && g.text === text)).filter((g) => !!g);
    }
    const detailCases = computed(() => detail.value ? variants(detail.value) : []);
    const variantLabel = (g) => ({ upper: "大写", lower: "小写", hiragana: "平假名", katakana: "片假名", mixed: "" })[g.group];
    const sequential = /* @__PURE__ */ ref(false);
    const stage = /* @__PURE__ */ ref("observe");
    const currentInk = /* @__PURE__ */ ref([]);
    const currentDrawing = /* @__PURE__ */ ref();
    const testScope = /* @__PURE__ */ ref("learned");
    const cursorKey = computed(() => `${language.value}:mixed`);
    const learned = computed(() => new Set(progress.value.learned));
    const learnedPool = computed(() => pool.value.filter(letterLearned));
    const cursor = computed(() => progress.value.cursors[cursorKey.value]);
    const nextStudy = computed(
      () => studyPool.value.find((g) => g.id === cursor.value?.id && !learned.value.has(g.id)) ?? studyPool.value.find((g) => !learned.value.has(g.id)) ?? studyPool.value[0]
    );
    const languageRounds = computed(
      () => history.value.rounds.filter((r) => glyphs.find((g) => g.id === r.answers[0]?.id)?.language === language.value).slice().reverse()
    );
    const totalScore = (record) => Math.round(record.answers.reduce((sum, a) => sum + a.score, 0) / record.answers.length);
    async function persistProgress() {
      if (!progressWritable.value) return;
      progress.value.lastGroups[language.value] = group.value;
      progress.value.language = language.value;
      progress.value.tab = tab.value;
      try {
        await saveProgress(progress.value);
      } catch (e) {
        notice.value = `进度保存失败：${message(e)}`;
      }
    }
    function capture() {
      if (page.value === "learn" && sequential.value) {
        progress.value.cursors[cursorKey.value] = {
          id: activeID.value,
          stage: stage.value,
          strokes: currentInk.value,
          drawing: currentDrawing.value,
          feedback: feedback.value
        };
      }
      if (page.value === "test") {
        progress.value.drafts[language.value] = {
          id: roundID.value,
          group: group.value,
          questions: round.value,
          answers: answers.value,
          index: questionIndex.value,
          strokes: currentInk.value,
          drawing: currentDrawing.value,
          feedback: feedback.value,
          selected: selected.value
        };
      }
    }
    function inkChanged(strokes2, drawing) {
      if (busy.value || feedback.value) return;
      currentInk.value = strokes2;
      currentDrawing.value = drawing;
      if (page.value === "learn") feedback.value = null;
      capture();
      void persistProgress();
    }
    function switchTab(value) {
      if (busy.value) return;
      capture();
      if (!supportsWriting(language.value) && (value === "study" || value === "tests"))
        value = "letters";
      tab.value = value;
      detail.value = null;
      page.value = value === "study" ? "home" : value === "tests" ? "test-home" : value === "about" ? "about" : "library";
      resetFeedback();
      void persistProgress();
    }
    function continueStudy(g = nextStudy.value) {
      const saved = cursor.value;
      sequential.value = g.id === nextStudy.value.id;
      learn(g, sequential.value);
      if (sequential.value && saved?.id === g.id) {
        stage.value = saved.stage === "observe" ? "trace" : saved.stage;
        tracing.value = stage.value === "trace";
        currentInk.value = saved.strokes;
        currentDrawing.value = saved.drawing;
        feedback.value = saved.feedback;
        if (saved.strokes.length) lastInk.value = raster(saved.strokes).toDataURL();
      }
      capture();
      void persistProgress();
    }
    function resumeRound() {
      const d = progress.value.drafts[language.value];
      if (!d) return;
      group.value = d.group;
      round.value = d.questions;
      answers.value = [...d.answers];
      roundID.value = d.id;
      questionIndex.value = d.index;
      resetFeedback();
      currentInk.value = d.strokes;
      currentDrawing.value = d.drawing;
      feedback.value = d.feedback;
      selected.value = d.selected;
      if (d.strokes.length) lastInk.value = raster(d.strokes).toDataURL();
      tab.value = "tests";
      tracing.value = false;
      page.value = "test";
    }
    const page = /* @__PURE__ */ ref("home");
    const isRootPage = computed(
      () => ["home", "library", "test-home", "about"].includes(page.value) && !detail.value && !reviewAnswer.value
    );
    watch(
      isRootPage,
      (isRoot) => {
        void setRootPage(isRoot).catch(() => {
        });
      },
      { immediate: true }
    );
    const pageTitle2 = computed(
      () => ({
        progress: "学习进度",
        learn: "字母学习",
        test: "字母测试",
        summary: "测试结果",
        history: "测试记录"
      })[page.value] ?? ""
    );
    const backLabel = computed(
      () => page.value === "progress" ? "返回学习首页" : page.value === "summary" ? "返回测试" : page.value === "test" ? "保存并返回测试" : "保存并返回"
    );
    function backPage() {
      if (busy.value) return;
      if (page.value === "progress") switchTab("study");
      else if (page.value === "summary") switchTab("tests");
      else leave();
    }
    const language = /* @__PURE__ */ ref("ru"), group = /* @__PURE__ */ ref("mixed");
    const activeID = /* @__PURE__ */ ref("ru-а"), tracing = /* @__PURE__ */ ref(false), overlay = /* @__PURE__ */ ref(false);
    const fontsReady = /* @__PURE__ */ ref(false), loading = /* @__PURE__ */ ref(true), busy = /* @__PURE__ */ ref(false), error = /* @__PURE__ */ ref(""), notice = /* @__PURE__ */ ref(""), historyWritable = /* @__PURE__ */ ref(false);
    const history = /* @__PURE__ */ ref({ practices: [], rounds: [] });
    const round = /* @__PURE__ */ ref([]), answers = /* @__PURE__ */ ref([]), questionIndex = /* @__PURE__ */ ref(0), roundID = /* @__PURE__ */ ref("");
    const feedback = /* @__PURE__ */ ref(null), selected = /* @__PURE__ */ ref(null), lastInk = /* @__PURE__ */ ref("");
    const pad = /* @__PURE__ */ ref();
    const pool = computed(
      () => poolFor(language.value, language.value === "ru" ? "mixed" : group.value)
    );
    const studyPool = computed(() => poolFor(language.value, "mixed"));
    const letterCards = computed(
      () => language.value === "ja" ? studyPool.value.filter((g) => g.group === "hiragana") : studyPool.value.filter((g) => g.group === "lower")
    );
    const libraryCards = computed(
      () => language.value === "ja" ? pool.value : language.value === "el" ? glyphs.filter((g) => g.language === "el" && g.group === "lower") : letterCards.value
    );
    function libraryPair(g) {
      return g.language === "hy" || g.language === "vi" ? variants(g) : g.language === "ja" ? [g] : g.language === "el" && g.text !== "ς" ? variants(g) : pair(g);
    }
    const libraryCells = computed(() => {
      if (language.value !== "ja") return libraryCards.value;
      const rows = [
        "a i u e o",
        "ka ki ku ke ko",
        "sa shi su se so",
        "ta chi tsu te to",
        "na ni nu ne no",
        "ha hi fu he ho",
        "ma mi mu me mo",
        "ya _ yu _ yo",
        "ra ri ru re ro",
        "wa _ _ _ wo",
        "n _ _ _ _"
      ];
      return rows.join(" ").split(" ").map((name) => libraryCards.value.find((g) => g.name === name) ?? null);
    });
    function pair(g) {
      if (g.language === "ja" || g.language === "el" && g.text !== "ς") return variants(g);
      return g.language === "ru" ? glyphs.filter(
        (item) => item.language === "ru" && item.text.toLowerCase() === g.text.toLowerCase()
      ).slice().reverse() : [g];
    }
    function letterLearned(g) {
      return pair(g).every((item) => learned.value.has(item.id));
    }
    const learnedLetters = computed(() => letterCards.value.filter(letterLearned).length);
    function studyLetter(g) {
      continueStudy(pair(g).find((item) => !learned.value.has(item.id)) ?? g);
    }
    function switchCase(g) {
      const mode = tracing.value;
      capture();
      if (g.language !== "ru" && group.value !== "mixed") group.value = g.group;
      learn(g, sequential.value);
      tracing.value = mode;
      stage.value = mode ? "trace" : "write";
      capture();
      void persistProgress();
    }
    function setPracticeMode(trace) {
      if (busy.value || tracing.value === trace) return;
      resetFeedback();
      tracing.value = trace;
      stage.value = trace ? "trace" : "write";
      capture();
      void persistProgress();
    }
    const active = computed(
      () => page.value === "test" ? round.value[questionIndex.value].glyph : glyphs.find((g) => g.id === activeID.value)
    );
    const question = computed(() => round.value[questionIndex.value]);
    const languageName = computed(() => languages.find((l) => l.id === language.value).name);
    const passedStudy = computed(
      () => new Set(
        history.value.practices.filter((practice) => !practice.tracing && practice.score >= 80).map((practice) => practice.id)
      )
    );
    const canAdvanceStudy = computed(
      () => pair(active.value).every((g) => passedStudy.value.has(g.id))
    );
    const stats = computed(() => summarize(answers.value));
    const reviewIDs = computed(() => {
      const outcomes = /* @__PURE__ */ new Map();
      const attempts = [
        ...history.value.practices.filter((p2) => !p2.tracing),
        ...history.value.rounds.flatMap((r) => r.answers.map((a) => ({ ...a, at: r.at })))
      ].sort((a, b) => a.at.localeCompare(b.at));
      attempts.forEach((a) => outcomes.set(a.id, a.correct));
      return [...outcomes].filter(([, correct]) => !correct).map(([id]) => id);
    });
    const masks = /* @__PURE__ */ new Map();
    function glyphMask(g) {
      if (!masks.has(g.id)) masks.set(g.id, mask(template(g)));
      return masks.get(g.id);
    }
    async function initialize() {
      loading.value = true;
      error.value = "";
      try {
        await loadFonts();
        fontsReady.value = true;
      } catch (e) {
        error.value = message(e);
      }
      try {
        history.value = await loadHistory();
        historyWritable.value = true;
        progress.value = await loadProgress();
        progress.value.learned = [
          .../* @__PURE__ */ new Set([
            ...progress.value.learned,
            ...history.value.practices.filter((p2) => !p2.tracing && p2.score >= 80).map((p2) => p2.id)
          ])
        ];
        for (const lang of ["ja", "ru", "el"])
          if (history.value.rounds.some((r) => r.id === progress.value.drafts[lang]?.id))
            delete progress.value.drafts[lang];
        language.value = progress.value.language;
        group.value = language.value === "ru" ? "mixed" : progress.value.lastGroups[language.value] ?? (language.value === "ja" ? "hiragana" : "lower");
        progressWritable.value = true;
        switchTab(progress.value.tab);
      } catch (e) {
        historyWritable.value = false;
        progressWritable.value = false;
        error.value = message(e);
      }
      loading.value = false;
    }
    function message(e) {
      return e instanceof Error ? e.message : "操作暂时失败，请重试。";
    }
    async function persist() {
      if (!historyWritable.value) {
        notice.value = "历史记录未成功读取，本次结果仅保留在当前页面。";
        return;
      }
      try {
        await saveHistory(history.value);
        notice.value = "";
      } catch (e) {
        notice.value = `记录保存失败：${message(e)}。请点击重试保存。`;
      }
    }
    function requestLanguage(event) {
      const select = event.target;
      const id = select.value;
      select.value = language.value;
      if (id === language.value || busy.value) return;
      chooseLanguage(id);
    }
    function chooseLanguage(id) {
      progress.value.lastGroups[language.value] = group.value;
      capture();
      resetFeedback();
      page.value = "home";
      language.value = id;
      libraryHandwriting.value = false;
      group.value = id === "ru" ? "mixed" : progress.value.lastGroups[id] ?? (id === "ja" ? "hiragana" : "lower");
      switchTab(tab.value);
    }
    function resetFeedback() {
      feedback.value = null;
      selected.value = null;
      lastInk.value = "";
      overlay.value = false;
      currentInk.value = [];
      currentDrawing.value = void 0;
    }
    function learn(g, inSequence = false) {
      if (["home", "progress", "library", "summary", "test-home"].includes(page.value))
        learnParent.value = page.value;
      sequential.value = inSequence;
      activeID.value = g.id;
      if (!inSequence && group.value !== "mixed") group.value = g.group;
      resetFeedback();
      stage.value = "trace";
      tracing.value = true;
      detail.value = null;
      page.value = "learn";
    }
    async function completeStudy() {
      if (busy.value || page.value !== "learn" || !canAdvanceStudy.value) return;
      const index = letterCards.value.findIndex(
        (g) => pair(g).some((item) => item.id === activeID.value)
      );
      for (const glyph of pair(active.value)) {
        if (!learned.value.has(glyph.id)) progress.value.learned.push(glyph.id);
      }
      const next = letterCards.value[index + 1];
      if (next) {
        learn(next, true);
        capture();
      } else {
        delete progress.value.cursors[cursorKey.value];
        sequential.value = false;
        switchTab("study");
      }
      busy.value = true;
      try {
        await persistProgress();
      } finally {
        busy.value = false;
      }
    }
    function startRound(review = false) {
      if (progress.value.drafts[language.value]) {
        resumeRound();
        return;
      }
      const targets = review || testScope.value === "all" ? pool.value : learnedPool.value;
      try {
        round.value = makeRound(targets, review ? reviewIDs.value : [], Math.random, pool.value);
      } catch (e) {
        notice.value = message(e);
        return;
      }
      answers.value = [];
      questionIndex.value = 0;
      roundID.value = createID();
      resetFeedback();
      tracing.value = false;
      tab.value = "tests";
      page.value = "test";
      capture();
      void persistProgress();
    }
    function leave() {
      if (page.value === "learn") {
        capture();
        page.value = learnParent.value;
        resetFeedback();
        void persistProgress();
        return;
      }
      switchTab(tab.value);
    }
    async function grade(strokes2) {
      if (busy.value || feedback.value) return;
      busy.value = true;
      error.value = "";
      await nextTick();
      await new Promise((r) => setTimeout(r, 30));
      try {
        const ink = raster(strokes2);
        lastInk.value = ink.toDataURL();
        feedback.value = assess(
          mask(ink),
          glyphMask(active.value),
          pool.value.filter((g) => g.group === active.value.group).map((g) => ({ id: g.id, mask: glyphMask(g) })),
          active.value.id
        );
        if (page.value === "learn") {
          history.value.practices.push({
            id: active.value.id,
            score: feedback.value.score,
            correct: feedback.value.correct,
            tracing: tracing.value,
            at: (/* @__PURE__ */ new Date()).toISOString()
          });
          history.value.practices = history.value.practices.slice(-500);
          if (!tracing.value && feedback.value.score >= 80 && !learned.value.has(active.value.id))
            progress.value.learned.push(active.value.id);
          await persist();
        }
        capture();
        await persistProgress();
      } catch (e) {
        error.value = message(e);
      } finally {
        busy.value = false;
      }
    }
    function choose(id) {
      if (feedback.value) return;
      selected.value = id;
      const correct = id === active.value.id;
      feedback.value = {
        score: correct ? 100 : 0,
        correct,
        status: correct ? "match" : "different",
        feedback: correct ? "选择正确，记住这个字形。" : "这不是对应的字形。下面是正确的手写范字。"
      };
      capture();
      void persistProgress();
    }
    async function advance(skip = false) {
      if (!feedback.value || busy.value) return;
      busy.value = true;
      answers.value.push({
        id: active.value.id,
        text: active.value.text,
        score: skip ? 0 : feedback.value.score,
        correct: skip ? false : feedback.value.correct,
        status: skip ? "skipped" : feedback.value.status,
        ...question.value.type === "write" ? { type: "write", strokes: currentInk.value } : { type: "choice", chosenID: selected.value }
      });
      if (questionIndex.value === 9) {
        history.value.rounds.push({
          id: roundID.value,
          language: languageName.value,
          group: group.value,
          at: (/* @__PURE__ */ new Date()).toISOString(),
          answers: [...answers.value]
        });
        history.value.rounds = history.value.rounds.slice(-50);
        await persist();
        delete progress.value.drafts[language.value];
        page.value = "summary";
      } else {
        questionIndex.value++;
        resetFeedback();
        await nextTick();
        pad.value?.clear();
      }
      capture();
      await persistProgress();
      busy.value = false;
    }
    function openRecord(record) {
      answers.value = record.answers;
      const first = glyphs.find((g) => g.id === record.answers[0]?.id);
      language.value = first.language;
      group.value = record.group;
      tab.value = "tests";
      page.value = "summary";
    }
    function retry() {
      resetFeedback();
      pad.value?.clear();
      capture();
      void persistProgress();
    }
    const scoreLabel = computed(
      () => feedback.value?.status === "match" ? "字形匹配" : feedback.value?.status === "different" ? "需要再练习" : "暂无法判断"
    );
    let previousFocus = null;
    watch(
      () => !!detail.value || !!reviewAnswer.value,
      async (open) => {
        if (open) {
          previousFocus = document.activeElement;
          document.body.style.overflow = "hidden";
          await nextTick();
          document.querySelector(".dialog-close")?.focus();
        } else {
          document.body.style.overflow = "";
          previousFocus?.focus();
        }
      }
    );
    watch(group, () => {
      if (!loading.value && ["home", "library", "test-home", "about"].includes(page.value))
        void persistProgress();
    });
    watch([page, activeID, questionIndex], async () => {
      await nextTick();
      window.scrollTo({ top: 0, behavior: "instant" });
    });
    watch(page, stopPronunciation);
    let removeFocusMode;
    onBeforeUnmount(() => {
      removeFocusMode?.();
      stopPronunciation();
      document.body.style.overflow = "";
    });
    onMounted(async () => {
      removeFocusMode = installFocusMode();
      await ready().catch(() => {
      });
      void loadPronunciations().catch(() => {
      });
      await initialize();
    });
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", {
        class: normalizeClass(["app-shell", { native: unref(isNative)() }])
      }, [
        createBaseVNode("nav", {
          class: normalizeClass(["page-tools", { "secondary-toolbar": pageTitle2.value, "lingrove-root-actions": !pageTitle2.value }]),
          "aria-label": unref(t)("页面工具"),
          inert: !!detail.value || !!reviewAnswer.value
        }, [
          pageTitle2.value ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
            createBaseVNode("button", {
              class: "page-back",
              "aria-label": unref(t)(backLabel.value),
              disabled: busy.value,
              onClick: backPage
            }, [..._cache[20] || (_cache[20] = [
              createBaseVNode("svg", {
                viewBox: "0 0 24 24",
                "aria-hidden": "true"
              }, [
                createBaseVNode("path", { d: "m15 5-7 7 7 7" })
              ], -1)
            ])], 8, _hoisted_2),
            createBaseVNode("h2", null, toDisplayString(unref(t)(pageTitle2.value)), 1),
            page.value === "learn" ? (openBlock(), createElementBlock("div", _hoisted_3, [
              canAdvanceStudy.value ? (openBlock(), createElementBlock("button", {
                key: 0,
                class: "next-letter",
                disabled: busy.value,
                onClick: completeStudy
              }, toDisplayString(unref(t)("下一个")), 9, _hoisted_4)) : createCommentVNode("", true),
              createBaseVNode("button", {
                class: "text-button writing-help",
                onClick: _cache[0] || (_cache[0] = ($event) => detail.value = active.value)
              }, toDisplayString(unref(t)("书写方法 ↗")), 1)
            ])) : createCommentVNode("", true)
          ], 64)) : createCommentVNode("", true),
          isRootPage.value ? (openBlock(), createElementBlock("select", {
            key: 1,
            class: "lingrove-language-select",
            "aria-label": unref(t)("练习语言"),
            value: language.value,
            disabled: busy.value || loading.value || !fontsReady.value,
            onChange: requestLanguage
          }, [
            (openBlock(true), createElementBlock(Fragment, null, renderList(unref(languages), (item) => {
              return openBlock(), createElementBlock("option", {
                key: item.id,
                value: item.id
              }, toDisplayString(unref(t)(item.name)), 9, _hoisted_6);
            }), 128))
          ], 40, _hoisted_5)) : createCommentVNode("", true)
        ], 10, _hoisted_1),
        createBaseVNode("main", {
          class: normalizeClass({ "learning-page": page.value === "learn" }),
          inert: !!detail.value || !!reviewAnswer.value
        }, [
          loading.value ? (openBlock(), createElementBlock("div", _hoisted_8, toDisplayString(unref(t)("正在准备离线字帖…")), 1)) : createCommentVNode("", true),
          error.value ? (openBlock(), createElementBlock("div", _hoisted_9, [
            createTextVNode(toDisplayString(unref(t)(error.value)) + " ", 1),
            createBaseVNode("button", {
              onClick: initialize,
              disabled: busy.value
            }, toDisplayString(unref(t)("重新加载资源")), 9, _hoisted_10)
          ])) : createCommentVNode("", true),
          notice.value ? (openBlock(), createElementBlock("div", _hoisted_11, [
            createTextVNode(toDisplayString(unref(t)(notice.value)) + " ", 1),
            historyWritable.value ? (openBlock(), createElementBlock("button", {
              key: 0,
              onClick: _cache[1] || (_cache[1] = ($event) => persist().then(persistProgress))
            }, toDisplayString(unref(t)("重试保存")), 1)) : createCommentVNode("", true)
          ])) : createCommentVNode("", true),
          !loading.value && fontsReady.value ? (openBlock(), createElementBlock(Fragment, { key: 3 }, [
            page.value === "about" ? (openBlock(), createBlock(_sfc_main$1, {
              key: 0,
              language: language.value
            }, null, 8, ["language"])) : page.value === "home" ? (openBlock(), createElementBlock(Fragment, { key: 1 }, [
              createBaseVNode("section", _hoisted_12, [
                createBaseVNode("div", null, [
                  createBaseVNode("span", _hoisted_13, toDisplayString(unref(t)(learnedLetters.value === letterCards.value.length ? "已完成全部学习" : "下一个未学字形")), 1),
                  createBaseVNode("h2", null, toDisplayString(unref(t)(nextStudy.value.name)), 1),
                  createBaseVNode("p", null, toDisplayString(unref(t)("已学习")) + " " + toDisplayString(unref(t)(learnedLetters.value)) + " / " + toDisplayString(unref(t)(letterCards.value.length)) + " " + toDisplayString(unref(t)("个字母")), 1),
                  createBaseVNode("div", _hoisted_14, [
                    createBaseVNode("i", {
                      style: normalizeStyle({ width: `${learnedLetters.value / letterCards.value.length * 100}%` })
                    }, null, 4)
                  ])
                ]),
                createBaseVNode("div", _hoisted_15, [
                  (openBlock(true), createElementBlock(Fragment, null, renderList(pair(nextStudy.value), (g) => {
                    return openBlock(), createBlock(_sfc_main$6, {
                      key: g.id,
                      glyph: g
                    }, null, 8, ["glyph"]);
                  }), 128))
                ]),
                createBaseVNode("div", _hoisted_16, [
                  createBaseVNode("button", {
                    onClick: _cache[2] || (_cache[2] = ($event) => page.value = "progress"),
                    "aria-label": unref(t)("查看学习进度")
                  }, toDisplayString(unref(t)("查看进度")), 9, _hoisted_17),
                  createBaseVNode("button", {
                    class: "primary",
                    onClick: _cache[3] || (_cache[3] = ($event) => continueStudy())
                  }, toDisplayString(unref(t)("继续学习 →")), 1)
                ])
              ]),
              createBaseVNode("p", _hoisted_18, toDisplayString(unref(t)("查看书写方法，临摹后切换测试并评分，记录学习进度。进度与笔迹自动保存。")), 1)
            ], 64)) : page.value === "progress" ? (openBlock(), createElementBlock(Fragment, { key: 2 }, [
              createBaseVNode("section", _hoisted_19, [
                createBaseVNode("p", null, toDisplayString(unref(t)("已学习")) + " " + toDisplayString(unref(t)(learnedLetters.value)) + " / " + toDisplayString(unref(t)(letterCards.value.length)) + " " + toDisplayString(unref(t)("个字母")), 1)
              ]),
              createBaseVNode("div", {
                class: "progress-track",
                "aria-label": unref(t)("学习进度")
              }, [
                createBaseVNode("i", {
                  style: normalizeStyle({ width: `${learnedLetters.value / letterCards.value.length * 100}%` })
                }, null, 4)
              ], 8, _hoisted_20),
              createBaseVNode("div", _hoisted_21, [
                (openBlock(true), createElementBlock(Fragment, null, renderList(letterCards.value, (g) => {
                  return openBlock(), createElementBlock("button", {
                    key: g.id,
                    class: normalizeClass({
                      learned: letterLearned(g),
                      current: pair(g).some((item) => item.id === nextStudy.value.id)
                    }),
                    "aria-label": unref(t)(
                      `${pair(g).map((item) => item.text).join(" · ")}，${letterLearned(g) ? "已学习" : "未学习"}`
                    ),
                    onClick: ($event) => studyLetter(g)
                  }, [
                    createBaseVNode("span", _hoisted_23, toDisplayString(pair(g).map((item) => item.text).join(" · ")), 1)
                  ], 10, _hoisted_22);
                }), 128))
              ])
            ], 64)) : page.value === "test-home" ? (openBlock(), createElementBlock(Fragment, { key: 3 }, [
              createBaseVNode("section", _hoisted_24, [
                createBaseVNode("span", _hoisted_25, toDisplayString(unref(t)("TEST / 检验进步")), 1),
                createBaseVNode("h1", null, toDisplayString(unref(t)("看看记住了多少。")), 1),
                createBaseVNode("p", null, toDisplayString(unref(t)(languageName.value)) + " " + toDisplayString(unref(t)("· 10 道题，书写和选择交替进行。")), 1)
              ]),
              language.value !== "ru" ? (openBlock(), createElementBlock("div", _hoisted_26, [
                (openBlock(true), createElementBlock(Fragment, null, renderList(unref(groups)(language.value), (item) => {
                  return openBlock(), createElementBlock("button", {
                    key: item.id,
                    class: normalizeClass({ active: group.value === item.id }),
                    onClick: ($event) => group.value = item.id
                  }, toDisplayString(unref(t)(item.name)), 11, _hoisted_27);
                }), 128))
              ])) : createCommentVNode("", true),
              createBaseVNode("section", _hoisted_28, [
                createBaseVNode("label", null, [
                  createTextVNode(toDisplayString(unref(t)("测试范围")) + " ", 1),
                  withDirectives(createBaseVNode("select", {
                    "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => testScope.value = $event),
                    "aria-label": unref(t)("测试范围")
                  }, [
                    createBaseVNode("option", _hoisted_30, toDisplayString(unref(t)("已学字母（")) + toDisplayString(unref(t)(learnedLetters.value)) + "）", 1),
                    createBaseVNode("option", _hoisted_31, toDisplayString(unref(t)("全部字母（")) + toDisplayString(unref(t)(letterCards.value.length)) + "）", 1)
                  ], 8, _hoisted_29), [
                    [vModelSelect, testScope.value]
                  ])
                ]),
                testScope.value === "learned" && !learnedPool.value.length ? (openBlock(), createElementBlock("p", _hoisted_32, toDisplayString(unref(t)("当前字母组还没有学习记录。先去学习，或选择全部字母测试。")), 1)) : testScope.value === "learned" && learnedPool.value.length < 10 ? (openBlock(), createElementBlock("p", _hoisted_33, toDisplayString(unref(t)("已学字母不足 10 个，本轮会重复抽取；选择题干扰项来自同组字母。")), 1)) : createCommentVNode("", true),
                progress.value.drafts[language.value] ? (openBlock(), createElementBlock("button", {
                  key: 2,
                  class: "primary",
                  onClick: resumeRound
                }, toDisplayString(unref(t)("继续本轮 · 第")) + " " + toDisplayString(unref(t)(progress.value.drafts[language.value].index + 1)) + " " + toDisplayString(unref(t)("/ 10 题 →")), 1)) : (openBlock(), createElementBlock("button", {
                  key: 3,
                  class: "primary",
                  disabled: testScope.value === "learned" && !learnedPool.value.length,
                  onClick: _cache[5] || (_cache[5] = ($event) => startRound())
                }, toDisplayString(unref(t)("开始测试 →")), 9, _hoisted_34))
              ]),
              createBaseVNode("div", _hoisted_35, [
                createBaseVNode("div", null, [
                  createBaseVNode("b", null, toDisplayString(unref(t)(languageRounds.value.length ? totalScore(languageRounds.value[0]) : "—")), 1),
                  createBaseVNode("span", null, toDisplayString(unref(t)("最近成绩")), 1)
                ]),
                createBaseVNode("div", null, [
                  createBaseVNode("b", null, toDisplayString(unref(t)(languageRounds.value.length ? Math.max(...languageRounds.value.map(totalScore)) : "—")), 1),
                  createBaseVNode("span", null, toDisplayString(unref(t)("最佳成绩")), 1)
                ]),
                createBaseVNode("div", null, [
                  createBaseVNode("b", null, toDisplayString(unref(t)(languageRounds.value.length)), 1),
                  createBaseVNode("span", null, toDisplayString(unref(t)("完成轮数")), 1)
                ])
              ]),
              createBaseVNode("div", _hoisted_36, [
                createBaseVNode("h2", null, toDisplayString(unref(t)("测试记录")), 1),
                createBaseVNode("span", null, toDisplayString(unref(t)("总分 / 100")), 1)
              ]),
              !languageRounds.value.length ? (openBlock(), createElementBlock("p", _hoisted_37, toDisplayString(unref(t)("还没有完成的测试。你的第一份成绩，会出现在这里。")), 1)) : createCommentVNode("", true),
              createBaseVNode("div", _hoisted_38, [
                (openBlock(true), createElementBlock(Fragment, null, renderList(languageRounds.value, (r) => {
                  return openBlock(), createElementBlock("button", {
                    key: r.id,
                    onClick: ($event) => openRecord(r)
                  }, [
                    createBaseVNode("span", null, [
                      createTextVNode(toDisplayString(unref(t)(new Date(r.at).toLocaleDateString(unref(locale2)))), 1),
                      createBaseVNode("small", null, toDisplayString(unref(t)(unref(groups)(language.value).find((g) => g.id === r.group)?.name)), 1)
                    ]),
                    createBaseVNode("span", null, [
                      createTextVNode(toDisplayString(unref(t)("书写")) + " " + toDisplayString(unref(t)(unref(summarize)(r.answers).writing)), 1),
                      createBaseVNode("small", null, toDisplayString(unref(t)("选择")) + " " + toDisplayString(unref(t)(unref(summarize)(r.answers).choices)) + "/5", 1)
                    ]),
                    createBaseVNode("strong", null, toDisplayString(unref(t)(totalScore(r))) + " " + toDisplayString(unref(t)("分")), 1),
                    _cache[21] || (_cache[21] = createBaseVNode("span", null, "↗", -1))
                  ], 8, _hoisted_39);
                }), 128))
              ])
            ], 64)) : page.value === "library" ? (openBlock(), createElementBlock(Fragment, { key: 4 }, [
              language.value === "ja" ? (openBlock(), createElementBlock("div", _hoisted_40, [
                (openBlock(true), createElementBlock(Fragment, null, renderList(unref(groups)(language.value), (item) => {
                  return openBlock(), createElementBlock("button", {
                    key: item.id,
                    class: normalizeClass({ active: group.value === item.id }),
                    onClick: ($event) => group.value = item.id
                  }, toDisplayString(unref(t)(item.name)), 11, _hoisted_41);
                }), 128))
              ])) : createCommentVNode("", true),
              createBaseVNode("div", _hoisted_42, [
                createBaseVNode("span", null, toDisplayString(unref(t)(language.value === "el" ? "24 个字母 · 含词尾 ς" : `${libraryCards.value.length} 个字母`)), 1),
                unref(supportsWriting)(language.value) ? (openBlock(), createElementBlock("label", _hoisted_43, [
                  withDirectives(createBaseVNode("input", {
                    "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => libraryHandwriting.value = $event),
                    type: "checkbox"
                  }, null, 512), [
                    [vModelCheckbox, libraryHandwriting.value]
                  ]),
                  createBaseVNode("span", null, toDisplayString(unref(t)("手写体")), 1)
                ])) : createCommentVNode("", true)
              ]),
              createBaseVNode("div", {
                class: normalizeClass(["glyph-grid", { "print-library": !libraryHandwriting.value, "armenian-library": language.value === "hy" }])
              }, [
                (openBlock(true), createElementBlock(Fragment, null, renderList(libraryCells.value, (g, index) => {
                  return openBlock(), createElementBlock(Fragment, {
                    key: g?.id ?? `empty-${index}`
                  }, [
                    !g ? (openBlock(), createElementBlock("span", _hoisted_44)) : (openBlock(), createElementBlock("div", {
                      key: 1,
                      class: normalizeClass(["letter-card", {
                        "greek-letter-card": language.value === "el" || !unref(supportsWriting)(language.value),
                        "russian-letter-card": language.value === "ru"
                      }])
                    }, [
                      createBaseVNode("button", {
                        class: normalizeClass(["glyph-card-open", { "reference-letter": !unref(supportsWriting)(language.value) }]),
                        onClick: ($event) => unref(supportsWriting)(language.value) ? detail.value = g : void 0,
                        disabled: !unref(supportsWriting)(language.value),
                        "aria-label": unref(supportsWriting)(language.value) ? unref(t)(`查看 ${g.name} 的书写说明`) : g.name
                      }, [
                        libraryHandwriting.value && language.value !== "ja" ? (openBlock(), createElementBlock("span", _hoisted_46, toDisplayString(pair(g).map((item) => item.text).join(" ")), 1)) : createCommentVNode("", true),
                        createBaseVNode("div", _hoisted_47, [
                          (openBlock(true), createElementBlock(Fragment, null, renderList(libraryPair(g), (item) => {
                            return openBlock(), createElementBlock(Fragment, {
                              key: item.id
                            }, [
                              libraryHandwriting.value ? (openBlock(), createBlock(_sfc_main$6, {
                                key: 0,
                                glyph: item
                              }, null, 8, ["glyph"])) : (openBlock(), createElementBlock("span", _hoisted_48, toDisplayString(item.text), 1))
                            ], 64);
                          }), 128))
                        ]),
                        language.value !== "ru" ? (openBlock(), createElementBlock("small", _hoisted_49, toDisplayString(unref(t)(language.value === "el" ? g.name.split(" · ")[0] : g.name)), 1)) : createCommentVNode("", true)
                      ], 10, _hoisted_45),
                      createVNode(_sfc_main$3, {
                        glyph: g,
                        compact: ""
                      }, null, 8, ["glyph"])
                    ], 2))
                  ], 64);
                }), 128))
              ], 2)
            ], 64)) : page.value === "learn" || page.value === "test" ? (openBlock(), createElementBlock(Fragment, { key: 5 }, [
              page.value === "test" ? (openBlock(), createElementBlock("div", _hoisted_50, [
                createBaseVNode("div", null, [
                  createBaseVNode("span", _hoisted_51, toDisplayString(unref(t)("PRACTICE / 小小测验")), 1),
                  createBaseVNode("h1", null, toDisplayString(unref(t)(question.value.type === "write" ? "写出对应的手写体" : "选出对应的手写体")), 1)
                ]),
                page.value === "test" ? (openBlock(), createElementBlock("span", _hoisted_52, [
                  createTextVNode(toDisplayString(unref(t)(questionIndex.value + 1)), 1),
                  _cache[22] || (_cache[22] = createBaseVNode("small", null, " / 10", -1))
                ])) : createCommentVNode("", true)
              ])) : createCommentVNode("", true),
              page.value === "test" ? (openBlock(), createElementBlock("div", _hoisted_53, [
                createBaseVNode("i", {
                  style: normalizeStyle({ width: `${questionIndex.value * 10}%` })
                }, null, 4)
              ])) : createCommentVNode("", true),
              createBaseVNode("div", {
                class: normalizeClass(["exercise-layout", { "study-layout": page.value === "learn" }])
              }, [
                page.value === "test" || tracing.value ? (openBlock(), createElementBlock("aside", _hoisted_54, [
                  createBaseVNode("div", _hoisted_55, [
                    createBaseVNode("div", _hoisted_56, [
                      createBaseVNode("span", _hoisted_57, toDisplayString(unref(t)(active.value.language === "ja" ? "题目字形" : "印刷体")), 1),
                      createBaseVNode("div", _hoisted_58, toDisplayString(page.value === "learn" && language.value === "ru" ? pair(active.value).map((g) => g.text).join(" ") : active.value.text), 1)
                    ]),
                    page.value === "learn" && tracing.value ? (openBlock(), createElementBlock("div", _hoisted_59, [
                      createBaseVNode("span", _hoisted_60, toDisplayString(unref(t)("手写体")), 1),
                      createBaseVNode("div", _hoisted_61, [
                        (openBlock(true), createElementBlock(Fragment, null, renderList(language.value === "ru" ? pair(active.value) : [active.value], (g) => {
                          return openBlock(), createBlock(_sfc_main$6, {
                            key: g.id,
                            glyph: g
                          }, null, 8, ["glyph"]);
                        }), 128))
                      ])
                    ])) : createCommentVNode("", true)
                  ]),
                  page.value === "test" ? (openBlock(), createElementBlock("p", _hoisted_62, toDisplayString(unref(t)(
                    question.value.type === "write" ? "观察印刷体，用手写体作答。" : "从右侧四个手写字形中选择。"
                  )), 1)) : createCommentVNode("", true)
                ])) : createCommentVNode("", true),
                createBaseVNode("section", _hoisted_63, [
                  page.value === "learn" || question.value.type === "write" ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
                    createBaseVNode("div", _hoisted_64, [
                      createBaseVNode("h2", null, toDisplayString(unref(t)(page.value === "learn" && tracing.value ? "沿着范字描摹" : "轮到你来写")), 1),
                      page.value === "learn" ? (openBlock(), createBlock(_sfc_main$3, {
                        key: active.value.id,
                        glyph: active.value
                      }, null, 8, ["glyph"])) : (openBlock(), createElementBlock("span", _hoisted_65, toDisplayString(unref(t)(busy.value ? "正在比对字形…" : "落笔 · 观察 · 再试一次")), 1))
                    ]),
                    page.value === "learn" ? (openBlock(), createElementBlock("div", _hoisted_66, [
                      createBaseVNode("div", {
                        class: "segments",
                        "aria-label": unref(t)("练习模式")
                      }, [
                        createBaseVNode("button", {
                          class: normalizeClass({ active: tracing.value }),
                          "aria-pressed": tracing.value,
                          disabled: busy.value,
                          onClick: _cache[7] || (_cache[7] = ($event) => setPracticeMode(true))
                        }, toDisplayString(unref(t)("临摹")), 11, _hoisted_68),
                        createBaseVNode("button", {
                          class: normalizeClass({ active: !tracing.value }),
                          "aria-pressed": !tracing.value,
                          disabled: busy.value,
                          onClick: _cache[8] || (_cache[8] = ($event) => setPracticeMode(false))
                        }, toDisplayString(unref(t)("测试")), 11, _hoisted_69)
                      ], 8, _hoisted_67),
                      variants(active.value).length > 1 ? (openBlock(), createElementBlock("div", {
                        key: 0,
                        class: "segments",
                        "aria-label": unref(t)(language.value === "ja" ? "书写假名" : "书写大小写")
                      }, [
                        (openBlock(true), createElementBlock(Fragment, null, renderList(variants(active.value), (g) => {
                          return openBlock(), createElementBlock("button", {
                            key: g.id,
                            disabled: busy.value,
                            class: normalizeClass({ active: active.value.id === g.id }),
                            "aria-pressed": active.value.id === g.id,
                            onClick: ($event) => switchCase(g)
                          }, toDisplayString(unref(t)(variantLabel(g))), 11, _hoisted_71);
                        }), 128))
                      ], 8, _hoisted_70)) : createCommentVNode("", true)
                    ])) : createCommentVNode("", true),
                    (openBlock(), createBlock(_sfc_main$5, {
                      ref_key: "pad",
                      ref: pad,
                      key: `${active.value.id}-${stage.value}-${tracing.value}-${questionIndex.value}`,
                      glyph: active.value,
                      "compact-tools": page.value === "learn",
                      "inline-actions": page.value === "learn",
                      tracing: page.value === "learn" && tracing.value,
                      "initial-strokes": currentInk.value,
                      "initial-drawing": currentDrawing.value,
                      disabled: busy.value || !!detail.value || !!feedback.value,
                      obscured: !!detail.value || !!reviewAnswer.value,
                      onSubmit: grade,
                      onInk: inkChanged
                    }, null, 8, ["glyph", "compact-tools", "inline-actions", "tracing", "initial-strokes", "initial-drawing", "disabled", "obscured"]))
                  ], 64)) : (openBlock(), createElementBlock("div", _hoisted_72, [
                    (openBlock(true), createElementBlock(Fragment, null, renderList(question.value.options, (option, i) => {
                      return openBlock(), createElementBlock("button", {
                        key: option.id,
                        onClick: ($event) => choose(option.id),
                        disabled: !!feedback.value,
                        class: normalizeClass({
                          chosen: selected.value === option.id,
                          correct: !!feedback.value && option.id === active.value.id,
                          incorrect: !!feedback.value && selected.value === option.id && !feedback.value.correct
                        }),
                        "aria-label": unref(t)(`选项 ${i + 1}`)
                      }, [
                        createBaseVNode("span", null, toDisplayString(unref(t)("ABCD"[i])), 1),
                        createVNode(_sfc_main$6, { glyph: option }, null, 8, ["glyph"])
                      ], 10, _hoisted_73);
                    }), 128))
                  ])),
                  feedback.value ? (openBlock(), createElementBlock("div", {
                    key: 2,
                    class: normalizeClass(["feedback", feedback.value.status]),
                    role: "status"
                  }, [
                    createBaseVNode("div", _hoisted_74, [
                      createBaseVNode("strong", null, toDisplayString(unref(t)(
                        page.value === "test" && question.value.type === "choice" ? feedback.value.correct ? "回答正确" : "再记一次" : scoreLabel.value
                      )), 1),
                      page.value === "learn" || question.value.type === "write" ? (openBlock(), createElementBlock("span", _hoisted_75, [
                        createBaseVNode("b", null, toDisplayString(unref(t)(feedback.value.score)), 1),
                        _cache[23] || (_cache[23] = createTextVNode(" / 100", -1))
                      ])) : createCommentVNode("", true)
                    ]),
                    createBaseVNode("p", null, toDisplayString(unref(t)(feedback.value.feedback)), 1),
                    page.value === "learn" || question.value.type === "write" ? (openBlock(), createElementBlock("small", _hoisted_76, toDisplayString(unref(t)(tracing.value && page.value === "learn" ? "描摹练习分" : "字形练习分")) + " " + toDisplayString(unref(t)("· 本地相似度估计，不代表笔顺或书法等级。")), 1)) : createCommentVNode("", true),
                    lastInk.value && !(page.value === "learn" && !tracing.value) ? (openBlock(), createElementBlock(Fragment, { key: 1 }, [
                      createBaseVNode("button", {
                        class: "text-button",
                        onClick: _cache[9] || (_cache[9] = ($event) => overlay.value = !overlay.value)
                      }, toDisplayString(unref(t)(overlay.value ? "收起对照" : "叠加对照范字")) + " ↗ ", 1),
                      overlay.value ? (openBlock(), createElementBlock("div", _hoisted_77, [
                        createBaseVNode("img", {
                          src: unref(template)(active.value).toDataURL(),
                          class: "model-ink",
                          alt: "浅色范字"
                        }, null, 8, _hoisted_78),
                        createBaseVNode("img", {
                          src: lastInk.value,
                          alt: "本次书写"
                        }, null, 8, _hoisted_79),
                        createBaseVNode("span", null, toDisplayString(unref(t)("浅色：范字 · 深色：你的书写")), 1)
                      ])) : createCommentVNode("", true)
                    ], 64)) : createCommentVNode("", true),
                    page.value === "test" && question.value.type === "choice" && !feedback.value.correct ? (openBlock(), createElementBlock("div", _hoisted_80, [
                      createBaseVNode("span", null, toDisplayString(unref(t)("正确范字")), 1),
                      createVNode(_sfc_main$6, { glyph: active.value }, null, 8, ["glyph"])
                    ])) : createCommentVNode("", true),
                    page.value === "learn" ? (openBlock(), createElementBlock("div", _hoisted_81, [
                      createBaseVNode("button", {
                        onClick: retry,
                        disabled: busy.value
                      }, toDisplayString(unref(t)("再写一次")), 9, _hoisted_82),
                      stage.value === "trace" ? (openBlock(), createElementBlock("button", {
                        key: 0,
                        class: "primary",
                        onClick: _cache[10] || (_cache[10] = ($event) => setPracticeMode(false)),
                        disabled: busy.value
                      }, toDisplayString(unref(t)("独立书写 →")), 9, _hoisted_83)) : createCommentVNode("", true)
                    ])) : feedback.value.status === "uncertain" ? (openBlock(), createElementBlock("div", _hoisted_84, [
                      createBaseVNode("button", { onClick: retry }, toDisplayString(unref(t)("重新书写")), 1),
                      createBaseVNode("button", {
                        onClick: _cache[11] || (_cache[11] = ($event) => advance(true)),
                        disabled: busy.value
                      }, toDisplayString(unref(t)("跳过此题（记 0 分）")), 9, _hoisted_85)
                    ])) : (openBlock(), createElementBlock("button", {
                      key: 5,
                      class: "primary wide",
                      onClick: _cache[12] || (_cache[12] = ($event) => advance()),
                      disabled: busy.value
                    }, toDisplayString(unref(t)(questionIndex.value === 9 ? "查看本轮结果" : "下一题 →")), 9, _hoisted_86))
                  ], 2)) : createCommentVNode("", true),
                  page.value === "learn" ? (openBlock(), createElementBlock("button", {
                    key: 3,
                    class: "primary wide complete-study",
                    disabled: busy.value || !canAdvanceStudy.value,
                    onClick: completeStudy
                  }, toDisplayString(unref(t)("下一个")), 9, _hoisted_87)) : createCommentVNode("", true),
                  page.value === "learn" && !canAdvanceStudy.value ? (openBlock(), createElementBlock("p", _hoisted_88, toDisplayString(unref(t)("当前组各写法的测试均需达到 80 分，临摹分数不计入。")), 1)) : createCommentVNode("", true)
                ])
              ], 2)
            ], 64)) : page.value === "summary" ? (openBlock(), createElementBlock(Fragment, { key: 6 }, [
              createBaseVNode("section", _hoisted_89, [
                _cache[24] || (_cache[24] = createBaseVNode("span", { class: "eyebrow" }, "ROUND COMPLETE", -1)),
                createBaseVNode("h1", null, toDisplayString(unref(t)("又熟悉了一点。")), 1),
                createBaseVNode("p", null, toDisplayString(unref(t)("十次小小的练习，都是留下的进步。")), 1),
                createBaseVNode("div", _hoisted_90, [
                  createBaseVNode("div", null, [
                    createBaseVNode("b", null, toDisplayString(unref(t)(stats.value.writing)), 1),
                    createBaseVNode("span", null, toDisplayString(unref(t)("书写平均分 / 100")), 1)
                  ]),
                  createBaseVNode("div", null, [
                    createBaseVNode("b", null, [
                      createTextVNode(toDisplayString(unref(t)(stats.value.choices)), 1),
                      createBaseVNode("small", null, " / " + toDisplayString(unref(t)(stats.value.choiceCount)), 1)
                    ]),
                    createBaseVNode("span", null, toDisplayString(unref(t)("选择题答对")), 1)
                  ])
                ]),
                createBaseVNode("div", _hoisted_91, [
                  createBaseVNode("button", {
                    class: "primary",
                    onClick: _cache[13] || (_cache[13] = ($event) => startRound(true))
                  }, toDisplayString(unref(t)(progress.value.drafts[language.value] ? "继续未完成测试 →" : "再练一轮 →")), 1),
                  createBaseVNode("button", {
                    onClick: _cache[14] || (_cache[14] = ($event) => switchTab("study"))
                  }, toDisplayString(unref(t)("回到学习")), 1)
                ])
              ]),
              createBaseVNode("div", _hoisted_92, [
                createBaseVNode("h2", null, toDisplayString(unref(t)("本轮回顾")), 1),
                createBaseVNode("span", null, toDisplayString(unref(t)("点击查看作答与范字")), 1)
              ]),
              createBaseVNode("div", _hoisted_93, [
                (openBlock(true), createElementBlock(Fragment, null, renderList(answers.value, (answer, i) => {
                  return openBlock(), createElementBlock("button", {
                    key: i,
                    onClick: ($event) => reviewAnswer.value = answer
                  }, [
                    createBaseVNode("b", null, toDisplayString(answer.text), 1),
                    createBaseVNode("span", null, toDisplayString(unref(t)(answer.type === "write" ? "书写题" : "选择题")), 1),
                    createBaseVNode("span", null, toDisplayString(unref(t)(answer.status === "skipped" ? "已跳过" : answer.correct ? "已匹配" : "待复习")), 1),
                    createBaseVNode("strong", null, toDisplayString(unref(t)(answer.score)) + " " + toDisplayString(unref(t)("分")), 1),
                    _cache[25] || (_cache[25] = createBaseVNode("span", null, "↗", -1))
                  ], 8, _hoisted_94);
                }), 128))
              ])
            ], 64)) : createCommentVNode("", true)
          ], 64)) : createCommentVNode("", true),
          createBaseVNode("footer", null, [
            _cache[26] || (_cache[26] = createBaseVNode("span", null, "Alphi", -1)),
            _cache[27] || (_cache[27] = createBaseVNode("span", null, "WRITE SLOWLY. LEARN DEEPLY.", -1)),
            unref(supportsWriting)(language.value) ? (openBlock(), createElementBlock("details", _hoisted_95, [
              createBaseVNode("summary", null, toDisplayString(unref(t)("字帖来源与评分说明")), 1),
              createBaseVNode("p", null, toDisplayString(unref(t)(
                "字形评分是离线模板相似度估计，尚未经过大规模真实手写样本校准。合理变体可能无法识别；不评判书法水平，不将字形相似度当作笔顺正确性。"
              )), 1),
              createBaseVNode("p", null, toDisplayString(unref(t)(
                "日语笔顺：KanjiVG / Ulrich Apel，CC BY-SA 3.0。俄语：Bad Script / The Bad Script Project Authors，SIL OFL。希腊语：Playpen Sans / The Playpen Sans Project Authors，SIL OFL。范字是一种参考写法。"
              )), 1)
            ])) : createCommentVNode("", true),
            createVNode(_sfc_main$2, { language: language.value }, null, 8, ["language"])
          ])
        ], 10, _hoisted_7),
        createBaseVNode("nav", {
          class: "bottom-tabs lingrove-bottom-tabs",
          "aria-label": unref(t)("主导航"),
          inert: !!detail.value || !!reviewAnswer.value
        }, [
          (openBlock(true), createElementBlock(Fragment, null, renderList([
            { id: "letters", name: "字母", icon: "M4 20L11 4h2l7 16 M7 14h10" },
            {
              id: "study",
              name: "学习",
              icon: "M4 5h6q2 0 2 2q0-2 2-2h6v14h-6q-2 0-2 2q0-2-2-2H4z M12 7v14"
            },
            { id: "tests", name: "测试", icon: "M8 4H5v17h14V4h-3 M8 3h8v4H8z M8 14l3 3 5-6" },
            {
              id: "about",
              name: "介绍",
              icon: "M12 11v6 M12 7h.01 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0"
            }
          ].filter(
            (item) => unref(supportsWriting)(language.value) || item.id === "letters" || item.id === "about"
          ), (item) => {
            return openBlock(), createElementBlock("button", {
              key: item.id,
              "aria-current": tab.value === item.id ? "page" : void 0,
              class: normalizeClass({ active: tab.value === item.id }),
              disabled: busy.value || loading.value,
              onClick: ($event) => switchTab(item.id)
            }, [
              (openBlock(), createElementBlock("svg", _hoisted_98, [
                createBaseVNode("path", {
                  d: item.icon
                }, null, 8, _hoisted_99)
              ])),
              createBaseVNode("span", null, toDisplayString(unref(t)(item.name)), 1)
            ], 10, _hoisted_97);
          }), 128))
        ], 8, _hoisted_96),
        detail.value || reviewAnswer.value ? (openBlock(), createElementBlock("div", {
          key: 0,
          class: normalizeClass(["modal-backdrop", { "writing-sheet-backdrop": detail.value && !reviewAnswer.value }]),
          onClick: _cache[18] || (_cache[18] = withModifiers(($event) => {
            detail.value = null;
            reviewAnswer.value = null;
          }, ["self"])),
          onKeydown: _cache[19] || (_cache[19] = withKeys(($event) => {
            detail.value = null;
            reviewAnswer.value = null;
          }, ["esc"]))
        }, [
          createBaseVNode("section", {
            class: normalizeClass(["letter-dialog", { "writing-sheet": detail.value && !reviewAnswer.value }]),
            role: "dialog",
            "aria-modal": "true",
            "aria-label": unref(t)(reviewAnswer.value ? "作答回顾" : "书写方法与动画")
          }, [
            createBaseVNode("header", _hoisted_101, [
              detail.value && !reviewAnswer.value ? (openBlock(), createElementBlock("span", _hoisted_102)) : createCommentVNode("", true),
              createBaseVNode("button", {
                class: "dialog-close lingrove-sheet-close",
                "aria-label": unref(t)("关闭"),
                onClick: _cache[15] || (_cache[15] = ($event) => {
                  detail.value = null;
                  reviewAnswer.value = null;
                })
              }, " × ", 8, _hoisted_103)
            ]),
            createBaseVNode("div", _hoisted_104, [
              reviewAnswer.value ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
                createBaseVNode("span", _hoisted_105, toDisplayString(unref(t)("ANSWER / 作答回顾")), 1),
                createBaseVNode("h2", null, toDisplayString(reviewAnswer.value.text) + " · " + toDisplayString(unref(t)(reviewAnswer.value.score)) + " " + toDisplayString(unref(t)("分")), 1),
                createBaseVNode("div", _hoisted_106, [
                  createVNode(_sfc_main$6, {
                    glyph: unref(glyphs).find((g) => g.id === reviewAnswer.value.id)
                  }, null, 8, ["glyph"])
                ]),
                createBaseVNode("p", null, toDisplayString(unref(t)("正确的手写范字")), 1),
                reviewAnswer.value.type === "write" ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
                  reviewAnswer.value.strokes.length ? (openBlock(), createElementBlock("img", {
                    key: 0,
                    class: "answer-ink",
                    src: unref(raster)(reviewAnswer.value.strokes).toDataURL(),
                    alt: "当时的书写"
                  }, null, 8, _hoisted_107)) : (openBlock(), createElementBlock("p", _hoisted_108, toDisplayString(unref(t)("本题未书写。")), 1))
                ], 64)) : (openBlock(), createElementBlock("p", _hoisted_109, toDisplayString(unref(t)("你的选择：")) + toDisplayString(unref(t)(
                  unref(glyphs).find(
                    (g) => reviewAnswer.value.type === "choice" && g.id === reviewAnswer.value.chosenID
                  )?.text ?? "未作答"
                )), 1)),
                createBaseVNode("p", null, toDisplayString(unref(t)(reviewAnswer.value.correct ? "已匹配" : "建议再练习这个字母")), 1),
                createBaseVNode("button", {
                  class: "primary wide",
                  onClick: _cache[16] || (_cache[16] = ($event) => {
                    learn(unref(glyphs).find((g) => g.id === reviewAnswer.value.id));
                    reviewAnswer.value = null;
                  })
                }, toDisplayString(unref(t)("练习这个字母 →")), 1)
              ], 64)) : detail.value ? (openBlock(), createElementBlock(Fragment, { key: 1 }, [
                createBaseVNode("div", _hoisted_110, [
                  detailCases.value.length > 1 ? (openBlock(), createElementBlock("div", {
                    key: 0,
                    class: "segments",
                    "aria-label": unref(t)(detail.value.language === "ja" ? "书写说明假名" : "书写说明大小写")
                  }, [
                    (openBlock(true), createElementBlock(Fragment, null, renderList(detailCases.value, (g) => {
                      return openBlock(), createElementBlock("button", {
                        key: g.id,
                        class: normalizeClass({ active: detail.value.id === g.id }),
                        "aria-pressed": detail.value.id === g.id,
                        onClick: ($event) => detail.value = g
                      }, toDisplayString(unref(t)(variantLabel(g))) + " " + toDisplayString(g.text), 11, _hoisted_112);
                    }), 128))
                  ], 8, _hoisted_111)) : createCommentVNode("", true),
                  (openBlock(), createBlock(_sfc_main$3, {
                    key: detail.value.id,
                    glyph: detail.value
                  }, null, 8, ["glyph"]))
                ]),
                (openBlock(), createBlock(_sfc_main$4, {
                  key: detail.value.id,
                  glyph: detail.value,
                  autoplay: page.value === "learn"
                }, null, 8, ["glyph", "autoplay"])),
                page.value !== "learn" ? (openBlock(), createElementBlock("button", {
                  key: 0,
                  class: "primary wide",
                  onClick: _cache[17] || (_cache[17] = ($event) => learn(detail.value))
                }, toDisplayString(unref(t)("练习这个字母 →")), 1)) : createCommentVNode("", true)
              ], 64)) : createCommentVNode("", true)
            ])
          ], 10, _hoisted_100)
        ], 34)) : createCommentVNode("", true)
      ], 2);
    };
  }
});
void initializeAppLanguage(messages$1).then(
  () => createApp(_sfc_main).mount("#app"),
  () => createApp(_sfc_main).mount("#app")
);
//# sourceMappingURL=index-Cx_oUbpX.js.map
