"use strict";

var Q = require("q");

module.exports = function FlyoutPlugin(flyoutsMap) {
    var that = this;

    function createShowFlyoutHandler(flyout) {
        function appendToDomUntilHide(flyoutEl) {
            flyout.onNext("hide", document.body.removeChild.bind(document.body, flyoutEl));
            document.body.appendChild(flyoutEl);
        }

        function showFlyout(defaultAnchor) {
            flyout.show(flyout.anchor || defaultAnchor);
        }

        return function onShowFlyout(ev) {
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

            if (flyoutsMap.hasOwnProperty(key)) {
                var flyout = flyoutsMap[key];
                flyoutEl.addEventListener("click", createShowFlyoutHandler(flyout));
            }
        });

        return element;
    };
};
