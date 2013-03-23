"use strict";

var notifications = Windows.UI.Notifications;
var notifier = notifications.ToastNotificationManager.createToastNotifier();

function getTemplateType(options) {
    var typeName = "toast";
    if (options.image) {
        typeName += "ImageAnd";
    }
    typeName += "Text0" + options.type;

    return notifications.ToastTemplateType[typeName];
}

function setImage(image, xmlDoc) {
    if (image) {
        var imageEl = xmlDoc.getElementsByTagName("image")[0];
        imageEl.setAttribute("src", image.src);
        imageEl.setAttribute("alt", image.alt);
    }
}

function setText(text, xmlDoc) {
    if (typeof text === "string") {
        text = [text];
    }

    var textEls = xmlDoc.getElementsByTagName("text");
    if (textEls.length !== text.length) {
        throw new Error("The number of text lines provided does not match the notification type specified.");
    }

    for (var i = 0; i < textEls.length; ++i) {
        textEls[i].innerText = text[i];
    }
}

function setLaunch(launch, xmlDoc) {
    if (launch) {
        xmlDoc.selectSingleNode("/toast").setAttribute("launch", launch);
    }
}

exports.show = function (options) {

    if (typeof options === "string") {
        options = { type: 1, text: [options] };
    }

    var type = getTemplateType(options);
    var xmlDoc = notifications.ToastNotificationManager.getTemplateContent(type);

    setImage(options.image, xmlDoc);
    setText(options.text, xmlDoc);
    setLaunch(options.launch, xmlDoc);

    var toast = new notifications.ToastNotification(xmlDoc);
    notifier.show(toast);
};
