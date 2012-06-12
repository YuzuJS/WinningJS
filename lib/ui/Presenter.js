"use strict";
var ui = WinJS.UI;
var Q = require("q");
var parseMapString = require("../util/parseMapString");

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

        // Don't call `WinJS.UI.processAll` for subcomponents; it will be called on the root element.
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

    function listenForCommandsOn(element) {
        var eventMap = parseMapString(element.getAttribute("data-winning-events"), options.dataContext);

        Object.keys(eventMap).forEach(function (event) {
            [element, element.winControl].some(function (target) {
                if (("on" + event) in target) {
                    target.addEventListener(event, eventMap[event]);
                    return true;
                }
            });
        });
    }

    function bindWinningEvents() {
        var elementsWithCommands = el.querySelectorAll("[data-winning-events]");

        Array.prototype.slice.call(elementsWithCommands).forEach(listenForCommandsOn);
    }

    function processElement() {
        var promises = [];

        if (options.hasOwnProperty("dataContext")) {
            promises.push(processElementBindings());
        }

        promises.push(processElementUI());

        return Q.all(promises).then(function () {
            if (options.hasOwnProperty("dataContext")) {
                bindWinningEvents();
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