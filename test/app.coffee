"use strict"

sandboxedModule = require("sandboxed-module")

Windows =
    ApplicationModel: Activation:
        ActivationKind: launch: {}
        ApplicationExecutionState: terminated: {}

requireApp = (winJS = {}) ->
    winJS.Application ?= start: ->
    winJS.UI ?= processAll: ->
    winJS.UI._ElementsPool = prototype: {}

    sandboxedModule.require("../lib/app", globals: { WinJS: winJS, Windows: Windows })

describe "app", ->
    it "should call `WinJS.Application.start()`", ->
        stubWinJS = Application: start: sinon.spy()
        requireApp(stubWinJS).start()

        stubWinJS.Application.start.should.have.been.calledOnce

    describe "when an 'activated' event is triggered with kind 'launch'", ->
        beforeEach ->
            @eventObject = detail: kind: Windows.ApplicationModel.Activation.ActivationKind.launch

        it "should call `WinJS.UI.processAll()`", ->
            stubWinJS = UI: processAll: sinon.spy()
            app = requireApp(stubWinJS)
            app.start()

            stubWinJS.Application.onactivated(@eventObject)

            stubWinJS.UI.processAll.should.have.been.calledOnce

        describe "when the previous execution state is not 'terminated'", ->
            beforeEach ->
                @eventObject.detail.previousExecutionState = {}

            it "should publish a 'launch' event", ->
                stubWinJS = {}
                app = requireApp(stubWinJS)
                app.start()

                spy = sinon.spy()
                app.on("launch", spy)

                stubWinJS.Application.onactivated(@eventObject)

                spy.should.have.been.calledWith(@eventObject)

        describe "when the previous execution state is 'terminated'", ->
            beforeEach ->
                @eventObject.detail.previousExecutionState =
                    Windows.ApplicationModel.Activation.ApplicationExecutionState.terminated

            it "should publish a 'reactivate' event", ->
                stubWinJS = {}
                app = requireApp(stubWinJS)
                app.start()

                spy = sinon.spy()
                app.on("reactivate", spy)

                stubWinJS.Application.onactivated(@eventObject)

                spy.should.have.been.calledWith(@eventObject)

    describe "when the 'checkpoint' event is triggered", ->
        it "should publish a 'beforeSuspend' event", ->
            stubWinJS = {}
            app = requireApp(stubWinJS)
            app.start()

            spy = sinon.spy()
            app.on("beforeSuspend", spy)

            eventObject = {}
            stubWinJS.Application.oncheckpoint(eventObject)

            spy.should.have.been.calledWith(eventObject)
