# 字母发音

当前课程的 103 个基本读音均已提供真人录音，覆盖全部 207 个字形：

- 日语 46 个基本假名；平假名与片假名共用音频。浊音、拗音等尚不在当前课程范围内。
- 俄语 33 个字母；大小写共用字母名称读音，包括硬音符和软音符的名称。
- 现代希腊语 24 个字母；大小写共用字母名称读音，词尾 ς 与 σ 共用。

## 来源与许可

日语音频来自 Tofugu，俄语及希腊语来自 Wikimedia Commons。逐文件来源页、作者、下载地址、校验值、许可状态及裁剪位置见 `SOURCES.json`，应用底部“发音来源与许可”也提供署名和原始链接。

- 日语：Tofugu 的 Learn Hiragana 教学页面（https://www.tofugu.com/japanese/learn-hiragana/），全部 46 个假名使用该页面的 v2 音频，保留完整单次读音，不沿用旧来源的裁剪位置。按用户要求用于个人学习；未核实公开再分发许可，不标注为公有领域或开放许可。
- 俄语：Cherus，CC BY-SA 3.0（https://creativecommons.org/licenses/by-sa/3.0/）。裁去首尾空白并转换格式；修改后的录音继续按 CC BY-SA 3.0 提供。
- 希腊语：CuteHappyBrute，RoB 降噪及均衡处理。Public domain（PD-self）。按字母顺序从完整现代希腊语字母表朗读中截取；截取边界记录于配置。

原始 MP3 保存于 `app/glyphora/audio-sources/`，当前日语来源位于其 `tofugu/` 子目录。已移除不再使用的旧日语来源。文件转换为 24 kHz 单声道 16-bit PCM WAV，保留原始语速和音高。名称读音不是字母在单词中的全部发音规则。发音及截取仍可继续接受母语者校对。

## 重新生成

配置：`app/glyphora/src/pronunciation-samples.json`，来源元数据：`app/glyphora/src/pronunciation-sources.json`（生成时同步至公开的 `SOURCES.json`）。

macOS 上运行 `python3 scripts/generate-pronunciation-samples.py --recordings-only`，从本地来源文件重新转换、按配置裁剪，并更新 `app/glyphora/src/pronunciation-audio.json`。不需要联网；音频解码服务可能需要沙箱外运行。

生成的 WAV 保存在非发布目录 `app/glyphora/audio-generated/`，用于维护和校验。运行时仅打包嵌入数据，避免依赖 iOS 自定义地址加载媒体；来源与许可说明仍随应用发布。生成器检查时长和非静音数据；这不能替代发音校对。课程覆盖、字形映射、来源文件和嵌入数据由测试检查。
