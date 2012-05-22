"use strict";

var makeEmitter = require("pubit").makeEmitter;

var publish = makeEmitter(exports, { events: ["launch", "reactivate", "beforeSuspend"] });

WinJS.Application.onactivated = function (eventObject) {
    if (eventObject.detail.kind === Windows.ApplicationModel.Activation.ActivationKind.launch) {
        if (eventObject.detail.previousExecutionState !==
            Windows.ApplicationModel.Activation.ApplicationExecutionState.terminated) {
            publish("launch", eventObject);
        } else {
            publish("reactivate", eventObject);
        }

        WinJS.UI.processAll();
    }
};

WinJS.Application.oncheckpoint = function (eventObject) {
    publish("beforeSuspend", eventObject);
};

WinJS.Application.start();
