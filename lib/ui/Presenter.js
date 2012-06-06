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
        return Q.when(regionMap[regionName].render(false)).then(function (renderedElement) {
            regionEl.parentNode.replaceChild(renderedElement, regionEl);
        });
    }));
}

module.exports = function Presenter(options) {
    var that = this;
    var el = options && options.hasOwnProperty("template") ?
        getElementFromTemplate(options.template) : document.createElement("div");

    Object.defineProperty(that, "element", { value: el });

    that.render = function (processWinJSUI) {
        function processUI(el) {
            if (processWinJSUI === false) {
                return Q.resolve(el);
            }

            var winPromise = ui.processAll(el);
            return Q.when(winPromise).then(function () {
                if (options.ui) {
                    ui.setOptions(el.winControl, options.ui);
                }
                return el;
            });
        }

        if (options.renderables) {
            return processRenderables(el, options.renderables).then(function () {
                return processUI(el);
            });
        }

        return processUI(el);
    };
};