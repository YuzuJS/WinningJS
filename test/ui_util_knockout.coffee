"use strict"

Q = require("q")
makeEmitter = require("pubit").makeEmitter

{ $, document, ko, koUtils } = do ->
    jsdom = require("jsdom").jsdom
    sandboxedModule = require("sandboxed-module")

    window = jsdom(null, null, features: QuerySelector: true).createWindow()
    globals =
        window: window
        document: window.document
        navigator: window.navigator
        Error: Error # necessary for `instanceof Error` checks :-/

    $ = sandboxedModule.require("jquery-browserify", globals: globals)
    ko = sandboxedModule.require("knockoutify", globals: globals)
    koUtils = sandboxedModule.require("../lib/ui/util/knockout", globals: globals, requires: knockoutify: ko)

    return { $, document: window.document, ko, koUtils }

describe "Using the knockout util", ->

    describe "observable helper", ->
        obj = null

        beforeEach ->
           obj = prop: "hello"

        describe "observableFromProperty", ->
            observable = null

            beforeEach ->
                observable = koUtils.observableFromProperty(obj, "prop")

            it "should create an observable with the correct initial value", ->
                observable().should.equal("hello")

            it "should update the property when the observable is updated", ->
                observable("hi there")
                obj.prop.should.equal("hi there")

        describe "observableFromChangingProperty", ->
            observable = null
            publish = null

            beforeEach ->
                publish = makeEmitter(obj, events: ["propChange"])
                observable = koUtils.observableFromChangingProperty(obj, "prop")

            it "should create an observable with the correct initial value", ->
                observable().should.equal("hello")

            it "should update the property when updating the observable", ->
                observable("hi there")
                obj.prop.should.equal("hi there")

            it "should update the observable when the corresponding change event is published", ->
                publish("propChange", "hi there")
                observable().should.equal("hi there")

    describe "addBindings", ->
        beforeEach ->
            koUtils.addBindings()

        describe "when the custom binding `itemInvoked` is present in the markup", ->
            el = null
            viewModel = null

            beforeEach ->
                el = $('<div data-bind="itemInvoked: onItemInvoked">Test</div>')[0]
                viewModel = onItemInvoked: sinon.stub()

            describe "and the element owns a winControl", ->
                beforeEach ->
                    el.winControl = addEventListener: sinon.stub()
                    el.winControl.addEventListener.callsArgWith(1, el.winControl)
                    ko.applyBindings(viewModel, el)

                it "should call `addEventListener` on the winControl", ->
                    el.winControl.addEventListener.should.have.been.called

                it "should callback the `iteminvoked` event listener", ->
                    viewModel.onItemInvoked.should.have.been.calledWith(el.winControl)

        describe "when the custom binding `component` is present in the markup", ->
            parent = null
            el = null
            viewModel = null
            componentProcessPromise = null

            beforeEach ->
                parent = document.createElement("div")
                el = $('<div data-bind="component: theComponent">Test</div>')[0]
                parent.appendChild(el)

                componentProcessPromise = Q.resolve($('<div>Component One</div>')[0])
                viewModel =
                    theComponent:
                        render: sinon.spy()
                        process: sinon.stub().returns(componentProcessPromise)
                        onWinControlAvailable: sinon.spy()
            
            describe "and we have rendered components", ->
                beforeEach ->
                    ko.applyBindings(viewModel, el)

                it "should call component's `render` and `process` methods", ->
                    viewModel.theComponent.render.should.have.beenCalled
                    viewModel.theComponent.process.should.have.beenCalled

                it "should call `onWinControlAvailable` on the component if available", ->
                    componentProcessPromise.then ->
                        viewModel.theComponent.onWinControlAvailable.should.have.been.called

                it "should replace the placeholder element with the component's element", ->
                    componentProcessPromise.then ->
                        parent.innerHTML.should.equal('<div>Component One</div>')
