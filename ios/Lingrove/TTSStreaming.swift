import Foundation
import AVFoundation
import UIKit
import SwiftUI
import MediaPlayer

// Both adapters request mono, signed 16-bit little-endian PCM at 24 kHz.
// Keep an odd trailing byte across transport chunks, never across requests.
struct TTSPCMFrames {
    private var pending = Data()
    private(set) var totalBytes = 0
    static let maximumBytes = 24 * 1024 * 1024
    mutating func append(_ data: Data) throws -> Data {
        totalBytes += data.count
        guard totalBytes <= Self.maximumBytes else { throw ModuleError.invalid("语音响应过大，请缩短文本") }
        pending.append(data)
        let count = pending.count - pending.count % 2
        let result = Data(pending.prefix(count))
        pending = Data(pending.dropFirst(count))
        return result
    }
    func finish() throws {
        guard totalBytes > 0, pending.isEmpty else { throw ModuleError.invalid("语音服务未返回完整音频") }
    }
}

struct MiniMaxPCMStream {
    private var line = Data()
    private var payload = Data()
    private(set) var completed = false
    private let maximumEventBytes = 2 * 1024 * 1024

    mutating func feed(_ bytes: Data) throws -> [Data] {
        var audio: [Data] = []
        for byte in bytes {
            if byte == 10 {
                if let chunk = try consumeLine() { audio.append(chunk) }
            } else {
                guard line.count + payload.count < maximumEventBytes else { throw ModuleError.invalid("语音响应过大，请缩短文本") }
                line.append(byte)
            }
        }
        return audio
    }
    mutating func finish() throws -> [Data] {
        var audio: [Data] = []
        if !line.isEmpty, let chunk = try consumeLine() { audio.append(chunk) }
        if let chunk = try dispatch() { audio.append(chunk) }
        guard completed else { throw ModuleError.invalid("语音连接中断，音频未生成完整") }
        return audio
    }
    private mutating func consumeLine() throws -> Data? {
        if line.last == 13 { line.removeLast() }
        defer { line.removeAll(keepingCapacity: true) }
        if line.isEmpty { return try dispatch() }
        if line.starts(with: Data("data:".utf8)) {
            var value = line.dropFirst(5)
            if value.first == 32 { value = value.dropFirst() }
            if !payload.isEmpty { payload.append(10) }
            payload.append(contentsOf: value)
        }
        return nil
    }
    private mutating func dispatch() throws -> Data? {
        guard !payload.isEmpty else { return nil }
        defer { payload.removeAll(keepingCapacity: true) }
        if payload == Data("[DONE]".utf8) {
            guard completed else { throw ModuleError.invalid("语音连接中断，音频未生成完整") }
            return nil
        }
        guard !completed,
              let json = try? JSONSerialization.jsonObject(with: payload) as? [String: Any],
              let base = json["base_resp"] as? [String: Any], let code = base["status_code"] as? Int else {
            throw ModuleError.invalid("语音服务响应无效")
        }
        guard code == 0 else { throw ModuleError.invalid("MiniMax 语音生成失败（\(code)），请检查密钥、模型、音色和套餐额度") }
        guard let data = json["data"] as? [String: Any], let status = data["status"] as? Int, [1, 2].contains(status) else {
            throw ModuleError.invalid("语音服务响应无效")
        }
        if status == 2 {
            // MiniMax's terminal audio field is the aggregate, not a new chunk.
            // Request exclude_aggregated_audio and never enqueue a terminal aggregate.
            completed = true
            return nil
        }
        guard let hex = data["audio"] as? String else { throw ModuleError.invalid("语音服务响应无效") }
        return try TTSService.decodeHex(hex)
    }
}

extension TTSService {
    static func preparePCM(_ params: [String: Any], configuration: TTSConfiguration, session: URLSession? = nil, usageContext: TTSUsageContext = .preview) async throws -> Data {
        var audio = Data()
        try await streamPCM(params, configuration: configuration, session: session, usageContext: usageContext) { audio.append($0) }
        return audio
    }

