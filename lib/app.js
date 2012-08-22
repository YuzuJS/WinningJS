"use strict";

var makeEmitter = require("pubit").makeEmitter;
var patches = require("./patches");
var app = WinJS.Application;
var activation = Windows.ApplicationModel.Activation;

var publish = makeEmitter(exports, ["launch", "reactivate", "beforeSuspend"]);

exports.start = function () {
    Object.keys(patches).forEach(function (patch) {
        patches[patch]();
    });

    WinJS.Binding.optimizeBindingReferences = true;

    app.addEventListener("activated", function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                publish("launch", args);
            } else {
                publish("reactivate", args);
            }

            args.setPromise(WinJS.UI.processAll());
        }
    });

    app.addEventListener("checkpoint", function (args) {
        publish("beforeSuspend", args);
    });

    app.start();
};
