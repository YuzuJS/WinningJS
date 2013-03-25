"use strict"

_ = require("underscore")
sandboxedModule = require("sandboxed-module")
EventEmitter = require("events").EventEmitter

settingsCmd = {}

Windows =
    ApplicationModel: Activation:
        ActivationKind: launch: {}
        ApplicationExecutionState: terminated: {}
    UI: 
        WebUI: WebUIApplication: {}
        ApplicationSettings: SettingsCommand: -> settingsCmd

windowsSettingsCommandSpy =  sinon.spy(Windows.UI.ApplicationSettings, "SettingsCommand")

requireApp = (WinJS = {}, patches = {}) ->
    WinJS.Application ?= start: ->
    WinJS.UI ?= 
        processAll: ->
        SettingsFlyout: populateSettings: sinon.stub()

    WinJS.Binding ?= {}

    applicationEE = new EventEmitter()
    WinJS.Application.addEventListener = applicationEE.on.bind(applicationEE)
    WinJS.Application.dispatchEvent = applicationEE.emit.bind(applicationEE)

    webUIEE = new EventEmitter()
    Windows.UI.WebUI.WebUIApplication.addEventListener = webUIEE.on.bind(webUIEE)
    Windows.UI.WebUI.WebUIApplication.dispatchEvent = webUIEE.emit.bind(webUIEE)

    sandboxedModule.require(
        "../lib/app"
        globals: { WinJS: WinJS, Windows: Windows }
        requires: { "./patches": patches }
    )

describe "app", ->
    it "should call `WinJS.Application.start()`", ->
        stubWinJS = Application: start: sinon.spy()
        requireApp(stubWinJS).start()

        stubWinJS.Application.start.should.have.been.calledOnce

    it "should set `WinJS.Binding.optimizeBindingReferences` to `true`", ->
        stubWinJS = {}
        requireApp(stubWinJS).start()

        stubWinJS.Binding.optimizeBindingReferences.should.equal(true)

    it "should execute all patches", ->
        patches = { patch1: sinon.spy(), patch2: sinon.spy() }
        requireApp(undefined, patches).start()

        patches.patch1.should.have.been.called
        patches.patch2.should.have.been.called

    describe "when an 'activated' event is triggered with kind 'launch'", ->
        beforeEach ->
            @args =
                detail: kind: Windows.ApplicationModel.Activation.ActivationKind.launch
                setPromise: sinon.spy()

        it "should call `WinJS.UI.processAll` and pass the result to `args.setPromise`", ->
            processAllResult = {}
            stubWinJS = UI: processAll: sinon.stub().returns(processAllResult)
            requireApp(stubWinJS).start()

            stubWinJS.Application.dispatchEvent("activated", @args)

            stubWinJS.UI.processAll.should.have.been.calledOnce
            @args.setPromise.should.have.been.calledWith(sinon.match.same(processAllResult))

        describe "when the previous execution state is not 'terminated'", ->
            beforeEach ->
                @args.detail.previousExecutionState = {}

            it "should publish a 'launch' event", ->
                stubWinJS = {}
                app = requireApp(stubWinJS)
                app.start()

                spy = sinon.spy()
                app.on("launch", spy)

                stubWinJS.Application.dispatchEvent("activated", @args)

                spy.should.have.been.calledWith(@args)

    describe "when the 'checkpoint' event is triggered", ->
        it "should publish a 'suspend' event", ->
            stubWinJS = {}
            app = requireApp(stubWinJS)
            app.start()

            spy = sinon.spy()
            app.on("suspend", spy)

            eventObject = {}
            stubWinJS.Application.dispatchEvent("checkpoint", eventObject)

            spy.should.have.been.calledWith(eventObject)

    describe "when the 'resuming' event is triggered", ->
        it "should publish a 'resume' event", ->
            stubWinJS = {}
            app = requireApp(stubWinJS)
            app.start()

            spy = sinon.spy()
            app.on("resume", spy)

            eventObject = {}
            Windows.UI.WebUI.WebUIApplication.dispatchEvent("resuming", eventObject)

            spy.should.have.been.calledWith(eventObject)

    describe "when the WinJS 'settings' event is triggered", ->
        beforeEach ->
            @stubWinJS = {}
            app = requireApp(@stubWinJS)
            app.start()

            @spy = sinon.spy()
            app.on("settings", @spy)

            @eventObject = { detail: e: request: applicationCommands: append: sinon.stub() }
            @stubWinJS.Application.dispatchEvent("settings", @eventObject)

        it "should publish a 'settings' event", ->
            @spy.should.have.been.called

        describe "when the app settings is published", ->
            beforeEach ->
                @command = @spy.firstCall.args[0]

            it "should pass an object with an `append` method", ->
                expect(@command).respondTo("append")

            it "should call `populateSettings`", ->
                @stubWinJS.UI.SettingsFlyout.populateSettings.should.have.been.called

            describe "when the appendCommand function is called back", ->
                beforeEach ->
                    @settingsCmd = @command.append("foo", "bar", "jack")

                it "creates a `SettingsCommand` object", ->
                    windowsSettingsCommandSpy.should.have.been.calledWith("foo", "bar", "jack")

                it "append the `SettingsCommand` object to `applicationCommands`", ->
                    @eventObject.detail.e.request.applicationCommands
                        .append.should.have.been.calledWith(settingsCmd);
