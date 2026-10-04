import UIKit
import PencilKit

// A modal drawing session owned by its module runtime. No drawing leaves the device.
@MainActor final class HandwritingController: UIViewController, PKCanvasViewDelegate {
    private let canvas = PKCanvasView()
    private let stage = HandwritingStage()
    private let prompt: String
    private let reference: UIImage?
    private let tracing: Bool
    private var completion: ((Any) -> Void)?
    private let submit = UIButton(type: .system)
    private let undoButton = UIButton(type: .system)
    private let clearButton = UIButton(type: .system)

    init(prompt: String, reference: UIImage?, tracing: Bool, completion: @escaping (Any) -> Void) {
        self.prompt = prompt; self.reference = reference; self.tracing = tracing; self.completion = completion
        super.init(nibName: nil, bundle: nil)
        modalPresentationStyle = .fullScreen
        isModalInPresentation = true
    }
    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = LingroveTheme.background
        view.tintColor = UIColor(red: 48/255, green: 78/255, blue: 62/255, alpha: 1)
        let stack = UIStackView(); stack.axis = .vertical; stack.spacing = 12
        stack.translatesAutoresizingMaskIntoConstraints = false; view.addSubview(stack)
        NSLayoutConstraint.activate([
            stack.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 20),
            stack.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -20),
            stack.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 12),
            stack.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -16)
        ])
        let heading = UIStackView(); heading.alignment = .center; heading.spacing = 16
        let cancel = button("取消", action: #selector(cancelDrawing)); heading.addArrangedSubview(cancel)
        let title = UILabel(); title.text = "写出 \(prompt) 的手写体"; title.font = .preferredFont(forTextStyle: .headline); title.textAlignment = .center
        heading.addArrangedSubview(title)
        submit.setTitle("提交书写", for: .normal); submit.titleLabel?.font = .preferredFont(forTextStyle: .headline)
        submit.addTarget(self, action: #selector(submitDrawing), for: .touchUpInside); submit.isEnabled = false
        submit.accessibilityIdentifier = "handwriting-submit"; heading.addArrangedSubview(submit)
        cancel.setContentHuggingPriority(.required, for: .horizontal); submit.setContentHuggingPriority(.required, for: .horizontal)
        heading.heightAnchor.constraint(greaterThanOrEqualToConstant: 44).isActive = true; stack.addArrangedSubview(heading)
        if let reference {
            let preview = UIImageView(image: reference); preview.contentMode = .scaleAspectFit
            preview.heightAnchor.constraint(equalToConstant: 80).isActive = true
            preview.accessibilityLabel = "手写范字"; preview.isAccessibilityElement = true
            stack.addArrangedSubview(preview)
        }
        let tip = UILabel(); tip.text = tracing ? "沿浅色范字描摹，完成后提交。" : "在方框内书写，完成后提交。"; tip.textAlignment = .center; tip.font = .preferredFont(forTextStyle: .subheadline); tip.textColor = .secondaryLabel
        stack.addArrangedSubview(tip)
        canvas.backgroundColor = .clear; canvas.isOpaque = false
        canvas.tool = PKInkingTool(.pen, color: UIColor(red: 48/255, green: 78/255, blue: 62/255, alpha: 1), width: 4)
        canvas.drawingPolicy = .pencilOnly; canvas.delegate = self
        canvas.isScrollEnabled = false; canvas.minimumZoomScale = 1; canvas.maximumZoomScale = 1
        canvas.accessibilityIdentifier = "handwriting-canvas"
        stage.canvas = canvas; stage.reference.image = tracing ? reference : nil
        stage.addSubview(stage.grid); stage.addSubview(stage.reference); stage.addSubview(canvas)
        stage.reference.alpha = 0.2; stage.reference.contentMode = .scaleAspectFit; stage.reference.isUserInteractionEnabled = false
        stack.addArrangedSubview(stage)
        stage.setContentHuggingPriority(.defaultLow, for: .vertical)
        let controls = UIStackView(); controls.axis = .horizontal; controls.distribution = .equalSpacing; controls.alignment = .center
        undoButton.setTitle("撤销", for: .normal); undoButton.addTarget(self, action: #selector(undoDrawing), for: .touchUpInside)
        clearButton.setTitle("清空", for: .normal); clearButton.addTarget(self, action: #selector(clearDrawing), for: .touchUpInside)
        controls.addArrangedSubview(undoButton); controls.addArrangedSubview(clearButton)
        let input = UISegmentedControl(items: ["仅 Pencil", "允许手指"]); input.selectedSegmentIndex = 0
        input.accessibilityIdentifier = "handwriting-input"; input.addTarget(self, action: #selector(changeInput(_:)), for: .valueChanged)
        controls.addArrangedSubview(input); controls.heightAnchor.constraint(greaterThanOrEqualToConstant: 44).isActive = true
        stack.addArrangedSubview(controls)
        let tools = UISegmentedControl(items: ["墨笔", "橡皮（整笔）"])
        tools.selectedSegmentIndex = 0; tools.accessibilityIdentifier = "handwriting-tool"
        tools.addTarget(self, action: #selector(changeTool(_:)), for: .valueChanged)
        tools.heightAnchor.constraint(greaterThanOrEqualToConstant: 36).isActive = true
        stack.addArrangedSubview(tools)
        canvasViewDrawingDidChange(canvas)
    }
    private func button(_ title: String, action: Selector) -> UIButton {
        let b = UIButton(type: .system); b.setTitle(title, for: .normal); b.addTarget(self, action: action, for: .touchUpInside); return b
    }
    @objc private func changeTool(_ sender: UISegmentedControl) {
        if sender.selectedSegmentIndex == 1 { canvas.tool = PKEraserTool(.vector) }
        else { canvas.tool = PKInkingTool(.pen, color: UIColor(red: 48/255, green: 78/255, blue: 62/255, alpha: 1), width: 4) }
    }
    @objc private func changeInput(_ sender: UISegmentedControl) { canvas.drawingPolicy = sender.selectedSegmentIndex == 0 ? .pencilOnly : .anyInput }
    @objc private func undoDrawing() { canvas.undoManager?.undo(); canvasViewDrawingDidChange(canvas) }
    @objc private func clearDrawing() { canvas.drawing = PKDrawing(); canvas.undoManager?.removeAllActions(); canvasViewDrawingDidChange(canvas) }
    func canvasViewDrawingDidChange(_ canvasView: PKCanvasView) {
        submit.isEnabled = !canvasView.drawing.strokes.isEmpty
        clearButton.isEnabled = submit.isEnabled; undoButton.isEnabled = canvas.undoManager?.canUndo ?? false
    }
    @objc private func cancelDrawing() { finish(NSNull()) }
    @objc private func submitDrawing() {
        guard !canvas.drawing.strokes.isEmpty, canvas.bounds.width > 0 else { return }
        // Bounded payload, uniformly sampled along each stroke. Scale survives iPad layout changes.
        guard canvas.drawing.strokes.count <= 128 else {
            let alert = UIAlertController(title: "笔画较多", message: "请清空画板后重新书写。", preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "好", style: .default)); present(alert, animated: true); return
        }
        let side = canvas.bounds.width
        let strokes: [[[String: Double]]] = canvas.drawing.strokes.prefix(128).map { stroke in
            let path = stroke.path
            guard path.count > 0 else { return [] }
            let count = min(256, max(2, path.count))
            return (0..<count).map { index in
                let value = CGFloat(index) / CGFloat(count - 1) * CGFloat(path.count - 1)
                let point = path.interpolatedPoint(at: value).location.applying(stroke.transform)
                return ["x": Double(min(1, max(0, point.x / side))), "y": Double(min(1, max(0, point.y / side)))]
            }
        }
        finish(["strokes": strokes])
    }
    func finish(_ value: Any) {
        guard let completion else { return }; self.completion = nil
        dismiss(animated: true) { completion(value) }
    }
}

@MainActor private final class HandwritingStage: UIView {
    var canvas: PKCanvasView?
    let reference = UIImageView()
    let grid = HandwritingGrid()
    private var previousSide: CGFloat = 0
    override func layoutSubviews() {
        super.layoutSubviews()
        let side = max(1, min(bounds.width, bounds.height))
        let frame = CGRect(x: (bounds.width-side)/2, y: (bounds.height-side)/2, width: side, height: side)
        if previousSide > 0, previousSide != side, let canvas {
            canvas.drawing = canvas.drawing.transformed(using: CGAffineTransform(scaleX: side/previousSide, y: side/previousSide))
        }
        previousSide = side
        grid.frame = frame; reference.frame = frame; canvas?.frame = frame
        grid.setNeedsDisplay()
    }
}
@MainActor private final class HandwritingGrid: UIView {
    override func draw(_ rect: CGRect) {
        guard let ctx = UIGraphicsGetCurrentContext() else { return }
        UIColor(red: 1, green: 0.996, blue: 0.976, alpha: 1).setFill(); ctx.fill(rect)
        UIColor(red: 0.80, green: 0.84, blue: 0.77, alpha: 1).setStroke(); ctx.setLineWidth(1)
        ctx.stroke(rect.insetBy(dx: 1, dy: 1)); ctx.setLineDash(phase: 0, lengths: [5,5])
        for fraction in [0.25,0.5,0.75] {
            let y = rect.height*fraction; ctx.move(to: CGPoint(x:0,y:y)); ctx.addLine(to: CGPoint(x:rect.width,y:y))
        }
        ctx.move(to: CGPoint(x:rect.midX,y:0)); ctx.addLine(to: CGPoint(x:rect.midX,y:rect.height)); ctx.strokePath()
    }
}

// Embedded in the WKWebView's scroll content, so the writing surface moves with the page.
@MainActor final class InlineHandwriting: UIView, PKCanvasViewDelegate {
    let sessionID: String
    private let canvas = PKCanvasView()
    private let guide = UIImageView()
    private var restoring = false
    private var side: CGFloat = 0
    private var boundsObservation: NSKeyValueObservation?
    private weak var scrollView: UIScrollView?
    private var topInset: CGFloat = 60
    private var bottomInset: CGFloat = 88
    var changed: (([String: Any]) -> Void)?
    init(id: String, scrollView: UIScrollView) {
        sessionID = id; self.scrollView = scrollView
        super.init(frame: .zero)
        backgroundColor = .clear; clipsToBounds = true; layer.cornerRadius = 18
        canvas.backgroundColor = .clear; canvas.isOpaque = false; canvas.isScrollEnabled = false
        canvas.minimumZoomScale = 1; canvas.maximumZoomScale = 1
        canvas.drawingPolicy = .pencilOnly; canvas.delegate = self
        canvas.accessibilityIdentifier = "inline-handwriting-canvas"
        canvas.tool = PKInkingTool(.pen, color: LingroveTheme.accent.resolvedColor(with: traitCollection), width:4)
        guide.contentMode = .scaleAspectFit; guide.alpha = 0.18; guide.isUserInteractionEnabled = false
        addSubview(guide); addSubview(canvas)
        registerForTraitChanges([UITraitUserInterfaceStyle.self]) { (view: InlineHandwriting, _: UITraitCollection) in
            view.updateInkAppearance()
        }
        boundsObservation = scrollView.observe(\.bounds, options: [.new]) { [weak self] _, _ in
            MainActor.assumeIsolated { self?.updateClip() }
        }
    }
    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }
    func place(_ rect: CGRect, top: CGFloat, bottom: CGFloat) {
        guard let scrollView else { return }
        restoring = true
        if side > 0, side != rect.width {
            canvas.drawing = canvas.drawing.transformed(using: CGAffineTransform(scaleX:rect.width/side, y:rect.width/side))
        }
        side = rect.width; topInset = top; bottomInset = bottom
        frame = rect.offsetBy(dx:scrollView.contentOffset.x, dy:scrollView.contentOffset.y)
        canvas.frame = bounds; guide.frame = bounds
        restoring = false; updateClip()
    }
    private func updateClip() {
        guard let scrollView else { return }
        let visible = CGRect(x:scrollView.bounds.minX, y:scrollView.bounds.minY + topInset,
                             width:scrollView.bounds.width, height:max(0, scrollView.bounds.height-topInset-bottomInset))
        let clip = frame.intersection(visible)
        let mask = CAShapeLayer()
        mask.path = UIBezierPath(rect: clip.isNull ? .zero : clip.offsetBy(dx:-frame.minX, dy:-frame.minY)).cgPath
        layer.mask = mask
    }
    override func point(inside point: CGPoint, with event: UIEvent?) -> Bool {
        guard let scrollView else { return false }
        let y = point.y + frame.minY - scrollView.bounds.minY
        return y >= topInset && y < scrollView.bounds.height-bottomInset && super.point(inside:point, with:event)
    }
    func configure(finger: Bool, eraser: Bool, locked: Bool, hidden: Bool = false) {
        isHidden = hidden
        canvas.drawingPolicy = finger ? .anyInput : .pencilOnly
        canvas.isUserInteractionEnabled = !locked
        canvas.tool = eraser ? PKEraserTool(.vector) : PKInkingTool(.pen, color:LingroveTheme.accent.resolvedColor(with: traitCollection), width:4)
    }
    func restore(_ encoded: String?, reference: UIImage?, strokes: [[[String:Double]]]?) throws {
        restoring = true; defer { restoring = false }
        guide.image = reference?.withRenderingMode(.alwaysTemplate)
        guide.tintColor = LingroveTheme.accent
        if let encoded {
            guard encoded.utf8.count < 2_000_000, let data = Data(base64Encoded:encoded) else { throw ModuleError.invalid("笔迹数据无效") }
            let drawing = try PKDrawing(data:data)
            guard drawing.strokes.count <= 128 else { throw ModuleError.invalid("笔迹数量过多") }
            canvas.drawing = drawing.transformed(using:CGAffineTransform(scaleX:side, y:side))
        }
        if encoded == nil, let strokes {
            guard strokes.count <= 128 else { throw ModuleError.invalid("笔迹数量过多") }
            let ink = PKInk(.pen, color:LingroveTheme.accent.resolvedColor(with: traitCollection))
            canvas.drawing = PKDrawing(strokes:try strokes.map { points in
                guard !points.isEmpty, points.count <= 2048 else { throw ModuleError.invalid("笔迹数据无效") }
                let controls = try points.enumerated().map { index,p -> PKStrokePoint in
                    guard let x = p["x"], let y = p["y"], x.isFinite, y.isFinite, (0...1).contains(x), (0...1).contains(y) else { throw ModuleError.invalid("笔迹坐标无效") }
                    return PKStrokePoint(location:CGPoint(x:x*side,y:y*side), timeOffset:Double(index)*0.01, size:CGSize(width:4,height:4), opacity:1, force:1, azimuth:0, altitude:.pi/2)
                }
                return PKStroke(ink:ink,path:PKStrokePath(controlPoints:controls,creationDate:Date()))
            })
        }
        updateInkAppearance()
        canvas.undoManager?.removeAllActions()
    }
    private func updateInkAppearance() {
        let wasRestoring = restoring
        restoring = true
        defer { restoring = wasRestoring }
        let color = LingroveTheme.accent.resolvedColor(with: traitCollection)
        if canvas.tool is PKInkingTool { canvas.tool = PKInkingTool(.pen, color: color, width: 4) }
        canvas.drawing = PKDrawing(strokes: canvas.drawing.strokes.map { stroke in
            var updated = stroke
            updated.ink = PKInk(stroke.ink.inkType, color: color)
            return updated
        })
    }
    func command(_ name: String) {
        if name == "clear" { canvas.drawing = PKDrawing(); canvas.undoManager?.removeAllActions() }
        if name == "undo" { canvas.undoManager?.undo() }
        canvasViewDrawingDidChange(canvas)
    }
    func canvasViewDrawingDidChange(_ canvasView: PKCanvasView) {
        guard !restoring, side > 0 else { return }
        if canvas.drawing.strokes.count > 128 {
            restoring = true; canvas.drawing = PKDrawing(strokes:Array(canvas.drawing.strokes.prefix(128))); restoring = false
        }
        let strokes = canvas.drawing.strokes.map { stroke -> [[String:Double]] in
            let path = stroke.path; guard path.count > 0 else { return [] }
            let count = min(256, max(2,path.count))
            return (0..<count).map { index in
                let value = CGFloat(index)/CGFloat(count-1)*CGFloat(path.count-1)
                let point = path.interpolatedPoint(at:value).location.applying(stroke.transform)
                return ["x":Double(min(1,max(0,point.x/side))), "y":Double(min(1,max(0,point.y/side)))]
            }
        }
        let normalized = canvas.drawing.transformed(using:CGAffineTransform(scaleX:1/side,y:1/side))
        changed?(["strokes":strokes, "drawing":normalized.dataRepresentation().base64EncodedString(), "canUndo":canvas.undoManager?.canUndo ?? false])
    }
    func detach() { boundsObservation = nil; changed = nil; removeFromSuperview() }
}
