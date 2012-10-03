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

    var element = null;
    var viewModel = options.viewModel;
    var plugins = [];

    Object.defineProperties(that, {
        // `element` can be modified if `render()` is called again, so this is an accessor, not a data descriptor.
        element: { get: function () { return element; }, enumerable: true }
    });

    function renderRenderables() {
        var regionMap = options.renderables;
        var regionNames = Object.keys(regionMap);

        regionNames.forEach(function (regionName) {
            var regionEl = element.querySelector("div[data-winning-region='" + regionName + "']");

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
        var $elsWithOptions = $(element).find("[data-winning-has-win-control-options]").andSelf();

        $elsWithOptions.each(function (i, element) {
            var winControlOptions = $(element).data("winning-win-control-options");
            setAllWinControlOptionsFor(element, winControlOptions);
        });
    }

    that.render = function () {
        element = getElementFromTemplate(options.template);

        if (viewModel) {
            ko.cleanNode(element);
            ko.applyBindings(viewModel, element);
        }
        if (options.winControls) {
            element.setAttribute("data-winning-has-win-control-options", "true");
            $(element).data("winning-win-control-options", options.winControls);
        }
        if (options.renderables) {
            renderRenderables();
        }

        plugins.forEach(function (plugin) {
            plugin.process(element);
        });

        return element;
    };

    that.process = function () {
        return Q.when(WinJS.UI.processAll(element)).then(function () {
            setAllWinControlOptions();

            // Needs to happen after `WinJS.UI.processAll`, because of e.g. `data-win-res={ winControl: { ... } }`.
            WinJS.Resources.processAll(element);

            return element;
        });
    };

    that.refresh = Q.fbind(function (newViewModel) {
        if (!element || !element.parentNode) {
            throw new Error("Only presenters whose elements are already in the DOM can be refreshed.");
        }

        viewModel = newViewModel;

        var oldEl = element;
        that.render();

        oldEl.parentNode.replaceChild(element, oldEl);

        return that.process();
    });

    // TODO Possibly change `plugin.process` name to something else as this is called on `presenter.render`.
    that.use = function (plugin) {
        plugins.push(plugin);
    };
};
