/* exports EventSource */

(function () {

    "use strict";

    var EventSource = function EventSource(url) {
        Object.defineProperty(this, "url", {value: url});

        EventSource.mockedeventsources.push(this);
        this.events = {
            error: [],
            init: [],
            close: [],
            notification: []
        };

        if (EventSource.eventsourceconfs[url] !== "timeout") {
            var timeout = setTimeout(() => {
                var i;
                var event = !EventSource.eventsourceconfs[url] ? this.events.init : this.events.error;
                for (i = 0; i < event.length; i++) {
                    try {
                        event[i]({data: "{\"id\": 1}"});
                    } catch (e) {}
                }
            }, 0);
            EventSource.timeouts.push(timeout);
        }
        this.close = jasmine.createSpy('close');
    };
    EventSource.timeouts = [];

    EventSource.clear = function clear() {
        EventSource.timeouts.forEach(clearTimeout);
        EventSource.timeouts = [];
        EventSource.mockedeventsources = [];
        EventSource.eventsourceconfs = {};
    };

    EventSource.prototype.addEventListener = function addEventListener(event_name, handler) {
        this.events[event_name].push(handler);
    };

    EventSource.prototype.removeEventListener = function removeEventListener(event_name, handler) {
        var index = this.events[event_name].indexOf(handler);
        if (index !== -1) {
            this.events[event_name].splice(index, 1);
        }
    };

    /* Detect Node.js */
    if ((typeof require === 'function') && typeof global != null) {
        global.EventSource = EventSource;
    } else {
        window.EventSource = EventSource;
    }

})();
