"use strict";

var ui = WinJS.UI;
var ko = require("knockoutify");
var Q = require("q");

function getElementFromTemplate(template) {
    var containerEl = document.createElement("div");
    containerEl.innerHTML = template();

    if (containerEl.children.length !== 1) {
        throw new Error("Expected the template to render exactly one element.");
    }

    return containerEl.children[0];
}

function processRenderables(rootElement, regionMap) {
    var regionNames = Object.keys(regionMap);
    return Q.all(regionNames.map(function (regionName) {
        var regionEl = rootElement.querySelector("div[data-winning-region='" + regionName + "']");

        return Q.when(regionMap[regionName].render()).then(function (renderedElement) {
            regionEl.parentNode.replaceChild(renderedElement, regionEl);
        });
    }));
}

module.exports = function Presenter(options) {
    var that = this;

    var el = getElementFromTemplate(options.template);
    var elementDeferred = Q.defer();
    var winControlDeferred = Q.defer();

    Object.defineProperties(that, {
        element: { value: elementDeferred.promise, enumerable: true },
        winControl: { value: winControlDeferred.promise, enumerable: true }
    });

    function processElementUI() {
        return Q.when(ui.processAll(el)).then(function () {
            if (options.hasOwnProperty("ui")) {
                ui.setOptions(el.winControl, options.ui);
            }
        });
    }

    function processElement() {
        return processElementUI().then(function () {
            if (options.hasOwnProperty("viewModel")) {
                ko.applyBindings(options.viewModel, el);
            }

            elementDeferred.resolve(el);
            winControlDeferred.resolve(el.winControl);

            return el;
        });
    }

    that.process = function () {
        if (options.renderables) {
            return processRenderables(el, options.renderables).then(processElement);
        }

        return processElement();
    };
};
