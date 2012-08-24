"use strict";

var _ = require("underscore");

// This module exports a class `ObservableVectorDataSource`, which adapts an [`IObservableVector<T>`][] instance into an
// [`IListDataSource`][] instance that can be used for databinding to WinJS controls like [`ListView`][].
//
// It does this by leveraging the existing infrastructure for [creating a custom data source][], namely deriving from
// [`VirtualizedDataSource`][] and passing in a custom [`IListDataAdapter`][] instance, viz.
// `ObservableVectorListDataAdapter` below. One piece of implementation knowledge that may be helpful to keep in mind:
// while data sources have a notion of “key,” a vector does not—it simply has indices. Nevertheless, keys seem to be
// necessary for a functional implementation of a data source, and so we choose the keys to simply be the string values
// of the corresponding index.
//
// Notably, the data source is a *read-only* view into the observable vector: none of the mutation methods will
// function. This is simply an implementation choice: there is nothing, theoretically, stopping us from extending this
// implementation to support mutation as well.
//
// [`IObservableVector<T>`]: http://msdn.microsoft.com/en-us/library/windows/apps/br226052.aspx
// [`IListDataSource`]: http://msdn.microsoft.com/en-us/library/windows/apps/br211786.aspx
// [`ListView`]: http://msdn.microsoft.com/en-us/library/windows/apps/br211837.aspx
// [creating a custom data source]: http://msdn.microsoft.com/en-us/library/windows/apps/hh770849.aspx
// [`VirtualizedDataSource`]: http://msdn.microsoft.com/en-us/library/windows/apps/hh701413.aspx
// [`IListDataAdapter`]: http://msdn.microsoft.com/en-us/library/windows/apps/br212603.aspx


function ObservableVectorListDataAdapter(observableVector) {
    var that = this;

    that._observableVector = observableVector;

    // Translate the observable vector's `"vectorchanged"` events to method calls on the notification handler that has
    // been set below in `ObservableVectorListDataAdapter.prototype.setNotificationHandler` (if any). The
    // `VirtualizedDataSource` will translate these method calls into updates of the virtualized data source that we are
    // creating, and thus anything bound the data source will get updated as a result.
    //
    // A more sophisticated implementation could debounce and aggregate incoming events, firing them as batches using
    // the notification handler's `beginNotifications` and `endNotifications` methods, and even translating
    // removal/insertion pairs for the same item into `moved` calls.
    that._observableVector.addEventListener("vectorchanged", function (ev) {
        if (!that._notificationHandler) {
            return;
        }

        // Relevant docs:
        // - [`IVectorChangedEventArgs`](http://msdn.microsoft.com/en-us/library/windows/apps/windows.foundation.collections.ivectorchangedeventargs):
        //   `ev` is one of these.
        // - [`CollectionChange` enumeration](http://msdn.microsoft.com/en-us/library/windows/apps/windows.foundation.collections.collectionchange)
        //   `ev.collectionChange` is one of these.
        // - [`IListDataNotificationHandler`](http://msdn.microsoft.com/en-us/library/windows/apps/br212587.aspx):
        //   `that._notificationHandler` is one of these.

        switch (ev.collectionChange) {
        case Windows.Foundation.Collections.CollectionChange.reset:
            that._notificationHandler.reload();
            break;
        case Windows.Foundation.Collections.CollectionChange.itemInserted:
            that._notifyInsertedAtIndex(ev.index);
            break;
        case Windows.Foundation.Collections.CollectionChange.itemRemoved:
            that._notificationHandler.removed(ev.index.toString(), ev.index);
            break;
        case Windows.Foundation.Collections.CollectionChange.itemChanged:
            that._notificationHandler.changed(that._itemFromIndex(ev.index));
            break;
        }
    });
}

// Implement the read-only subset of `IListDataAdapter`.
ObservableVectorListDataAdapter.prototype = {
    constructor: ObservableVectorListDataAdapter,

    _itemFromIndex: function (index) {
        // Given an index into the observable vector, returns an [`IItem`][] containing the data at that index. This is
        // used because the notification handler must be called with `IItem` instances, and the `IFetchResult`s returned
        // by `itemsFromIndex` must contain them.
        // [`IItem`]: http://msdn.microsoft.com/en-us/library/windows/apps/br212592.aspx

        var data = this._observableVector[index];
        return {
            data: data,
            key: index.toString()
        };
    },
    _notifyInsertedAtIndex: function (index) {
        var previousKey = index === 0 ? null : (index - 1).toString();
        var nextKey = index === this._observableVector.length - 1 ? null : (index + 1).toString();
        this._notificationHandler.inserted(this._itemFromIndex(index), previousKey, nextKey, index);
    },
    getCount: function () {
        return WinJS.Promise.wrap(this._observableVector.length);
    },
    itemsFromIndex: function (index, countBefore, countAfter) {
        var start = index - countBefore;
        var end = index + countAfter;
        var length = this._observableVector.length;

        // This behavior is consistent with that of the built-in `IListDataAdapter` implementations.
        if (start < 0 || end >= length) {
            return WinJS.Promise.wrapError(new WinJS.ErrorFromName(WinJS.UI.FetchError.doesNotExist));
        }

        // Returns a promise for an [`IFetchResult`].
        // [`IFetchResult`]: http://msdn.microsoft.com/en-us/library/windows/apps/br212548.aspx
        return WinJS.Promise.wrap({
            absoluteIndex: index,
            atEnd: end === length - 1,
            atStart: start === 0,
            items: _.range(start, end + 1).map(this._itemFromIndex.bind(this)),
            offset: countBefore,
            totalCount: length
        });
    },
    itemsFromKey: function (key, countBefore, countAfter) {
        // Recall that keys are simply stringified versions of the indices.
        return this.itemsFromIndex(+key, countBefore, countAfter);
    },
    itemsFromStart: function (count) {
        return this.itemsFromIndex(0, 0, count);
    },
    itemsFromEnd: function (count) {
        return this.itemsFromIndex(this._observableVector.length - 1, count - 1, 0);
    },
    setNotificationHandler: function (notificationHandler) {
        // Store the reference on this instance; the actual proxying to this handler takes place in the constructor.
        this._notificationHandler = notificationHandler;

        // One tick later, after WinJS has had time to settle down, notify the notification handler about any items
        // already in the observable vector.
        var that = this;
        setImmediate(function () {
            if (that._observableVector.length > 0) {
                that._notificationHandler.beginNotifications();
                that._observableVector.forEach(function (data, i) {
                    that._notifyInsertedAtIndex(i);
                });
                that._notificationHandler.endNotifications();
            }
        });
    }
};


// `ObservableVectorDataSource` is simply a thin wrapper, implementing `VirtualizedDataSource` by passing all
// responsibilities through to `ObservableVectorListDataAdapter`.
function ObservableVectorDataSource(observableVector) {
    this._baseDataSourceConstructor(new ObservableVectorListDataAdapter(observableVector));
}
ObservableVectorDataSource.prototype = Object.create(WinJS.UI.VirtualizedDataSource.prototype);
ObservableVectorDataSource.prototype.constructor = ObservableVectorDataSource;

module.exports = ObservableVectorDataSource;
