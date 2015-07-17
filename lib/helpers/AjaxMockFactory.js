(function () {
    "use strict";

    var proto = {
        'clear': function clear() {
            this.staticURLs = {};
        },
        'addStaticURL': function addStaticURL(url, response) {
            this.staticURLs[url] = response;
        }
    };

    var ajaxMockFactory = {
        'createFunction': function createFunction() {
            var func, instance, key;

            instance = {};

            func = function (url, options) {
                var specific_callback, response_info;

                if (options == null) {
                    options = {};
                }

                if (url in this.staticURLs) {
                    response_info = this.staticURLs[url];
                    switch (typeof response_info.checkRequestContent) {
                    case "string":
                        if (response_info.checkRequestContent !== options.postBody) {
                            response_info = {
                                status: 400,
                                responseText: ""
                            };
                        }
                        break;
                    case "function":
                        try {
                            if (!response_info.checkRequestContent(url, options)) {
                                response_info = {
                                    status: 400,
                                    responseText: ""
                                };
                            }
                        } catch (e) {
                            response_info = {
                                status: 400,
                                responseText: ""
                            };
                        }
                        break;
                    default:
                    }
                }

                if (response_info != null) {

                    specific_callback = 'on' + response_info.status;
                    if (response_info.headers == null) {
                        response_info.headers = {};
                    }
                    response_info.getHeader = function (header_name) {
                        return this.headers[header_name];
                    };

                    if (specific_callback in options) {
                        options[specific_callback]();
                    } else if (typeof options.onSuccess === 'function' && response_info.status >= 200 && response_info.status < 300) {
                        try {
                            options.onSuccess(response_info);
                        } catch (e) {}
                    } else if (typeof options.onFailure === 'function') {
                        try {
                            options.onFailure(response_info);
                        } catch (e) {}
                    }
                } else {
                    if (typeof options.onFailure === 'function') {
                        try {
                            options.onFailure({
                                status: 0
                            });
                        } catch (e) {}
                    }
                }

                if (typeof options.onComplete === 'function') {
                    try {
                        options.onComplete();
                    } catch (e) {}
                }

            };

            func = func.bind(instance);
            for (key in proto) {
                func[key] = proto[key].bind(instance);
            }
            func.clear();

            return func;
        }
    };

    window.ajaxMockFactory = ajaxMockFactory;
})();
