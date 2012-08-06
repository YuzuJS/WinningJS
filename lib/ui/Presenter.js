"use strict";

var ko = require("knockoutify");
var domify = require("domify");
var $ = require("jquery-browserify");
var Q = require("q");
var _ = require("underscore");
var s = require("../resources").s;

function getElementFromTemplate(template) {
    return domify(template({ s: s }));
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

        elementDeferred.resolve(rootElement);
        return rootElement;
    };

    that.process = function () {
        return Q.when(WinJS.UI.processAll(rootElement))
            .then(function () {
                if (_.has(options, "ui")) {
                    WinJS.UI.setOptions(rootElement.winControl, options.ui);
                }

                // Check for renderable elements that need further processing.
                var processEls = Array.prototype.slice.call(rootElement.querySelectorAll("[data-winning-process]"));

                processEls.forEach(function (element) {
                    var onWinControlAvailable = $(element).data("winning-processor");
                    onWinControlAvailable(element, element.winControl);
                });

                WinJS.Resources.processAll(rootElement);

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
