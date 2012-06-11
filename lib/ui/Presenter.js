"use strict";
var ui = WinJS.UI;
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
        var regionEl = rootElement.querySelector("div[data-region='" + regionName + "']");

        // Don't call `WinJS.UI.processAll` for subcomponents; it will be called on the root element.
        return Q.when(regionMap[regionName].render()).then(function (renderedElement) {
            regionEl.parentNode.replaceChild(renderedElement, regionEl);
        });
    }));
}

module.exports = function Presenter(options) {
    var that = this;
    var el = getElementFromTemplate(options.template);

    Object.defineProperty(that, "element", { value: el, enumerable: true });

    function processElementBindings() {
        return Q.when(WinJS.Binding.processAll(el, options.dataContext));
    }

    function processElementUI() {
        return Q.when(ui.processAll(el)).then(function () {
            if (options.hasOwnProperty("ui")) {
                ui.setOptions(el.winControl, options.ui);
            }
        });
    }

    function processElement() {
        var promises = [];

        if (options.hasOwnProperty("dataContext")) {
            promises.push(processElementBindings());
        }

        promises.push(processElementUI());

        return Q.all(promises).then(function () { return el; });
    }

    that.process = function () {
        if (options.renderables) {
            return processRenderables(el, options.renderables).then(processElement);
        }

        return processElement();
    };
};