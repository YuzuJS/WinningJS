"use strict";

var ko = require("knockoutify");
var domify = require("domify");
var $ = require("jquery-browserify");
var Q = require("q");
var s = require("../resources").s;

function getElementFromTemplate(template) {
    // Wrap in `MSApp.execUnsafeLocalFunction`, as otherwise it will do crazy stuff like strip out comments (which
    // breaks Knockout entirely).
    return MSApp.execUnsafeLocalFunction(function () {
        return domify(template({ s: s }));
    });
}

function setAllWinControlOptionsFor(rootElement, allWinControlOptions) {
    if (!allWinControlOptions) {
        return;
    }

    Object.keys(allWinControlOptions).forEach(function (selector) {
        var element = selector === ":scope" ? rootElement : rootElement.querySelector(selector);
        var winControlOptions = allWinControlOptions[selector];

        WinJS.UI.setOptions(element.winControl, winControlOptions);
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

    function setAllWinControlOptions() {
        var $elsWithOptions = $(rootElement).find("[data-winning-has-win-control-options]").andSelf();

        $elsWithOptions.each(function (i, element) {
            var winControlOptions = $(element).data("winning-win-control-options");
            setAllWinControlOptionsFor(element, winControlOptions);
        });
    }

    that.render = function () {
        if (options.viewModel) {
            ko.applyBindings(options.viewModel, rootElement);
        }
        if (options.winControls) {
            rootElement.setAttribute("data-winning-has-win-control-options", "true");
            $(rootElement).data("winning-win-control-options", options.winControls);
        }
        if (options.renderables) {
            renderRenderables();
        }

        elementDeferred.resolve(rootElement);
        return rootElement;
    };

    that.process = function () {
        return Q.when(WinJS.UI.processAll(rootElement)).then(function () {
            setAllWinControlOptions();

            // Check for renderable elements that need further processing.
            var processNodeList = rootElement.querySelectorAll("[data-winning-process]");

            Array.prototype.forEach.call(processNodeList, function (element) {
                var onWinControlAvailable = $(element).data("winning-processor");
                onWinControlAvailable(element, element.winControl);
            });

            // Needs to happen after `WinJS.UI.processAll`, because of e.g. `data-win-res={ winControl: { ... } }`.
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
