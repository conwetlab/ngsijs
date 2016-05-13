(function () {

    "use strict";

    function EventSource(url) {
        Object.defineProperty(this, "url", {value: url});

        EventSource.mocks.push(this);
        this.events = {
            init: [],
            close: [],
            notification: []
        };

        setTimeout(function () {
            var i;

            for (i = 0; i < this.events.init.length; i++) {
                try {
                    this.events.init[i]({data: "{\"id\": 1}"});
                } catch (e) {}
            }
        }.bind(this), 0);
    };

    EventSource.mocks = [];

    EventSource.prototype.addEventListener = function addEventListener(event_name, handler) {
        this.events[event_name].push(handler);
    };

    EventSource.prototype.removeEventListener = function removeEventListener(event_name, handler) {
        var index = this.events[event_name].indexOf(handler);
        if (index !== -1) {
            this.events[event_name].splice(index, 1);
        }
    };

    if (typeof window !== 'undefined') {
      exports = window;
    }

    exports.EventSource = EventSource;
})();
