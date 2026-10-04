# Sentra

Lingrove 的第一个 Vue 3 + TypeScript + Vite 子应用。提供翻译（直译/地道表达）、原句语法分析、同语言表达优化、流式展示、学习历史的搜索/打开/删除，以及学习偏好设置。

从仓库根目录运行 `npm ci`、`npm run dev`。`npm run build` 生成 `dist/sentra/`、独立 ZIP 和 iOS 内置资源。

- 三个 Tab 独立保留草稿和结果。
- 翻译目标为英语、日语、俄语、希腊语；解释语言与翻译目标独立。
- 需要 Lingrove 1.2.0；在宿主「应用设置 → 大模型配置」中管理协议、地址、模型与 API Key，所有子应用共用。
- 模型调用使用 `@lingrove/host-sdk` 的 `llm.complete()`；宿主构造并发送请求，子应用不读取 API Key。独立浏览器仅支持界面与历史预览。
- 流式结果只做展示，完整结果通过结构和原句/目标语言校验后保存。
- 原生学习历史不受代码包更新影响。浏览器历史兼容旧 Sentra 的 `sentra.sentences.v1` 数据。
- 无远程字体、运行时 CDN 或 Service Worker 依赖，原生离线可查看历史。

详细运行、更新配置、签名发布及测试见仓库根 README。