    static func streamPCM(_ params: [String: Any], configuration: TTSConfiguration, session: URLSession? = nil,
                          usageContext: TTSUsageContext = .preview, receive: @escaping (Data) async throws -> Void) async throws {
        try Task.checkCancellation()
        let request = try configuration.request(params, streaming: true)
        let settings = session?.configuration ?? URLSessionConfiguration.ephemeral
        settings.timeoutIntervalForRequest = 120
        settings.timeoutIntervalForResource = 600
        settings.httpCookieStorage = nil; settings.httpShouldSetCookies = false; settings.urlCache = nil
        let connection = URLSession(configuration: settings, delegate: NoRedirect(), delegateQueue: nil)
        defer { connection.invalidateAndCancel() }
        await TTSUsageStore.shared.record(context: usageContext, request: request)
        let (bytes, response) = try await connection.bytes(for: request)
        guard let http = response as? HTTPURLResponse else { throw ModuleError.invalid("语音服务响应无效") }
        guard (200..<300).contains(http.statusCode) else { throw ModuleError.invalid("朗读失败，请检查「语音合成」中的设置和可用额度。") }
        let contentType = http.mimeType?.lowercased() ?? ""
        if configuration.provider == .minimax {
            guard contentType == "text/event-stream" else { throw ModuleError.invalid("暂时无法播放，请在「语音合成」中更换模型后重试。") }
        } else {
            guard ["audio/pcm", "audio/x-pcm", "audio/raw", "application/octet-stream"].contains(contentType) else {
                throw ModuleError.invalid("暂时无法播放，请在「语音合成」中更换模型后重试。")
            }
        }
        let maximumBytes = TTSPCMFrames.maximumBytes * 2 + 1024 * 1024
        guard response.expectedContentLength <= maximumBytes else { throw ModuleError.invalid("语音响应过大，请缩短文本") }
        var decoder = MiniMaxPCMStream(), frames = TTSPCMFrames(), batch = Data(), total = 0
        func deliver(_ chunks: [Data]) async throws {
            for data in chunks {
                try Task.checkCancellation()
                let aligned = try frames.append(data)
                if !aligned.isEmpty { try await receive(aligned) }
            }
        }
        for try await byte in bytes {
            try Task.checkCancellation()
            total += 1
            guard total <= maximumBytes else { throw ModuleError.invalid("语音响应过大，请缩短文本") }
            batch.append(byte)
            if batch.count >= 4800 || (configuration.provider == .minimax && byte == 10) {
                let chunks = configuration.provider == .minimax ? try decoder.feed(batch) : [batch]
                try await deliver(chunks)
                batch.removeAll(keepingCapacity: true)
            }
        }
        let tail = configuration.provider == .minimax ? try decoder.feed(batch) + decoder.finish() : [batch]
        try await deliver(tail)
        try frames.finish()
        try Task.checkCancellation()
    }
}

// URLRequest equality does not reliably compare HTTP bodies. Audio reuse must.
struct TTSRequestIdentity: Equatable {
    let url: URL?
    let method: String?
    let headers: [String: String]
    let body: Data?
    init(_ request: URLRequest) {
        url = request.url; method = request.httpMethod
        headers = request.allHTTPHeaderFields ?? [:]; body = request.httpBody
    }
}

enum TTSPlaybackState: String { case buffering, playing, paused, ended, stopped, error }

@MainActor final class TTSPlayback {
    private static weak var active: TTSPlayback?
    var onChunk: ((Int) -> Void)?
    private let engine = AVAudioEngine()
    private let node = AVAudioPlayerNode()
    private let format = AVAudioFormat(standardFormatWithSampleRate: 24000, channels: 1)!
    private let onState: (TTSPlaybackState) async -> Void
    private var events: Task<Void, Never>?
    private var worker: Task<Void, Error>?
    private var queuedAudio: Task<Data, Error>?
    private var drain: CheckedContinuation<Void, Error>?
    private var observers: [NSObjectProtocol] = []
    private var started = false
    private var audioSessionActive = false
    private var paused = false
    private var stopped = false
    private var inputEnded = false
    private var queuedFrames: AVAudioFrameCount = 0
    private var waitingForBuffer = true
    private var hasPlayed = false
    // Accumulate 400 ms before starting, and 800 ms after an underrun.
    private var minimumFrames: AVAudioFrameCount { hasPlayed ? 19200 : 9600 }
    private(set) var state: TTSPlaybackState = .buffering
    // Prevent stale completion callbacks from stopped audio changing playback state.
    private var generation = UUID()

