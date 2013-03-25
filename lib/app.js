"use strict";

var makeEmitter = require("pubit").makeEmitter;
var patches = require("./patches");
var app = WinJS.Application;
var activation = Windows.ApplicationModel.Activation;

var publish = makeEmitter(exports, ["launch", "suspend", "resume", "settings"]);

exports.start = function () {
    Object.keys(patches).forEach(function (patch) {
        patches[patch]();
    });

    WinJS.Binding.optimizeBindingReferences = true;

    app.addEventListener("activated", function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                publish("launch", args);
            }

            args.setPromise(WinJS.UI.processAll());
        }
    });

    app.addEventListener("checkpoint", function (args) {
        publish("suspend", args);
    });

    Windows.UI.WebUI.WebUIApplication.addEventListener("resuming", function (args) {
        publish("resume", args);
    });

    app.addEventListener("settings", function (e) {
        publish("settings", {
            append: function (id, label, handler) {
                var cmd = new Windows.UI.ApplicationSettings.SettingsCommand(id, label, handler);
                e.detail.e.request.applicationCommands.append(cmd);
            }
        });
        WinJS.UI.SettingsFlyout.populateSettings(e);
    });

    app.start();
};
