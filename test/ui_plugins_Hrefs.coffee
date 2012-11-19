"use strict"

jsdom = require("jsdom").jsdom
sandboxedModule = require("sandboxed-module")

describe "Using the ButtonHrefs presenter plugin", ->
    document = null
    $ = null

    beforeEach ->
        window = jsdom(null, null, features: QuerySelector: true).createWindow()
        document = window.document
        globals = { window, document }

        $ = sandboxedModule.require("jquery-browserify", globals: globals)

        ButtonHrefsPlugin = sandboxedModule.require(
            "../lib/ui/plugins/Hrefs"
            globals: globals
            requires: { "jquery-browserify": $ }
        )
        (new ButtonHrefsPlugin()).process(document.body)

        document.body.innerHTML = '''
                                  <button id="x" data-winning-href="#/test">Test</button>
                                  <div id="y" data-winning-href="#/test-div">Test Div</div>
                                  '''

    it "should react to clicks on button elements with data-winning-href attributes by navigating there", ->
        $("#x").click()

        document.location.href.should.equal("#/test")

    it "should react to clicks on div elements with data-winning-href attributes by navigating there", ->
        $("#y").click()

        document.location.href.should.equal("#/test-div")
