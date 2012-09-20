"use strict"

jsdom = require("jsdom").jsdom
sandboxedModule = require("sandboxed-module")
Q = require("q")

beforeEach ->
    @applyBindings = sinon.spy()

    requires =
        knockoutify:
            applyBindings: @applyBindings
        "./utils":
            getElementFromTemplate: (template) -> template() + " ELEMENTIFIED"

    @renderers = sandboxedModule.require("../lib/ui/renderers", { requires })

describe "Renderer creation", ->
    specify "fromComponentFactory", ->
        processResult = { processed: true }
        processPromise = Q.resolve(processResult)
        component =
            render: sinon.spy()
            process: sinon.stub().returns(processPromise)
        componentFactory = sinon.stub().returns(component)

        data = { foo: "bar" }
        itemPromise = Q.resolve({ data })

        renderer = @renderers.fromComponentFactory(componentFactory)

        renderer(itemPromise).then (result) =>
            result.should.equal(processResult)

            componentFactory.should.have.been.calledWith(data)

            component.render.should.have.been.called
            component.render.should.have.been.calledBefore(component.process)

    specify "fromTemplate", ->
        data = { foo: "bar" }
        itemPromise = Q.resolve({ data })

        template = => "templateResult"

        renderer = @renderers.fromTemplate(template)

        renderer(itemPromise).then (result) =>
            result.should.equal("templateResult ELEMENTIFIED")

            @applyBindings.should.have.been.calledWith(data, result)
