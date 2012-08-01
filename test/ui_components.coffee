"use strict"

jsdom = require("jsdom").jsdom
window = jsdom(null, null, features: QuerySelector: true).createWindow()
document = window.document
Q = require("q")

Presenter = sinon.spy class
    constructor: (options) ->
        document.body.innerHTML = options.template()
        componentRootEl = document.body.firstChild
        componentRootEl.winControl =
            show: sinon.spy(->
                throw new Error("No anchor set!") unless componentRootEl.winControl.anchor
            )
            hide: sinon.stub(),
            addEventListener: sinon.stub()

        @use = (plugin) -> plugin.process(componentRootEl)
        @process = sinon.stub().returns(Q.resolve(componentRootEl))
        @winControl = Q.resolve(componentRootEl.winControl)

components = do ->
    sandboxedModule = require("sandboxed-module")
    sandboxedModule.require("../lib/ui/components", requires: "./Presenter": Presenter)

createFlyoutConstructor = components.createFlyoutConstructor

describe "UI components utility", ->
    describe "creating a flyout component", ->
        presenterOptsFactory = sinon.stub().returns(template: -> "<div>My Flyout</div>")
        FlyoutComponent = createFlyoutConstructor(presenterOptsFactory)
        anchorEl = null

        beforeEach -> anchorEl = document.createElement("a")
        afterEach -> document.body.innerHTML = ""

        it "should implement the flyout component api and listen to winControl events", ->
            component = new FlyoutComponent(anchor: anchorEl)

            expect(component).to.respondTo("show")
            expect(component).to.respondTo("hide")
            expect(component).to.have.ownProperty("anchor")

            component.render().then (componentRootEl) ->
                expect(componentRootEl.winControl.addEventListener).to.have.been.calledWith("aftershow")
                expect(componentRootEl.winControl.addEventListener).to.have.been.calledWith("afterhide")

        it "should pass all arguments exluding the first to the presenter options factory", ->
            new FlyoutComponent(anchor: anchorEl, 1, 2, 3)
            presenterOptsFactory.should.have.been.calledWith(1, 2, 3)

        describe "on the corresponding flyout win control", ->
            it "should set the anchor if option is set", ->
                component = new FlyoutComponent(anchor: anchorEl)

                component.render().then (componentRootEl) ->
                    expect(componentRootEl.winControl.anchor).to.equal(anchorEl)

            it "should set the anchor when the anchor property is set", ->
                component = new FlyoutComponent()
                component.anchor = anchorEl

                component.render().then (componentRootEl) ->
                    expect(componentRootEl.winControl.anchor).to.equal(anchorEl)

            it "should set the placement if option is set", ->
                component = new FlyoutComponent(placement: "top")

                component.render().then (componentRootEl) ->
                    expect(componentRootEl.winControl.placement).to.equal("top")

            it "should set the alignment if option is set", ->
                component = new FlyoutComponent(alignment: "left")

                component.render().then (componentRootEl) ->
                    expect(componentRootEl.winControl.alignment).to.equal("left")

        describe "when show is invoked", ->
            it "should proxy to win control", ->
                component = new FlyoutComponent(anchor: anchorEl)

                component.render()
                    .then((componentRootEl) ->
                        component.show()
                        return componentRootEl
                    )
                    .then (componentRootEl) ->
                        expect(componentRootEl.winControl.show).to.have.been.called

            it "should proxy to win control passing in any arguments", ->
                component = new FlyoutComponent()

                component.render()
                    .then((componentRootEl) ->
                        component.show(anchorEl)
                        return componentRootEl
                    )
                    .then (componentRootEl) ->
                        expect(componentRootEl.winControl.show).to.have.been.calledWith(anchorEl)

            it "should be rejected if no anchor has been set", ->
                component = new FlyoutComponent()

                component.render().then (componentRootEl) ->
                    expect(component.show()).to.be.rejected.with(Error)

        describe "when hide is invoked", ->
            it "should proxy to win control", ->
                component = new FlyoutComponent()

                component.render().then (componentRootEl) ->
                    component.hide()
                    expect(componentRootEl.winControl.hide).to.have.beenCalled

        describe "with plugins set", ->
            fooPlugin = process: sinon.stub()
            barPlugin = process: sinon.stub()

            it "should invoke `process` for each plugin", ->
                plugins = [fooPlugin, barPlugin]
                component = new FlyoutComponent(plugins: plugins)

                component.render().then (componentRootEl) ->
                    for plugin in plugins
                        plugin.process.should.have.been.calledWith(componentRootEl)


    describe "creating a flyout component using an options object instead of an options factory", ->
        presenterOpts = { template: -> "<div>My Flyout</div>" }
        FlyoutComponent = createFlyoutConstructor(presenterOpts)

        it "should pass the options directly to the presenter", ->
            new FlyoutComponent()
            Presenter.should.have.been.calledWith(presenterOpts)
