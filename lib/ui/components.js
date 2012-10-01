"use strict";

var Q = require("q");
var Presenter = require("./Presenter");
var _ = require("underscore");
var $ = require("jquery-browserify");
var makeEmitter = require("pubit").makeEmitter;

exports.createFlyoutConstructor = function (presenterOptionsFactory) {
    return function FlyoutComponent(options) {
        var that = this;

        var anchorEl = null;
        var publish = makeEmitter(that, ["show", "hide"]);

        var factoryArgs = Array.prototype.slice.call(arguments, 1);
        var presenterOptions = typeof presenterOptionsFactory === "function" ?
                                   presenterOptionsFactory.apply(null, factoryArgs) :
                                   presenterOptionsFactory;
        var presenter = new Presenter(presenterOptions);

        var flyoutWinControlDeferred = Q.defer();
        var flyoutWinControl = flyoutWinControlDeferred.promise;

        function initialize() {
            if (!options) {
                return;
            }

            if (options.plugins) {
                options.plugins.forEach(presenter.use);
            }

            var winControlOptions = _.pick(options, ["placement", "alignment", "anchor"]);
            if (Object.keys(winControlOptions).length > 0) {
                setWinControlOptions(winControlOptions);
            }
        }

        function setWinControlOptions(winControlOptions) {
            anchorEl = winControlOptions.anchor;

            flyoutWinControl.then(function (winControl) {
                _.extend(winControl, winControlOptions);
            }).end();
        }

        // Acts like a sync property because the `anchorEl` is set available right away.
        // The presenter's winControl implementation is hidden from the client.
        Object.defineProperty(that, "anchor", {
            get: function () { return anchorEl; },
            set: function (el) {
                anchorEl = el;
                flyoutWinControl.put("anchor", anchorEl);
            },
            enumerable: true
        });

        that.render = presenter.render;

        that.process = function () {
            return presenter.process().then(function (element) {
                flyoutWinControlDeferred.resolve(element.winControl);

                element.winControl.addEventListener("aftershow", publish.bind(null, "show"));
                element.winControl.addEventListener("afterhide", publish.bind(null, "hide"));

                return element;
            });
        };

        that.show = function () {
            return flyoutWinControl.post("show", arguments);
        };

        that.hide = function () {
            return flyoutWinControl.invoke("hide");
        };

        initialize();
    };
};

exports.mixinShowable = function (target, presenter) {
    target.show = function () {
        $(presenter.element).show();
    };

    target.hide = function () {
        $(presenter.element).hide();
    };
};
