import UIKit
import PencilKit

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
