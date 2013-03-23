"use strict";

var makeEmitter = require("pubit-as-promised").makeEmitter;
var patches = require("./patches");
var localState = require("./localState");

var app = WinJS.Application;
var activation = Windows.ApplicationModel.Activation;
var activationKind = activation.ActivationKind;

// See http://msdn.microsoft.com/en-us/library/windows/apps/windows.applicationmodel.activation.activationkind
var kinds = [
    "launch", "search", "shareTarget", "file", "protocol", "fileOpenPicker", "fileSavePicker",
    "cachedFileUpdater", "contactPicker", "device", "printTaskSettings", "cameraSettings"
];

var allEvents = ["splash", "load", "suspend", "resume", "settings", "restore", "launch"];

var publish = makeEmitter(exports, allEvents);

var loaded;

var kindPlugins = {};

exports.registerKindPlugin = function (kind, plugin) {
    if (kinds.indexOf(kind) !== -1) {
        kindPlugins[kind] = plugin.handleKind;
        exports[kind] = {
            on: plugin.on,
            once: plugin.once,
            off: plugin.off
        };
    } else {
        throw new Error("[WinningJS/lib/app.registerKindPlugin] Unsupported kind: " + kind);
    }
};

exports.start = function () {
    Object.keys(patches).forEach(function (patch) {
        patches[patch]();
    });

    WinJS.Binding.optimizeBindingReferences = true;

    app.addEventListener("activated", function (args) {

        function publishSplash() {
            var promise = new WinJS.Promise(function (complete) {
                publish.when("splash", args.detail.splashScreen).done(complete);
            });
            args.setPromise(promise);
        }

        function publishLoad() {
            localState.load().then(function (localState) {
                exports.localState = localState;
                return publish.when("load", args.detail.previousExecutionState);
            }).done(publishRestore);
            args.setPromise(WinJS.UI.processAll());
        }

        function publishRestore() {
            if (args.detail.previousExecutionState === activation.ApplicationExecutionState.terminated) {
                publish.when("restore", WinJS.Application.sessionState).done(publishKind);
            } else {
                publishKind(); // Skip right to publishing the kind.
            }
        }

        function publishKind() {
            var kindStr = kinds[args.detail.kind];

            if (args.detail.kind === activationKind.launch) {
                publish(kindStr, args.detail.arguments);
            } else {
                if (kindPlugins[kindStr]) { // Supported kind plugin registered?
                    kindPlugins[kindStr](args);
                } else {
                    throw new Error("WinningJS - unsupported kind: " + kindStr);
                }
            }
        }

        if (!loaded) {
            loaded = true;
            publishSplash();
            publishLoad();
        } else {
            publishKind(); // Publish the actual kind.
        }

    });

    app.addEventListener("checkpoint", function (args) {
        app.sessionState = {};
        var promise = new WinJS.Promise(function (complete) {
            publish.when("suspend", app.sessionState)
                .then(function () {
                    return localState.save(exports.localState);
                })
                .done(complete);
        });
        args.setPromise(promise);
    });

    Windows.UI.WebUI.WebUIApplication.addEventListener("resuming", function () {
        publish("resume");
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
