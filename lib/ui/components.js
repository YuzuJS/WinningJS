"use strict";

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

            presenter.winControl.then(function (winControl) {
                _.extend(winControl, winControlOptions);
            }).end();
        }

        // Acts like a sync property because the `anchorEl` is set available right away.
        // The presenter's winControl implementation is hidden from the client.
        Object.defineProperty(that, "anchor", {
            get: function () { return anchorEl; },
            set: function (el) {
                anchorEl = el;
                presenter.winControl.put("anchor", anchorEl);
            },
            enumerable: true
        });

        that.render = presenter.process;

        presenter.winControl.then(function (winControl) {
            winControl.addEventListener("aftershow", publish.bind(null, "show"));
            winControl.addEventListener("afterhide", publish.bind(null, "hide"));
        });

        that.show = function () {
            return presenter.winControl.post("show", arguments);
        };

        that.hide = function () {
            return presenter.winControl.invoke("hide");
        };

        initialize();
    };
};

exports.mixinShowable = function (target, presenter) {
    target.show = function () {
        presenter.element.then(function (element) {
            $(element).show();
        }).end();
    };

    target.hide = function () {
        presenter.element.then(function (element) {
            $(element).hide();
        }).end();
    };
};
