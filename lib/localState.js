"use strict";

var app = WinJS.Application;

exports.save = function (localState) {
    return app.local.writeText("_localState.json", JSON.stringify(localState));
};

exports.load = function () {
    return app.local.readText("_localState.json", "{}")
        .then(function (str) {
            return JSON.parse(str);
        });
};
