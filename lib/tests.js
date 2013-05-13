/*
 *     (C) Copyright 2013 CoNWeT Lab - Universidad Politécnica de Madrid
 *
 *     This file is part of ngsijs.
 *
 *     Ngsijs is free software: you can redistribute it and/or modify it under
 *     the terms of the GNU Affero General Public License as published by the
 *     Free Software Foundation, either version 3 of the License, or (at your
 *     option) any later version.
 *
 *     Ngsijs is distributed in the hope that it will be useful, but WITHOUT
 *     ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *     FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public
 *     License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with ngsijs. If not, see <http://www.gnu.org/licenses/>.
 *
 *     Linking this library statically or dynamically with other modules is
 *     making a combined work based on this library.  Thus, the terms and
 *     conditions of the GNU Affero General Public License cover the whole
 *     combination.
 *
 *     As a special exception, the copyright holders of this library give you
 *     permission to link this library with independent modules to produce an
 *     executable, regardless of the license terms of these independent
 *     modules, and to copy and distribute the resulting executable under
 *     terms of your choice, provided that you also meet, for each linked
 *     independent module, the terms and conditions of the license of that
 *     module.  An independent module is a module which is not derived from
 *     or based on this library.  If you modify this library, you may extend
 *     this exception to your version of the library, but you are not
 *     obligated to do so.  If you do not wish to do so, delete this
 *     exception statement from your version.
 *
 */

