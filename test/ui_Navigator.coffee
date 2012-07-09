"use strict"

jsdom = require("jsdom").jsdom
Navigator = require("../lib/ui/Navigator")

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
        $ = require("jQuery").create(window)
        $body = $(window.document.body)

        @eventObject = detail: location: ""

        @nav =
            _listener: null
            addEventListener: (eventName, newListener) => @nav._listener = newListener
            navigate: sinon.spy(=> @nav._listener(@eventObject))

        @navigator = new Navigator(@nav, window.document.body)

    afterEach ->
        $(window.document.body).empty()

    describe "navigate to a new page", ->
        beforeEach ->
            window.document.body.innerHTML = '''
                                             <section data-winning-page="about" id="x">About</section
                                             <section data-winning-page="testhome" id="y">Test Home</section>
                                             '''

            @eventObject.detail.location = "about"

        it "should throw no location found", ->
            (-> @navigator.navigate()).should.throw()

        it "should call 'nav' navigate method", ->
            @navigator.navigate("about")
            @nav.navigate.should.have.been.calledWith("about")

        it "should show and hide sections", ->
            @navigator.navigate("about")

            $body.children("section[data-winning-page='about']").is(":visible").should.equal(true)
            $body.children("section[data-winning-page='testhome']").is(":visible").should.equal(false)
            

    describe "listen to clicks", ->
        beforeEach ->
            window.document.body.innerHTML = '''
                                             <div>
                                                 <a href="/testpage" id="x">Test Page</a>
                                                 <button data-winning-href="/testpage2" id="y">Test Page 2</button>
                                                 <a href="" id="z">Someone is smoking crack</a>
                                             </div>
                                             <section data-winning-page="testpage"></section>
                                             <section data-winning-page="testpage2"></section>
                                             '''

            @navigator.listenToClicks(window.document.body)

        it "should work for href attributes", ->
            ev = triggerClick($body.find("#x"))
            @nav.navigate.should.have.been.calledWith("testpage")
            ev.preventDefault.should.have.been.called

        it "should work with data-winning-href attributes", ->
            ev = triggerClick($body.find("#y"))

            @nav.navigate.should.have.been.calledWith("testpage2")
            ev.preventDefault.should.have.been.called

        it "should not do anything if href is empty", ->
            ev = triggerClick($body.find("#z"))
            
            @nav.navigate.should.not.have.been.called
            ev.preventDefault.should.not.have.been.called 
