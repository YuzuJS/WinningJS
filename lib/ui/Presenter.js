"use strict";

var ko = require("knockoutify");
var $ = require("jquery-browserify");
var Q = require("q");
var getElementFromTemplate = require("./utils").getElementFromTemplate;

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

            // Render the renderable and replace the placeholder with the result.
            var renderable = regionMap[regionName];
            var renderedElement = renderable.render();
            regionEl.parentNode.replaceChild(renderedElement, regionEl);
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
