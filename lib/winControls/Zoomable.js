"use strict";

/*jshint unused: false */

// TODO: figure out how to properly implement all this. Right now it does enough to allow us to put non-`ListView`s
// as children of a `WinJS.UI.SemanticZoom` control via `element.winControl = new Zoomable()`, but presumably by leaving
// so many methods of `IZoomableView` empty: http://msdn.microsoft.com/en-us/library/windows/apps/br229794.aspx

function ZoomableView() { }

ZoomableView.prototype = {
    constructor: ZoomableView,

    getPanAxis: function () {

    },
    configureForZoom: function (isZoomedOut, isCurrentView, triggerZoom, prefetchedPages) {

    },
    setCurrentItem: function (x, y) {

    },
    getCurrentItem: function () {

    },
    beginZoom: function () {

    },
    positionItem: function (item, position) {

    },
    endZoom: function (isCurrentView) {

    },
    handlePointer: function (pointerId) {

    }
};

function Zoomable(element, options) {
    this.zoomableView = new ZoomableView();
}

WinJS.Utilities.markSupportedForProcessing(Zoomable);

module.exports = Zoomable;
