"use strict"

Q = require("q")
EventEmitter = require("events").EventEmitter

{ $, document, ko, koUtils } = do ->
    jsdom = require("jsdom").jsdom
    sandboxedModule = require("sandboxed-module")

    window = jsdom(null, null, features: QuerySelector: true).createWindow()
    globals =
        window: window
        document: window.document
        navigator: window.navigator

    $ = sandboxedModule.require("jquery-browserify", globals: globals)
    ko = sandboxedModule.require("knockoutify", globals: globals)
    koUtils = sandboxedModule.require("../lib/ui/util/knockout", globals: globals, requires: knockoutify: ko)

    return { $, document: window.document, ko, koUtils }

describe "Knockout custom bindings", ->
    beforeEach -> koUtils.addBindings()

    describe "itemInvoked", ->
        beforeEach ->
            @el = $('<div data-bind="itemInvoked: onItemInvoked">Test</div>')[0]
            @viewModel = onItemInvoked: sinon.spy()

        describe "and the element owns a winControl", ->
            beforeEach ->
                ee = new EventEmitter()

                @el.winControl = addEventListener: ee.on.bind(ee)
                @trigger = (args...) => ee.emit("iteminvoked", args...)

                ko.applyBindings(@viewModel, @el)

            it "should forward iteminvoked events to the specified view model method", ->
                @trigger(1, 2, 3)

                @viewModel.onItemInvoked.should.have.been.calledWith(@el.winControl, 1, 2, 3)

        describe "and the element does not own a winControl", ->
            it "should throw an informative error", ->
                (=> ko.applyBindings(@viewModel, @el)).should.throw("does not own a winControl")

    describe "component", ->
        beforeEach ->
            @el = $('<div><!-- ko component: theComponent -->Test<!-- /ko --></div>')[0]

            componentEl = $('<section>Component One</section>')[0]
            @componentProcessPromise = Q.resolve(componentEl)
            @viewModel =
                theComponent:
                    render: sinon.stub().returns(componentEl)
                    process: sinon.stub().returns(@componentProcessPromise)
                    onWinControlAvailable: sinon.spy()

            ko.applyBindings(@viewModel, @el)

        it "should call component's `render` and `process` methods", ->
            @viewModel.theComponent.render.should.have.beenCalled
            @viewModel.theComponent.process.should.have.beenCalled

        it "should call `onWinControlAvailable` on the component (when present)", ->
            @componentProcessPromise.then =>
                @viewModel.theComponent.onWinControlAvailable.should.have.been.called

        it "should set the element's contents to the rendered component", ->
            @el.innerHTML.should.equal(
                '<!-- ko component: theComponent --><section>Component One</section><!-- /ko -->'
            )

