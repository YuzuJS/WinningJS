"use strict";

var $ = require("jquery");

function getPageId(url) {
    return url.substring(url.lastIndexOf("/") + 1);
}

module.exports = function Navigator(options, nav) {
    var that = this;
    if (!options.home) {
        throw new Error("Need to pass a home option.");
    }

    that.home = options.home;
    
    nav.addEventListener("navigated", function (e) {
        var body = document.body;
        $(body).children("section[data-winning-page]").hide();

        var newPageName = getPageId(e.detail.location);

        var $newPage = $(body).children("section[data-winning-page='" + newPageName + "']");
        if ($newPage.length === 0) {
            throw new Error('Could not find page "' + newPageName + '".');
        }
        if ($newPage.length > 1) {
            throw new Error('There was more than one page named "' + newPageName + '".');
        }

        $newPage.show();
    });

    that.navigate = function (location) {
        if (!location) {
            throw new Error("location parameter is required.");
        }
        nav.navigate(location);
    };

    that.listenToClicks = function (element) {
        $(element).on("click", "a, button", function (ev) {
            var href = this.getAttribute("href") || this.getAttribute("data-winning-href");
            if (href) {
                ev.preventDefault();

                var location = getPageId(href);
                nav.navigate(location);
            }
        });
    };
};
