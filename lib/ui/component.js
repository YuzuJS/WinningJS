"use strict";

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
        var regionEl = rootElement.querySelector("region[name='" + regionName + "']");

        // Don't call `WinJS.UI.processAll` for subcomponents; it will be called on the root element.
        var componentEl = regionNamesToComponents[regionName].render(false);

        regionEl.parentNode.replaceChild(componentEl, regionEl);
    });
}

exports.mixin = function (target, options) {
    target.render = function (processWinJSUI) {
        var el = getElementFromTemplate(options.template);

        if (options.components) {
            renderSubComponents(el, options.components);
        }

        if (processWinJSUI !== false) {
            WinJS.UI.processAll(el);
        }

        return el;
    };
};

exports.create = function (options) {
    var component = {};
    exports.mixin(component, options);
    return component;
};
