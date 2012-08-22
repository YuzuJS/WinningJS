"use strict";

var ko = require("knockoutify");

exports.addBindings = function () {
    ko.bindingHandlers.itemInvoked = { // listens to winControl iteminvoked event
        init: function (element, valueAccessor) {
            var winControl = element.winControl;
            if (!winControl) {
                throw new Error("Can not listen to itemInvoked on an element that does not own a winControl.");
            }

            winControl.addEventListener("iteminvoked", function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(winControl);
                var handler = ko.utils.unwrapObservable(valueAccessor());
                handler.apply(this, args);
            });
        }
    };

    ko.bindingHandlers.component = {
        init: function (placeholderEl, valueAccessor) {
            var component = ko.utils.unwrapObservable(valueAccessor());

            var componentEl = component.render();
            placeholderEl.parentNode.replaceChild(componentEl, placeholderEl);

            component.process().then(function () {
                if (typeof component.onWinControlAvailable === "function") {
                    component.onWinControlAvailable(componentEl, componentEl.winControl);
                }
            }).end();
        }
    };
};
