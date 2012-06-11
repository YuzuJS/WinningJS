"use strict";

module.exports = function parseMapString(mapString, bindingTarget) {
    var pieces = mapString.split(",").filter(function (piece) { return !!piece; });
    
    var map = Object.create(null);

    pieces.forEach(function (piece) {
        var parts = piece.split(":");
        var key = parts[0].trim().toLowerCase();
        var value = parts[1].trim();

        if (!(value in bindingTarget)) {
            throw new TypeError("The binding target has no property \"" + value + "\".");
        }
        var bindTo = bindingTarget[value];

        map[key] = bindTo;
    });

    return map;
};
