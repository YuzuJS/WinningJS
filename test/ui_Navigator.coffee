"use strict"

jsdom = require("jsdom").jsdom
sandboxedModule = require("sandboxed-module")

describe "Navigator", ->
    window = null
    $ = null
    $body = null

    # This is a hack to work around jQuery's trigger being broken with jsdom. TODO: figure out why??
    triggerClick = (el$) ->
        ev = window.document.createEvent("MouseEvents")
        ev.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
        sinon.spy(ev, "preventDefault")

        el$[0].dispatchEvent(ev)

        return ev


    beforeEach ->
        window = jsdom(null, null, features: QuerySelector: true).createWindow()
        $ = sandboxedModule.require("jquery-browserify", globals: { window })
        $body = $(window.document.body)

        @nav =
            _listener: null
            addEventListener: (eventName, newListener) => @nav._listener = newListener
            navigate: sinon.spy((location, state) => @nav._listener(detail: { location, state }))

        Navigator = sandboxedModule.require("../lib/ui/Navigator", requires: "jquery-browserify": $)
        @navigator = new Navigator(@nav, window.document.body)

    afterEach -> $body.empty()

    describe "navigate to a new page", ->
        beforeEach ->
            window.document.body.innerHTML = '''
                                             <section data-winning-page="about" id="x">About</section
                                             <section data-winning-page="testhome" id="y">Test Home</section>
                                             '''

        it "should throw when given no location", ->
            (-> @navigator.navigate()).should.throw()

        it "should call 'nav' navigate method with the passed location and state", ->
            @navigator.navigate("about", { foo: "bar" })
            @nav.navigate.should.have.been.calledWith("about", { foo: "bar" })

        it "should show and hide sections", ->
            @navigator.navigate("about")

            $body.children("section[data-winning-page='about']").is(":visible").should.equal(true)
            $body.children("section[data-winning-page='testhome']").is(":visible").should.equal(false)


    describe "listen to clicks", ->
        beforeEach ->
            window.document.body.innerHTML = '''
                                             <div>
                                                 <a href="/testpage" id="a">Link</a>
                                                 <button data-winning-href="/testpage2" id="b">Button</button>
                                                 <a href="/testpage3?foo=bar&baz=quux" id="c">Query strings!</a>
                                                 <a href="" id="d">Empty href</a>
                                                 <a href="http://google.com" id="e">External link</a>
                                             </div>
                                             <section data-winning-page="testpage"></section>
                                             <section data-winning-page="testpage2"></section>
                                             <section data-winning-page="testpage3"></section>
                                             '''

            @navigator.listenToClicks(window.document.body)

        it "should work for href attributes on <a> tags", ->
            ev = triggerClick($body.find("#a"))

            @nav.navigate.should.have.been.calledWith("testpage")
            ev.preventDefault.should.have.been.called

        it "should work with data-winning-href attributes on <button> tags", ->
            ev = triggerClick($body.find("#b"))

            @nav.navigate.should.have.been.calledWith("testpage2")
            ev.preventDefault.should.have.been.called

        it "should parse query strings and pass them as state to `navigate`", ->
            ev = triggerClick($body.find("#c"))

            @nav.navigate.should.have.been.calledWith("testpage3", { foo: "bar", baz: "quux" })
            ev.preventDefault.should.have.been.called

        it "should not do anything if href is empty", ->
            ev = triggerClick($body.find("#d"))

            @nav.navigate.should.not.have.been.called
            ev.preventDefault.should.not.have.been.called

        it "should not do anything if href is an absolute URL", ->
            ev = triggerClick($body.find("#e"))

            @nav.navigate.should.not.have.been.called
            ev.preventDefault.should.not.have.been.called
