"use strict";

var ko = require("knockoutify");

// TODO both of these leak memory :(. Neither subscription ever goes away.

exports.observableFromProperty = function (object, propertyName) {
    var observable = ko.observable(object[propertyName]);

    observable.subscribe(function (newValue) {
        object[propertyName] = newValue;
    });

    return observable;
};

exports.observableFromChangingProperty = function (object, propertyName) {
    var observable = exports.observableFromProperty(object, propertyName);

    object.on(propertyName + "Change", function (newValue) {
        observable(newValue);
    });

    return observable;
};

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
};