/*global ajaxMockFactory, beforeEach, expect, it, NGSI, runs, waitsFor*/

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
                                status_code: 400,
                                responseText: ""
                            };
                        }
                        break;
                    case "function":
                        try {
                            if (!response_info.checkRequestContent(url, options)) {
                                response_info = {
                                    status_code: 400,
                                    responseText: ""
                                };
                            }
                        } catch (e) {
                            response_info = {
                                status_code: 400,
                                responseText: ""
                            };
                        }
                        break;
                    default:
                    }
                }

                if (response_info != null) {

                    specific_callback = 'on' + response_info.status_code;

                    if (specific_callback in options) {
                        options[specific_callback]();
                    } else if (typeof options.onSuccess === 'function' && response_info.status_code >= 200 && response_info.status_code < 300) {
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
                                status_code: 0
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

describe("NGSI Library handles", function () {

    "use strict";

    var connection, response, response_data, failure, ajaxMockup;

    ajaxMockup = ajaxMockFactory.createFunction();
    connection = new NGSI.Connection('http://ngsi.server.com', {
        requestFunction: ajaxMockup
    });

    beforeEach(function () {
        ajaxMockup.clear();
        response = false;
        response_data = null;
        failure = false;
    });

    it("basic register context requests", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/registerContext1.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi9/registerContext", {
                    status_code: 200,
                    responseText: request.responseText
                }
            );

            connection.createRegistration([
                    {type: 'Technician', id: 'entity1'}
                ],
                [],
                'PT24H',
                'http://app.example.com/',
                {
                    onSuccess: function (data) {
                        response_data = data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual({
                duration: 'PT24H',
                registrationId: '167'
            });
        });
    });

    it("register context requests passing attributes", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/registerContext1.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi9/registerContext", {
                    status_code: 200,
                    responseText: request.responseText,
                    checkRequestContent: function (url, options) {
                        var doc, result, entityIdElement, attribute, name, type;

                        doc = NGSI.XML.parseFromString(options.postBody, 'application/xml');
                        if (doc.documentElement.tagName !== 'registerContextRequest') {
                            throw new NGSI.InvalidResponseError('');
                        }

                        result = document.evaluate('count(contextRegistrationList/contextRegistration)', doc.documentElement, null, XPathResult.ANY_TYPE, null);
                        if (result.numberValue !== 1) {
                            return false;
                        }

                        result = document.evaluate('count(contextRegistrationList/contextRegistration/entityIdList/entityId)', doc.documentElement, null, XPathResult.ANY_TYPE, null);
                        if (result.numberValue !== 1) {
                            return false;
                        }

                        result = doc.evaluate('contextRegistrationList/contextRegistration/entityIdList/entityId', doc.documentElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                        var entityIdElement = result.singleNodeValue;
                        if (entityIdElement == null || entityIdElement.getAttribute('type') !== 'Technician') {
                            return false;
                        }

                        result = doc.evaluate('contextRegistrationList/contextRegistration/contextRegistrationAttributeList/contextRegistrationAttribute', doc.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        if (result.snapshotLength !== 3) { return false };

                        // Attr1
                        attribute = result.snapshotItem(0);
                        name = NGSI.XML.getChildElementByTagName(attribute, 'name');
                        type = NGSI.XML.getChildElementByTagName(attribute, 'type');
                        if (!name || name.textContent !== 'attr1' || !type || type.textContent != 'string') {
                            return false;
                        }

                        // Attr2
                        attribute = result.snapshotItem(1);
                        type = NGSI.XML.getChildElementByTagName(attribute, 'type');
                        name = NGSI.XML.getChildElementByTagName(attribute, 'name');
                        if (!name || name.textContent !== 'attr2' || type) {
                            return false;
                        }

                        // Attr3
                        attribute = result.snapshotItem(2);
                        name = NGSI.XML.getChildElementByTagName(attribute, 'name');
                        type = NGSI.XML.getChildElementByTagName(attribute, 'type');
                        if (!name || name.textContent !== 'attr3' || !type || type.textContent != 'number') {
                            return false;
                        }

                        return true;
                    }
                }
            );

            connection.createRegistration([
                    {type: 'Technician', id: 'entity1'}
                ], [
                    {name: 'attr1', type: 'string'},
                    {name: 'attr2'},
                    {name: 'attr3', type: 'number'}
                ],
                'PT24H',
                'http://app.example.com/',
                {
                    onSuccess: function (data) {
                        response_data = data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual({
                duration: 'PT24H',
                registrationId: '167'
            });
        });
    });

    it("basic update context registration requests", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/registerContext1.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi9/registerContext", {
                    status_code: 200,
                    responseText: request.responseText
                }
            );

            connection.updateRegistration(167,
                [
                    {type: 'Technician', id: 'entity1'}
                ],
                [],
                'PT24H',
                'jasmine tests',
                {
                    onSuccess: function (data) {
                        response_data = data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual({
                duration: 'PT24H',
                registrationId: '167'
            });
        });
    });

    it("discover context availability requests", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/discoverContextAvailability1.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi9/discoverContextAvailability", {
                    status_code: 200,
                    responseText: request.responseText,
                    checkRequestContent: function (url, options) {
                        var doc, result, entityIdElement, idResult, attribute, name, type;

                        doc = NGSI.XML.parseFromString(options.postBody, 'application/xml');
                        if (doc.documentElement.tagName !== 'discoverContextAvailabilityRequest') {
                            throw new NGSI.InvalidResponseError('');
                        }

                        result = doc.evaluate('entityIdList/entityId', doc.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        if (result.snapshotLength !== 2) {
                            return false;
                        }

                        // Entity Id 1
                        entityIdElement = result.snapshotItem(0);
                        idResult = doc.evaluate('id', entityIdElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                        if (entityIdElement == null ||
                            entityIdElement.getAttribute('type') !== 'Technician' ||
                            idResult.singleNodeValue == null || idResult.singleNodeValue.textContent !== 'entity1' ||
                            entityIdElement.getAttribute('isPattern') !== 'false') {
                            return false;
                        }

                        // Entity Id 2
                        entityIdElement = result.snapshotItem(1);
                        idResult = doc.evaluate('id', entityIdElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                        if (entityIdElement == null ||
                            entityIdElement.getAttribute('type') !== 'Van' ||
                            idResult.singleNodeValue == null || idResult.singleNodeValue.textContent !== '.*' ||
                            entityIdElement.getAttribute('isPattern') !== 'true') {
                            return false;
                        }

                        result = doc.evaluate('attributeList/attribute', doc.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        if (result.snapshotLength !== 0) { return false };

                        return true;
                    }
                }
            );

            connection.discoverAvailability([
                    {type: 'Technician', id: 'entity1'},
                    {type: 'Van', id: '.*', isPattern: true},
                ],
                null,
                {
                    onSuccess: function (data) {
                        response_data = data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual([
                    {entities: [{type: 'Technician', id: 'entity1'}], attributes: [], providingApplication : 'http://wirecloud.conwet.fi.upm.es'},
                    {entities: [{type: 'Van', id: 'van1'}], attributes: [], providingApplication : 'http://wirecloud.conwet.fi.upm.es'},
            ]);
        });
    });

    it("basic query requests", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query1.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi10/queryContext", {
                    status_code: 200,
                    responseText: request.responseText
                }
            );

            connection.query([
                    {type: 'Technician', id: 'entity1'}
                ],
                null,
                {
                    onSuccess: function (data) {
                        response_data = data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual({
                'tech1': {
                    'entity': {
                        'id': 'tech1',
                        'type': 'Technician'
                    },
                    'attributes': {
                        'email': {
                            'name': 'email',
                            'type': 'string',
                            'contextValue': 'jacinto.salas@mycompany.com'
                        },
                        'function': {
                            'name': 'function',
                            'type': 'string',
                            'contextValue': 'MV Keeper'
                        },
                        'mobile_phone': {
                            'name': 'mobile_phone',
                            'type': 'string',
                            'contextValue': '0034123456789'
                        },
                        'name': {
                            'name': 'name',
                            'type': 'string',
                            'contextValue': 'Jacinto Salas Torres'
                        },
                        'twitter': {
                            'name': 'twitter',
                            'type': 'string',
                            'contextValue': 'jsalas'
                        },
                        'van': {
                            'name': 'van',
                            'type': 'string',
                            'contextValue': 'van1'
                        },
                        'working_area': {
                            'name': 'working_area',
                            'type': 'integer',
                            'contextValue': '28050'
                        }
                    }
                }
            });
        });
    });

    it("empty responses for query requests", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query2.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi10/queryContext", {
                    status_code: 200,
                    responseText: request.responseText
                }
            );

            connection.query([
                    {type: 'BankAccount', id: '.*', isPattern: true}
                ],
                null,
                {
                    onSuccess: function (data) {
                        response_data = data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual({});
        });
    });

    it("basic query requests using the flat option", function () {

        runs(function () {
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query1.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi10/queryContext", {
                    status_code: 200,
                    responseText: request.responseText
                }
            );

            connection.query([
                    {type: 'Technician', id: 'entity1'}
                ],
                null,
                {
                    flat: true,
                    onSuccess: function (data) {
                        response_data = data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual({
                tech1: {
                    'id': 'tech1',
                    'type': 'Technician',
                    'email': 'jacinto.salas@mycompany.com',
                    'function': 'MV Keeper',
                    'mobile_phone': '0034123456789',
                    'name': 'Jacinto Salas Torres',
                    'twitter': 'jsalas',
                    'van': 'van1',
                    'working_area': '28050'
                }
            });
        });
    });

    it("basic update context requests", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/update1.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi10/updateContext", {
                    status_code: 200,
                    responseText: request.responseText,
                    checkRequestContent: function (url, options) {
                        var doc, result, attribute, name, type, contextValue;

                        doc = NGSI.XML.parseFromString(options.postBody, 'application/xml');
                        if (doc.documentElement.tagName !== 'updateContextRequest') {
                            throw new NGSI.InvalidResponseError('');
                        }

                        result = document.evaluate('count(contextElementList)', doc.documentElement, null, XPathResult.ANY_TYPE, null);
                        if (result.numberValue !== 1) {
                            return false;
                        }

                        result = doc.evaluate('contextElementList/contextElement/entityId', doc.documentElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                        var entityIdElement = result.singleNodeValue;
                        if (entityIdElement == null || entityIdElement.getAttribute('type') !== 'Technician') {
                            return false;
                        }

                        result = doc.evaluate('contextElementList/contextElement/contextAttributeList/contextAttribute', doc.documentElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        if (result.snapshotLength !== 2) { return false };

                        attribute = result.snapshotItem(0);
                        name = NGSI.XML.getChildElementByTagName(attribute, 'name');
                        type = NGSI.XML.getChildElementByTagName(attribute, 'type');
                        contextValue = NGSI.XML.getChildElementByTagName(attribute, 'contextValue');
                        if (!name || name.textContent !== 'mobile_phone' || !type || type.textContent != 'string' || !contextValue || contextValue.textContent !== '0034223456789') {
                            return false;
                        }

                        attribute = result.snapshotItem(1);
                        name = NGSI.XML.getChildElementByTagName(attribute, 'name');
                        type = NGSI.XML.getChildElementByTagName(attribute, 'type');
                        contextValue = NGSI.XML.getChildElementByTagName(attribute, 'contextValue');
                        if (!name || name.textContent !== 'attr2' || type || !contextValue || contextValue.textContent !== 'value') {
                            return false;
                        }

                        return true;
                    }
                }
            );

            connection.updateAttributes([
                    {
                        'entity': {type: 'Technician', id: 'entity1'},
                        'attributes': [{
                            'name': 'mobile_phone',
                            'type': 'string',
                            'contextValue': '0034223456789'
                        }, {
                            'name': 'attr2',
                            'contextValue': 'value'
                        }]
                    }
                ], {
                    onSuccess: function (data) {
                        response_data = data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual({
                'tech1': {
                    'entity': {
                        'id': 'tech1',
                        'type': 'Technician'
                    },
                    'attributes': {
                        'mobile_phone': {
                            'name': 'mobile_phone',
                            'type': 'string',
                            'contextValue': '0034223456789'
                        }
                    }
                }
            });
        });
    });

    it("basic update context requests using the flat option", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/update1.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi10/updateContext", {
                    status_code: 200,
                    responseText: request.responseText
                }
            );

            connection.updateAttributes([
                    {
                        'entity': {type: 'Technician', id: 'entity1'},
                        'attributes': {
                            'name': 'mobile_phone',
                            'type': 'string',
                            'contextValue': '0034223456789'
                        }
                    }
                ], {
                    flat: true,
                    onSuccess: function (data) {
                        response_data = data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual({
                'tech1': {
                    'id': 'tech1',
                    'type': 'Technician',
                    'mobile_phone': '0034223456789'
                }
            });
        });
    });

    it("basic add context requests", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/update2.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi10/updateContext", {
                    status_code: 200,
                    responseText: request.responseText
                }
            );

            connection.addAttributes([
                    {
                        'entity': {type: 'Technician', id: 'entity1'},
                        'attributes': {
                            'name': 'new_attribute',
                            'type': 'string',
                            'contextValue': 'value'
                        }
                    }
                ], {
                    onSuccess: function (data) {
                        response_data = data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual({
                'tech1': {
                    'entity': {
                        'id': 'tech1',
                        'type': 'Technician'
                    },
                    'attributes': {
                        'new_attribute': {
                            'name': 'new_attribute',
                            'type': 'string',
                            'contextValue': 'value'
                        }
                    }
                }
            });
        });
    });

    it("basic add context requests using the flat option", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/update2.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi10/updateContext", {
                    status_code: 200,
                    responseText: request.responseText
                }
            );

            connection.addAttributes([
                    {
                        'entity': {type: 'Technician', id: 'entity1'},
                        'attributes': {
                            'name': 'new_attribute',
                            'type': 'string',
                            'contextValue': 'value'
                        }
                    }
                ], {
                    flat: true,
                    onSuccess: function (data) {
                        response_data = data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual({
                'tech1': {
                    'id': 'tech1',
                    'type': 'Technician',
                    'new_attribute': 'value'
                }
            });
        });
    });

    it("basic subscribe context requests", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/subscribeContext1.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi10/subscribeContext", {
                    status_code: 200,
                    responseText: request.responseText
                }
            );

            connection.createSubscription([
                    {type: 'Technician', id: 'tech*'},
                ],
                null,
                'PT24H',
                null,
                null,
                {
                    onNotify: 'http://www.example.com/callback',
                    onSuccess: function (data) {
                        response_data = data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual({
                'subscriptionId': 'sub1',
                'duration': 'PT24H'
            });
        });
    });

    it("basic update context subscription requests", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/updateContextSubscription1.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi10/updateContextSubscription", {
                    status_code: 200,
                    responseText: request.responseText
                }
            );

            connection.updateSubscription('sub1',
                'PT20H',
                null,
                null,
                {
                    onSuccess: function (data) {
                        response_data = data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual({
                'subscriptionId': 'sub1',
                'duration': 'PT20H'
            });
        });
    });

    it("basic cancel context subscription requests", function () {

        runs(function () {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/unsubscribeContext1.xml', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi10/unsubscribeContext", {
                    status_code: 200,
                    responseText: request.responseText
                }
            );

            connection.cancelSubscription('sub1', {
                    onSuccess: function (data) {
                        response_data = data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );
        });

        waitsFor(function () {
            return response;
        }, "Waiting NGSI response", 300);

        runs(function () {
            expect(failure).toEqual(false);
            expect(response_data).toEqual({
                'subscriptionId': 'sub1'
            });
        });
    });

});
