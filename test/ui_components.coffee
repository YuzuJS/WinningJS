"use strict"

jsdom = require("jsdom").jsdom
window = jsdom(null, null, features: QuerySelector: true).createWindow()
document = window.document
$ = require("jQuery").create(window)
Q = require("q")

components = do ->
    class Presenter
        constructor: (options) ->
            document.body.innerHTML = options.template()
            componentRootEl = document.body.firstChild
            componentRootEl.winControl =
                show: sinon.spy(->
                    throw new Error("No anchor set!") unless componentRootEl.winControl.anchor
                )
                hide: sinon.stub(),
                addEventListener: sinon.stub()

            @process = sinon.stub().returns(Q.resolve(componentRootEl))
            @winControl = Q.resolve(componentRootEl.winControl)

    sandboxedModule = require("sandboxed-module")
    sandboxedModule.require("../lib/ui/components", requires: "./Presenter": Presenter)

createFlyoutConstructor = components.createFlyoutConstructor

describe "UI components utility", ->
    describe "creating a flyout component", ->
        anchorEl = null
        FlyoutComponent = createFlyoutConstructor(-> "<div>My Flyout</div>")

        beforeEach -> anchorEl = document.createElement("a")

        afterEach -> $(document.body).empty()

        it "should implement the flyout component api and listen to winControl events", (done) ->
            component = new FlyoutComponent(anchor: anchorEl)
            
            expect(component).to.respondTo("show")
            expect(component).to.respondTo("hide")
            expect(component).to.have.ownProperty("anchor")

            expect(component.render().then((componentRootEl) ->
                expect(componentRootEl.winControl.addEventListener).to.have.been.calledWith("aftershow")
                expect(componentRootEl.winControl.addEventListener).to.have.been.calledWith("afterhide")
            )).to.notify(done)

        describe "on the corresponding flyout win control", ->
            it "should set the anchor if option is set", (done) ->
                component = new FlyoutComponent(anchor: anchorEl)

                expect(component.render().then((componentRootEl) ->
                    expect(componentRootEl.winControl.anchor).to.equal(anchorEl)
                )).to.notify(done)

            it "should set the anchor when the anchor property is set", (done) ->
                component = new FlyoutComponent()
                component.anchor = anchorEl

                expect(component.render().then((componentRootEl) ->
                    expect(componentRootEl.winControl.anchor).to.equal(anchorEl)
                )).to.notify(done)

            it "should set the placement if option is set", (done) ->
                component = new FlyoutComponent(placement: "top")

                expect(component.render().then((componentRootEl) ->
                    expect(componentRootEl.winControl.placement).to.equal("top")
                )).to.notify(done)

            it "should set the alignment if option is set", (done) ->
                component = new FlyoutComponent(alignment: "left")

                expect(component.render().then((componentRootEl) ->
                    expect(componentRootEl.winControl.alignment).to.equal("left")
                )).to.notify(done)

        describe "when show is invoked", ->
            it "should proxy to win control", (done) ->
                component = new FlyoutComponent(anchor: anchorEl)

                expect(component.render().then((componentRootEl) ->
                    component.show()
                    expect(componentRootEl.winControl.show).to.have.beenCalled
                )).to.notify(done)

            it "should be rejected if no anchor has been set", (done) ->
                component = new FlyoutComponent()

                expect(component.render().then((componentRootEl) ->
                    expect(component.show()).to.be.rejected.with(Error)
                )).to.notify(done)

        describe "when hide is invoked", ->
            it "should proxy to win control", (done) ->
                component = new FlyoutComponent()

                expect(component.render().then((componentRootEl) ->
                    component.hide()
                    expect(componentRootEl.winControl.hide).to.have.beenCalled
                )).to.notify(done)
