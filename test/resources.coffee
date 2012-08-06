"use strict"

WinJS = Resources: {}

resources = do ->
    sandboxedModule = require("sandboxed-module")

    globals =
        WinJS: WinJS
        Error: Error

    sandboxedModule.require("../lib/resources", globals: globals)

s = resources.s

describe "resources", ->

    beforeEach ->
        getStringStub = sinon.stub()
        getStringStub.withArgs("string1").returns(value: "STRING 1")
        getStringStub.withArgs("string2").returns(value: "STRING 2")
        getStringStub.withArgs("string3").returns(value: "STRING 3 AND {^string1}")
        getStringStub.withArgs("string4").returns(value: "STRING 4 AND {^string2} AND {^string1}")
        getStringStub.withArgs("string5").returns(value: "{^string4} AND {^string3}")
        getStringStub.withArgs("string12").returns(value: "string12", empty: true)
        getStringStub.withArgs("string6").returns(value: "{^string12}")
        getStringStub.withArgs("string_f").returns(value: "hello %s %s")

        WinJS.Resources = getString: getStringStub
        resources.augmentGetString()

    describe "augmentGetString", ->

        it "should work when no replacements are required", ->
            WinJS.Resources.getString("string1").value.should.equal("STRING 1")

        it "should replace a single reference", ->
            WinJS.Resources.getString("string3").value.should.equal("STRING 3 AND STRING 1")

        it "should replace multiple single references", ->
            WinJS.Resources.getString("string4").value.should.equal("STRING 4 AND STRING 2 AND STRING 1")

        it "should replace multiple references", ->
            WinJS.Resources.getString("string5").value.should
                                    .equal("STRING 4 AND STRING 2 AND STRING 1 AND STRING 3 AND STRING 1")

    describe "s", ->

        it "should work like WinningJS augmented WinJS.Resources.getString", ->
            s("string4").should.equal("STRING 4 AND STRING 2 AND STRING 1")
            s("string1").should.equal("STRING 1")

        it "should throw an error if key is not a valid string", ->
            (-> s()).should.throw("Resource key must be a valid string.")
            (-> s({})).should.throw("Resource key must be a valid string.")

        it "should throw an error if resource was not found", ->
            (-> s("string12")).should.throw("Resource with key 'string12' not found.")
            (-> s("string6")).should.throw("Resource with key 'string12' not found.")

        it "should act as `sprintf` on the returned string using any extra parameters", ->
            s("string_f", "goodbye", "goodnight").should.equal("hello goodbye goodnight")
