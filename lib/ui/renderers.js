"use strict";

var ko = require("knockout");
var getElementFromTemplate = require("./utils").getElementFromTemplate;

exports.fromComponentFactory = function (componentFactory) {
    return function (itemPromise) {
        return itemPromise.then(function (item) {
            var component = componentFactory(item.data);
            component.render();

            return component.process();
        });
    };
};

exports.fromTemplate = function (itemTemplate) {
    return function (itemPromise) {
        return itemPromise.then(function (item) {
            var el = getElementFromTemplate(itemTemplate);
            ko.applyBindings(item.data, el);
            return el;
        });
    };
};
