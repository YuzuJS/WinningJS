"use strict";

var $ = require("jquery2");

module.exports = function HrefsPlugin() {
    this.process = function (element) {
        $(element).on("click", "[data-winning-href]", function (ev) {
            var href = ev.currentTarget.getAttribute("data-winning-href");
            document.location.href = href;
        });
    };
};
