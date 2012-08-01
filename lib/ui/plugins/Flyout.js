"use strict";

var Q = require("q");
var _ = require("underscore");

module.exports = function FlyoutPlugin(flyoutsMap) {
    var that = this;

    function createShowFlyoutHandler(flyoutFactory) {
        var flyout = null;

        function appendToDomUntilHide(flyoutEl) {
            flyout.onNext("hide", document.body.removeChild.bind(document.body, flyoutEl));
            document.body.appendChild(flyoutEl);
        }

        function showFlyout(defaultAnchor) {
            flyout.show(flyout.anchor || defaultAnchor);
        }

        return function onShowFlyout(ev) {
            flyout = flyoutFactory(); // Always create new instances of the flyout.
            flyout.render()
                .then(appendToDomUntilHide)
                .then(showFlyout.bind(null, ev.target))
                .end();
        };
    }

    that.process = function (element) {
        var flyoutEls = Array.prototype.slice.call(element.querySelectorAll("[data-winning-flyout]"));

        flyoutEls.forEach(function (flyoutEl) {
            var key = flyoutEl.getAttribute("data-winning-flyout");

            if (_.has(flyoutsMap, key)) {
                var flyoutFactory = flyoutsMap[key];
                flyoutEl.addEventListener("click", createShowFlyoutHandler(flyoutFactory));
            } else {
                throw new Error("No handler was found for \"" + key + "\" in the flyouts map.");
            }
        });

        return element;
    };
};
