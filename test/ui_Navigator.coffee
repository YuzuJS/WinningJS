"use strict"

jsdom = require("jsdom").jsdom

window = jsdom(null, null, features: QuerySelector: true).createWindow()
$ = require("jQuery").create(window)

# This is a hack to work around jQuery's trigger being broken with jsdom. TODO: figure out why??
triggerClick = (el) ->
    ev = window.document.createEvent("MouseEvents")
    ev.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
    sinon.spy(ev, "preventDefault")

    el.dispatchEvent(ev)

    return ev

Navigator = do ->
    sandboxedModule = require("sandboxed-module")

    globals =
        window: window
        document: window.document

    sandboxedModule.require("../lib/ui/Navigator", globals: globals)

describe "Create Navigator", ->
    beforeEach ->
        @nav = navigate: sinon.spy()
        @nav.addEventListener = sinon.stub()
        @navigator = new Navigator(home: "testhome", @nav)
        @eventObject = detail: location: ""

    it "should have a 'home' property", ->
        expect(@navigator).to.have.property("home")
    
    it "should set the home page", ->
        @navigator.home.should.equal("testhome")

    it "should throw if not called with a home option", ->
        (-> new Navigator({})).should.throw("Need to pass a home option.")

    describe "navigate to a new page", ->
        beforeEach ->
            @eventObject.detail.location = "about"

        it "should throw no location found", ->
            (-> @navigator.navigate).should.throw(Error)

        it "should call 'nav' navigate method", ->
            @navigator.navigate("about")
            @nav.navigate.should.have.been.calledWith("about")

        it "should show and hide sections", ->
            @nav.addEventListener.callsArgWith(1, @eventObject)

            window.document.body.innerHTML = '''
                                            <section data-winning-page="about" id="x">About</section
                                            <section data-winning-page="testhome" id="y">Test Home</section>
                                             '''
            $sections = $(window.document.body)            

            navigator = new Navigator(home: "testhome", @nav)
            @navigator.navigate("about")
            $sections.children("section[data-winning-page='about']").is(":visible").should.equal(true)
            $sections.children("section[data-winning-page='testhome']").is(":visible").should.equal(false)
            

    describe "listen to clicks", ->
        beforeEach ->
            window.document.body.innerHTML = '''
                                            <div>
                                                <a href="/testpage" id="x">Test Page</a>
                                                <button data-winning-href="/testpage2" id="y">Test Page 2</button>
                                                <a href="" id="z">Someone is smoking crack</a>
                                            </div>
                                            '''
            @$body = $(window.document.body)
            @navigator.listenToClicks(window.document.body)

        afterEach ->
            window.document.body.innerHTML = ""

        it "should work for href attributes", ->
            ev = triggerClick(@$body.find("#x")[0])
            @nav.navigate.should.have.been.calledWith("testpage")
            ev.preventDefault.should.have.been.called

        it "should work with data-winning-href attributes", ->
            ev = triggerClick(@$body.find("#y")[0])
            @nav.navigate.should.have.been.calledWith("testpage2")
            ev.preventDefault.should.have.been.called

        it "should not do anything if href is empty", ->
            ev = triggerClick(@$body.find("#z")[0])
            
            @nav.navigate.should.not.have.been.called
            ev.preventDefault.should.not.have.been.called 
