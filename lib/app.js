"use strict";

var makeEmitter = require("pubit").makeEmitter;
var patches = require("./patches");

var publish = makeEmitter(exports, { events: ["launch", "reactivate", "beforeSuspend"] });

exports.start = function () {
    Object.keys(patches).forEach(function (patch) {
        patches[patch]();
    });

    WinJS.Application.addEventListener("activated", function (eventObject) {
        if (eventObject.detail.kind === Windows.ApplicationModel.Activation.ActivationKind.launch) {
            if (eventObject.detail.previousExecutionState !==
                Windows.ApplicationModel.Activation.ApplicationExecutionState.terminated) {
                publish("launch", eventObject);
            } else {
                publish("reactivate", eventObject);
            }

            WinJS.UI.processAll();
        }
    });

    WinJS.Application.addEventListener("checkpoint", function (eventObject) {
        publish("beforeSuspend", eventObject);
    });

    WinJS.Application.start();
};
