"use strict"

jsdom = require("jsdom").jsdom

window = jsdom(null, null, features: QuerySelector: true).createWindow()
document = window.document
$ = require("jQuery").create(window)
Q = require("q")
makeEmitter = require("pubit").makeEmitter


# Using jQuery `click` method on the element does not work (does not emit the click event).
# TODO: Either make this a util (currently used by Navigator test), or find out why jQuery is not working.
triggerClickFor = (el) ->
    ev = window.document.createEvent("MouseEvents")
    ev.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
    el.dispatchEvent(ev)

    return ev
    
FlyoutPlugin = do ->
    sandboxedModule = require("sandboxed-module")

    globals =
        window: window
        document: window.document
        Error: Error # necessary for `instanceof Error` checks :-/

    sandboxedModule.require("../lib/ui/plugins/Flyout", globals: globals)

createFlyout = (title) ->
    flyout = {}
    publish = makeEmitter(flyout, ["show", "hide"])

    flyout.show = sinon.spy(-> 
        publish("show", flyout)
        Q.resolve()
    )
    flyout.hide = sinon.spy(-> 
        publish("hide", flyout)
        Q.resolve()
    )
    flyout.render = sinon.stub().returns(Q.resolve($("<div class='flyout'>" + title + "</div>")[0]))
    flyout.publish = publish

    return flyout

describe "Using the Flyout presenter plugin", ->
    describe "and one or more data-winning-flyout attributes exists in the template markup", ->
        element = null
        flyout = null
        plugin = null

        beforeEach ->
            flyout = createFlyout("Flyout One")
            plugin = new FlyoutPlugin(showFlyout: flyout)
            element = document.createElement("section")
            element.innerHTML = '<button data-winning-flyout="showFlyout">Click me.</button>'

        afterEach ->
            $(document.body).empty()

        it "should call the flyout's render/show method on click of the element the attribute was found on.", (done) ->
            element = plugin.process(element)

            button = element.querySelector("button[data-winning-flyout]")
            triggerClickFor(button)

            flyout.render.should.have.been.called
            flyout.on("show", -> done())

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
