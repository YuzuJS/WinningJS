"use strict";

exports.scaleLength = function (length) {
    return Math.round(length * Windows.Graphics.Display.DisplayProperties.resolutionScale / 100);
};

exports.flexibleGridLayout = function () {
    // Setting the `layout` property of a `ListView` to this return value allows its items to have different sizes.
    // This works by saying that each "cell" is 1 pixel by 1 pixel, but that if the contents of a cell gets too large,
    // it can span multiple cells (`enableCellSpanning: true`), and thus be any number of pixels.
    return exports.createGridLayout(1, 1);
};

exports.createGridLayout = function (cellWidth, cellHeight) {
    // Setting the `layout` property of a `ListView` to this return value allows its items to have different sizes.
    // It can span multiple cells (`enableCellSpanning: true`).
    return new WinJS.UI.GridLayout({
        groupInfo: function () {
            return {
                enableCellSpanning: true,
                cellWidth: cellWidth,
                cellHeight: cellHeight
            };
        }
    });
};
