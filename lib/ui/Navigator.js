"use strict";

var $ = require("jquery-browserify");

function getPageId(url) {
    return url.substring(url.lastIndexOf("/") + 1);
}

module.exports = function Navigator(nav, pageParentEl) {
    var that = this;

    nav.addEventListener("navigated", function (e) {
        $(pageParentEl).children("section[data-winning-page]").hide();

        var newPageName = getPageId(e.detail.location);
        var $newPage = $(pageParentEl).children("section[data-winning-page='" + newPageName + "']");
        if ($newPage.length === 0) {
            throw new Error('Could not find page "' + newPageName + '".');
        }
        if ($newPage.length > 1) {
            throw new Error('There was more than one page named "' + newPageName + '".');
        }

        $newPage.show();
    });

    that.navigate = function (location, state) {
        if (!location) {
            throw new Error("location parameter is required.");
        }

        nav.navigate(location, state);
    };

    that.listenToClicks = function (element) {
        $(element).on("click", "a, button", function (ev) {
            var href = this.getAttribute("href") || this.getAttribute("data-winning-href");
            if (href) {
                ev.preventDefault();

                var location = getPageId(href);
                that.navigate(location);
            }
        });
    };
};
