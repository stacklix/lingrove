import XCTest
import Network
import UIKit
final class LingroveUITests: XCTestCase {
    func testModuleStatusBarMatchesPageInLightMode() throws { try checkModuleBackgrounds(appearance: "light") }
    func testModuleStatusBarMatchesPageInDarkMode() throws { try checkModuleBackgrounds(appearance: "dark") }

    private func checkModuleBackgrounds(appearance: String) throws {
        let app = XCUIApplication()
        app.launchArguments += ["-app.appearance", appearance, "-resources.mode", "bundled",
                                "-app.language", "zh-Hans", "-AppleLanguages", "(zh-Hans)"]
        app.launch()
        defer { app.terminate() }
        for name in ["Sentra", "Alphi", "Lexis", "Verso", "Polykeys"] {
            let entry = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", name)).firstMatch
            waitForEnabled(entry)
            entry.tap()
            let webView = app.webViews.firstMatch
            XCTAssertTrue(webView.waitForExistence(timeout: 20))
            let statusBar = app.statusBars.firstMatch
            guard statusBar.exists, statusBar.frame.height > 0 else { throw XCTSkip("A visible status bar is required") }
            XCTAssertGreaterThanOrEqual(webView.frame.minY, statusBar.frame.maxY - 1,
                                        "Page controls must remain below the status bar")
            // Sample blank areas below the clock/camera and between the Home
            // button and right-hand page actions, rather than glyph pixels.
            let x = app.frame.minX + app.frame.width * 0.3
            let statusPoint = CGPoint(x: x, y: statusBar.frame.maxY - 3)
            let pagePoint = CGPoint(x: x, y: webView.frame.minY + 12)
            var lastScreenshot: XCUIScreenshot?
            var sampledColors: [[Int]] = []
            let matching = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
                let screenshot = app.screenshot()
                lastScreenshot = screenshot
                guard let status = self.backgroundPixel(screenshot, at: statusPoint, frame: app.frame),
                      let canvas = self.backgroundPixel(screenshot, at: pagePoint, frame: app.frame) else { return false }
                sampledColors = [status, canvas]
                return zip(status, canvas).allSatisfy { pair in abs(pair.0 - pair.1) <= 2 }
            }, object: nil)
            let result = XCTWaiter.wait(for: [matching], timeout: 10)
            if let screenshot = lastScreenshot {
                let attachment = XCTAttachment(screenshot: screenshot)
                attachment.name = "\(name)-status-bar-background-\(appearance)"
                attachment.lifetime = .keepAlways
                add(attachment)
            }
            XCTAssertEqual(result, .completed, "\(name) \(appearance): status bar and page RGB \(sampledColors)")
            app.buttons["module-home"].tap()
        }
    }

    private func backgroundPixel(_ screenshot: XCUIScreenshot, at point: CGPoint, frame: CGRect) -> [Int]? {
        guard let image = screenshot.image.cgImage, frame.width > 0, frame.height > 0 else { return nil }
        let x = (point.x - frame.minX) * CGFloat(image.width) / frame.width
        let y = (point.y - frame.minY) * CGFloat(image.height) / frame.height
        guard let pixel = image.cropping(to: CGRect(x: x.rounded(.down), y: y.rounded(.down), width: 1, height: 1)) else { return nil }
        var rgba = [UInt8](repeating: 0, count: 4)
        let rendered = rgba.withUnsafeMutableBytes { bytes -> Bool in
            guard let context = CGContext(data: bytes.baseAddress, width: 1, height: 1,
                                          bitsPerComponent: 8, bytesPerRow: 4,
                                          space: CGColorSpaceCreateDeviceRGB(),
                                          bitmapInfo: CGBitmapInfo.byteOrder32Big.rawValue | CGImageAlphaInfo.premultipliedLast.rawValue) else { return false }
            context.draw(pixel, in: CGRect(x: 0, y: 0, width: 1, height: 1))
            return true
        }
        return rendered ? rgba.prefix(3).map(Int.init) : nil
    }

    func testModuleEditingAndDetails() { checkModuleEditingAndDetails(appearance: "light") }
    func testModuleDetailsDarkMode() { checkModuleEditingAndDetails(appearance: "dark") }
    private func checkModuleEditingAndDetails(appearance: String) {
        let app = XCUIApplication()
        app.launchArguments += ["-app.appearance", appearance]
        app.launchArguments += ["-resources.mode", "bundled", "-app.language", "zh-Hans", "-AppleLanguages", "(zh-Hans)"]
        app.launch()
        XCTAssertTrue(app.buttons["应用设置"].waitForExistence(timeout: 20))
        XCTAssertFalse(app.staticTexts["一点好奇"].exists)
        XCTAssertFalse(app.staticTexts["YOUR LANGUAGE POCKET"].exists)
        XCTAssertFalse(app.staticTexts["我的学习工具"].exists)
        XCTAssertFalse(app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "语言学习 · v")).firstMatch.exists)
        app.buttons["应用设置"].tap()
        let developerDetails = app.buttons["module-developer-details-sentra"]
        for _ in 0..<6 {
            if developerDetails.exists && developerDetails.isHittable { break }
            app.swipeUp()
        }
        XCTAssertTrue(developerDetails.isHittable)
        developerDetails.tap()
        XCTAssertTrue(app.navigationBars["Sentra"].waitForExistence(timeout: 5))
        XCTAssertEqual(app.descendants(matching: .any).matching(identifier: "module-resource-source").count, 1)
        XCTAssertFalse(app.staticTexts["安装来源"].exists)
        XCTAssertFalse(app.staticTexts["本机安装包"].exists)
        XCTAssertTrue(app.staticTexts["版本"].exists)
        XCTAssertTrue(app.staticTexts["文件名"].exists)
        XCTAssertFalse(app.staticTexts["更新日期"].exists)
        XCTAssertFalse(app.staticTexts["应用介绍"].exists)
        let developerScreenshot = XCTAttachment(screenshot: app.screenshot())
        developerScreenshot.name = "Developer-module-details-\(appearance)"
        developerScreenshot.lifetime = .keepAlways
        add(developerScreenshot)
        swipeFromLeftEdge(app)
        XCTAssertTrue(app.navigationBars["设置"].waitForExistence(timeout: 5), "A nested page swipe must return to settings")
        let edit = app.buttons["module-edit-button"]
        for _ in 0..<8 {
            if edit.exists && edit.isHittable { break }
            app.swipeUp()
        }
        XCTAssertTrue(edit.isHittable)
        XCTAssertEqual(edit.label, "编辑")
        XCTAssertFalse(app.buttons["检查更新"].exists)
        let details = app.buttons["module-details-sentra"]
        for _ in 0..<3 {
            if details.exists && details.isHittable { break }
            app.swipeUp()
        }
        XCTAssertTrue(details.isHittable)
        details.tap()
        XCTAssertTrue(app.navigationBars["Sentra"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["更新日期"].exists)
        XCTAssertTrue(app.staticTexts["应用介绍"].exists)
        XCTAssertFalse(app.staticTexts["开发模式"].exists)
        XCTAssertFalse(app.descendants(matching: .any)["module-resource-source"].firstMatch.exists)
        XCTAssertFalse(app.staticTexts["版本"].exists)
        XCTAssertFalse(app.staticTexts["文件名"].exists)
        let screenshot = XCTAttachment(screenshot: app.screenshot())
        screenshot.name = "Module-details"
        screenshot.lifetime = .keepAlways
        add(screenshot)
        app.navigationBars["Sentra"].buttons.firstMatch.tap()
        for _ in 0..<3 {
            if edit.isHittable && edit.frame.minY > app.navigationBars["设置"].frame.maxY + 8 { break }
            app.swipeDown()
        }
        edit.tap()
        XCTAssertEqual(edit.label, "完成")
        let detailRows = app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH %@", "module-details-"))
        XCTAssertFalse(detailRows.firstMatch.exists)
        edit.tap()
        XCTAssertEqual(edit.label, "编辑")
        XCTAssertTrue(detailRows.firstMatch.waitForExistence(timeout: 5))
        app.coordinate(withNormalizedOffset: CGVector(dx: 0.35, dy: 0.5))
            .press(forDuration: 0.05, thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.8, dy: 0.5)))
        XCTAssertTrue(app.navigationBars["设置"].exists, "A drag away from the edge must not close settings")
        swipeFromLeftEdge(app)
        XCTAssertTrue(app.navigationBars["设置"].waitForNonExistence(timeout: 5))
        XCTAssertTrue(app.buttons["应用设置"].waitForExistence(timeout: 5))
        let homeScreenshot = XCTAttachment(screenshot: app.screenshot())
        homeScreenshot.name = "Home-list-\(appearance)"
        homeScreenshot.lifetime = .keepAlways
        add(homeScreenshot)
    }

    func testLLMUsageSettingsEntry() {
        let app = XCUIApplication()
        app.launchArguments += ["-resources.mode", "bundled", "-app.language", "zh-Hans", "-AppleLanguages", "(zh-Hans)"]
        app.launch()
        let settings = app.buttons["应用设置"]
        XCTAssertTrue(settings.waitForExistence(timeout: 20))
        settings.tap()
        let configuration = app.buttons["通用模型"]
        for _ in 0..<5 {
            if configuration.exists && configuration.isHittable { break }
            app.swipeUp()
        }
        XCTAssertTrue(configuration.isEnabled)
        configuration.tap()
        XCTAssertTrue(app.navigationBars["通用模型"].waitForExistence(timeout: 5))
        app.navigationBars["通用模型"].buttons.firstMatch.tap()
        let usage = app.buttons["模型使用统计"]
        for _ in 0..<5 {
            if usage.exists && usage.isHittable { break }
            app.swipeUp()
        }
        XCTAssertTrue(usage.exists)
        XCTAssertTrue(usage.isEnabled)
        let screenshot = XCTAttachment(screenshot: app.screenshot())
        screenshot.name = "Settings-navigation-and-reordering"
        screenshot.lifetime = .keepAlways
        add(screenshot)
        usage.tap()
        XCTAssertTrue(app.staticTexts["用量总览"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["发送 Token"].firstMatch.exists)
        XCTAssertTrue(app.staticTexts["接收 Token"].firstMatch.exists)
        app.segmentedControls.buttons["语音模型"].tap()
        XCTAssertTrue(app.staticTexts["提交字符数"].firstMatch.waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["请求数"].firstMatch.exists)
        XCTAssertTrue(app.staticTexts["每日字符用量"].exists)
        XCTAssertFalse(app.staticTexts["按模型"].exists)
        app.segmentedControls.buttons["通用模型"].tap()
        XCTAssertTrue(app.staticTexts["发送 Token"].firstMatch.waitForExistence(timeout: 5))
    }

    func testNativeEdgeExitWorksWithHomeHiddenAndChildDialogOpen() throws {
        let app = XCUIApplication()
        // Use bundled resources so this recovery test never needs a debug server.
        app.launchArguments += ["-resources.mode", "bundled"]
        app.launch()
        let entry = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Sentra")).firstMatch
        waitForEnabled(entry); entry.tap()
        let settings = app.webViews.buttons["设置"]
        XCTAssertTrue(settings.waitForExistence(timeout: 25)); settings.tap()
        let home = app.buttons["module-home"]
        let hidden = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: home)
        XCTAssertEqual(XCTWaiter.wait(for: [hidden], timeout: 5), .completed)
        XCTAssertTrue(app.buttons["module-exit-edge"].exists)

        // Ordinary drags within the child must not return to the host.
        app.coordinate(withNormalizedOffset: CGVector(dx: 0.35, dy: 0.5))
            .press(forDuration: 0.05, thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.8, dy: 0.5)))
        XCTAssertFalse(app.buttons["应用设置"].exists)
        func exitFromEdge() {
            app.coordinate(withNormalizedOffset: CGVector(dx: 0.005, dy: 0.5))
                .press(forDuration: 0.05, thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.7, dy: 0.5)))
            XCTAssertTrue(app.buttons["应用设置"].waitForExistence(timeout: 5))
        }
        exitFromEdge()
        // Cached child pages retain their dialog; the native escape works again.
        waitForEnabled(entry); entry.tap()
        XCTAssertTrue(app.buttons["module-exit-edge"].waitForExistence(timeout: 5))
        XCTAssertFalse(home.exists)
        exitFromEdge()
    }
    private func swipeFromLeftEdge(_ app: XCUIApplication) {
        app.coordinate(withNormalizedOffset: CGVector(dx: 0.005, dy: 0.5))
            .press(forDuration: 0.05, thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.7, dy: 0.5)))
    }
    private func waitForEnabled(_ element: XCUIElement) {
        let ready = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == true AND enabled == true"), object: element)
        XCTAssertEqual(XCTWaiter.wait(for: [ready], timeout: 40), .completed)
    }
    func testAlphiNativeWritingAndHistory() throws {
        let app = XCUIApplication(); app.launch()
        let entry = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Alphi")).firstMatch
        waitForEnabled(entry); entry.tap()
        let studyTab = app.webViews.buttons["学习"]
        XCTAssertTrue(studyTab.waitForExistence(timeout:25)); studyTab.tap()
        func resumeStudy() {
            let start = app.webViews.buttons.matching(NSPredicate(format:"label CONTAINS %@ OR label CONTAINS %@", "开始学习", "继续学习")).firstMatch
            XCTAssertTrue(start.waitForExistence(timeout:5)); start.tap()
            let resume = app.webViews.buttons.matching(NSPredicate(format:"label BEGINSWITH %@", "从 ")).firstMatch
            XCTAssertTrue(resume.waitForExistence(timeout:5)); resume.tap()
        }
        resumeStudy()
        let trace = app.webViews.buttons.matching(NSPredicate(format:"label CONTAINS %@", "开始描摹")).firstMatch
        if trace.waitForExistence(timeout:3) { trace.tap() }
        let submit = app.webViews.buttons.matching(NSPredicate(format:"label CONTAINS %@", "检查书写")).firstMatch
        XCTAssertTrue(submit.waitForExistence(timeout:5))
        let finger = app.webViews.descendants(matching:.any).matching(NSPredicate(format:"label == %@", "允许手指")).firstMatch
        finger.tap()
        let canvas = app.descendants(matching:.any).matching(identifier:"inline-handwriting-canvas").firstMatch
        XCTAssertTrue(canvas.waitForExistence(timeout:5))
        XCTAssertFalse(app.buttons["handwriting-submit"].exists)
        canvas.coordinate(withNormalizedOffset:CGVector(dx:0.3,dy:0.25)).press(forDuration:0.05,thenDragTo:canvas.coordinate(withNormalizedOffset:CGVector(dx:0.65,dy:0.75)))
        waitForEnabled(submit)
        app.webViews.buttons["学习"].tap()
        app.terminate(); app.launch()
        let reopened = app.buttons.matching(NSPredicate(format:"label CONTAINS %@", "Alphi")).firstMatch
        waitForEnabled(reopened); reopened.tap()
        XCTAssertTrue(app.webViews.buttons["学习"].waitForExistence(timeout:25)); app.webViews.buttons["学习"].tap()
        resumeStudy()
        waitForEnabled(submit)
        XCTAssertTrue(canvas.waitForExistence(timeout:5))
        let screenshot = XCTAttachment(screenshot:app.screenshot()); screenshot.name = "Alphi-inline-resumed"; screenshot.lifetime = .keepAlways; add(screenshot)
        submit.tap()
        let independent = app.webViews.buttons.matching(NSPredicate(format:"label CONTAINS %@", "独立书写 →")).firstMatch
        XCTAssertTrue(independent.waitForExistence(timeout:10))
        app.webViews.buttons["测试"].tap()
        XCTAssertTrue(app.webViews.staticTexts["测试记录"].waitForExistence(timeout:5))
        app.webViews.buttons["字母"].tap()
        let letter = app.webViews.buttons["查看 д 的笔顺"]
        XCTAssertTrue(letter.waitForExistence(timeout:5)); letter.tap()
        XCTAssertTrue(app.webViews.buttons["练习这个字母 →"].waitForExistence(timeout:5))
    }
    private func tapSwitch(_ element: XCUIElement) {
        element.coordinate(withNormalizedOffset: CGVector(dx: 0.9, dy: 0.5)).tap()
    }
    private func debugFields(_ app: XCUIApplication) -> XCUIElementQuery {
        app.textFields.matching(NSPredicate(format: "identifier BEGINSWITH %@", "debug-address-"))
    }
    private func addressID(_ field: XCUIElement) -> String {
        String(field.identifier.dropFirst("debug-address-".count))
    }
    private func addressSelection(_ app: XCUIApplication, _ field: XCUIElement) -> XCUIElement {
        app.buttons["debug-address-select-\(addressID(field))"]
    }
    private func addressResult(_ app: XCUIApplication, _ field: XCUIElement) -> XCUIElement {
        app.staticTexts["debug-address-result-\(addressID(field))"]
    }
    private func replaceDebugAddress(_ field: XCUIElement, _ value: String) {
        let original = field.value as? String ?? ""
        let count = original == field.placeholderValue ? 0 : original.count
        field.tap()
        if count > 0 {
            field.press(forDuration: 1.2)
            let selectAll = XCUIApplication().menuItems.matching(NSPredicate(format: "label IN %@", ["全选", "Select All"])).firstMatch
            XCTAssertTrue(selectAll.waitForExistence(timeout: 3))
            selectAll.tap()
        }
        field.typeText(value)
        XCTAssertEqual(field.value as? String, value)
        field.typeText("\n")
    }
    private func prepareDebugSettings(_ app: XCUIApplication) {
        XCTAssertTrue(app.buttons["应用设置"].waitForExistence(timeout: 20))
        app.buttons["应用设置"].tap()
        app.buttons["debug-settings-disclosure"].tap()
        let mode = app.switches["debug-mode-toggle"].firstMatch
        XCTAssertTrue(mode.waitForExistence(timeout: 5))
        if mode.value as? String == "1" { tapSwitch(mode) }
        let deletes = app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH %@", "debug-address-delete-"))
        for _ in 0..<20 {
            guard deletes.firstMatch.exists else { break }
            deletes.firstMatch.tap()
        }
        XCTAssertEqual(debugFields(app).count, 0)
        app.buttons["debug-add-address"].tap()
        XCTAssertEqual(debugFields(app).count, 1)
    }
    func testDebugModeSwitchControlsHostRefreshAndPersists() throws {
        let listener = try NWListener(using: .tcp, on: .any)
        let ready = expectation(description: "Debug server ready")
        listener.stateUpdateHandler = { if case .ready = $0 { ready.fulfill() } }
        listener.newConnectionHandler = { connection in
            connection.start(queue: .global())
            connection.receive(minimumIncompleteLength: 1, maximumLength: 65536) { _, _, _, _ in
                let body = #"{"modules":[{"id":"sentra","name":"Sentra","entry":"index.html","version":"20261023","minHostVersion":"1.3.0","bridgeVersion":1,"stateSchemaVersion":1,"allowedOrigins":[]}]}"#
                let response = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: \(body.utf8.count)\r\nConnection: close\r\n\r\n\(body)"
                connection.send(content: Data(response.utf8), completion: .contentProcessed { _ in connection.cancel() })
            }
        }
        listener.start(queue: .global())
        defer { listener.cancel() }
        wait(for: [ready], timeout: 5)
        let url = "http://127.0.0.1:\(try XCTUnwrap(listener.port).rawValue)"
        let app = XCUIApplication()
        app.launchArguments += ["-app.language", "zh-Hans", "-AppleLanguages", "(zh-Hans)"]
        app.launch()
        prepareDebugSettings(app)
        let first = debugFields(app).element(boundBy: 0)
        replaceDebugAddress(first, url)
        app.buttons["debug-add-address"].tap()
        let second = debugFields(app).element(boundBy: 1)
        replaceDebugAddress(second, url + "/second")
        let firstID = addressID(first), secondID = addressID(second)
        func enable(_ field: XCUIElement) {
            addressSelection(app, field).tap()
            XCTAssertEqual(app.switches["debug-mode-toggle"].firstMatch.value as? String, "0")
            tapSwitch(app.switches["debug-mode-toggle"].firstMatch)
            XCTAssertTrue(addressResult(app, field).waitForExistence(timeout: 15))
            XCTAssertTrue(addressResult(app, field).label.contains("连接成功"))
            XCTAssertTrue(addressSelection(app, field).isSelected)
            XCTAssertEqual(app.switches["debug-mode-toggle"].firstMatch.value as? String, "1")
        }
        enable(first)
        app.buttons["debug-settings-disclosure"].tap()
        XCTAssertEqual(debugFields(app).count, 0)
        XCTAssertTrue(app.switches["debug-mode-toggle"].firstMatch.isHittable)
        tapSwitch(app.switches["debug-mode-toggle"].firstMatch)
        XCTAssertEqual(app.switches["debug-mode-toggle"].firstMatch.value as? String, "0")
        app.buttons["debug-settings-disclosure"].tap()
        enable(second)
        XCTAssertFalse(addressSelection(app, first).isSelected)
        let addressesScreenshot = XCTAttachment(screenshot: app.screenshot())
        addressesScreenshot.name = "Multiple-debug-addresses-one-active"
        addressesScreenshot.lifetime = .keepAlways
        add(addressesScreenshot)
        // Editing a selected address disables it until a fresh check passes.
        replaceDebugAddress(second, "http://127.0.0.1:1")
        XCTAssertTrue(addressSelection(app, second).isSelected)
        tapSwitch(app.switches["debug-mode-toggle"].firstMatch)
        XCTAssertTrue(addressResult(app, second).waitForExistence(timeout: 15))
        XCTAssertTrue(addressResult(app, second).label.contains("连接失败"))
        XCTAssertTrue(addressSelection(app, second).isSelected)
        XCTAssertEqual(app.switches["debug-mode-toggle"].firstMatch.value as? String, "0")
        replaceDebugAddress(second, url + "/second")
        enable(second)
        app.navigationBars["设置"].buttons.firstMatch.tap()
        app.terminate(); app.launch()
        app.buttons["应用设置"].tap()
        app.buttons["debug-settings-disclosure"].tap()
        let restoredFirst = app.textFields["debug-address-\(firstID)"]
        let restoredSecond = app.textFields["debug-address-\(secondID)"]
        XCTAssertEqual(restoredFirst.value as? String, url)
        XCTAssertEqual(restoredSecond.value as? String, url + "/second")
        XCTAssertFalse(addressSelection(app, restoredFirst).isSelected)
        XCTAssertTrue(addressSelection(app, restoredSecond).isSelected)
        app.buttons["debug-address-delete-\(secondID)"].tap()
        XCTAssertFalse(restoredSecond.exists)
        XCTAssertFalse(addressSelection(app, restoredFirst).isSelected)
        XCTAssertFalse(app.switches["snapshot-toggle"].exists)
        XCTAssertEqual(app.switches["debug-mode-toggle"].firstMatch.value as? String, "0")
        XCTAssertEqual(debugFields(app).count, 1)
        addressSelection(app, restoredFirst).tap()
        tapSwitch(app.switches["debug-mode-toggle"].firstMatch)
        XCTAssertTrue(addressResult(app, restoredFirst).waitForExistence(timeout: 15))
        XCTAssertFalse(app.switches["snapshot-toggle"].exists)
        XCTAssertTrue(restoredFirst.exists)
        tapSwitch(app.switches["debug-mode-toggle"].firstMatch)
        app.navigationBars["设置"].buttons.firstMatch.tap()
        XCTAssertFalse(app.buttons["重新加载子应用"].exists)
        let verso = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Verso")).firstMatch
        waitForEnabled(verso); verso.tap()
        XCTAssertTrue(app.webViews.buttons["导入文章"].waitForExistence(timeout: 20))
    }
    func testDebugTokenFailureUsesNormalConnectionErrorAndManualSettings() throws {
        let listener = try NWListener(using: .tcp, on: .any)
        let ready = expectation(description: "Token protected debug server ready")
        listener.stateUpdateHandler = { if case .ready = $0 { ready.fulfill() } }
        listener.newConnectionHandler = { connection in
            connection.start(queue: .global())
            connection.receive(minimumIncompleteLength: 1, maximumLength: 65536) { data, _, _, _ in
                let request = String(data: data ?? Data(), encoding: .utf8) ?? ""
                let authorized = request.components(separatedBy: "\r\n").contains { line in
                    let fields = line.split(separator: ":", maxSplits: 1)
                    return fields.count == 2 && fields[0].lowercased() == "stack-pass"
                        && String(fields[1]).trimmingCharacters(in: .whitespaces) == "Ui12Ab"
                }
                let catalog = #"{"modules":[{"id":"sentra","name":"Sentra","entry":"index.html","version":"20261023","minHostVersion":"1.3.0","bridgeVersion":1,"stateSchemaVersion":1,"allowedOrigins":[]}]}"#
                let body = authorized && !request.hasPrefix("HEAD ") ? catalog : ""
                let status = authorized ? "200 OK" : "401 Unauthorized"
                let response = "HTTP/1.1 \(status)\r\nContent-Type: application/json\r\nWWW-Authenticate: Stack-Pass realm=\"Lingrove Debug\"\r\nX-Lingrove-Debug-Auth: Stack-Pass\r\nContent-Length: \(body.utf8.count)\r\nConnection: close\r\n\r\n\(body)"
                connection.send(content: Data(response.utf8), completion: .contentProcessed { _ in connection.cancel() })
            }
        }
        listener.start(queue: .global())
        defer { listener.cancel() }
        wait(for: [ready], timeout: 5)
        let url = "http://127.0.0.1:\(try XCTUnwrap(listener.port).rawValue)"
        let app = XCUIApplication()
        app.launchArguments += ["-app.language", "zh-Hans", "-AppleLanguages", "(zh-Hans)"]
        app.launch()
        defer { app.terminate() }
        prepareDebugSettings(app)
        let field = debugFields(app).firstMatch
        replaceDebugAddress(field, url)
        addressSelection(app, field).tap()
        tapSwitch(app.switches["debug-mode-toggle"].firstMatch)
        let token = app.textFields["debug-token-input"]
        let result = addressResult(app, field)
        XCTAssertTrue(result.waitForExistence(timeout: 10))
        XCTAssertTrue(result.label.contains("HTTP 401"))
        XCTAssertFalse(token.exists, "HTTP errors must not open Token settings")
        XCTAssertEqual(app.switches["debug-mode-toggle"].firstMatch.value as? String, "0")
        let tokenSettings = app.buttons["debug-address-token-\(addressID(field))"]
        tokenSettings.tap()
        XCTAssertTrue(token.waitForExistence(timeout: 5))
        app.buttons["debug-token-cancel"].tap()
        XCTAssertEqual(app.switches["debug-mode-toggle"].firstMatch.value as? String, "0")
        tokenSettings.tap()
        XCTAssertTrue(token.waitForExistence(timeout: 5))
        token.tap(); token.typeText("Bad123")
        app.buttons["debug-token-save"].tap()
        XCTAssertTrue(token.waitForNonExistence(timeout: 5))
        XCTAssertEqual(app.switches["debug-mode-toggle"].firstMatch.value as? String, "0")
        tapSwitch(app.switches["debug-mode-toggle"].firstMatch)
        XCTAssertTrue(result.waitForExistence(timeout: 10))
        XCTAssertTrue(result.label.contains("HTTP 401"))
        XCTAssertFalse(token.exists, "A saved invalid Token must also use the normal error")
        XCTAssertEqual(app.switches["debug-mode-toggle"].firstMatch.value as? String, "0")
        tokenSettings.tap()
        XCTAssertTrue(token.waitForExistence(timeout: 5))
        token.tap()
        token.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: "Bad123".count))
        token.typeText("Ui12Ab")
        app.buttons["debug-token-save"].tap()
        XCTAssertTrue(token.waitForNonExistence(timeout: 5))
        XCTAssertEqual(app.switches["debug-mode-toggle"].firstMatch.value as? String, "0", "Saving settings must not enable debug mode automatically")
        tapSwitch(app.switches["debug-mode-toggle"].firstMatch)
        let enabled = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            app.switches["debug-mode-toggle"].firstMatch.value as? String == "1"
        }, object: nil)
        wait(for: [enabled], timeout: 15)
        XCTAssertTrue(app.otherElements["debug-active-token-auth"].exists || app.staticTexts["当前地址采用 Token 认证"].exists)
        tapSwitch(app.switches["debug-mode-toggle"].firstMatch)
    }
    func testDebugConnectionFormLightMode() { checkDebugConnectionForm(appearance: "light") }
    func testDebugConnectionFormDarkMode() { checkDebugConnectionForm(appearance: "dark") }
    private func checkDebugConnectionForm(appearance: String) {
        let app = XCUIApplication()
        app.launchArguments += ["-app.appearance", appearance, "-app.language", "zh-Hans", "-AppleLanguages", "(zh-Hans)"]
        app.launch()
        prepareDebugSettings(app)
        let field = debugFields(app).firstMatch
        XCTAssertTrue((field.placeholderValue ?? "").isEmpty)
        XCTAssertFalse(app.switches["debug-mode-toggle"].firstMatch.isEnabled)
        addressSelection(app, field).tap()
        tapSwitch(app.switches["debug-mode-toggle"].firstMatch)
        let result = addressResult(app, field)
        XCTAssertTrue(result.waitForExistence(timeout: 10))
        XCTAssertTrue(result.label.contains("请先填写"))
        XCTAssertEqual(app.switches["debug-mode-toggle"].firstMatch.value as? String, "0")
        XCTAssertTrue(field.isHittable, "An empty address must remain editable")
        replaceDebugAddress(field, "http://127.0.0.1:1")
        tapSwitch(app.switches["debug-mode-toggle"].firstMatch)
        XCTAssertTrue(result.waitForExistence(timeout: 15))
        XCTAssertTrue(result.label.contains("连接失败"))
        XCTAssertTrue(addressSelection(app, field).isSelected)
        XCTAssertEqual(app.switches["debug-mode-toggle"].firstMatch.value as? String, "0")
        XCTAssertTrue(field.exists)
        let screenshot = XCTAttachment(screenshot: app.screenshot())
        screenshot.name = "Debug-address-failure-\(appearance)"
        screenshot.lifetime = .keepAlways
        add(screenshot)
        app.buttons["debug-settings-disclosure"].tap()
        XCTAssertEqual(debugFields(app).count, 0)
        for id in ["alphi", "lexis", "verso", "sentra"] {
            XCTAssertTrue(app.buttons["module-developer-details-\(id)"].exists)
        }
        app.navigationBars["设置"].buttons.firstMatch.tap()
        app.terminate(); app.launch()
        for name in ["Alphi", "Lexis", "Verso", "Sentra"] {
            waitForEnabled(app.buttons.matching(NSPredicate(format: "label CONTAINS %@", name)).firstMatch)
        }
    }
    func testKeyboardReturnKeyIsDoneWithoutExtraConfirmationBar() throws {
        let app = XCUIApplication(); app.launch()
        let entry = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Sentra")).firstMatch
        waitForEnabled(entry); entry.tap()
        let input = app.webViews.textViews.firstMatch
        XCTAssertTrue(input.waitForExistence(timeout: 20)); input.tap()
        let keyboard = app.keyboards.firstMatch
        XCTAssertTrue(keyboard.waitForExistence(timeout: 5))
        let done = keyboard.buttons.matching(NSPredicate(format: "label IN %@", ["Done", "done", "完成", "确认"])).firstMatch
        XCTAssertTrue(done.waitForExistence(timeout: 5))
        XCTAssertTrue(done.isHittable)
        XCTAssertFalse(app.webViews.buttons["确认"].exists)
        // Empty input must neither submit a request nor insert a newline.
        done.tap()
        XCTAssertTrue(keyboard.exists)
        input.typeText("Keyboard confirmation")
        XCTAssertEqual(input.value as? String, "Keyboard confirmation")
        XCTAssertTrue(done.exists)
        let screenshot = XCTAttachment(screenshot: app.screenshot())
        screenshot.name = "Sentra-system-done-key"; screenshot.lifetime = .keepAlways; add(screenshot)
        app.buttons["返回 Lingrove"].tap()
        XCTAssertFalse(app.keyboards.firstMatch.exists)
    }
    func testSavingUnchangedSettingsPreservesChildDraft() throws {
        let app = XCUIApplication(); app.launch()
        let entry = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Sentra")).firstMatch
        waitForEnabled(entry); entry.tap()
        let input = app.webViews.textViews.firstMatch
        XCTAssertTrue(input.waitForExistence(timeout: 20))
        input.tap(); input.typeText("Keep this unsent draft")
        app.buttons["返回 Lingrove"].tap()
        app.buttons["应用设置"].tap()
        app.navigationBars["设置"].buttons.firstMatch.tap()
        waitForEnabled(entry); entry.tap()
        XCTAssertTrue(input.waitForExistence(timeout: 20))
        XCTAssertEqual(input.value as? String, "Keep this unsent draft")
    }
    func testDebugSettingsAutoSaveAndReturn() throws {
        let app = XCUIApplication()
        app.launchArguments += ["-app.language", "zh-Hans", "-AppleLanguages", "(zh-Hans)"]
        app.launch()
        prepareDebugSettings(app)
        let field = debugFields(app).firstMatch
        let id = addressID(field)
        replaceDebugAddress(field, "not-a-url")
        addressSelection(app, field).tap()
        tapSwitch(app.switches["debug-mode-toggle"].firstMatch)
        XCTAssertTrue(addressResult(app, field).waitForExistence(timeout: 5))
        XCTAssertEqual(app.switches["debug-mode-toggle"].firstMatch.value as? String, "0")
        app.buttons["debug-add-address"].tap()
        XCTAssertEqual(debugFields(app).count, 2)
        swipeFromLeftEdge(app)
        XCTAssertTrue(app.navigationBars["设置"].waitForNonExistence(timeout: 5))
        XCTAssertTrue(app.buttons["应用设置"].waitForExistence(timeout: 5))
        app.terminate(); app.launch()
        app.buttons["应用设置"].tap()
        XCTAssertEqual(debugFields(app).count, 0, "Debug settings start collapsed")
        app.buttons["debug-settings-disclosure"].tap()
        let restored = app.textFields["debug-address-\(id)"]
        XCTAssertEqual(restored.value as? String, "not-a-url")
        XCTAssertTrue(addressSelection(app, restored).isSelected)
        XCTAssertEqual(debugFields(app).count, 1, "Blank rows must not persist")
        app.buttons["debug-address-delete-\(id)"].tap()
        app.buttons["debug-add-address"].tap()
        XCTAssertTrue(debugFields(app).firstMatch.isHittable)
        app.navigationBars["设置"].buttons.firstMatch.tap()
        app.buttons["应用设置"].tap()
        app.buttons["debug-settings-disclosure"].tap()
        XCTAssertEqual(debugFields(app).count, 0, "An empty configuration must not persist")
        XCTAssertFalse(app.switches["debug-mode-toggle"].firstMatch.isEnabled)
        app.navigationBars["设置"].buttons.firstMatch.tap()
    }

    func testChildPageDoesNotZoomWithPinch() throws {
        let app = XCUIApplication(); app.launch()
        let entry = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Sentra")).firstMatch
        waitForEnabled(entry); entry.tap()
        let settings = app.webViews.buttons["设置"]
        XCTAssertTrue(settings.waitForExistence(timeout: 25))
        let original = settings.frame
        app.webViews.firstMatch.pinch(withScale: 2, velocity: 1)
        XCTAssertEqual(settings.frame.width, original.width, accuracy: 1)
        XCTAssertEqual(settings.frame.minX, original.minX, accuracy: 1)
        app.webViews.firstMatch.pinch(withScale: 0.5, velocity: -1)
        XCTAssertEqual(settings.frame.width, original.width, accuracy: 1)
        XCTAssertEqual(settings.frame.minX, original.minX, accuracy: 1)
        XCTAssertFalse(app.otherElements["module-loading"].exists)
        XCTAssertTrue(app.buttons["返回 Lingrove"].exists)
        XCTAssertFalse(app.buttons["module-reload"].exists)
    }
    func testReloadButtonReinitializesChildPage() throws {
        let app = XCUIApplication()
        app.launchArguments += ["-resources.mode", "debug", "-debug.servers", "{}", "-app.language", "zh-Hans", "-AppleLanguages", "(zh-Hans)"]
        app.launch()
        let entry = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Sentra")).firstMatch
        waitForEnabled(entry)
        app.buttons["重新加载子应用"].tap()
        let hostSuccess = app.staticTexts["Sentra：本地资源重新加载成功"]
        XCTAssertFalse(hostSuccess.exists)
        let successButton = app.buttons["module-refresh-success"]
        XCTAssertTrue(successButton.waitForExistence(timeout: 25))
        let restored = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: successButton)
        XCTAssertEqual(XCTWaiter.wait(for: [restored], timeout: 7), .completed)
        XCTAssertTrue(app.buttons["module-refresh"].exists)
        entry.tap()
        let settings = app.webViews.buttons["设置"]
        XCTAssertTrue(settings.waitForExistence(timeout: 20))
        XCTAssertFalse(app.webViews.buttons["重新加载子应用"].exists)
        let home = app.buttons["返回 Lingrove"]
        XCTAssertFalse(app.buttons["module-reload"].exists)
        home.tap()
        XCTAssertFalse(hostSuccess.exists)
        app.buttons["重新加载子应用"].tap()
        XCTAssertFalse(hostSuccess.exists)
        waitForEnabled(entry); entry.tap()
        XCTAssertTrue(settings.waitForExistence(timeout: 20))
        settings.tap()
        XCTAssertTrue(app.webViews.staticTexts["学习偏好"].firstMatch.waitForExistence(timeout: 10))
    }
    func testNormalDetailsUseDownloadLabelsLightMode() { checkNormalDetailsLabels(appearance: "light") }
    func testNormalDetailsUseDownloadLabelsDarkMode() { checkNormalDetailsLabels(appearance: "dark") }
    private func checkNormalDetailsLabels(appearance: String) {
        let app = XCUIApplication()
        app.launchArguments += ["-app.appearance", appearance,
                                "-app.language", "zh-Hans", "-AppleLanguages", "(zh-Hans)",
                                "-resources.mode", "bundled"]
        app.launch()
        XCTAssertTrue(app.buttons["应用设置"].waitForExistence(timeout: 20))
        app.buttons["应用设置"].tap()
        XCTAssertFalse(app.switches["snapshot-toggle"].exists)
        app.buttons["module-developer-details-sentra"].tap()
        XCTAssertTrue(app.staticTexts["下载状态"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["最近下载时间"].exists)
        XCTAssertEqual(app.descendants(matching: .any)["module-resource-source"].firstMatch.label, "应用来源")
        XCTAssertEqual(app.descendants(matching: .any).matching(identifier: "module-resource-source").count, 1)
        let source = app.descendants(matching: .any)["module-resource-source"].firstMatch.value as? String ?? ""
        XCTAssertTrue(["宿主内置", "Release 下载"].contains(source), "Unopened local pages should show their selected package source")
        XCTAssertFalse(app.staticTexts["资源地址"].exists)
        XCTAssertFalse(app.staticTexts["刷新状态"].exists)
        XCTAssertFalse(app.staticTexts["最近刷新时间"].exists)
        let screenshot = XCTAttachment(screenshot: app.screenshot())
        screenshot.name = "Normal-download-details-\(appearance)"; screenshot.lifetime = .keepAlways; add(screenshot)
    }

    func testRefreshStatusInSettingsLightMode() throws { try checkRefreshStatusInSettings(appearance: "light", fails: false) }
    func testRefreshStatusInSettingsDarkMode() throws { try checkRefreshStatusInSettings(appearance: "dark", fails: true) }
    private func checkRefreshStatusInSettings(appearance: String, fails: Bool) throws {
        let app = XCUIApplication()
        let listener = try NWListener(using: .tcp, on: .any)
        let ready = expectation(description: "Resource server ready")
        listener.stateUpdateHandler = { if case .ready = $0 { ready.fulfill() } }
        listener.newConnectionHandler = { connection in
            connection.start(queue: .global())
            connection.receive(minimumIncompleteLength: 1, maximumLength: 65536) { _, _, _, _ in
                let body = "<html><body><script>window.webkit.messageHandlers.lingrove.postMessage({version:1,method:'runtime.ready',params:{}})</script></body></html>"
                let response = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: \(body.utf8.count)\r\nConnection: close\r\n\r\n\(body)"
                connection.send(content: Data(response.utf8), completion: .contentProcessed { _ in connection.cancel() })
            }
        }
        listener.start(queue: .global())
        defer { listener.cancel() }
        wait(for: [ready], timeout: 5)
        let port = fails ? 1 : Int(try XCTUnwrap(listener.port).rawValue)
        let servers = "{\"addresses\":[{\"id\":\"test\",\"url\":\"http://127.0.0.1:\(port)\"}],\"activeID\":\"test\"}"
        // UserDefaults parses argument values as property lists; quote the JSON as a string.
        let serverArgument = String(data: try JSONSerialization.data(withJSONObject: servers, options: .fragmentsAllowed), encoding: .utf8)!
        app.launchArguments += ["-resources.mode", "debug", "-debug.servers", serverArgument,
                                "-app.appearance", appearance, "-app.language", "zh-Hans", "-AppleLanguages", "(zh-Hans)"]
        app.launch()
        let refresh = app.buttons["重新加载子应用"]
        XCTAssertTrue(refresh.waitForExistence(timeout: 20))
        refresh.tap()
        app.buttons["应用设置"].tap()
        let expected = fails ? "刷新失败" : "刷新成功"
        let resultRows = app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH %@ AND label CONTAINS %@", "module-developer-details-", expected))
        let allFinished = XCTNSPredicateExpectation(predicate: NSPredicate(format: "count == 5"), object: resultRows)
        XCTAssertEqual(XCTWaiter.wait(for: [allFinished], timeout: 25), .completed)
        XCTAssertFalse(app.staticTexts["debug-reload-feedback"].exists)
        let listScreenshot = XCTAttachment(screenshot: app.screenshot())
        listScreenshot.name = "Refresh-status-list-\(appearance)"; listScreenshot.lifetime = .keepAlways; add(listScreenshot)
        let disappeared = XCTNSPredicateExpectation(predicate: NSPredicate(format: "count == 0"), object: resultRows)
        XCTAssertEqual(XCTWaiter.wait(for: [disappeared], timeout: 7), .completed)
        XCTAssertTrue(app.buttons["module-developer-details-sentra"].exists)
        XCTAssertFalse(app.staticTexts["尚未刷新"].exists)
        let expiredScreenshot = XCTAttachment(screenshot: app.screenshot())
        expiredScreenshot.name = "Refresh-status-hidden-\(appearance)"; expiredScreenshot.lifetime = .keepAlways; add(expiredScreenshot)
        app.buttons["module-developer-details-sentra"].tap()
        XCTAssertTrue(app.staticTexts["最近刷新时间"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.staticTexts["暂无记录"].exists)
        let message = app.staticTexts["module-refresh-result"]
        XCTAssertEqual(message.label, fails ? "网页不可用，已加载本地资源" : "网页资源刷新成功")
        XCTAssertTrue(app.descendants(matching: .any)["module-resource-source"].firstMatch.exists)
        XCTAssertEqual(app.descendants(matching: .any)["module-resource-source"].firstMatch.value as? String, fails ? "宿主内置" : "网页资源")
        XCTAssertEqual(app.descendants(matching: .any).matching(identifier: "module-resource-source").count, 1)
        XCTAssertTrue(app.staticTexts["版本"].exists)
        XCTAssertEqual(app.staticTexts["文件名"].exists, fails)
        XCTAssertFalse(app.staticTexts["本机安装包"].exists)
        XCTAssertFalse(app.staticTexts["安装来源"].exists)
        XCTAssertEqual(app.descendants(matching: .any)["module-resource-source"].firstMatch.label, "应用来源")
        XCTAssertEqual(app.staticTexts["资源地址"].exists, !fails)
        let detailScreenshot = XCTAttachment(screenshot: app.screenshot())
        detailScreenshot.name = "Refresh-time-details-\(appearance)"; detailScreenshot.lifetime = .keepAlways; add(detailScreenshot)
        app.terminate(); app.launch()
        app.buttons["应用设置"].tap()
        XCTAssertFalse(app.buttons["module-developer-details-sentra"].label.contains(expected))
        app.buttons["module-developer-details-sentra"].tap()
        XCTAssertTrue(app.staticTexts["最近刷新时间"].exists)
        XCTAssertFalse(app.staticTexts["暂无记录"].exists)
        XCTAssertEqual(message.label, fails ? "网页不可用，已加载本地资源" : "网页资源刷新成功")
        XCTAssertEqual(app.descendants(matching: .any)["module-resource-source"].firstMatch.label, "应用来源")
        XCTAssertEqual(app.descendants(matching: .any)["module-resource-source"].firstMatch.value as? String, "网页资源")
        XCTAssertTrue(app.staticTexts["资源地址"].exists)
        let pendingScreenshot = XCTAttachment(screenshot: app.screenshot())
        pendingScreenshot.name = "Pending-resource-details-\(appearance)"; pendingScreenshot.lifetime = .keepAlways; add(pendingScreenshot)
    }
    func testHostModelConfigurationPersists() throws {
        let app = XCUIApplication()
        app.launchArguments += ["-app.language", "zh-Hans", "-AppleLanguages", "(zh-Hans)"]
        app.launch()
        func openModelSettings() {
            let settings = app.buttons["应用设置"]
            XCTAssertTrue(settings.waitForExistence(timeout: 15)); settings.tap()
            let modelSettings = app.buttons["通用模型"]
            for _ in 0..<5 { if modelSettings.isHittable { break }; app.swipeUp() }
            XCTAssertTrue(modelSettings.waitForExistence(timeout: 5)); modelSettings.tap()
        }
        func replace(_ field: XCUIElement, _ text: String) {
            XCTAssertTrue(field.waitForExistence(timeout: 5)); field.tap()
            field.press(forDuration: 1.2)
            let selectAll = app.menuItems.matching(NSPredicate(format: "label IN %@", ["全选", "Select All"])).firstMatch
            XCTAssertTrue(selectAll.waitForExistence(timeout: 3))
            selectAll.tap()
            field.typeText(text)
            XCTAssertEqual(field.value as? String, text)
        }
        openModelSettings()
        replace(app.textFields["API Base URL"], "https://model.example/v1")
        replace(app.textFields["模型名称"], "host-ui-test")
        app.buttons["llm-save"].tap()
        XCTAssertTrue(app.navigationBars["设置"].waitForExistence(timeout: 5))
        app.terminate(); app.launch(); openModelSettings()
        XCTAssertEqual(app.textFields["模型名称"].value as? String, "host-ui-test")
        XCTAssertEqual(app.textFields["API Base URL"].value as? String, "https://model.example/v1")
        replace(app.textFields["模型名称"], "unsaved-model")
        app.navigationBars["通用模型"].buttons.firstMatch.tap()
        app.terminate(); app.launch(); openModelSettings()
        XCTAssertEqual(app.textFields["模型名称"].value as? String, "host-ui-test")
    }
    func testReturningHomePreservesTabScrollAndSheet() throws {
        let app = XCUIApplication(); app.launch()
        let entry = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Sentra")).firstMatch
        waitForEnabled(entry); entry.tap()
        let grammar = app.webViews.buttons["语法"]
        XCTAssertTrue(grammar.waitForExistence(timeout: 20)); grammar.tap()
        let input = app.webViews.textViews.firstMatch
        XCTAssertTrue(input.waitForExistence(timeout: 5))
        app.webViews.firstMatch.swipeUp()
        app.webViews.firstMatch.swipeUp()
        let notes = app.webViews.staticTexts["学习笔记"]
        let originalY = notes.frame.minY
        app.buttons["返回 Lingrove"].tap()
        waitForEnabled(entry); entry.tap()
        XCTAssertTrue(app.webViews.buttons["分析语法 ↗"].waitForExistence(timeout: 5))
        XCTAssertEqual(notes.frame.minY, originalY, accuracy: 8)
        app.webViews.buttons["设置"].tap()
        let preference = app.webViews.staticTexts["学习偏好"].firstMatch
        XCTAssertTrue(preference.waitForExistence(timeout: 5))
        XCTAssertEqual(app.webViews.secureTextFields.count, 0)
        app.buttons["返回 Lingrove"].tap()
        waitForEnabled(entry); entry.tap()
        XCTAssertTrue(app.webViews.buttons["取消"].waitForExistence(timeout: 5))
        XCTAssertTrue(preference.exists)
        app.webViews.buttons["取消"].tap()
    }
    func testBundledSentraLoadsAndBridgePersistsPreferences() throws {
        let app = XCUIApplication(); app.launch()
        let sentra = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Sentra")).firstMatch
        XCTAssertTrue(sentra.waitForExistence(timeout: 15)); waitForEnabled(sentra); sentra.tap()
        let settings = app.webViews.buttons["设置"]
        XCTAssertTrue(settings.waitForExistence(timeout: 20))
        let originalTabBottom = app.webViews.buttons["翻译"].frame.maxY
        let screenshot = XCTAttachment(screenshot: app.screenshot()); screenshot.name = "Sentra-iPhone"; screenshot.lifetime = .keepAlways; add(screenshot)
        app.webViews.firstMatch.swipeUp()
        let scrolled = XCTAttachment(screenshot: app.screenshot()); scrolled.name = "Sentra-scrolled"; scrolled.lifetime = .keepAlways; add(scrolled)
        XCTAssertTrue(app.buttons["返回 Lingrove"].exists)
        settings.tap()
        XCTAssertTrue(app.webViews.staticTexts["学习偏好"].firstMatch.waitForExistence(timeout: 5))
        XCTAssertEqual(app.webViews.textFields.count, 0)
        app.webViews.buttons["保存"].tap()
        let sheetClosed = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: app.webViews.buttons["保存"])
        XCTAssertEqual(XCTWaiter.wait(for: [sheetClosed], timeout: 5), .completed)
        XCTAssertEqual(app.webViews.buttons["翻译"].frame.maxY, originalTabBottom, accuracy: 3)
        XCTAssertGreaterThan(originalTabBottom, app.frame.maxY - 100)
        let fixedTabs = XCTAttachment(screenshot: app.screenshot()); fixedTabs.name = "Sentra-tabs-after-keyboard"; fixedTabs.lifetime = .keepAlways; add(fixedTabs)
        app.terminate(); app.launch()
        let reopened = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Sentra")).firstMatch
        waitForEnabled(reopened); reopened.tap()
        XCTAssertTrue(app.webViews.buttons["设置"].waitForExistence(timeout: 20)); app.webViews.buttons["设置"].tap()
        XCTAssertTrue(app.webViews.staticTexts["学习偏好"].firstMatch.waitForExistence(timeout: 5))
        app.buttons["返回 Lingrove"].tap()
        XCTAssertTrue(app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Sentra")).firstMatch.waitForExistence(timeout: 5))
    }
}


extension LingroveUITests {
    func testTTSSettingsProviderSwitching() { checkTTSSettings(style: "Light") }
    func testTTSSettingsDarkMode() { checkTTSSettings(style: "Dark") }
    private func checkTTSSettings(style: String) {
        let app = XCUIApplication()
        app.launchArguments += ["-resources.mode", "bundled", "-app.language", "zh-Hans", "-AppleLanguages", "(zh-Hans)"]
        app.launchArguments += ["-app.appearance", style.lowercased()]
        app.launch()
        XCTAssertTrue(app.buttons["应用设置"].waitForExistence(timeout: 20))
        app.buttons["应用设置"].tap()
        let entry = app.buttons["tts-settings-entry"]
        for _ in 0..<5 { if entry.isHittable { break }; app.swipeUp() }
        XCTAssertTrue(entry.isEnabled); entry.tap()
        XCTAssertTrue(app.navigationBars["语音合成"].waitForExistence(timeout: 5))
        let provider = app.buttons["tts-provider"]
        XCTAssertTrue(provider.waitForExistence(timeout: 5)); provider.tap()
        app.buttons["OpenAI"].tap()
        XCTAssertFalse(app.textFields["tts-model"].exists)
        let model = app.buttons["tts-model"]
        let voice = app.buttons["tts-voice"]
        XCTAssertTrue(model.exists); XCTAssertTrue(voice.exists)
        voice.tap(); app.buttons["Cedar"].tap()
        app.buttons["tts-language-voices"].tap()
        let japaneseVoice = app.buttons["tts-voice-ja"]
        japaneseVoice.tap(); app.buttons["Echo"].tap()
        let search = app.searchFields.firstMatch
        search.tap(); search.typeText("el")
        let greekVoice = app.buttons["tts-voice-el"]
        XCTAssertTrue(greekVoice.waitForExistence(timeout: 5))
        greekVoice.tap(); app.buttons["Nova"].tap()
        app.buttons["关闭"].tap()
        let languagesScreenshot = XCTAttachment(screenshot: app.screenshot())
        languagesScreenshot.name = "TTS-languages-" + style
        languagesScreenshot.lifetime = .keepAlways
        add(languagesScreenshot)
        app.navigationBars["按语言设置音色"].buttons.firstMatch.tap()
        model.tap(); app.buttons["tts-1"].tap()
        voice.tap(); XCTAssertFalse(app.buttons["Cedar"].exists); app.buttons["Alloy"].tap()
        XCTAssertFalse(app.textFields["tts-url"].exists)
        provider.tap(); app.buttons["minimax-cn"].tap()
        model.tap(); app.buttons["speech-2.8-turbo"].tap()
        XCTAssertTrue((model.value as? String ?? model.label).contains("speech-2.8-turbo"))
        provider.tap(); app.buttons["OpenAI"].tap()
        XCTAssertTrue((model.value as? String ?? model.label).contains("tts-1"))
        XCTAssertTrue((voice.value as? String ?? voice.label).contains("Alloy"))
        app.buttons["tts-language-voices"].tap()
        XCTAssertTrue((japaneseVoice.value as? String ?? japaneseVoice.label).contains("Echo"))
        app.navigationBars["按语言设置音色"].buttons.firstMatch.tap()
        provider.tap(); app.buttons["minimax-cn"].tap()
        let screenshot = XCTAttachment(screenshot: app.screenshot()); screenshot.name = "TTS-settings-" + style; screenshot.lifetime = .keepAlways; add(screenshot)
        XCTAssertTrue(app.buttons["tts-save"].exists)
        app.buttons["tts-save"].tap()
        XCTAssertTrue(app.navigationBars["设置"].waitForExistence(timeout: 5))
        app.buttons["tts-settings-entry"].tap()
        XCTAssertFalse(app.staticTexts["未单独设置、未指定或暂不支持的语言使用默认音色。"].exists)
        XCTAssertFalse(app.staticTexts["试听使用当前填写的配置，点击右上角保存后生效。播放的是 AI 生成语音。"].exists)
        let previewLanguage = app.buttons["tts-preview-language"]
        let sample = app.descendants(matching: .any).matching(identifier: "tts-sample").firstMatch
        for _ in 0..<4 { if previewLanguage.isHittable && sample.exists && sample.isHittable { break }; app.swipeUp() }
        previewLanguage.tap(); app.buttons["英语"].tap()
        XCTAssertTrue((sample.value as? String ?? "").contains("Hello"))
        previewLanguage.tap(); app.buttons["中文"].tap()
        XCTAssertTrue((sample.value as? String ?? "").contains("你好"))
        previewLanguage.tap(); app.buttons["日语"].tap()
        XCTAssertTrue((sample.value as? String ?? "").contains("こんにちは"))
        previewLanguage.tap(); app.buttons["俄语"].tap()
        XCTAssertTrue((sample.value as? String ?? "").contains("Здравствуйте"))
        previewLanguage.tap(); app.buttons["希腊语"].tap()
        XCTAssertTrue((sample.value as? String ?? "").contains("Γεια"))
        previewLanguage.tap(); app.buttons["默认音色"].tap()
        XCTAssertTrue((sample.value as? String ?? "").contains("你好"))
        // Explicitly saved settings persist when the page is reopened.
        app.navigationBars["语音合成"].buttons.firstMatch.tap()
        let entryAgain = app.buttons["tts-settings-entry"]
        for _ in 0..<5 { if entryAgain.isHittable { break }; app.swipeUp() }
        entryAgain.tap()
        XCTAssertTrue((app.buttons["tts-model"].value as? String ?? "").contains("speech-2.8-turbo"))
        app.buttons["tts-language-voices"].tap()
        let chineseVoice = app.buttons["tts-voice-zh"]
        chineseVoice.tap(); app.buttons["青涩青年音色"].tap()
        app.buttons["tts-language-save"].tap()
        XCTAssertTrue(app.navigationBars["语音合成"].waitForExistence(timeout: 5))
        app.terminate(); app.launch()
        XCTAssertTrue(app.buttons["应用设置"].waitForExistence(timeout: 20)); app.buttons["应用设置"].tap()
        for _ in 0..<5 { if entryAgain.isHittable { break }; app.swipeUp() }
        entryAgain.tap(); app.buttons["tts-language-voices"].tap()
        XCTAssertTrue((chineseVoice.value as? String ?? "").contains("青涩青年音色"))
        chineseVoice.tap(); app.buttons["精英青年音色"].tap()
        app.navigationBars["按语言设置音色"].buttons.firstMatch.tap()
        app.navigationBars["语音合成"].buttons.firstMatch.tap()
        entryAgain.tap(); app.buttons["tts-language-voices"].tap()
        XCTAssertTrue((chineseVoice.value as? String ?? "").contains("青涩青年音色"))
    }
}
