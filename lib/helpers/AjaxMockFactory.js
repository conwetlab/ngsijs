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

                if (options.method == null) {
                    options.method = "POST";
                }

                if (url in this.staticURLs) {
                    response_info = this.staticURLs[url];
                    if ('method' in response_info && response_info.method !== options.method) {
                        response_info = {
                            status: 405,
                            responseText: ""
                        };
                    } else {
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
                                var result = response_info.checkRequestContent(url, options);
                                if (typeof result !== "undefined" && !result) {
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
                }

                if (response_info != null) {
                    if (response_info.headers == null) {
                        response_info.headers = {};
                    }
                    response_info.getHeader = function (header_name) {
                        return this.headers[header_name];
                    };

                    if (response_info.exception != null) {
                        return Promise.reject(response_info.exception);
                    }

                    if (response_info.delayed) {
                        return new Promise(function (resolve, reject) {
                            setTimeout(function () {
                                resolve(response_info);
                            }, 0);
                        });
                    } else {
                        return Promise.resolve(response_info);
                    }
                } else {
                    return Promise.reject();
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
