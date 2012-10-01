"use strict"

jsdom = require("jsdom").jsdom
sandboxedModule = require("sandboxed-module")
s = require("../lib/resources").s

[window, WinJS, Windows, MSApp, uiUtils] = [null, null, null, null]

beforeEach ->
    window = jsdom(null, null, features: QuerySelector: true).createWindow()
    [WinJS, Windows, MSApp] = [{}, {}, { execUnsafeLocalFunction: (f) -> f() }]

    globals =
        window: window
        document: window.document
        WinJS: WinJS
        Windows: Windows
        MSApp: MSApp
    requires =
        domify: sandboxedModule.require("domify", { globals })
        "../resources": require("../lib/resources")

    uiUtils = sandboxedModule.require("../lib/ui/utils", { globals, requires })

describe "UI utilities", ->
    describe "scaleLength", ->
        describe "when the resolutions scale is 100", ->
            beforeEach ->
                Windows.Graphics = Display: DisplayProperties: resolutionScale: 100

            it "should return the length unchanged", ->
                uiUtils.scaleLength(314).should.equal(314)

        describe "when the resolutions scale is 180", ->
            beforeEach ->
                Windows.Graphics = Display: DisplayProperties: resolutionScale: 180

            it "should return the length multiplied by 1.8, and rounded", ->
                uiUtils.scaleLength(314).should.equal(565)

    describe "flexibleGridLayout", ->
        beforeEach ->
            @gridLayoutConstructed = {}
            WinJS.UI = GridLayout: sinon.stub().returns(@gridLayoutConstructed)

        it "should return a `WinJS.UI.GridLayout` instance created with a flexible `groupInfo` getter", ->
            result = uiUtils.flexibleGridLayout()
            constructionOptions = WinJS.UI.GridLayout.args[0][0]

            result.should.equal(@gridLayoutConstructed)

            expect(constructionOptions).to.have.property("groupInfo").that.is.a("function")
            expect(constructionOptions.groupInfo()).to.deep.equal(enableCellSpanning: true, cellWidth: 1, cellHeight: 1)

    describe "createGridLayout", ->
        beforeEach ->
            @customGridLayoutConstructed = {}
            WinJS.UI = GridLayout: sinon.stub().returns(@customGridLayoutConstructed)

        it "should return a `WinJS.UI.GridLayout` instance created with specified width and height", ->
            result = uiUtils.createGridLayout(200, 250)
            constructionOptions = WinJS.UI.GridLayout.args[0][0]

            result.should.equal(@customGridLayoutConstructed)

            expect(constructionOptions).to.have.property("groupInfo").that.is.a("function")
            expect(constructionOptions.groupInfo())
                .to.deep.equal(enableCellSpanning: true, cellWidth: 200, cellHeight: 250)

    describe "getElementFromTemplate", ->
        it "should return the element resulting from executing the template", ->
            element = uiUtils.getElementFromTemplate(-> "<section><h1>Stuff</h1><p>text</p></section>")

            element.tagName.should.equal("SECTION")
            element.querySelector("h1").textContent.should.equal("Stuff")
            element.querySelector("p").textContent.should.equal("text")

        it "should pass the `s` resource-string function to the template", ->
            template = sinon.stub().returns("<section></section>")
            uiUtils.getElementFromTemplate(template)

            template.should.have.been.calledWith(s: s)
