"use strict";

var makeEmitter = require("pubit").makeEmitter;

var publish = makeEmitter(exports, { events: ["launch", "reactivate", "beforeSuspend"] });

function patchSetRenderer() {
    // Pulled from //Microsoft.WinJS.1.0.RC/js/ui.js line 19133
    WinJS.UI._ElementsPool.prototype.setRenderer = function (newRenderer) {
        if (!newRenderer) {
            if (WinJS.validation) {
                throw new WinJS.ErrorFromName("WinJS.UI.ListView.invalidTemplate", WinJS.UI._strings.invalidTemplate);
            }
            this.renderer = WinJS.UI._trivialHtmlRenderer; // This is changed to get access to the default list renderer.
        } else if (typeof newRenderer === "function") {
            this.renderer = newRenderer;
        } else if (typeof newRenderer === "object") {
            if (WinJS.validation && !newRenderer.renderItem) {
                throw new WinJS.ErrorFromName("WinJS.UI.ListView.invalidTemplate", WinJS.UI._strings.invalidTemplate);
            }
            this.renderer = newRenderer.renderItem.bind(newRenderer); // This is the other change (binding to newRenderer).
        }
    };
}

exports.start = function () {
    patchSetRenderer();

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
};