    init(onState: @escaping (TTSPlaybackState) async -> Void = { _ in }) {
        self.onState = onState
        engine.attach(node)
        engine.connect(node, to: engine.mainMixerNode, format: format)
    }

    func run(_ params: [String: Any], configuration: TTSConfiguration, session: URLSession? = nil, prepared: Task<Data, Error>? = nil, artwork: UIImage? = nil, usageContext: TTSUsageContext = .preview) async throws {
        defer { prepared?.cancel() }
        try Task.checkCancellation()
        guard !stopped else { throw CancellationError() }
        Self.active?.stop()
        Self.active = self
        let contentTitle = (params["title"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        HostPlayback.shared.attach(self, title: contentTitle.isEmpty ? usageContext.appName : String(contentTitle.prefix(512)), image: artwork)
        report(paused ? .paused : .buffering)
        observeInterruptions()
        defer { dispose() }
        do {
            try await withTaskCancellationHandler {
                let texts = params["queue"] as? [String] ?? [params["text"] as? String ?? ""]
                var readyAudio = prepared
                defer { queuedAudio?.cancel(); queuedAudio = nil }
                for (index, text) in texts.enumerated() {
                    try Task.checkCancellation()
                    guard !stopped else { throw CancellationError() }
                    onChunk?(index)
                    var current = params
                    current["text"] = text
                    let currentParams = current
                    inputEnded = false
                    report(paused ? .paused : .buffering)
                    let preparedChunk = readyAudio
                    if index + 1 < texts.count {
                        var next = params; next["text"] = texts[index + 1]
                        let nextParams = next
                        queuedAudio = Task { try await TTSService.preparePCM(nextParams, configuration: configuration, session: session, usageContext: usageContext) }
                    } else { queuedAudio = nil }
                    readyAudio = queuedAudio
                    let task = Task {
                        if let prepared = preparedChunk {
                            try await withTaskCancellationHandler {
                                let data = try await prepared.value
                                try Task.checkCancellation()
                                try self.enqueue(data)
                            } onCancel: { prepared.cancel() }
                        } else {
                            try await TTSService.streamPCM(currentParams, configuration: configuration, session: session, usageContext: usageContext) { data in
                                try self.enqueue(data)
                            }
                        }
                    }
                    worker = task
                    try await task.value
                    worker = nil
                    try Task.checkCancellation()
                    guard !stopped else { throw CancellationError() }
                    inputEnded = true
                    startWhenBuffered()
                    if queuedFrames > 0 {
                        try await withCheckedThrowingContinuation { drain = $0 }
                    }
                    try Task.checkCancellation()
                    guard !stopped else { throw CancellationError() }
                }
            } onCancel: {
                Task { @MainActor in self.stop() }
            }
            report(.ended)
            await events?.value
        } catch {
            generation = UUID(); node.stop(); engine.stop()
            report(stopped || Task.isCancelled || error is CancellationError ? .stopped : .error)
            await events?.value
            if stopped || Task.isCancelled { throw CancellationError() }
            throw error
        }
    }

    func pause() {
        guard !stopped, state != .ended, state != .error else { return }
        paused = true
        if started { node.pause() }
        report(.paused)
    }
    func resume() {
        guard paused, !stopped else { return }
        paused = false
        startWhenBuffered()
        if queuedFrames == 0 || waitingForBuffer { report(.buffering) }
    }
    func stop() {
        guard !stopped, state != .ended, state != .error else { return }
        stopped = true
        worker?.cancel()
        queuedAudio?.cancel()
        generation = UUID()
        node.stop(); engine.stop()
        deactivateAudio()
        queuedFrames = 0
        drain?.resume(throwing: CancellationError()); drain = nil
        report(.stopped)
    }
    private func enqueue(_ data: Data) throws {
        try Task.checkCancellation()
        guard !stopped else { throw CancellationError() }
        guard !data.isEmpty, data.count.isMultiple(of: 2),
              let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: AVAudioFrameCount(data.count / 2)),
              let channel = buffer.floatChannelData?[0] else { throw ModuleError.invalid("语音服务响应无效") }
        buffer.frameLength = buffer.frameCapacity
        data.withUnsafeBytes { raw in
            let bytes = raw.bindMemory(to: UInt8.self)
            for i in 0..<Int(buffer.frameLength) {
                let bits = UInt16(bytes[i * 2]) | UInt16(bytes[i * 2 + 1]) << 8
                channel[i] = Float(Int16(bitPattern: bits)) / 32768
            }
        }
        if !started {
            let audio = AVAudioSession.sharedInstance()
            try audio.setCategory(.playback, mode: .spokenAudio)
            try audio.setActive(true)
            audioSessionActive = true
            try engine.start()
            started = true
            observers.append(NotificationCenter.default.addObserver(forName: Notification.Name.AVAudioEngineConfigurationChange, object: engine, queue: .main) { [weak self] _ in
                Task { @MainActor in
                    guard let self, self.started, !self.engine.isRunning else { return }
                    self.stop()
                }
            })
        }
        queuedFrames += buffer.frameLength
        let frames = buffer.frameLength, ticket = generation
        node.scheduleBuffer(buffer, completionCallbackType: .dataPlayedBack) { [weak self] _ in
            Task { @MainActor in self?.played(frames, ticket: ticket) }
        }
        startWhenBuffered()
    }
    private func startWhenBuffered() {
        guard !paused, !stopped, started, queuedFrames > 0 else { return }
        guard !waitingForBuffer || queuedFrames >= minimumFrames || inputEnded else { return }
        waitingForBuffer = false
        hasPlayed = true
        if !node.isPlaying { node.play() }
        report(.playing)
    }
    private func played(_ frames: AVAudioFrameCount, ticket: UUID) {
        guard ticket == generation, !stopped else { return }
        queuedFrames -= min(queuedFrames, frames)
        if queuedFrames == 0 {
            if inputEnded { drain?.resume(); drain = nil }
            else {
                waitingForBuffer = true
                node.pause()
                if !paused { report(.buffering) }
            }
        }
    }
    private func report(_ value: TTSPlaybackState) {
        // Emit the initial buffering state too; all later transitions are deduplicated.
        guard value != state || events == nil else { return }
        state = value
        HostPlayback.shared.update(self)
        let previous = events, sink = onState
        events = Task { await previous?.value; await sink(value) }
    }
    private func observeInterruptions() {
        for name in [AVAudioSession.interruptionNotification] {
            observers.append(NotificationCenter.default.addObserver(forName: name, object: nil, queue: .main) { [weak self] _ in
                Task { @MainActor in self?.stop() }
            })
        }
        observers.append(NotificationCenter.default.addObserver(forName: AVAudioSession.routeChangeNotification, object: nil, queue: .main) { [weak self] note in
            if let reason = note.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt,
               reason == AVAudioSession.RouteChangeReason.oldDeviceUnavailable.rawValue {
                Task { @MainActor in self?.stop() }
            }
        })
    }
    private func deactivateAudio() {
        if Self.active === self, audioSessionActive {
            try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
            audioSessionActive = false
        }
    }
    private func dispose() {
        generation = UUID()
        worker?.cancel(); worker = nil
        observers.forEach(NotificationCenter.default.removeObserver); observers.removeAll()
        node.stop(); engine.stop()
        deactivateAudio()
        if Self.active === self { Self.active = nil }
    }
}

/// One shared control surface for native playback, independent of the visible WebView.
@MainActor final class HostPlayback: ObservableObject {
    static let shared = HostPlayback()
    @Published private(set) var player: TTSPlayback?
    @Published private(set) var title = ""
    @Published private(set) var cover: UIImage?
    private var artwork: MPMediaItemArtwork?
    @Published private(set) var state: TTSPlaybackState = .stopped
    private init() {
        let commands = MPRemoteCommandCenter.shared()
        commands.playCommand.addTarget { _ in
            Task { @MainActor in Self.shared.player?.resume() }; return .success
        }
        commands.pauseCommand.addTarget { _ in
            Task { @MainActor in Self.shared.player?.pause() }; return .success
        }
        commands.togglePlayPauseCommand.addTarget { _ in
            Task { @MainActor in Self.shared.toggle() }; return .success
        }
        setCommands(false)
    }
    private func setCommands(_ enabled: Bool) {
        let commands = MPRemoteCommandCenter.shared()
        for command in [commands.playCommand, commands.pauseCommand, commands.togglePlayPauseCommand] {
            command.isEnabled = enabled
        }
        // The system transport offers pause/resume; explicit stop lives in the app.
        commands.stopCommand.isEnabled = false
    }
    func attach(_ player: TTSPlayback, title: String, image: UIImage? = nil) {
        self.player = player; self.title = title
        let image = image ?? Self.defaultCover()
        cover = image
        artwork = MPMediaItemArtwork(boundsSize: image.size) { _ in image }
        setCommands(true)
        update(player)
    }
    func update(_ player: TTSPlayback) {
        guard self.player === player else { return }
        state = player.state
        if [.ended, .stopped, .error].contains(state) {
            self.player = nil
            setCommands(false)
            MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
        } else {
            MPNowPlayingInfoCenter.default().nowPlayingInfo = [
                MPMediaItemPropertyArtwork: artwork as Any,
                MPMediaItemPropertyTitle: title,
                MPMediaItemPropertyArtist: "Lingrove",
                // Buffering retains playback intent so the system still offers pause.
                MPNowPlayingInfoPropertyPlaybackRate: state == .paused ? 0.0 : 1.0,
                MPNowPlayingInfoPropertyIsLiveStream: false
            ]
        }
    }
    private static func defaultCover() -> UIImage {
        UIGraphicsImageRenderer(size: CGSize(width: 512, height: 512)).image { _ in
            UIColor(red: 0.20, green: 0.32, blue: 0.25, alpha: 1).setFill()
            UIBezierPath(rect: CGRect(x: 0, y: 0, width: 512, height: 512)).fill()
            UIImage(systemName: "waveform", withConfiguration: UIImage.SymbolConfiguration(pointSize: 240, weight: .medium))?
                .withTintColor(.white, renderingMode: .alwaysOriginal)
                .draw(in: CGRect(x: 112, y: 136, width: 288, height: 240))
        }
    }
    func toggle() {
        if state == .paused { player?.resume() } else { player?.pause() }
    }
}

struct HostPlaybackControls: View {
    @ObservedObject private var playback = HostPlayback.shared
    var body: some View {
        if playback.player != nil {
            HStack(spacing: 16) {
                if let cover = playback.cover {
                    Image(uiImage: cover).resizable().scaledToFill()
                        .frame(width: 40, height: 40).clipShape(RoundedRectangle(cornerRadius: 10))
                        .accessibilityHidden(true)
                }
                if playback.state == .buffering { ProgressView().tint(Color(uiColor: LingroveTheme.accent)) }
                Text(playback.title).font(.subheadline).lineLimit(1)
                Spacer(minLength: 0)
                Button { playback.toggle() } label: {
                    Image(systemName: playback.state == .paused ? "play.fill" : "pause.fill").frame(width: 44, height: 44)
                        .foregroundStyle(Color(uiColor: LingroveTheme.onAccent))
                        .background(Color(uiColor: LingroveTheme.accent), in: Circle())
                }.buttonStyle(.plain).accessibilityLabel(playback.state == .paused ? "继续播放" : "暂停播放")
                    .accessibilityIdentifier("host-playback-toggle")
                Button { playback.player?.stop() } label: {
                    Image(systemName: "stop.fill").frame(width: 44, height: 44)
                        .foregroundStyle(Color(uiColor: .label))
                        .background(Color(uiColor: .tertiarySystemFill), in: Circle())
                }.buttonStyle(.plain).accessibilityLabel("停止朗读").accessibilityIdentifier("host-playback-stop")
            }
            .padding(.horizontal, 16).padding(.vertical, 6)
            .background(Color(uiColor: LingroveTheme.surface))
            .clipShape(RoundedRectangle(cornerRadius: 18))
            .overlay(RoundedRectangle(cornerRadius: 18).stroke(Color(uiColor: .separator), lineWidth: 1))
            .padding(.horizontal)
            .accessibilityIdentifier("host-playback-controls")
        }
    }
}
