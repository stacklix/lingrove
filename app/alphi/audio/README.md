# 字母发音

当前课程的 215 个基本读音均已提供真人录音，覆盖全部 358 个字形：

- 日语 46 个基本假名；平假名与片假名共用音频。浊音、拗音等尚不在当前课程范围内。
- 俄语 33 个字母；大小写共用字母名称读音，包括硬音符和软音符的名称。
- 现代希腊语 24 个字母；大小写共用字母名称读音，词尾 ς 与 σ 共用。

## 来源与许可

日语音频来自 Tofugu，俄语及希腊语来自 Wikimedia Commons。逐文件来源页、作者、下载地址、校验值、许可状态及裁剪位置见 `SOURCES.json`，应用底部“发音来源与许可”也提供署名和原始链接。

- 日语：Tofugu 的 Learn Hiragana 教学页面（https://www.tofugu.com/japanese/learn-hiragana/），全部 46 个假名使用该页面的 v2 音频，保留完整单次读音，不沿用旧来源的裁剪位置。按用户要求用于个人学习；未核实公开再分发许可，不标注为公有领域或开放许可。
- 俄语：Cherus，CC BY-SA 3.0（https://creativecommons.org/licenses/by-sa/3.0/）。裁去首尾空白并转换格式；修改后的录音继续按 CC BY-SA 3.0 提供。
- 希腊语：CuteHappyBrute，RoB 降噪及均衡处理。Public domain（PD-self）。按字母顺序从完整现代希腊语字母表朗读中截取；截取边界记录于配置。

原始录音保存于 `app/alphi/audio-sources/`，当前日语来源位于其 `tofugu/` 子目录。已移除不再使用的旧日语来源。文件转换为 24 kHz 单声道 16-bit PCM WAV，保留原始语速和音高。名称读音不是字母在单词中的全部发音规则。发音及截取仍可继续接受母语者校对。

## 重新生成

配置：`app/alphi/src/pronunciation-samples.json`，来源元数据：`app/alphi/src/pronunciation-sources.json`（生成时同步至公开的 `SOURCES.json`）。

安装 FFmpeg 后，在 Windows、macOS 或 Linux 上运行 `python3 scripts/generate-pronunciation-samples.py --recordings-only`，从本地来源文件重新转换、按配置裁剪，并更新 `app/alphi/src/pronunciation-audio.json`。不需要联网；音频解码服务可能需要沙箱外运行。

生成的 WAV 保存在非发布目录 `app/alphi/audio-generated/`，用于维护和校验。运行时仅打包嵌入数据，避免依赖 iOS 自定义地址加载媒体；来源与许可说明仍随应用发布。生成器检查时长和非静音数据；这不能替代发音校对。课程覆盖、字形映射、来源文件和嵌入数据由测试检查。

新增语言：亚美尼亚语 39 个字母（大小写共用）、格鲁吉亚语 33 个字母、韩语 40 个字母，只提供印刷体字母表和离线真人发音。

- 亚美尼亚语：[Vahagn Petrosyan 母语者录音](https://commons.wikimedia.org/wiki/File:Armenian_alphabet_(Eastern_Armenian).ogg)，CC BY-SA 3.0。按原录音的传统 38 字母、ու、և 顺序切分，省去独立 ւ；显示现代 39 字母表。对截取片段进行高通和 FFT 降噪，保持语速和音高，修改后沿用 CC BY-SA 3.0。截取边界和滤镜保存在 sample 配置中。
- 格鲁吉亚语：[Learn Kartuli](https://learnkartuli.com/georgian-alphabet/) 明确标注母语者发音的字母录音，按 Unicode 码位映射到原始 M4A。
- 韩语：[zKorean](https://zkorean.com/hangul/appearance) 字母教学真人录音。辅音保留完整的字母名称和发音演示，元音为读音。

格鲁吉亚语、韩语录音仅用于个人学习，未确认公开再分发许可；作者、下载地址和校验值随应用保留。可用 `--ffmpeg <路径>` 指定 FFmpeg。
