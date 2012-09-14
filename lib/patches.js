"use strict";

// A number of WinJS methods have flat-out bugs. These are patched here.

// The `setRenderer` method accepts objects with `renderItem` methods, but then uses those methods as if they were
// simple functions—that is, it forgets to bind the method before assigning it.
//
// - A longer explanation and test case can be found at https://gist.github.com/2889463.
// - Original source at //Microsoft.WinJS.1.0/js/ui.js line 20039
exports.patchSetRenderer = function () {
    WinJS.UI._ElementsPool.prototype.setRenderer = function (newRenderer) {
        if (!newRenderer) {
            if (WinJS.validation) {
                throw new WinJS.ErrorFromName("WinJS.UI.ListView.invalidTemplate", WinJS.UI._strings.invalidTemplate);
            }
            this.renderer = WinJS.UI._trivialHtmlRenderer; // CHANGE: use global instead of local variable.
        } else if (typeof newRenderer === "function") {
            this.renderer = newRenderer;
        } else if (typeof newRenderer === "object") {
            if (WinJS.validation && !newRenderer.renderItem) {
                throw new WinJS.ErrorFromName("WinJS.UI.ListView.invalidTemplate", WinJS.UI._strings.invalidTemplate);
            }
            this.renderer = newRenderer.renderItem.bind(newRenderer); // CHANGE: fix bug by binding the method.
        }
    };
};

// The `_renderSelection` method does a `wrapper.querySelectorAll` to find all descendants matching a given selector,
// but then loops through the results, calling `wrapper.removeChild` on them. This throws a DOM error in the
// not-unlikely case where the descendant is not an immediate child.
//
// - Original source at //Microsoft.WinJS.1.0/js/ui.js line 23319
exports.patchRenderSelection = function () {
    WinJS.UI.ListView.prototype._renderSelection = function (wrapper, element, selected, aria) {
        // Update the selection rendering if necessary
        if (selected !== WinJS.UI._isSelectionRenderer(wrapper)) {
            if (selected) {
                wrapper.insertBefore(this._selectionTemplate[0].cloneNode(true), wrapper.firstElementChild);

                for (var i = 1, len = this._selectionTemplate.length; i < len; i++) {
                    wrapper.appendChild(this._selectionTemplate[i].cloneNode(true));
                }
            } else {
                var nodes = wrapper.querySelectorAll(WinJS.UI._selectionPartsSelector);
                // CHANGE: make JSHint happy by replacing `i` with `j` and `len` with `len2`.
                for (var j = 0, len2 = nodes.length; j < len2; j++) {
                    if (nodes[j].parentNode === wrapper) { // CHANGE: check if it's an immediate child before removing.
                        wrapper.removeChild(nodes[j]); // CHANGE: `i` to `j` to match the above.
                    }
                }
            }

            // CHANGE: use global `WinJS.Utilities` instead of local `utilities` alias.
            WinJS.Utilities[selected ? "addClass" : "removeClass"](wrapper, WinJS.UI._selectedClass);
        }

        // To allow itemPropertyChange to work properly, aria needs to be updated after the selection visuals are added to the wrapper
        if (aria) {
            this._setAriaSelected(element, selected);
        }
    };
};

// The `_alignViews` returns a WinJS promise when the current view does not provide a current item.
// This promise is never resolved as it simply returns an object instead of correctly calling the complete
// function argument. Instead we will patch it and resolve the promise using the `as` method.
//
// - Original source at //Microsoft.WinJS.1.0/js/ui.js line 30419
exports.patchSemanticZoomAlignViews = function () {
    WinJS.UI.SemanticZoom.prototype._alignViews = function (zoomOut, centerX, centerY, completedCurrentItem) {
        var multiplier = (1 - this._zoomFactor),
            rtl = this._rtl(),
            offsetLeft = multiplier * (rtl ? this._viewportWidth - centerX : centerX),
            offsetTop = multiplier * centerY;

        var that = this;
        if (zoomOut) {
            var item = completedCurrentItem || this._viewIn.getCurrentItem();
            if (item) {
                return item.then(function (current) {
                    var positionIn = current.position,
                    positionOut = {
                        left: positionIn.left * that._zoomFactor + offsetLeft,
                        top: positionIn.top * that._zoomFactor + offsetTop,
                        width: positionIn.width * that._zoomFactor,
                        height: positionIn.height * that._zoomFactor
                    };

                    return that._viewOut.positionItem(that._zoomedOutItem(current.item), positionOut);
                });
            }
        } else {
            var item2 = completedCurrentItem || this._viewOut.getCurrentItem();
            if (item2) {
                return item2.then(function (current) {
                    var positionOut = current.position,
                    positionIn = {
                        left: (positionOut.left - offsetLeft) / that._zoomFactor,
                        top: (positionOut.top - offsetTop) / that._zoomFactor,
                        width: positionOut.width / that._zoomFactor,
                        height: positionOut.height / that._zoomFactor
                    };

                    return that._viewIn.positionItem(that._zoomedInItem(current.item), positionIn);
                });
            }
        }

        // CHANGE: Correctly resolve promise by as method.
        return WinJS.Promise.as({ x: 0, y: 0 });
    };
};
