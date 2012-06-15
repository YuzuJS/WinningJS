"use strict"

jsdom = require("jsdom").jsdom
window = jsdom(null, null, features: QuerySelector: true).createWindow()
$ = require("jQuery").create(window)
makeEmitter = require("pubit").makeEmitter
ko = null

koUtils = do ->
    sandboxedModule = require("sandboxed-module")

    globals =
        window: window
        document: window.document
        navigator: window.navigator
        Error: Error # necessary for `instanceof Error` checks :-/        

    ko = sandboxedModule.require("knockoutify", globals: globals) # ko relies on global window

    requires = 
         knockoutify: ko

    sandboxedModule.require("../lib/ui/util/knockout", globals: globals, requires: requires)

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
        describe "when the custom binding `itemInvoked` is present in the markup", ->
            el = null
            viewModel = 
                onItemInvoked: sinon.stub()

            beforeEach ->
                koUtils.addBindings()
                el = $('<div data-bind="itemInvoked: onItemInvoked">Test</div>')[0]

            describe "and the element owns a winControl", ->
                beforeEach ->
                    el.winControl = addEventListener: sinon.stub()
                    el.winControl.addEventListener.callsArgWith(1, el.winControl)
                    ko.applyBindings(viewModel, el)

                it "should call `addEventListener` on the winControl", ->
                    el.winControl.addEventListener.should.have.been.called

                it "should callback the `iteminvoked` event listener", ->
                    viewModel.onItemInvoked.should.have.been.calledWith(el.winControl)
