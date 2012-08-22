"use strict";

var ko = require("knockoutify");

exports.addBindings = function () {
    // TODO: generalize to any winControl event.
    ko.bindingHandlers.itemInvoked = {
        init: function (element, valueAccessor) {
            var winControl = element.winControl;
            if (!winControl) {
                throw new Error("Cannot listen to itemInvoked on an element that does not own a winControl.");
            }

            var handler = valueAccessor();

            winControl.addEventListener("iteminvoked", function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(winControl);
                handler.apply(this, args);
            });
        }
    };

    ko.bindingHandlers.component = {
        init: function (placeholderEl, valueAccessor) {
            var component = ko.utils.unwrapObservable(valueAccessor());

            var componentEl = component.render();
            ko.virtualElements.setDomNodeChildren(placeholderEl, [componentEl]);

            component.process().then(function () {
                if (typeof component.onWinControlAvailable === "function") {
                    component.onWinControlAvailable(componentEl, componentEl.winControl);
                }
            }).end();

            return { controlsDescendantBindings: true };
        }
    };
    ko.virtualElements.allowedBindings.component = true;

    var VOREACH_KEY = "__ko_voreach_vectorObservableArray";

    function createVoreachValueAccessor(element) {
        return function () {
            return element[VOREACH_KEY];
        };
    }

    ko.bindingHandlers.voreach = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var winRTObservableVector = ko.utils.unwrapObservable(valueAccessor());
            element[VOREACH_KEY] = ko.observableArray(winRTObservableVector);

            winRTObservableVector.addEventListener("vectorchanged", function () {
                element[VOREACH_KEY].valueHasMutated();
            });

            return ko.bindingHandlers.foreach.init(
                element, createVoreachValueAccessor(element), allBindingsAccessor, viewModel, bindingContext
            );
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            return ko.bindingHandlers.foreach.update(
                element, createVoreachValueAccessor(element), allBindingsAccessor, viewModel, bindingContext
            );
        }
    };
    ko.virtualElements.allowedBindings.voreach = true;
};
