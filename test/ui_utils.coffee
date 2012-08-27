"use strict"

sandboxedModule = require("sandboxed-module")

[WinJS, Windows, uiUtils] = [null, null, null]

beforeEach ->
    [WinJS, Windows] = [{}, {}]
    uiUtils = sandboxedModule.require("../lib/ui/utils", globals: { WinJS, Windows })

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
