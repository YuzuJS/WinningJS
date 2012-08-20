"use strict";

var ko = require("knockoutify");
var domify = require("domify");
var $ = require("jquery-browserify");
var Q = require("q");
var _ = require("underscore");
var s = require("../resources").s;

function getElementFromTemplate(template) {
    // Wrap in `MSApp.execUnsafeLocalFunction`, as otherwise it will do crazy stuff like strip out comments (which
    // breaks Knockout entirely).
    return MSApp.execUnsafeLocalFunction(function () {
        return domify(template({ s: s }))
    });
}

module.exports = function Presenter(options) {
    var that = this;

    var rootElement = getElementFromTemplate(options.template);
    var elementDeferred = Q.defer();

    Object.defineProperties(that, {
        element: { value: elementDeferred.promise, enumerable: true }
    });

    function renderRenderables() {
        var regionMap = options.renderables;
        var regionNames = Object.keys(regionMap);

        regionNames.forEach(function (regionName) {
            var regionEl = rootElement.querySelector("div[data-winning-region='" + regionName + "']");

            if (!regionEl) {
                throw new Error('There is no region "' + regionName + '".');
            }

            // Render the renderable, and check if it has onWinControlAvailable.
            var renderable = regionMap[regionName];
            var renderedElement = renderable.render();
            regionEl.parentNode.replaceChild(renderedElement, regionEl);

            // If onWinControlAvailable found, tag rendered element that it needs further processing.
            if (typeof renderable.onWinControlAvailable === "function") {
                renderedElement.setAttribute("data-winning-process", "ready");

                // Memoize function, which will be called when we process the DOM (see process method below).
                $(renderedElement).data("winning-processor", renderable.onWinControlAvailable);
            }
        });
    }

    that.render = function () {
        if (_.has(options, "viewModel")) {
            ko.applyBindings(options.viewModel, rootElement);
        }
        if (options.renderables) {
            renderRenderables();
        }

        WinJS.Resources.processAll(rootElement);

        elementDeferred.resolve(rootElement);
        return rootElement;
    };

    that.process = function () {
        return Q.when(WinJS.UI.processAll(rootElement))
            .then(function () {
                // Use `winControls` to set winControl options for either this element (with the `:scope` selector), or
                // descendant winControls (using other selectors).
                if (_.has(options, "winControls")) {
                    Object.keys(options.winControls).forEach(function (selector) {
                        var winControlOptions = options.winControls[selector];
                        if (selector === ":scope") {
                            WinJS.UI.setOptions(rootElement.winControl, winControlOptions);
                        } else {
                            WinJS.UI.setOptions(rootElement.querySelector(selector).winControl, winControlOptions);
                        }
                    });
                }

                // Check for renderable elements that need further processing.
                var processEls = Array.prototype.slice.call(rootElement.querySelectorAll("[data-winning-process]"));

                processEls.forEach(function (element) {
                    var onWinControlAvailable = $(element).data("winning-processor");
                    onWinControlAvailable(element, element.winControl);
                });

                return rootElement;
            });
    };

    that.bindViewModel = function (newViewModel) {
        return that.element.then(function () {
            ko.applyBindings(newViewModel, rootElement);
        });
    };

    // TODO Possibly change `plugin.process` name to something else as this is called on `presenter.render`.
    that.use = function (plugin) {
        return that.element.then(plugin.process);
    };
};
