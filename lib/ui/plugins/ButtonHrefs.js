"use strict";

var $ = require("jquery-browserify");

module.exports = function ButtonHrefsPlugin() {
    this.process = function (element) {
        $(element).on("click", "button[data-winning-href]", function (ev) {
            var href = ev.target.getAttribute("data-winning-href");
            document.location.href = href;
        });
    };
};
