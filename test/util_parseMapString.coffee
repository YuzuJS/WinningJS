"use strict"

parseMapString = require("../lib/util/parseMapString")

describe "Parsing a map string", ->
    bound = { a: {}, b: {}, c: {}, d: {} }

    it "click: a", ->
        expect(parseMapString("click: a", bound)).to.have.property("click", bound.a)

    it "click: a, itemInvoked: b", ->
        result = parseMapString("click: a, itemInvoked: b", bound)
        expect(result).to.have.property("click", bound.a)
        expect(result).to.have.property("iteminvoked", bound.b)

    it "click: a, itemInvoked: nobody", ->
        expect(-> parseMapString("click: a, itemInvoked: nobody", bound)).to.throw(TypeError, "nobody")
