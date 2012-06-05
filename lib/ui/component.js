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

function renderSubComponents(rootElement, regionNamesToComponents) {
    var regionNames = Object.keys(regionNamesToComponents);
    return Q.all(regionNames.map(function (regionName) {
        var regionEl = rootElement.querySelector("div[data-region='" + regionName + "']");

        // Don't call `WinJS.UI.processAll` for subcomponents; it will be called on the root element.
        return regionNamesToComponents[regionName].render(false).then(function (componentEl) {
            regionEl.parentNode.replaceChild(componentEl, regionEl);
        });
    }));
}

exports.mixin = function (target, options) {
    target.render = function (processWinJSUI) {
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

        var el = getElementFromTemplate(options.template);

        if (options.components) {
            return renderSubComponents(el, options.components).then(function () {
                return processUI(el);
            });
        }

        return processUI(el);
    };
};

exports.create = function (options) {
    var component = {};
    exports.mixin(component, options);
    return component;
};
