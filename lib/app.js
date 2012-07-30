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
            this.renderer = WinJS.UI._trivialHtmlRenderer; // CHANGE: Get access to the default list renderer.
        } else if (typeof newRenderer === "function") {
            this.renderer = newRenderer;
        } else if (typeof newRenderer === "object") {
            if (WinJS.validation && !newRenderer.renderItem) {
                throw new WinJS.ErrorFromName("WinJS.UI.ListView.invalidTemplate", WinJS.UI._strings.invalidTemplate);
            }
            this.renderer = newRenderer.renderItem.bind(newRenderer); // CHANGE: bind to `newRenderer`.
        }
    };
}

function patchRenderSelection() {
    // Pulled from //Microsoft.WinJS.1.0.RC/js/ui.js line 22068
    WinJS.UI.ListView.prototype._renderSelection = function ListView_renderSelection(wrapper, element, selected, aria) {
        // Update the selection rendering if necessary
        if (selected !== WinJS.UI._isSelectionRenderer(wrapper)) {
            if (selected) {
                wrapper.insertBefore(this._selectionTemplate[0].cloneNode(true), wrapper.firstElementChild);
                for (var i = 1, len = this._selectionTemplate.length; i < len; i++) {
                    wrapper.appendChild(this._selectionTemplate[i].cloneNode(true));
                }
            } else {
                var nodes = wrapper.querySelectorAll(WinJS.UI._selectionPartsSelector);
                for (var j = 0, length = nodes.length; j < length; j++) { // CHANGE: Replace `i` and `len` with `j` and `length`
                    if (nodes[j].parentNode === wrapper) { // CHANGE: Check if `nodes[j]` has `wrapper` as its parent
                        wrapper.removeChild(nodes[j]);
                    }
                }
            }
            // CHANGE: `utilities` to `WinJS.Utilities`
            WinJS.Utilities[selected ? "addClass" : "removeClass"](wrapper, WinJS.UI._selectedClass);
        }
        // To allow itemPropertyChange to work properly, aria needs to be updated after the selection visuals are added to the wrapper
        if (aria) {
            this._setAriaSelected(element, selected);
        }
    };
}

exports.start = function () {
    patchSetRenderer();
    patchRenderSelection();

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
