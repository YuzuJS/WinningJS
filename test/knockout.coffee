"use strict"

Q = require("q")
_ = require("underscore")
EventEmitter = require("events").EventEmitter

Windows = Foundation: Collections: CollectionChange:
    reset: 0
    itemInserted: 1
    itemRemoved: 2
    itemChanged: 3

{ $, document, ko, koUtils } = do ->
    jsdom = require("jsdom").jsdom
    sandboxedModule = require("sandboxed-module")

    window = jsdom(null, null, features: QuerySelector: true).createWindow()
    globals =
        window: window
        document: window.document
        navigator: window.navigator
        Windows: Windows

    $ = sandboxedModule.require("jquery-browserify", globals: globals)
    ko = sandboxedModule.require("knockoutify", globals: globals)
    koUtils = sandboxedModule.require("../lib/knockout", globals: globals, requires: knockoutify: ko)

    return { $, document: window.document, ko, koUtils }

describe "observableArrayFromVector", ->
    { CollectionChange } = Windows.Foundation.Collections
    mapping = sinon.spy (x) => 11 * x

    beforeEach ->
        @vector = []

        ee = new EventEmitter()
        @vector.addEventListener = ee.on.bind(ee)
        @trigger = (args...) => ee.emit("vectorchanged", args...)

    it "should fill the observable array with the initial elements of the vector, mapped", ->
        @vector.push(1, 2, 3)
        array = koUtils.observableArrayFromVector(@vector, mapping)

        array().should.deep.equal([11, 22, 33])

    it "should not pass the index to the mapper", ->
        # This test ensures that the mapping function doesn't get called with an index, like a normal callback to
        # `Array.prototype.map` would. See explanation in the source.

        @vector.push(1, 2, 3)
        array = koUtils.observableArrayFromVector(@vector, mapping)

        mapping.should.have.been.calledWithExactly(1)
        mapping.should.have.been.calledWithExactly(2)
        mapping.should.have.been.calledWithExactly(3)

    it "should reflect vectorchanged reset events", ->
        array = koUtils.observableArrayFromVector(@vector, mapping)

        array().should.deep.equal([])

        @vector.push(1, 2, 3)
        @trigger(collectionChange: CollectionChange.reset)

        array().should.deep.equal([11, 22, 33])

    it "should reflect vectorchanged itemInserted events", ->
        array = koUtils.observableArrayFromVector(@vector, mapping)

        array().should.deep.equal([])

        @vector.push(1)
        @trigger(collectionChange: CollectionChange.itemInserted, index: 0)

        array().should.deep.equal([11])

        @vector.push(2)
        @trigger(collectionChange: CollectionChange.itemInserted, index: 1)

        array().should.deep.equal([11, 22])

    it "should reflect vectorchanged itemRemoved events", ->
        @vector.push(1, 2, 3)
        array = koUtils.observableArrayFromVector(@vector, mapping)

        array().should.deep.equal([11, 22, 33])

        @vector.splice(1, 1)
        @trigger(collectionChange: CollectionChange.itemRemoved, index: 1)

        array().should.deep.equal([11, 33])

        @vector.shift()
        @trigger(collectionChange: CollectionChange.itemRemoved, index: 0)

        array().should.deep.equal([33])

    it "should reflect vectorchanged itemChanged events", ->
        @vector.push(1, 2, 3)
        array = koUtils.observableArrayFromVector(@vector, mapping)

        array().should.deep.equal([11, 22, 33])

        @vector[1] = 5
        @trigger(collectionChange: CollectionChange.itemChanged, index: 1)

        array().should.deep.equal([11, 55, 33])


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
            @el = $("<div><!-- ko component: theComponent --><!-- /ko --></div>")[0]

            componentEl = $("""
                            <section>
                                Component One
                                <span data-bind="text: theData">some data from a different rendering process</span>
                            </section>
                            """)[0]
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
            @el.querySelector("section").textContent.trim().should.equal(
                """
                Component One
                    some data from a different rendering process
                """
            )

    describe "voreach", ->
        beforeEach ->
            @el = $('<div><!-- ko voreach: theVector --><li data-bind="text: $data"></li><!-- /ko --></div>')[0]

            @vector = [1, 2]

            ee = new EventEmitter()
            @vector.addEventListener = ee.on.bind(ee)
            @trigger = => ee.emit("vectorchanged")

            @viewModel = theVector: @vector
            ko.applyBindings(@viewModel, @el)

        it "should bind to the initial elements of the vector", ->
            $lis = $(@el).find("li")
            expect($lis).to.have.length(2)
            _.pluck($lis, "textContent").should.deep.equal(["1", "2"])

        it "should react to vectorchanged events", ->
            @vector.push(3)
            @trigger()

            $lis = $(@el).find("li")
            expect($lis).to.have.length(3)
            _.pluck($lis, "textContent").should.deep.equal(["1", "2", "3"])
