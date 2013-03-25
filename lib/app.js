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
        // TODO add support for activation kinds other than `launch`
        // See http://msdn.microsoft.com/en-us/library/windows/apps/windows.applicationmodel.activation.activationkind
        if (args.detail.kind === activation.ActivationKind.launch) {
            publish("launch", args);
            args.setPromise(WinJS.UI.processAll());
        } else {
            throw new Error("WinningJS - Activated with unknown activation.ActivationKind = " + args.detail.kind);
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
