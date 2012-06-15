"use strict"

jsdom = require("jsdom").jsdom
window = jsdom(null, null, features: QuerySelector: true).createWindow()
$ = require("jQuery").create(window)
makeEmitter = require("pubit").makeEmitter

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
