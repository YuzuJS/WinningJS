This is just the beginning. Lots more to come.

How would you use a CommonJS-style module with Windows 8 and WinJS? I'm glad you asked. There's another project for
that.

# Events Published

An event listener MAY return a promise if it wishes to do any sort of asynchronous processing.

## Lifecycle events

### app.on("load")

This is the first event fired in the app lifecycle. The app should setup everything it needs here.

### app.on("restore")

This is fired if the system needs to be restored following an app termination. Fired after `load`.

## Kind events

The following events are fired after the lifecycle events `load` and `restore`. That is to say that a `protocol`
event (for example) MAY be preceded by a `load` and/or a `restore`.

### app.on("launch", arguments)

This is fired when the user launches the app by clicking the app tile or an app secondary tile.

* `argument` - Arguments passed if the launch came from a "Pin to Start" tile.

### app.on("protocol", uri)


* `uri` - A string uri that caused the event to fire. You MUST setup a Protocol Declaration
and specify the Name of protocol that your app will be handling (ex: mailto) in the
package manifest (package.appxmanifest) for your project.

### app.on("shareTarget", shareOperation)

* `shareOperation`

### app.on("file", files)

Fired when a user clicks on a file type that is associated with your app.

* `files` - An array of files.

## Other Events

These events do NOT contain the common arg properties and do NOT fires after immediately after a Lidecycle event.

### app.on("settings", settingsCommand)

settingsCommand:

* `append` - A method that you call to append commands to the Settings flyout. `append` takes three parameters:
`id`, `label`, and `handler`.

