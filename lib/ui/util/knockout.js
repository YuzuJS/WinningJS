"use strict";

var $ = require("jQuery");
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

