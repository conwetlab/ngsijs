/* exports EventSource */

(function () {

    "use strict";

    var EventSource = function EventSource(url) {
        Object.defineProperty(this, "url", {value: url});

        EventSource.mockedeventsources.push(this);
        this.events = {
            open: [],
            error: [],
            init: [],
            close: [],
            notification: []
        };

        if (EventSource.eventsourceconfs[url] !== "timeout") {
            const timeout = setTimeout(() => {
                const event = !EventSource.eventsourceconfs[url] ? "init" : "error";
                this.dispatchEvent(event, event === "init" ? {data: "{\"id\": 1}"} : null);
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

    EventSource.prototype.CONNECTING = 0;
    EventSource.prototype.OPEN = 1;
    EventSource.prototype.CLOSED = 2;
    EventSource.prototype.dispatchEvent = function dispatchEvent(event, data) {
        this.events[event].forEach((listener) => {
            try {
                listener(data);
            } catch (e) {}
        });
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
