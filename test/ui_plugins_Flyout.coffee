"use strict"

jsdom = require("jsdom").jsdom
Q = require("q")
sandboxedModule = require("sandboxed-module")
makeEmitter = require("pubit").makeEmitter

window = jsdom(null, null, features: QuerySelector: true).createWindow()
document = window.document
$ = sandboxedModule.require("jquery-browserify", globals: { window })

# Using jQuery `click` method on the element does not work (does not emit the click event).
# TODO: Either make this a util (currently used by Navigator test), or find out why jQuery is not working.
triggerClickFor = (el) ->
    ev = window.document.createEvent("MouseEvents")
    ev.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
    el.dispatchEvent(ev)

    return ev

FlyoutPlugin = do ->
    globals =
        window: window
        document: window.document
        Error: Error # necessary for `instanceof Error` checks :-/

    sandboxedModule.require("../lib/ui/plugins/Flyout", globals: globals)

createFlyout = (title) ->
    flyout = {}
    rootElement = $("<div class='flyout'> #{ title } </div>")[0]
    publish = makeEmitter(flyout, ["show", "hide"])

    flyout.show = sinon.spy(->
        publish("show", flyout)
        Q.resolve()
    )
    flyout.hide = sinon.spy(->
        publish("hide", flyout)
        Q.resolve()
    )

    flyout.render = sinon.stub().returns(rootElement)
    flyout.process = sinon.stub().returns(Q.resolve(rootElement))
    flyout.publish = publish

    return flyout

describe "Using the Flyout presenter plugin", ->
    element = null
    flyout = null
    plugin = null

    beforeEach ->
        flyout = createFlyout("Flyout One")
        plugin = new FlyoutPlugin(showFlyout: -> flyout)
        element = document.createElement("section")
        element.innerHTML = '<button data-winning-flyout="showFlyout">Click me.</button>'

    afterEach ->
        $(document.body).empty()

    it "should call the flyout's render/show method on click of the element the attribute was found on", (done) ->
        element = plugin.process(element)

        button = element.querySelector("button[data-winning-flyout]")
        triggerClickFor(button)

        flyout.render.should.have.been.called
        flyout.on("show", -> done())

    it "should work even if one of the keys is hasOwnProperty", ->
        plugin = new FlyoutPlugin(hasOwnProperty: 5)
        element.innerHTML = '<button data-winning-flyout="hasOwnProperty">Click me.</button>'
        (-> plugin.process(element)).should.not.throw()

    it "should throw a helpful error if a key is in the markup but not in the flyout map", ->
        plugin = new FlyoutPlugin({})
        (-> plugin.process(element)).should.throw(/no handler was found for "showFlyout"/i)


    describe "when the anchor value of the flyout component", ->
        describe "is NOT set", ->
            it "should call show with the current anchor passed and the flyout should exist in DOM", (done) ->
                element = plugin.process(element)

                button = element.querySelector("button[data-winning-flyout]")
                triggerClickFor(button)

                flyout.on("show", ->
                     flyout.show.should.have.been.calledWith(button)
                     document.body.querySelectorAll(".flyout").length.should.equal(1)
                     done()
                )

        describe "is set", ->
            it "should call show with that anchor", (done) ->
                element = plugin.process(element)

                button = element.querySelector("button[data-winning-flyout]")
                anchor = document.createElement("a")
                document.body.appendChild(anchor)
                flyout.anchor = anchor

                triggerClickFor(button)

                flyout.on("show", ->
                     flyout.show.should.have.been.calledWith(anchor)
                     done()
                )

    describe "when the flyout is hidden", ->
        it "should remove the flyout from the DOM", (done) ->
            element = plugin.process(element)

            button = element.querySelector("button[data-winning-flyout]")
            triggerClickFor(button)

            flyout.on("show", ->
                flyout.hide()
                document.body.querySelectorAll(".flyout").length.should.equal(0)
                done()
            )
