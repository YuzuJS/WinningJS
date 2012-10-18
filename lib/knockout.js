"use strict";

var collectionChange = Windows.Foundation.Collections.CollectionChange;
var $ = require("jquery-browserify");
var ko = require("knockoutify");

exports.observableArrayFromVector = function (vector, mapping) {
    // Don't let `Array.prototype.map` pass through index and array arguments. If that happened, then e.g. removing
    // an element from the array would mean needing to re-map all elements after it, since their indices changed.
    // We don't want to support that use case, so ensure that at all times `mapping` gets only a single argument.
    var singleArgMapping = mapping ? function (x) { return mapping(x); } : function (x) { return x; };

    var array = ko.observableArray(vector.map(singleArgMapping));

    vector.addEventListener("vectorchanged", function (ev) {
        switch (ev.collectionChange) {
        case collectionChange.reset:
            array.removeAll();
            array.push.apply(array, vector.map(singleArgMapping));
            break;
        case collectionChange.itemInserted:
            array.splice(ev.index, 0, singleArgMapping(vector[ev.index]));
            break;
        case collectionChange.itemRemoved:
            array.splice(ev.index, 1);
            break;
        case collectionChange.itemChanged:
            array.splice(ev.index, 1, singleArgMapping(vector[ev.index]));
            break;
        }
    });

    return array;
};

exports.observableFromMapItem = function (map, itemKey) {
    var observable = ko.observable(map[itemKey]);

    map.addEventListener("mapchanged", function (ev) {
        if (ev.key === itemKey && ev.collectionChange === collectionChange.itemChanged) {
            observable(map[itemKey]);
        }
    });

    return observable;
};

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

    ko.bindingHandlers.variableClass = {
        update: function (element, valueAccessor) {
            var className = ko.utils.unwrapObservable(valueAccessor());
            var $element = $(element);

            var previousClass = $element.data("ko-variable-class");
            if (previousClass) {
                $element.removeClass(previousClass);
            }

            if (className) {
                $element.data("ko-variable-class", className);
                $element.addClass(className);
            }
        }
    };

    ko.bindingHandlers.component = {
        init: function () {
            return { controlsDescendantBindings: true };
        },
        update: function (placeholderEl, valueAccessor) {
            var component = ko.utils.unwrapObservable(valueAccessor());

            var componentEl = component.render();
            ko.virtualElements.setDomNodeChildren(placeholderEl, [componentEl]);
            component.process().end();
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

    function createWinrtValueAccessor(key, newValue) {
        var obj = {};
        obj[key] = newValue;
        return function () {
            return obj;
        };
    }

    function updateWinrtBinding(element, bindingName, key, newValue) {
        var newValueAccessor = createWinrtValueAccessor(key, newValue);
        ko.bindingHandlers[bindingName].update(element, newValueAccessor);
    }

    ko.bindingHandlers.winrt = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var bindings = valueAccessor();

            // a map from view model property names to { bindingName, key } arrays
            var bindingsMap = Object.create(null);

            Object.keys(bindings).forEach(function (bindingName) {
                switch (bindingName) {
                    case "attr":
                    case "style": // these two both take object literals mapping to property names.
                        var map = bindings[bindingName];
                        Object.keys(map).forEach(function (key) {
                            var propertyName = map[key];

                            if (!(propertyName in bindingsMap)) {
                                bindingsMap[propertyName] = [];
                            }

                            bindingsMap[propertyName].push({ bindingName: bindingName, key: key });
                            updateWinrtBinding(element, bindingName, key, viewModel[propertyName]);
                        });

                        break;
                    default:
                        throw new Error("I can't deal with this.");
                }

                viewModel.addEventListener("mapchanged", function (ev) {
                    var propertyName = ev.key;
                    if (ev.collectionChange === collectionChange.itemChanged && propertyName in bindingsMap) {
                        bindingsMap[propertyName].forEach(function (binding) {
                            updateWinrtBinding(element, binding.bindingName, binding.key, viewModel[propertyName]);
                        });
                    }
                });
            });
        }
    };
};
