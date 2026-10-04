import XCTest
final class LingroveUITests: XCTestCase {
    func testNativeEdgeExitWorksWithHomeHiddenAndChildDialogOpen() throws {
        let app = XCUIApplication()
        // Use bundled resources so this recovery test never needs a debug server.
        app.launchArguments += ["-debug.enabled", "NO"]
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
    private func waitForEnabled(_ element: XCUIElement) {
        let ready = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == true AND enabled == true"), object: element)
        XCTAssertEqual(XCTWaiter.wait(for: [ready], timeout: 40), .completed)
    }
    func testGlyphoraNativeWritingAndHistory() throws {
        let app = XCUIApplication(); app.launch()
        let entry = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Glyphora")).firstMatch
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
        let reopened = app.buttons.matching(NSPredicate(format:"label CONTAINS %@", "Glyphora")).firstMatch
        waitForEnabled(reopened); reopened.tap()
        XCTAssertTrue(app.webViews.buttons["学习"].waitForExistence(timeout:25)); app.webViews.buttons["学习"].tap()
        resumeStudy()
        waitForEnabled(submit)
        XCTAssertTrue(canvas.waitForExistence(timeout:5))
        let screenshot = XCTAttachment(screenshot:app.screenshot()); screenshot.name = "Glyphora-inline-resumed"; screenshot.lifetime = .keepAlways; add(screenshot)
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
    func testDebugModeSwitchControlsHostRefreshAndPersists() throws {
        let app = XCUIApplication(); app.launch()
        func openSettings() {
            let settings = app.buttons["应用设置"]
            XCTAssertTrue(settings.waitForExistence(timeout: 15)); settings.tap()
            XCTAssertTrue(app.switches["debug-mode-toggle"].firstMatch.waitForExistence(timeout: 5))
        }
        func toggleDebug() {
            let control = app.switches["debug-mode-toggle"].firstMatch
            let previous = control.value as? String
            control.coordinate(withNormalizedOffset: CGVector(dx: 0.9, dy: 0.5)).tap()
            XCTAssertNotEqual(control.value as? String, previous)
        }
        func openChild() {
            let entry = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Sentra")).firstMatch
            waitForEnabled(entry); entry.tap()
            XCTAssertTrue(app.webViews.buttons["设置"].waitForExistence(timeout: 25))
        }
        openSettings()
        let originalOn = app.switches["debug-mode-toggle"].firstMatch.value as? String == "1"
        if !originalOn { toggleDebug() }
        app.buttons["完成"].tap()
        XCTAssertTrue(app.buttons["重新加载子应用"].waitForExistence(timeout: 5))
        openSettings()
        toggleDebug()
        app.buttons["取消"].tap()
        XCTAssertTrue(app.buttons["重新加载子应用"].waitForExistence(timeout: 5))
        openSettings()
        XCTAssertEqual(app.switches["debug-mode-toggle"].firstMatch.value as? String, "1")
        toggleDebug()
        app.buttons["完成"].tap()
        XCTAssertFalse(app.buttons["重新加载子应用"].exists)
        openChild()
        XCTAssertFalse(app.buttons["module-reload"].exists)
        XCTAssertTrue(app.buttons["返回 Lingrove"].exists)
        app.buttons["返回 Lingrove"].tap()
        app.terminate(); app.launch()
        XCTAssertTrue(app.buttons["应用设置"].waitForExistence(timeout: 15))
        XCTAssertFalse(app.buttons["重新加载子应用"].exists)
        openSettings()
        XCTAssertEqual(app.switches["debug-mode-toggle"].firstMatch.value as? String, "0")
        toggleDebug()
        app.buttons["完成"].tap()
        XCTAssertTrue(app.buttons["重新加载子应用"].waitForExistence(timeout: 5))
        openChild()
        XCTAssertFalse(app.buttons["module-reload"].exists)
        app.buttons["返回 Lingrove"].tap()
        if !originalOn {
            openSettings(); toggleDebug(); app.buttons["完成"].tap()
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
    func testDebugSettingsDoneSavesAndCancelDiscardsDraft() throws {
        let app = XCUIApplication(); app.launch()
        func openSettings() {
            let settings = app.buttons["应用设置"]
            XCTAssertTrue(settings.waitForExistence(timeout: 15)); settings.tap()
            XCTAssertTrue(app.textFields["调试服务器地址"].waitForExistence(timeout: 5))
        }
        func address() -> String {
            let field = app.textFields["调试服务器地址"]
            let value = field.value as? String ?? ""
            return value == field.placeholderValue ? "" : value
        }
        func replaceAddress(_ value: String) {
            let field = app.textFields["调试服务器地址"]
            let existing = address()
            field.tap()
            field.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: existing.count) + value)
        }
        openSettings()
        let original = address()
        XCTAssertFalse(app.buttons["保存并重新加载子应用"].exists)
        XCTAssertLessThan(app.buttons["取消"].frame.minX, app.buttons["完成"].frame.minX)
        replaceAddress("not-a-url")
        app.buttons["完成"].tap()
        XCTAssertTrue(app.staticTexts["debug-settings-error"].waitForExistence(timeout: 5))
        app.buttons["取消"].tap()
        openSettings()
        XCTAssertEqual(address(), original)
        XCTAssertFalse(app.staticTexts["debug-settings-error"].exists)
        replaceAddress("http://127.0.0.1:1")
        app.buttons["完成"].tap()
        app.terminate(); app.launch(); openSettings()
        XCTAssertEqual(address(), "http://127.0.0.1:1/")
        replaceAddress("http://127.0.0.1:2")
        app.buttons["取消"].tap()
        openSettings()
        XCTAssertEqual(address(), "http://127.0.0.1:1/")
        replaceAddress(original)
        app.buttons["完成"].tap()
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
        let app = XCUIApplication(); app.launch()
        let entry = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Sentra")).firstMatch
        waitForEnabled(entry)
        app.buttons["重新加载子应用"].tap()
        let hostSuccess = app.staticTexts["Sentra：本地资源重新加载成功"]
        XCTAssertTrue(hostSuccess.waitForExistence(timeout: 25))
        let hostDismissed = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: hostSuccess)
        XCTAssertEqual(XCTWaiter.wait(for: [hostDismissed], timeout: 5), .completed)
        entry.tap()
        let settings = app.webViews.buttons["设置"]
        XCTAssertTrue(settings.waitForExistence(timeout: 20))
        XCTAssertFalse(app.webViews.buttons["重新加载子应用"].exists)
        let home = app.buttons["返回 Lingrove"]
        XCTAssertFalse(app.buttons["module-reload"].exists)
        home.tap()
        app.buttons["重新加载子应用"].tap()
        XCTAssertTrue(app.staticTexts["Sentra：本地资源重新加载成功"].waitForExistence(timeout: 25))
        waitForEnabled(entry); entry.tap()
        XCTAssertTrue(settings.waitForExistence(timeout: 20))
        settings.tap()
        XCTAssertTrue(app.webViews.staticTexts["学习偏好"].firstMatch.waitForExistence(timeout: 10))
    }
    func testHostModelConfigurationPersists() throws {
        let app = XCUIApplication(); app.launch()
        func openModelSettings() {
            let settings = app.buttons["应用设置"]
            XCTAssertTrue(settings.waitForExistence(timeout: 15)); settings.tap()
            let modelSettings = app.buttons["大模型配置"]
            XCTAssertTrue(modelSettings.waitForExistence(timeout: 5)); modelSettings.tap()
        }
        func replace(_ field: XCUIElement, _ text: String) {
            XCTAssertTrue(field.waitForExistence(timeout: 5)); field.tap()
            let current = field.value as? String ?? ""
            field.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: current.count) + text)
        }
        openModelSettings()
        replace(app.textFields["API Base URL"], "https://model.example/v1")
        replace(app.textFields["模型名称"], "host-ui-test")
        app.swipeUp()
        let save = app.buttons["保存"]
        XCTAssertTrue(save.waitForExistence(timeout: 5)); save.tap()
        XCTAssertTrue(app.staticTexts["已保存，所有子应用将使用此模型服务。"].waitForExistence(timeout: 5))
        app.terminate(); app.launch(); openModelSettings()
        XCTAssertEqual(app.textFields["模型名称"].value as? String, "host-ui-test")
        XCTAssertEqual(app.textFields["API Base URL"].value as? String, "https://model.example/v1")
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
