"use strict";

var Presenter = require("./Presenter");
var _ = require("underscore");
var makeEmitter = require("pubit").makeEmitter;

exports.createFlyoutConstructor = function (template) {
    return function FlyoutComponent(options) {
        var that = this;
        var anchorEl = null;
        var publish = makeEmitter(that, ["show", "hide"]);

        var presenter = new Presenter({
            template: template
        });

        function setOptions() {
            anchorEl = options.anchor;

            presenter.winControl.then(function (winControl) {
                _.extend(winControl, options);
            }).end();
        }

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
            return presenter.winControl.invoke("show");
        };

        that.hide = function () {
            return presenter.winControl.invoke("hide");
        };

        if (options) {
            options = _.pick(options, ["placement", "alignment", "anchor"]);
            setOptions();
        }
    };
};
