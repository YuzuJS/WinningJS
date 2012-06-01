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
    Object.keys(regionNamesToComponents).forEach(function (regionName) {
        var regionEl = rootElement.querySelector("div[data-region='" + regionName + "']");

        // Don't call `WinJS.UI.processAll` for subcomponents; it will be called on the root element.
        regionNamesToComponents[regionName].render(false).then(function (componentEl) {
            regionEl.parentNode.replaceChild(componentEl, regionEl);
        }).end();        
    });
}

exports.mixin = function (target, options) {
    target.render = function (processWinJSUI) {
        var el = getElementFromTemplate(options.template);

        if (options.components) {
            renderSubComponents(el, options.components);
        }

        if (processWinJSUI !== false) {
            var winPromise = ui.processAll(el);
            return Q.when(winPromise).then(function () {
                if (options.ui) {
                    ui.setOptions(el.winControl, options.ui);
                }
                return el;
            });
        }

        return Q.resolve(el);
    };
};

exports.create = function (options) {
    var component = {};
    exports.mixin(component, options);
    return component;
};
