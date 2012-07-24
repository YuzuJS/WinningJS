"use strict";

exports.s = function (key) {
    if (!key || typeof key !== "string") {
        throw new Error("Resource key must be a valid string.");
    }
    var object = WinJS.Resources.getString(key);
    if (object.empty) {
        throw new Error("Resource with key '" + key + "' not found.");
    }
    return object.value;
};

exports.augmentGetString = function () {
    var REFERENCE_REGEX = /\{\^([^{]+)\}/g;
    var oldWinjsGetString = WinJS.Resources.getString;
    
    function getWithReferenceReplaced(string) {
        REFERENCE_REGEX.lastIndex = 0; // http://blog.stevenlevithan.com/archives/es3-regexes-broken
        
        return string.replace(REFERENCE_REGEX, function (bracedKey, key) {
            return exports.s(key);
        });
    }
    
    WinJS.Resources.getString = function (id) {
        var object = oldWinjsGetString(id);
        
        object.value = getWithReferenceReplaced(object.value);

        return object;
    };

};
