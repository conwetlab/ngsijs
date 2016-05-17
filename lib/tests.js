/*
 *     Copyright (c) 2013-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global ajaxMockFactory, mockedeventsources, EventSource, beforeEach, expect, it, NGSI, waitsFor*/

(function () {

    "use strict";

    var connection, response, response_data, response_error_data, response_details, failure, ajaxMockup, notification_data;

    var waitsForResponse = function waitsForResponse(next, done) {
        setTimeout(function() {
            if (response) {
                next();
            } else {
                done.fail("No response from NGSI");
            }
            done();
        }, 0);
    };

    var connection_error_on_query_test = function connection_error_on_query_test(description, code) {
        it("connection errors while making query requests (" + description + ")", function (done) {
            connection.query(
                [
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


            waitsForResponse(function () {
                expect(failure instanceof NGSI.ConnectionError).toBeTruthy();
            }, done);
        });
    };

    var bad_create_subscription_response_test = function bad_create_subscription_response_test(description, response_status, error_class) {
        it("create subscription error responses (" + description + ")", function (done) {
            // Mock NGSI proxy responses
            ajaxMockup.addStaticURL("http://ngsiproxy.example.com/eventsource", {
                status: 201,
                responseText: '',
                headers: {
                    'Location': 'http://ngsiproxy.example.com/eventsource/1'
                }
            });

            ajaxMockup.addStaticURL("http://ngsiproxy.example.com/callbacks", {
                status: 201,
                responseText: '{"callback_id": "1", "url": "http://ngsiproxy.example.com/callback/1"}',
                checkRequestContent: function (url, options) {
                    var data = JSON.parse(options.postBody);
                    return data.connection_id === 1;
                }
            });

            // Mock subscribeContext response
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/subscribeContext", {
                status: response_status
            });

            // Make the request
            connection.createSubscription(
                [
                    {type: 'Technician', id: 'tech*', isPattern: true},
                    {type: 'Van', id: 'van1'},
                ],
                null,
                'PT24H',
                null,
                [{type: 'ONCHANGE', condValues: ['position']}],
                {
                    onNotify: function (data) {
                        notification_data = data;
                    },
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

            // Wait until we have the response
            waitsForResponse(function () {
                // ... and check everything went as expected
                expect(failure instanceof error_class).toBeTruthy();
            }, done);
        });
    };

    var bad_ngsi_proxy_response_test = function bad_ngsi_proxy_response_test(description, response_status, error_class) {
        it("ngsi-proxy errors when making subscribe context requests (" + description + ")", function (done) {
            ajaxMockup.addStaticURL("http://ngsiproxy.example.com/eventsource", {status: response_status});

            connection.createSubscription(
                [
                    {type: 'Technician', id: 'tech*', isPattern: true},
                    {type: 'Van', id: 'van1'},
                ],
                null,
                'PT24H',
                null,
                [{type: 'ONCHANGE', condValues: ['position']}],
                {
                    onNotify: function (data) {
                        notification_data = data;
                    },
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

            waitsForResponse(function () {
                expect(failure instanceof NGSI.ProxyConnectionError).toBeTruthy();
                expect(failure.cause instanceof error_class).toBeTruthy();
            }, done);
        });
    };

    var arguments_error_test = function arguments_error_test(method, args, cond) {
        it(method + ' to throw TypeError exceptions when ' + cond, function () {
            expect(function () {
                connection[method].apply(connection, args);
            }).toThrowError(TypeError);
        });
    };

    var check_update_context_methods = function check_update_context_methods(methods) {
        for (var i = 0; i < methods.length; i++) {
            var method = methods[i][0];
            var arg_name = methods[i][1];

            arguments_error_test(method, [], 'missing all arguments');
            arguments_error_test(method, [null, null], 'passing a null ' + arg_name + ' argument');
            arguments_error_test(method, [[], null], 'passing a empty array ' + arg_name + ' argument');
            arguments_error_test(method, ["string", null], 'passing a string ' + arg_name + ' argument');
            arguments_error_test(method, [5, null], 'passing a number ' + arg_name + ' argument');
            arguments_error_test(method, [{}, null], 'passing a plain object ' + arg_name + ' argument');
            arguments_error_test(method, [false, null], 'passing a boolean ' + arg_name + ' argument');
        }
    };

    describe("NGSI Library handles", function () {

        ajaxMockup = ajaxMockFactory.createFunction();

        beforeEach(function () {
            var options = {
                requestFunction: ajaxMockup
            };
            connection = new NGSI.Connection('http://ngsi.server.com', options);
            ajaxMockup.clear();
            response = false;
            response_data = null;
            response_error_data = null;
            response_details = null;
            notification_data = null;
            failure = false;
        });

        it("custom exceptions from the requestFunction", function (done) {
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/registry/registerContext", {
                status: 502,
                exception: new NGSI.ConnectionError('WireCloud proxy is not responding')
            });

            connection.createRegistration(
                [
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
            waitsForResponse(function () {
                expect(failure instanceof NGSI.ConnectionError).toBeTruthy();
                expect(failure.message).toBe('WireCloud proxy is not responding');
            }, done);
        });

        it("basic register context requests", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/registerContext1.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/registry/registerContext", {
                status: 200,
                responseText: request.responseText
            });

            connection.createRegistration(
                [
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
            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual({
                    duration: 'PT24H',
                    registrationId: '167'
                });
            }, done);
        });

        it("register context requests passing attributes", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/registerContext1.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/registry/registerContext", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var data, entity, attributes;

                    data = JSON.parse(options.postBody);
                    if (!('contextRegistrations' in data) || data.contextRegistrations.length !== 1 || data.contextRegistrations[0].entities.length !== 1) {
                        return false;
                    }

                    entity = data.contextRegistrations[0].entities[0];
                    if (entity.id !== 'entity1' || entity.type !== 'Technician') {
                        return false;
                    }

                    attributes = data.contextRegistrations[0].attributes;
                    if (attributes.length !== 3) {
                        return false;
                    }

                    // Attribute 1
                    if (attributes[0].name !== 'attr1' || attributes[0].type !== 'string') {
                        return false;
                    }

                    // Attribute 2
                    if (attributes[1].name !== 'attr2' || 'type' in attributes[1]) {
                        return false;
                    }

                    // Attribute 3
                    if (attributes[2].name !== 'attr3' || attributes[2].type !== 'number') {
                        return false;
                    }

                    return true;
                }
            });

            connection.createRegistration(
                [
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual({
                    duration: 'PT24H',
                    registrationId: '167'
                });
            }, done);
        });

        it("basic update context registration requests", function (done) {


            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/registerContext1.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/registry/registerContext", {
                status: 200,
                responseText: request.responseText
            });

            connection.updateRegistration(
                167,
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


            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual({
                    duration: 'PT24H',
                    registrationId: '167'
                });
            }, done);
        });

        it("basic cancel registration requests", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/registerContext2.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/registry/registerContext", {
                status: 200,
                responseText: request.responseText
            });

            connection.cancelRegistration(
                167,
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual({
                    duration: 'PT0H',
                    registrationId: '167'
                });
            }, done);
        });

        it("discover context availability requests", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/discoverContextAvailability1.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/registry/discoverContextAvailability", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var doc, result, entity;

                    doc = JSON.parse(options.postBody);
                    if (doc.entities.length !== 2 || doc.attributes.length !== 0) {
                        return false;
                    }

                    // Entity Id 1
                    entity = doc.entities[0];
                    if (entity.type !== 'Technician' || entity.id !== 'entity1' || entity.isPattern !== 'false') {
                        return false;
                    }

                    // Entity Id 2
                    entity = doc.entities[1];
                    if (entity.type !== 'Van' || entity.id !== '.*' || entity.isPattern !== 'true') {
                        return false;
                    }

                    return true;
                }
            });

            connection.discoverAvailability(
                [
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


            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual([
                    {entities: [{type: 'Technician', isPattern: 'false', id: 'entity1'}], attributes: [], providingApplication: 'http://wirecloud.conwet.fi.upm.es'},
                    {entities: [{type: 'Van', isPattern: 'false', id: 'van1'}], attributes: [], providingApplication: 'http://wirecloud.conwet.fi.upm.es'},
                ]);
            }, done);
        });

        it("basic subscribe context availability requests", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/subscribeContextAvailability1.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/registry/subscribeContextAvailability", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var data, condition;

                    data = JSON.parse(options.postBody);
                    if (!Array.isArray(data.entities) || data.entities.length !== 2 || 'attributes' in data || 'subscriptionId' in data) {
                        return false;
                    }

                    if (data.reference !== 'http://www.example.com/callback' || data.duration !== 'PT24H') {
                        return false;
                    }

                    // Entity Id 1
                    if (data.entities[0].type !== 'Technician' || data.entities[0].id !== 'tech*' || data.entities[0].isPattern !== 'true') {
                        return false;
                    }

                    // Entity Id 2
                    if (data.entities[1].type !== 'Van' || data.entities[1].id !== 'van1' || data.entities[1].isPattern !== 'false') {
                        return false;
                    }

                    return true;
                }

            });

            connection.createAvailabilitySubscription(
                [
                    {type: 'Technician', id: 'tech*', isPattern: true},
                    {type: 'Van', id: 'van1'},
                ],
                null,
                'PT24H',
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(mockedeventsources.length).toEqual(0);
                expect(response_data).toEqual({
                    'subscriptionId': 'sub1',
                    'duration': 'PT24H'
                });
            }, done);
        });

        it("basic update context availability subscription requests", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/updateContextAvailabilitySubscription1.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/registry/updateContextAvailabilitySubscription", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var data, condition;

                    data = JSON.parse(options.postBody);

                    if ('reference' in data || data.subscriptionId !== 'sub1' || data.duration !== "PT3H" || data.entities.length !== 1) {
                        return false;
                    }

                    if (data.entities[0].type !== 'Van' || data.entities[0].id !== '.*' || data.entities[0].isPattern !== 'true') {
                        return false;
                    }

                    return true;
                }
            });

            connection.updateAvailabilitySubscription(
                'sub1',
                [
                    {type: 'Van', id: '.*', isPattern: true}
                ],
                null,
                'PT3H',
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual({
                    'subscriptionId': 'sub1',
                    'duration': 'PT3H'
                });
            }, done);
        });

        it("basic cancel context availability subscription requests", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/unsubscribeContextAvailability1.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/registry/unsubscribeContextAvailability", {
                    status: 200,
                    responseText: request.responseText
                });

            connection.cancelAvailabilitySubscription('sub1', {
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual({
                    "statusCode": {
                        "code": 200,
                        "reasonPhrase": "OK"
                    },
                    'subscriptionId': 'sub1'
                });
            }, done);
        });

        it("basic query requests", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query1.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/queryContext", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var data;

                    data = JSON.parse(options.postBody);
                    if (!Array.isArray(data.entities) || data.entities.length !== 2 || 'attributes' in data) {
                        return false;
                    }

                    // Entity Id 1
                    if (data.entities[0].type !== 'Technician' || data.entities[0].id !== 'tech1' || data.entities[0].isPattern !== 'false') {
                        return false;
                    }

                    // Entity Id 2
                    if (data.entities[1].type !== 'Technician' || data.entities[1].id !== 'tech2' || data.entities[1].isPattern !== 'false') {
                        return false;
                    }

                    return true;
                }
            });

            connection.query(
                [
                    {type: 'Technician', id: 'tech1'},
                    {type: 'Technician', id: 'tech2'}
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual(
                    [{
                        'entity': {
                            'id': 'tech1',
                            'type': 'Technician'
                        },
                        'attributes': [
                            {
                                'name': 'email',
                                'type': 'string',
                                'contextValue': 'jacinto.salas@mycompany.com'
                            },
                            {
                                'name': 'function',
                                'type': 'string',
                                'contextValue': 'MV Keeper'
                            },
                            {
                                'name': 'mobile_phone',
                                'type': 'string',
                                'contextValue': ''
                            },
                            {
                                'name': 'name',
                                'type': 'string',
                                'contextValue': 'Jacinto Salas Torres'
                            },
                            {
                                'name': 'twitter',
                                'type': 'string',
                                'contextValue': 'jsalas'
                            },
                            {
                                'name': 'van',
                                'type': 'string',
                                'contextValue': 'van1'
                            },
                            {
                                'name': 'working_area',
                                'type': 'integer',
                                'contextValue': '28050'
                            }
                        ]
                    },
                     {
                         'entity': {
                             'id': 'tech2',
                             'type': 'Technician'
                         },
                         'attributes' : []
                     }
                    ]);
            }, done);
        });

        it("basic query requests returnig structured attributes", function (done) {
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query6.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/queryContext", {
                status: 200,
                responseText: request.responseText
            }
                                   );

            connection.query(
                [
                    {type: 'Technician', id: 'tech1'}
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual(
                    [{
                        "entity": {
                            'id': 'tech1',
                            'type': 'Technician'
                        },
                        "attributes": [
                            {
                                "name": 'structuredattr',
                                "type": 'structure',
                                "contextValue": [
                                    "22",
                                    {
                                        "x": ["x1", "x2"],
                                        "y": "3"
                                    },
                                    ["z1", "z2"]
                                ]
                            }
                        ]
                    }
                    ]);
            }, done);
        });

        it("basic query requests using the pagination options", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query1.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/queryContext", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var data;

                    data = JSON.parse(options.postBody);
                    if (!Array.isArray(data.entities) || data.entities.length !== 1 || 'attributes' in data) {
                        return false;
                    }

                    // Entity Id 1
                    if (data.entities[0].type !== 'Technician' || data.entities[0].id !== '.*' || data.entities[0].isPattern !== 'true') {
                        return false;
                    }

                    if (options.parameters.limit !== 100) {
                        throw new NGSI.InvalidResponseError('');
                    }

                    if (options.parameters.offset !== 200) {
                        throw new NGSI.InvalidResponseError('');
                    }

                    return true;
                }
            });

            connection.query(
                [
                    {type: 'Technician', id: '.*', isPattern: true}
                ],
                null,
                {
                    limit: 100,
                    offset: 200,
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual(
                    [{
                        'entity': {
                            'id': 'tech1',
                            'type': 'Technician'
                        },
                        'attributes': [
                            {
                                'name': 'email',
                                'type': 'string',
                                'contextValue': 'jacinto.salas@mycompany.com'
                            },
                            {
                                'name': 'function',
                                'type': 'string',
                                'contextValue': 'MV Keeper'
                            },
                            {
                                'name': 'mobile_phone',
                                'type': 'string',
                                'contextValue': ''
                            },
                            {
                                'name': 'name',
                                'type': 'string',
                                'contextValue': 'Jacinto Salas Torres'
                            },
                            {
                                'name': 'twitter',
                                'type': 'string',
                                'contextValue': 'jsalas'
                            },
                            {
                                'name': 'van',
                                'type': 'string',
                                'contextValue': 'van1'
                            },
                            {
                                'name': 'working_area',
                                'type': 'integer',
                                'contextValue': '28050'
                            }
                        ]
                    },
                     {
                         'entity': {
                             'id': 'tech2',
                             'type': 'Technician'
                         },
                         'attributes' : []
                     }
                    ]);
            }, done);
        });

        it("basic query requests using the details options", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query3.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/queryContext", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var data;

                    data = JSON.parse(options.postBody);
                    if (!Array.isArray(data.entities) || data.entities.length !== 1 || 'attributes' in data) {
                        return false;
                    }

                    if (options.parameters.details !== 'on') {
                        throw new NGSI.InvalidResponseError('');
                    }

                    return true;
                }
            });

            connection.query(
                [
                    {type: 'Technician', id: '.*', isPattern: true}
                ],
                null,
                {
                    details: true,
                    onSuccess: function (data, details) {
                        response_data = data;
                        response_details = details;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_details).toEqual({
                    "count": 47855
                });
                expect(response_data.length).toEqual(4);
            }, done);
        });

        it("empty responses for query requests using the details option", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query2.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/queryContext", {
                status: 200,
                responseText: request.responseText
            });

            connection.query(
                [
                    {type: 'BankAccount', id: '.*', isPattern: true}
                ],
                null,
                {
                    details: true,
                    onSuccess: function (data, details) {
                        response_data = data;
                        response_details = details;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual([]);
                expect(response_details).toEqual({
                    "count": 0
                });
            }, done);
        });

        it("invalid offset when issuing query requests using the details options", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query4.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/queryContext", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var data;

                    data = JSON.parse(options.postBody);
                    if (!Array.isArray(data.entities) || data.entities.length !== 1 || 'attributes' in data) {
                        return false;
                    }

                    if (options.parameters.limit !== 100) {
                        throw new NGSI.InvalidResponseError('');
                    }

                    if (options.parameters.offset !== 1000) {
                        throw new NGSI.InvalidResponseError('');
                    }

                    if (options.parameters.details !== 'on') {
                        throw new NGSI.InvalidResponseError('');
                    }

                    return true;
                }
            });

            connection.query(
                [
                    {type: 'Technician', id: '.*', isPattern: true}
                ],
                null,
                {
                    details: true,
                    limit: 100,
                    offset: 1000,
                    onSuccess: function (data, details) {
                        response_data = data;
                        response_details = details;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );

            waitsForResponse(function () {
                expect(failure.details).toEqual({
                    "text": "Number of matching entities: 5. Offset is 1000",
                    "matches": 5,
                    "offset": 1000
                });
                expect(response_details).toEqual(null);
                expect(response_data).toEqual(null);
            }, done);
        });

        it("basic query requests using restrictions (polygon)", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query5.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/queryContext", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var data, restriction;

                    data = JSON.parse(options.postBody);
                    if (!Array.isArray(data.entities) || data.entities.length !== 1 || 'attributes' in data) {
                        return false;
                    }

                    if (data.entities[0].type !== 'Point' || data.entities[0].id !== '.*' || data.entities[0].isPattern !== 'true' || data.restriction.scopes.length !== 1) {
                        return false;
                    }

                    restriction = data.restriction.scopes[0];
                    return restriction.type === "FIWARE_Location" && restriction.value.polygon.vertices.length === 4 && !('inverted' in restriction.value.polygon);

                }

            });

            connection.query(
                [
                    {type: 'Point', id: '.*', isPattern: true}
                ],
                null,
                {
                    restriction: {
                        scopes: [
                            {
                                "type" : "FIWARE_Location",
                                "value" : {
                                    "polygon": {
                                        "vertices": [
                                            { "latitude": "3", "longitude": "3" },
                                            { "latitude": "3", "longitude": "8" },
                                            { "latitude": "11", "longitude": "8" },
                                            { "latitude": "11", "longitude": "3" }
                                        ]
                                    }
                                }
                            }
                        ]
                    },
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual(
                    [{
                        'entity': {
                            'id': 'B',
                            'type': 'Point'
                        },
                        'attributes': [
                            {
                                'name': 'position',
                                'type': 'coords',
                                'contextValue': '5, 5'
                            }
                        ]
                    },
                     {
                         'entity': {
                             'id': 'C',
                             'type': 'Point'
                         },
                         'attributes': [
                             {
                                 'name': 'position',
                                 'type': 'coords',
                                 'contextValue': '7, 4'
                             }
                         ]
                     }
                    ]);
            }, done);
        });

        it("basic query requests using restrictions (inverted polygon)", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query5.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/queryContext", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var data, restriction;

                    data = JSON.parse(options.postBody);
                    if (!Array.isArray(data.entities) || data.entities.length !== 1 || 'attributes' in data) {
                        return false;
                    }

                    if (data.entities[0].type !== 'Point' || data.entities[0].id !== '.*' || data.entities[0].isPattern !== 'true' || data.restriction.scopes.length !== 1) {
                        return false;
                    }

                    restriction = data.restriction.scopes[0];
                    return restriction.type === "FIWARE_Location" && restriction.value.polygon.vertices.length === 3 && restriction.value.polygon.inverted === 'true';
                }
            });

            connection.query(
                [
                    {type: 'Point', id: '.*', isPattern: true}
                ],
                null,
                {
                    restriction: {
                        scopes: [
                            {
                                "type" : "FIWARE_Location",
                                "value" : {
                                    "polygon": {
                                        "vertices": [
                                            { "latitude": "0", "longitude": "0" },
                                            { "latitude": "0", "longitude": "6" },
                                            { "latitude": "6", "longitude": "0" }
                                        ],
                                        "inverted": true
                                    }

                                }
                            }
                        ]
                    },
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual(
                    [{
                        'entity': {
                            'id': 'B',
                            'type': 'Point'
                        },
                        'attributes': [
                            {
                                'name': 'position',
                                'type': 'coords',
                                'contextValue': '5, 5'
                            }
                        ]
                    },
                     {
                         'entity': {
                             'id': 'C',
                             'type': 'Point'
                         },
                         'attributes': [
                             {
                                 'name': 'position',
                                 'type': 'coords',
                                 'contextValue': '7, 4'
                             }
                         ]
                     }
                    ]);
            }, done);
        });

        it("basic query requests using restrictions (circle)", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query4.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/queryContext", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var data, restriction;

                    data = JSON.parse(options.postBody);
                    if (!Array.isArray(data.entities) || data.entities.length !== 1 || 'attributes' in data) {
                        return false;
                    }

                    if (data.entities[0].type !== 'City' || data.entities[0].id !== '.*' || data.entities[0].isPattern !== 'true' || data.restriction.scopes.length !== 1) {
                        return false;
                    }

                    restriction = data.restriction.scopes[0];
                    return restriction.type === "FIWARE_Location" && restriction.value.circle.centerLatitude === "40.418889" && restriction.value.circle.centerLongitude === "-3.691944" && restriction.value.circle.radius === "14000" && !('inverted' in restriction.value.circle);
                }

            });

            connection.query(
                [
                    {type: 'City', id: '.*', isPattern: true}
                ],
                null,
                {
                    restriction: {
                        scopes: [
                            {
                                "type" : "FIWARE_Location",
                                "value" : {
                                    "circle": {
                                        "centerLatitude": "40.418889",
                                        "centerLongitude": "-3.691944",
                                        "radius": "14000"
                                    }
                                }
                            }
                        ]
                    },
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual([]);
            }, done);

        });

        it("basic query requests using restrictions (inverted circle)", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query4.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/queryContext", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var data, restriction;

                    data = JSON.parse(options.postBody);
                    if (!Array.isArray(data.entities) || data.entities.length !== 1 || 'attributes' in data) {
                        return false;
                    }

                    if (data.entities[0].type !== 'City' || data.entities[0].id !== '.*' || data.entities[0].isPattern !== 'true' || data.restriction.scopes.length !== 1) {
                        return false;
                    }

                    restriction = data.restriction.scopes[0];
                    return restriction.type === "FIWARE_Location" && restriction.value.circle.centerLatitude === "40.418889" && restriction.value.circle.centerLongitude === "-3.691944" && restriction.value.circle.radius === "14000" && restriction.value.circle.inverted === "true";
                }

            });

            connection.query(
                [
                    {type: 'City', id: '.*', isPattern: true}
                ],
                null,
                {
                    restriction: {
                        scopes: [
                            {
                                "type" : "FIWARE_Location",
                                "value" : {
                                    "circle": {
                                        "centerLatitude": "40.418889",
                                        "centerLongitude": "-3.691944",
                                        "radius": "14000",
                                        "inverted": "true"
                                    }
                                }
                            }
                        ]
                    },
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual([]);
            }, done);
        });

        it("empty responses for query requests", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query2.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/queryContext", {
                status: 200,
                responseText: request.responseText
            });

            connection.query(
                [
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual([]);
            }, done);
        });

        it("basic query requests using the flat option", function (done) {
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query1.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/queryContext", {
                status: 200,
                responseText: request.responseText
            });

            connection.query(
                [
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual({
                    tech1: {
                        'id': 'tech1',
                        'type': 'Technician',
                        'email': 'jacinto.salas@mycompany.com',
                        'function': 'MV Keeper',
                        'mobile_phone': '',
                        'name': 'Jacinto Salas Torres',
                        'twitter': 'jsalas',
                        'van': 'van1',
                        'working_area': '28050'
                    },
                    tech2: {
                        'id': 'tech2',
                        'type': 'Technician'
                    }
                });
            }, done);
        });

        it("basic query requests returnig structured attributes and using the flat option", function (done) {
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/query6.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/queryContext", {
                status: 200,
                responseText: request.responseText
            });

            connection.query(
                [
                    {type: 'Technician', id: 'tech1'}
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual({
                    tech1: {
                        'id': 'tech1',
                        'type': 'Technician',
                        'structuredattr': [
                            "22",
                            {
                                "x": ["x1", "x2"],
                                "y": "3"
                            },
                            ["z1", "z2"]
                        ]
                    }
                });
            }, done);
        });

        connection_error_on_query_test('Connection Error', 0);
        connection_error_on_query_test('Connection Error via proxy', 502);
        connection_error_on_query_test('Connection timeout via proxy', 504);

        var bad_query_response_test = function bad_query_response_test(content) {
            it("bad error codes for query requests (error " + content.status + ")", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v1/queryContext", {
                    status: content.status,
                    responseText: content.responseText
                });

                connection.query(
                    [
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

                waitsForResponse(function () {
                    expect(failure instanceof NGSI.InvalidResponseError).toBeTruthy();
                }, done);
            });
        };

        bad_query_response_test({status: 201, responseText: 'Created'});
        bad_query_response_test({status: 204, responseText: 'No Content'});
        bad_query_response_test({status: 402, responseText: 'Payment Required'});
        bad_query_response_test({status: 503, responseText: 'Service Unavailable'});

        var bad_query_response_content_test = function bad_query_response_content_test(description, content) {
            it("bad response content for query requests (" + description + ")", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/v1/queryContext", {
                    status: 200,
                    responseText: content
                });

                connection.query(
                    [
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

                waitsForResponse(function () {
                    expect(failure instanceof NGSI.InvalidResponseError).toBeTruthy();
                }, done);
            });
        };
        bad_query_response_content_test('unrelated json', '["a", "b"]');
        bad_query_response_content_test('totally invalid content', 'invalid content');
        bad_query_response_content_test('partial response', '{"statusCode": {}}');


        describe('updateAttributes(update, options)', function () {
            var check_update_attributes_method = function check_update_attributes_method(label, updated_attributes, response_file, expected_request, expected_response, flat, errors) {

                errors = errors == null ? [] : errors;

                it(label, function (done) {
                    // TODO
                    var request = new XMLHttpRequest();
                    request.open('GET', 'responses/' + response_file, false);
                    request.send();
                    ajaxMockup.addStaticURL("http://ngsi.server.com/v1/updateContext", {
                        status: 200,
                        responseText: request.responseText,
                        checkRequestContent: function (url, options) {
                            var data = JSON.parse(options.postBody);
                            expect(data).toEqual({
                                contextElements: [
                                    {
                                        id: 'entity1',
                                        isPattern: 'false',
                                        type: 'Technician',
                                        attributes: expected_request
                                    }
                                ],
                                updateAction: 'UPDATE'
                            });

                            return true;
                        }

                    });

                    connection.updateAttributes(
                        [
                            {
                                'entity': {type: 'Technician', id: 'entity1'},
                                'attributes': updated_attributes
                            }
                        ], {
                            flat: flat,
                            onSuccess: function (data, error_data) {
                                response_data = data;
                                response_error_data = error_data;
                            },
                            onFailure: function (e) {
                                failure = e;
                            },
                            onComplete: function () {
                                response = true;
                            }
                        }
                    );

                    waitsForResponse(function () {
                        expect(failure).toEqual(false);
                        expect(response_data).toEqual(expected_response);
                        expect(response_error_data).toEqual(errors);
                    }, done);
                });

            };

            check_update_attributes_method(
                "supports empty string values",
                [{'name': 'mobile_phone', 'type': 'string', 'contextValue': ''}],
                "update_empty_string.json",
                [{name: 'mobile_phone', type: 'string', value: ''}],
                {
                    'tech1': {
                        'id': 'tech1',
                        'type': 'Technician',
                        'mobile_phone': ''
                    }
                },
                /* flat: */ true
            );

            check_update_attributes_method(
                "supports null values",
                [{'name': 'new_attribute', 'type': 'string', 'contextValue': null}],
                "update2.json",
                [{name: 'new_attribute', type: 'string', value: null}],
                {
                    'tech1': {
                        'id': 'tech1',
                        'type': 'Technician',
                        'new_attribute': ''
                    }
                },
                true // flat
            );

            check_update_attributes_method(
                "supports structured attributes",
                [
                    {
                        name: "structuredattr",
                        type: "structure",
                        contextValue: [
                            "22",
                            {
                                "x": ["x1", "x2"],
                                "y": "3"
                            },
                            ["z1", "z2"]
                        ]
                    }
                ],
                "update9.json",
                [{name: 'structuredattr', type: 'structure', value: ['22', Object({x: ['x1', 'x2'], y: '3'}), ['z1', 'z2']]}],
                [
                    {
                        "entity": {
                            "id": "tech1",
                            "type": "Technician"
                        },
                        "attributes": [
                            {
                                "name": "structuredattr",
                                "type": "structure"
                            }
                        ]
                    }
                ]
            );

            check_update_attributes_method(
                "supports multiple attribute changes",
                [
                    {name: 'mobile_phone', type: 'string', contextValue: '0034223456789'},
                    {name: 'attr2', contextValue: 'value'},
                    {name: 'attr3', contextValue: 5}
                ],
                "update1.json",
                [
                    {name: 'mobile_phone', type: 'string', value: '0034223456789'},
                    {name: 'attr2', value: 'value'},
                    {name: 'attr3', value: 5}
                ],
                [
                    {
                        'entity': {
                            'id': 'tech1',
                            'type': 'Technician'
                        },
                        'attributes': [
                            {
                                'name': 'mobile_phone',
                                'type': 'string'
                            },
                            {
                                'name': 'attr2',
                                'type': ''
                            },
                            {
                                'name': 'attr3',
                                'type': ''
                            }
                        ]
                    }
                ]
            );

            check_update_attributes_method(
                "supports the flat option",
                [
                    {name: 'mobile_phone', type: 'string', contextValue: '0034223456789'},
                    {name: 'attr2', contextValue: 'value'},
                    {name: 'attr3', contextValue: 5}
                ],
                "update1.json",
                [
                    {name: 'mobile_phone', type: 'string', value: '0034223456789'},
                    {name: 'attr2', value: 'value'},
                    {name: 'attr3', value: 5}
                ],
                {
                    "tech1": {
                        "id": "tech1",
                        "type": "Technician",
                        "mobile_phone": "",
                        "attr2": "",
                        "attr3": ""
                    }
                },
                true // flat
            );

            check_update_attributes_method(
                "reports attribute not found errors",
                [
                    {name: 'position', type: 'coords', contextValue: '40.418889, -3.691944'},
                    {name: 'mobile_phone', type: 'string', contextValue: '0034223456789'}
                ],
                "update_attribute_not_found.json",
                [
                    {name: 'position', type: 'coords', value: '40.418889, -3.691944'},
                    {name: 'mobile_phone', type: 'string', value: '0034223456789'}
                ],
                [
                    {
                        entity: {id: 'tech1', type: 'Technician'},
                        attributes: [
                            {name: 'position', type: 'coords'}
                        ]
                    }
                ],
                /* flat: */ false,
                /* errors: */[
                    {
                        entity: {id: "tech1", type: "Technician"},
                        attributes: [
                            {name: "mobile_phone", type: "string"}
                        ],
                        statusCode: {
                            code: 404,
                            reasonPhrase: "No context element found",
                            details : "tech1"
                        }
                    }
                ]
            );
        });


        describe('addAttributes(toAdd, options)', function () {
            var check_add_attributes_method = function check_add_attributes_method(label, value, response_file, expected_request, expected_response, flat) {

                it(label, function (done) {
                    // TODO
                    var request = new XMLHttpRequest();
                    request.open('GET', 'responses/' + response_file, false);
                    request.send();
                    ajaxMockup.addStaticURL("http://ngsi.server.com/v1/updateContext", {
                        status: 200,
                        responseText: request.responseText,
                        checkRequestContent: function (url, options) {
                            var data = JSON.parse(options.postBody);
                            expect(data).toEqual({
                                contextElements: [
                                    {
                                        id: 'entity1',
                                        isPattern: 'false',
                                        type: 'Technician',
                                        attributes: [
                                            expected_request
                                        ]
                                    }
                                ],
                                updateAction: 'APPEND'
                            });

                            return true;
                        }

                    });

                    connection.addAttributes(
                        [
                            {
                                'entity': {type: 'Technician', id: 'entity1'},
                                'attributes': [value]
                            }
                        ], {
                            flat: flat,
                            onSuccess: function (data, error_data) {
                                response_data = data;
                                response_error_data = error_data;
                            },
                            onFailure: function (e) {
                                failure = e;
                            },
                            onComplete: function () {
                                response = true;
                            }
                        }
                    );

                    waitsForResponse(function () {
                        expect(failure).toEqual(false);
                        expect(response_data).toEqual(expected_response);
                        expect(response_error_data).toEqual([]);
                    }, done);
                });

            };

            check_add_attributes_method(
                "supports simple string values",
                {'name': 'new_attribute', 'type': 'string', 'contextValue': 'value'},
                "update2.json",
                {name: 'new_attribute', type: 'string', value: 'value'},
                [
                    {
                        entity: {
                            id: 'tech1',
                            type: 'Technician'
                        },
                        attributes: [
                            {
                                name: 'new_attribute',
                                type: 'string'
                            }
                        ]
                    }
                ]
            );

            check_add_attributes_method(
                "supports adding metadata",
                {
                    name: 'position',
                    type: 'coords',
                    contextValue: '40.418889, -3.691944',
                    metadata: [
                        {name: 'location', type: 'string', value: 'WGS84'}
                    ]
                },
                "update3.json",
                {
                    name: 'position',
                    type: 'coords',
                    value: '40.418889, -3.691944',
                    metadatas: [
                        {name: 'location', type: 'string', value: 'WGS84'}
                    ]
                },
                [
                    {
                        entity: {
                            id: 'entity1',
                            type: 'Technician'
                        },
                        attributes: [
                            {
                                name: 'position',
                                type: 'coords',
                                metadata: [
                                    {name: 'location', type: 'string', value: 'WGS84'}
                                ]
                            }
                        ]
                    }
                ]
            );

            check_add_attributes_method(
                "supports structured attributes",
                {
                    name: 'structuredattr',
                    type: 'structure',
                    contextValue: [
                        "22",
                        {
                            "x": ["x1", "x2"],
                            "y": "3"
                        },
                        ["z1", "z2"]
                    ]
                },
                "update9.json",
                {name: 'structuredattr', type: 'structure', value: ['22', Object({x: ['x1', 'x2'], y: '3'}), ['z1', 'z2']]},
                [
                    {
                        'entity': {
                            'id': 'tech1',
                            'type': 'Technician'
                        },
                        'attributes': [
                            {
                                'name': 'structuredattr',
                                'type': 'structure'
                            }
                        ]
                    }
                ]
            );

            check_add_attributes_method(
                "supports the flat option",
                {'name': 'new_attribute', 'type': 'string', 'contextValue': 'value'},
                "update2.json",
                {name: 'new_attribute', type: 'string', value: 'value'},
                {
                    'tech1': {
                        'id': 'tech1',
                        'type': 'Technician',
                        'new_attribute': ''
                    }
                },
                true // flat
            );

            check_add_attributes_method(
                "supports empty string values",
                {'name': 'new_attribute', 'type': 'string', 'contextValue': ''},
                "update2.json",
                {name: 'new_attribute', type: 'string', value: ''},
                {
                    'tech1': {
                        'id': 'tech1',
                        'type': 'Technician',
                        'new_attribute': ''
                    }
                },
                true // flat
            );

            check_add_attributes_method(
                "supports null values",
                {'name': 'new_attribute', 'type': 'string', 'contextValue': null},
                "update2.json",
                {name: 'new_attribute', type: 'string', value: null},
                {
                    'tech1': {
                        'id': 'tech1',
                        'type': 'Technician',
                        'new_attribute': ''
                    }
                },
                true // flat
            );

        });

        it("basic delete context attributes requests", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/update4.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/updateContext", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var data, entity;

                    data = JSON.parse(options.postBody);
                    if (!('contextElements' in data) || data.updateAction !== 'DELETE') {
                        return false;
                    }
                    if (data.contextElements.length !== 1) {
                        return false;
                    }

                    entity = data.contextElements[0];
                    if (entity.id !== 'Madrid' || entity.type !== 'City' || entity.attributes.length !== 1) {
                        return false;
                    }

                    // Attribute 1
                    if (entity.attributes[0].name !== 'position' || entity.attributes[0].type !== 'coords' || 'value' in entity.attributes[0]) {
                        return false;
                    }

                    return true;
                }

            });

            connection.deleteAttributes(
                [
                    {
                        'entity': {type: 'City', id: 'Madrid'},
                        'attributes': [
                            {'name': 'position', 'type': 'coords'}
                        ]
                    }
                ], {
                    onSuccess: function (data, error_data) {
                        response_data = data;
                        response_error_data = error_data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual(
                    [{
                        'entity': {
                            'id': 'Madrid',
                            'type': 'City'
                        },
                        'attributes': [
                            {
                                'name': 'position',
                                'type': 'coords'
                            }
                        ]
                    }
                    ]);
                expect(response_error_data).toEqual([]);
            }, done);
        });

        it("errors when making basic delete context requests", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/update5.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/updateContext", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var data, entity;

                    data = JSON.parse(options.postBody);
                    if (!('contextElements' in data) || data.updateAction !== 'DELETE') {
                        return false;
                    }
                    if (data.contextElements.length !== 1) {
                        return false;
                    }

                    entity = data.contextElements[0];
                    if (entity.id !== 'Madrid' || entity.type !== 'City' || entity.attributes.length !== 1) {
                        return false;
                    }

                    // Attribute 1
                    if (entity.attributes[0].name !== 'position' || entity.attributes[0].type !== 'coords' || 'value' in entity.attributes[0]) {
                        return false;
                    }

                    return true;
                }
            });

            connection.deleteAttributes(
                [
                    {
                        'entity': {type: 'City', id: 'Madrid'},
                        'attributes': [
                            {name: 'position', type: 'coords'}
                        ]
                    }
                ], {
                    onSuccess: function (data, error_data) {
                        response_data = data;
                        response_error_data = error_data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual([]);
                expect(response_error_data).toEqual(
                    [{
                        entity: {
                            id: 'Madrid',
                            type: 'City'
                        },
                        attributes: [
                            { name: 'position', type: 'coords' }
                        ],
                        statusCode: {
                            code: 472,
                            reasonPhrase: 'request parameter is invalid/not allowed',
                            details : 'action: DELETE - entity: (Madrid, City) - offending attribute: position'
                        }
                    }
                    ]);
            }, done);
        });

        it("errors when making basic delete context requests using the flat option", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/update6.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/updateContext", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var data, entity;

                    data = JSON.parse(options.postBody);
                    if (!('contextElements' in data) || data.updateAction !== 'DELETE') {
                        return false;
                    }
                    if (data.contextElements.length !== 2) {
                        return false;
                    }

                    // Entity 1
                    entity = data.contextElements[0];
                    if (entity.id !== 'Madrid' || entity.type !== 'City' || entity.attributes.length !== 1) {
                        return false;
                    }

                    if (entity.attributes[0].name !== 'position' || entity.attributes[0].type !== 'coords' || 'value' in entity.attributes[0]) {
                        return false;
                    }

                    // Entity 2
                    entity = data.contextElements[1];
                    if (entity.id !== 'Madriz' || entity.type !== 'City' || entity.attributes.length !== 1) {
                        return false;
                    }

                    if (entity.attributes[0].name !== 'position' || entity.attributes[0].type !== 'coords' || 'value' in entity.attributes[0]) {
                        return false;
                    }

                    return true;
                }

            });

            connection.deleteAttributes(
                [
                    {
                        'entity': {type: 'City', id: 'Madrid'},
                        'attributes': [
                            {name: 'position', type: 'coords'}
                        ]
                    },
                    {
                        'entity': {type: 'City', id: 'Madriz'},
                        'attributes': [
                            {name: 'position', type: 'coords'}
                        ]
                    }
                ], {
                    flat: true,
                    onSuccess: function (data, error_data) {
                        response_data = data;
                        response_error_data = error_data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual({
                    Madrid: {
                        id: 'Madrid',
                        type: 'City',
                        position: ''
                    }
                });
                expect(response_error_data).toEqual(
                    [{
                        entity: {
                            id: 'Madriz',
                            type: 'City'
                        },
                        statusCode: {
                            code: 404,
                            reasonPhrase: 'No context element found',
                            details : 'Madriz'
                        }
                    }
                    ]);
            }, done);
        });

        it("basic delete context entities requests", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/update8.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/updateContext", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var data, entity;

                    data = JSON.parse(options.postBody);
                    if (!('contextElements' in data) || data.updateAction !== 'DELETE') {
                        return false;
                    }
                    if (data.contextElements.length !== 1) {
                        return false;
                    }

                    entity = data.contextElements[0];
                    if (entity.id !== 'Madrid' || entity.type !== 'City' || 'attributes' in entity) {
                        return false;
                    }

                    return true;
                }

            });

            connection.deleteAttributes(
                [
                    {
                        'entity': {type: 'City', id: 'Madrid'}
                    }
                ], {
                    onSuccess: function (data, error_data) {
                        response_data = data;
                        response_error_data = error_data;
                    },
                    onFailure: function (e) {
                        failure = e;
                    },
                    onComplete: function () {
                        response = true;
                    }
                }
            );

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual(
                    [{
                        'entity': {
                            'id': 'Madrid',
                            'type': 'City'
                        },
                        'attributes': []
                    }
                    ]);
                expect(response_error_data).toEqual([]);
            }, done);
        });

        it("basic subscribe context requests", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/subscribeContext1.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/subscribeContext", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var data, condition;

                    data = JSON.parse(options.postBody);
                    if (!Array.isArray(data.entities) || data.entities.length !== 2 || 'attributes' in data || 'subscriptionId' in data || data.notifyConditions.length !== 1) {
                        return false;
                    }

                    if (data.reference !== 'http://www.example.com/callback' || data.duration !== 'PT24H') {
                        return false;
                    }

                    // Entity Id 1
                    if (data.entities[0].type !== 'Technician' || data.entities[0].id !== 'tech*' || data.entities[0].isPattern !== 'true') {
                        return false;
                    }

                    // Entity Id 2
                    if (data.entities[1].type !== 'Van' || data.entities[1].id !== 'van1' || data.entities[1].isPattern !== 'false') {
                        return false;
                    }

                    // Notify conditions
                    condition = data.notifyConditions[0];
                    return condition.type === 'ONCHANGE' && condition.condValues.length === 1 && condition.condValues[0] === 'position';
                }

            });

            connection.createSubscription(
                [
                    {type: 'Technician', id: 'tech*', isPattern: true},
                    {type: 'Van', id: 'van1'},
                ],
                null,
                'PT24H',
                null,
                [{type: 'ONCHANGE', condValues: ['position']}],
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(mockedeventsources.length).toEqual(0);
                expect(response_data).toEqual({
                    'subscriptionId': 'sub1',
                    'duration': 'PT24H'
                });
            }, done);
        });

        it("basic update context subscription requests", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/updateContextSubscription1.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/updateContextSubscription", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var data, condition;

                    data = JSON.parse(options.postBody);
                    if ('entities' in data || 'attributes' in data || data.subscriptionId !== 'sub1' || data.duration !== "PT20H") {
                        return false;
                    }

                    if ('reference' in data) {
                        return false;
                    }

                    return true;
                }
            });

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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual({
                    'subscriptionId': 'sub1',
                    'duration': 'PT20H'
                });
            }, done);
        });

        it("basic cancel context subscription requests", function (done) {
                // TODO
            var request = new XMLHttpRequest();
                request.open('GET', 'responses/unsubscribeContext1.json', false);
                request.send();
                ajaxMockup.addStaticURL("http://ngsi.server.com/v1/unsubscribeContext", {
                        status: 200,
                        responseText: request.responseText
                    });

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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual({
                    "statusCode": {
                        "code": 200,
                        "reasonPhrase": "OK"
                    },
                    'subscriptionId': 'sub1'
                });
            }, done);
        });

        it("basic get available types requests", function (done) {
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/contextTypes.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/contextTypes", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    return options.parameters.details === 'on';
                }
            });

            connection.getAvailableTypes({
                onSuccess: function (data, details) {
                    response_data = data;
                    response_details = details;
                },
                onFailure: function (e) {
                    failure = e;
                },
                onComplete: function () {
                    response = true;
                }
            });

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual([
                    {
                        "name" : "",
                        "attributes" : [
                            "position",
                            "status",
                            "value",
                            "city_location"
                        ]
                    },
                    {
                        "name" : "AMMS",
                        "attributes" : [
                            "Longitud",
                            "Latitud",
                            "ReactivePower",
                            "ActivePower",
                            "TimeInstant"
                        ]
                    },
                    {
                        "name" : "Agrarium",
                        "attributes" : [
                            "moisture",
                            "ambientLight",
                            "position",
                            "humidity",
                            "temperature"
                        ]
                    }
                ]);
                expect(response_details).toEqual({
                    "count": 123456
                });
            }, done);
        });

        it("empty get available types requests", function (done) {
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/contextTypes_empty.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/contextTypes", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    return options.parameters.details === 'on';
                }
            });

            connection.getAvailableTypes({
                onSuccess: function (data, details) {
                    response_data = data;
                    response_details = details;
                },
                onFailure: function (e) {
                    failure = e;
                },
                onComplete: function () {
                    response = true;
                }
            });

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual([]);
                expect(response_details).toEqual({
                    "count": 0
                });
            }, done);
        });

        it("basic get available types requests without details", function (done) {
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/contextTypes3.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/contextTypes", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    return options.parameters.details === 'off';
                }
            });

            connection.getAvailableTypes({
                details: false,
                onSuccess: function (data, details) {
                    response_data = data;
                    response_details = details;
                },
                onFailure: function (e) {
                    failure = e;
                },
                onComplete: function () {
                    response = true;
                }
            });

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual([
                    {
                        "name" : "",
                        "attributes" : [
                            "position",
                            "status",
                            "value",
                            "city_location"
                        ]
                    },
                    {
                        "name" : "AMMS",
                        "attributes" : [
                            "Longitud",
                            "Latitud",
                            "ReactivePower",
                            "ActivePower",
                            "TimeInstant"
                        ]
                    },
                    {
                        "name" : "Agrarium",
                        "attributes" : [
                            "moisture",
                            "ambientLight",
                            "position",
                            "humidity",
                            "temperature"
                        ]
                    }
                ]);
            }, done);
        });

        it("basic get type info requests", function (done) {
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/contextTypes2.json', false);
            request.send();
            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/contextTypes/Agrarium", {
                status: 200,
                responseText: request.responseText
            });

            connection.getTypeInfo("Agrarium", {
                onSuccess: function (data) {
                    response_data = data;
                },
                onFailure: function (e) {
                    failure = e;
                },
                onComplete: function () {
                    response = true;
                }
            });

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(response_data).toEqual({
                    "name" : "Agrarium",
                    "attributes" : [
                        "moisture",
                        "ambientLight",
                        "position",
                        "humidity",
                        "temperature"
                    ]
                });
            }, done);
        });

        // createRegistration parameters: entities, attributes, duration, providingApplication, options
        arguments_error_test('createRegistration', [], 'missing all arguments');
        arguments_error_test('createRegistration', [null, [], 'PT1H', 'app', null], 'passing a null entities argument');
        arguments_error_test('createRegistration', [[], [], 'PT1H', 'app', null], 'passing a empty array entities argument');
        arguments_error_test('createRegistration', ["string", [], 'PT1H', 'app', null], 'passing a string entities argument');
        arguments_error_test('createRegistration', [5, [], 'PT1H', 'app', null], 'passing a number entities argument');
        arguments_error_test('createRegistration', [{}, [], 'PT1H', 'app', null], 'passing a plain object entities argument');
        arguments_error_test('createRegistration', [false, [], 'PT1H', 'app', null], 'passing a boolean entities argument');
        arguments_error_test('createRegistration', [['a'], "string", 'PT1H', 'app', null], 'passing a string attributes argument');
        arguments_error_test('createRegistration', [['a'], 5, 'PT1H', 'app', null], 'passing a number attributes argument');
        arguments_error_test('createRegistration', [['a'], {}, 'PT1H', 'app', null], 'passing a plain object attributes argument');
        arguments_error_test('createRegistration', [['a'], false, 'PT1H', 'app', null], 'passing a boolean attributes argument');

        // updateRegistration parameters: regId, entities, attributes, duration, providingApplication, options
        arguments_error_test('updateRegistration', [], 'missing all arguments');
        arguments_error_test('updateRegistration', ['reg1', null, [], 'PT1H', 'app', null], 'passing a null entities argument');
        arguments_error_test('updateRegistration', ['reg1', [], [], 'PT1H', 'app', null], 'passing a empty array entities argument');
        arguments_error_test('updateRegistration', ['reg1', "string", [], 'PT1H', 'app', null], 'passing a string entities argument');
        arguments_error_test('updateRegistration', ['reg1', 5, [], 'PT1H', 'app', null], 'passing a number entities argument');
        arguments_error_test('updateRegistration', ['reg1', {}, [], 'PT1H', 'app', null], 'passing a plain object entities argument');
        arguments_error_test('updateRegistration', ['reg1', false, [], 'PT1H', 'app', null], 'passing a boolean entities argument');
        arguments_error_test('updateRegistration', ['reg1', ['a'], "string", 'PT1H', 'app', null], 'passing a string attributes argument');
        arguments_error_test('updateRegistration', ['reg1', ['a'], 5, 'PT1H', 'app', null], 'passing a number attributes argument');
        arguments_error_test('updateRegistration', ['reg1', ['a'], {}, 'PT1H', 'app', null], 'passing a plain object attributes argument');
        arguments_error_test('updateRegistration', ['reg1', ['a'], false, 'PT1H', 'app', null], 'passing a boolean attributes argument');

        // cancelRegistration parameters: regId, options
        arguments_error_test('cancelRegistration', [], 'missing all arguments');

        // discoverAvailability parameters: entities, attributes, options
        arguments_error_test('discoverAvailability', [], 'missing all arguments');
        arguments_error_test('discoverAvailability', [null, null, null], 'passing a null entities argument');
        arguments_error_test('discoverAvailability', [[], null, null], 'passing a empty array entities argument');
        arguments_error_test('discoverAvailability', ["string", null, null], 'passing a string entities argument');
        arguments_error_test('discoverAvailability', [5, null, null], 'passing a number entities argument');
        arguments_error_test('discoverAvailability', [{}, null, null], 'passing a plain object entities argument');
        arguments_error_test('discoverAvailability', [false, null, null], 'passing a boolean entities argument');
        arguments_error_test('discoverAvailability', [['a'], "string", null], 'passing a string attributes argument');
        arguments_error_test('discoverAvailability', [['a'], 5, null], 'passing a number attributes argument');
        arguments_error_test('discoverAvailability', [['a'], {}, null], 'passing a plain object attributes argument');
        arguments_error_test('discoverAvailability', [['a'], false, null], 'passing a boolean attributes argument');

        // createAvailabilitySubscription parameters: entities, attributeNames, duration, restriction, options
        arguments_error_test('createAvailabilitySubscription', [], 'missing all arguments');
        arguments_error_test('createAvailabilitySubscription', [null, null, 'PT1H', null, {onNotify: 'url'}], 'passing a null entities argument');
        arguments_error_test('createAvailabilitySubscription', [[], null, 'PT1H', null, {onNotify: 'url'}], 'passing a empty array entities argument');
        arguments_error_test('createAvailabilitySubscription', ["string", null, 'PT1H', null, {onNotify: 'url'}], 'passing a string entities argument');
        arguments_error_test('createAvailabilitySubscription', [5, null, 'PT1H', null, {onNotify: 'url'}], 'passing a number entities argument');
        arguments_error_test('createAvailabilitySubscription', [{}, null, 'PT1H', null, {onNotify: 'url'}], 'passing a plain object entities argument');
        arguments_error_test('createAvailabilitySubscription', [false, null, 'PT1H', null, {onNotify: 'url'}], 'passing a boolean entities argument');
        arguments_error_test('createAvailabilitySubscription', [['a'], "string", 'PT1H', null, {onNotify: 'url'}], 'passing a string attributes argument');
        arguments_error_test('createAvailabilitySubscription', [['a'], 5, 'PT1H', null, {onNotify: 'url'}], 'passing a number attributes argument');
        arguments_error_test('createAvailabilitySubscription', [['a'], {}, 'PT1H', null, {onNotify: 'url'}], 'passing a plain object attributes argument');
        arguments_error_test('createAvailabilitySubscription', [['a'], false, 'PT1H', null, {onNotify: 'url'}], 'passing a boolean attributes argument');
        arguments_error_test('createAvailabilitySubscription', [['a'], null, 'PT1H', null, null], 'passing a null options argument');
        arguments_error_test('createAvailabilitySubscription', [['a'], null, 'PT1H', null, {onNotify: false}], 'passing a boolean onNotify option');
        arguments_error_test('createAvailabilitySubscription', [['a'], null, 'PT1H', null, {onNotify: 5}], 'passing a number onNotify option');
        arguments_error_test('createAvailabilitySubscription', [['a'], null, 'PT1H', null, {onNotify: function () {}}], 'passing a boolean attributes argument');

        // updateAvailabilitySubscription parameters: subId, entities, attributeNames, duration, restriction, options
        arguments_error_test('updateAvailabilitySubscription', [], 'missing all arguments');
        arguments_error_test('updateAvailabilitySubscription', ['sub1', null, null, 'PT1H', null, null], 'passing a null entities argument');
        arguments_error_test('updateAvailabilitySubscription', ['sub1', [], null, 'PT1H', null, null], 'passing a empty array entities argument');
        arguments_error_test('updateAvailabilitySubscription', ['sub1', "string", null, 'PT1H', null, null], 'passing a string entities argument');
        arguments_error_test('updateAvailabilitySubscription', ['sub1', 5, null, 'PT1H', null, null], 'passing a number entities argument');
        arguments_error_test('updateAvailabilitySubscription', ['sub1', {}, null, 'PT1H', null, null], 'passing a plain object entities argument');
        arguments_error_test('updateAvailabilitySubscription', ['sub1', false, null, 'PT1H', null, null], 'passing a boolean entities argument');
        arguments_error_test('updateAvailabilitySubscription', ['sub1', ['a'], "string", 'PT1H', null, null], 'passing a string attributes argument');
        arguments_error_test('updateAvailabilitySubscription', ['sub1', ['a'], 5, 'PT1H', null, null], 'passing a number attributes argument');
        arguments_error_test('updateAvailabilitySubscription', ['sub1', ['a'], {}, 'PT1H', null, null], 'passing a plain object attributes argument');
        arguments_error_test('updateAvailabilitySubscription', ['sub1', ['a'], false, 'PT1H', null, null], 'passing a boolean attributes argument');

        // cancelAvailabilitySubscription parameters: subId, options
        arguments_error_test('cancelAvailabilitySubscription', [], 'missing all arguments');

        // query parameters: entities, attributes, options
        arguments_error_test('query', [], 'missing all arguments');
        arguments_error_test('query', [null, null, null], 'passing a null entities argument');
        arguments_error_test('query', [[], null, null], 'passing a empty array entities argument');
        arguments_error_test('query', ["string", null, null], 'passing a string entities argument');
        arguments_error_test('query', [5, null, null], 'passing a number entities argument');
        arguments_error_test('query', [{}, null, null], 'passing a plain object entities argument');
        arguments_error_test('query', [false, null, null], 'passing a boolean entities argument');
        arguments_error_test('query', [['a'], "string", null], 'passing a string attributes argument');
        arguments_error_test('query', [['a'], 5, null], 'passing a number attributes argument');
        arguments_error_test('query', [['a'], {}, null], 'passing a plain object attributes argument');
        arguments_error_test('query', [['a'], false, null], 'passing a boolean attributes argument');

        // updateAttributes, addAttributes and deleteAttributes
        check_update_context_methods([['updateAttributes', 'update'], ['addAttributes', 'toAdd'], ['deleteAttributes', 'toDelete']]);

        // createSubscription parameters: entities, attributeNames, duration, throttling, cond, options
        arguments_error_test('createSubscription', [], 'missing all arguments');
        arguments_error_test('createSubscription', [null, null, 'PT1H', null, null, {onNotify: 'url'}], 'passing a null entities argument');
        arguments_error_test('createSubscription', [[], null, 'PT1H', null, null, {onNotify: 'url'}], 'passing a empty array entities argument');
        arguments_error_test('createSubscription', ["string", null, 'PT1H', null, null, {onNotify: 'url'}], 'passing a string entities argument');
        arguments_error_test('createSubscription', [5, null, 'PT1H', null, null, {onNotify: 'url'}], 'passing a number entities argument');
        arguments_error_test('createSubscription', [{}, null, 'PT1H', null, null, {onNotify: 'url'}], 'passing a plain object entities argument');
        arguments_error_test('createSubscription', [false, null, 'PT1H', null, null, {onNotify: 'url'}], 'passing a boolean entities argument');
        arguments_error_test('createSubscription', [['a'], "string", 'PT1H', null, null, {onNotify: 'url'}], 'passing a string attributes argument');
        arguments_error_test('createSubscription', [['a'], 5, 'PT1H', null, null, {onNotify: 'url'}], 'passing a number attributes argument');
        arguments_error_test('createSubscription', [['a'], {}, 'PT1H', null, null, {onNotify: 'url'}], 'passing a plain object attributes argument');
        arguments_error_test('createSubscription', [['a'], false, 'PT1H', null, null, {onNotify: 'url'}], 'passing a boolean attributes argument');
        arguments_error_test('createSubscription', [['a'], null, 'PT1H', null, null, null], 'passing a null options argument');
        arguments_error_test('createSubscription', [['a'], null, 'PT1H', null, null, {onNotify: false}], 'passing a boolean onNotify option');
        arguments_error_test('createSubscription', [['a'], null, 'PT1H', null, null, {onNotify: 5}], 'passing a number onNotify option');
        arguments_error_test('createSubscription', [['a'], null, 'PT1H', null, null, {onNotify: function () {}}], 'passing a boolean attributes argument');

        // updateSubscription parameters: sub1, duration, throttling, cond, options
        arguments_error_test('updateSubscription', [], 'missing all arguments');

        // cancelSubscription parameters: subId, options
        arguments_error_test('cancelSubscription', [], 'missing all arguments');

        // getTypeInfo parameters: type, options
        arguments_error_test('getTypeInfo', [], 'missing all arguments');

    });

    describe("NGSI Library (using proxies) handles", function () {

        ajaxMockup = ajaxMockFactory.createFunction();

        beforeEach(function () {
            var options = {
                requestFunction: ajaxMockup,
                ngsi_proxy_url: 'http://ngsiproxy.example.com'
            };
            connection = new NGSI.Connection('http://ngsi.server.com', options);
            ajaxMockup.clear();
            response = false;
            response_data = null;
            response_error_data = null;
            response_details = null;
            notification_data = null;
            failure = false;
            window.mockedeventsources = [];
        });

        connection_error_on_query_test('Connection Error', 0);
        connection_error_on_query_test('Connection Error via proxy', 502);
        connection_error_on_query_test('Connection timeout via proxy', 504);

        it("basic subscribe availability context requests using the ngsi proxy", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/subscribeContextAvailability1.json', false);
            request.send();

            ajaxMockup.addStaticURL("http://ngsiproxy.example.com/eventsource", {
                status: 201,
                responseText: '',
                headers: {
                    'Location': 'http://ngsiproxy.example.com/eventsource/1'
                }
            });

            ajaxMockup.addStaticURL("http://ngsiproxy.example.com/callbacks", {
                status: 201,
                responseText: '{"callback_id": "1", "url": "http://ngsiproxy.example.com/callback/1"}',
                checkRequestContent: function (url, options) {
                    var data = JSON.parse(options.postBody);
                    return data.connection_id === 1;
                }
            });

            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/registry/subscribeContextAvailability", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var data, condition;

                    data = JSON.parse(options.postBody);
                    if (!Array.isArray(data.entities) || data.entities.length !== 2 || 'attributes' in data || 'subscriptionId' in data) {
                        return false;
                    }

                    if (data.reference !== 'http://ngsiproxy.example.com/callback/1' || data.duration !== 'PT24H') {
                        return false;
                    }

                    // Entity Id 1
                    if (data.entities[0].type !== 'Technician' || data.entities[0].id !== 'tech*' || data.entities[0].isPattern !== 'true') {
                        return false;
                    }

                    // Entity Id 2
                    if (data.entities[1].type !== 'Van' || data.entities[1].id !== 'van1' || data.entities[1].isPattern !== 'false') {
                        return false;
                    }

                    return true;
                }
            });

            connection.createAvailabilitySubscription(
                [
                    {type: 'Technician', id: 'tech*', isPattern: true},
                    {type: 'Van', id: 'van1'},
                ],
                null,
                'PT24H',
                null,
                {
                    onNotify: function (data) {
                        notification_data = data;
                    },
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(mockedeventsources.length).toEqual(1);
                expect(mockedeventsources[0].url).toEqual('http://ngsiproxy.example.com/eventsource/1');
                expect(mockedeventsources[0].events.init.length).toEqual(0);
                expect(mockedeventsources[0].events.close.length).toEqual(1);
                expect(mockedeventsources[0].events.notification.length).toEqual(1);
                expect(response_data).toEqual({
                    'subscriptionId': 'sub1',
                    'duration': 'PT24H'
                });
            }, done);
        });

        it("basic subscribe context requests using the ngsi proxy", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', 'responses/subscribeContext1.json', false);
            request.send();

            ajaxMockup.addStaticURL("http://ngsiproxy.example.com/eventsource", {
                status: 201,
                responseText: '',
                headers: {
                    'Location': 'http://ngsiproxy.example.com/eventsource/1'
                }
            });

            ajaxMockup.addStaticURL("http://ngsiproxy.example.com/callbacks", {
                status: 201,
                responseText: '{"callback_id": "1", "url": "http://ngsiproxy.example.com/callback/1"}',
                checkRequestContent: function (url, options) {
                    var data = JSON.parse(options.postBody);
                    return data.connection_id === 1;
                }
            });

            ajaxMockup.addStaticURL("http://ngsi.server.com/v1/subscribeContext", {
                status: 200,
                responseText: request.responseText,
                checkRequestContent: function (url, options) {
                    var data, condition;

                    data = JSON.parse(options.postBody);
                    if (!Array.isArray(data.entities) || data.entities.length !== 2 || 'attributes' in data || 'subscriptionId' in data || data.notifyConditions.length !== 1) {
                        return false;
                    }

                    if (data.reference !== 'http://ngsiproxy.example.com/callback/1' || data.duration !== 'PT24H') {
                        return false;
                    }

                    // Entity Id 1
                    if (data.entities[0].type !== 'Technician' || data.entities[0].id !== 'tech*' || data.entities[0].isPattern !== 'true') {
                        return false;
                    }

                    // Entity Id 2
                    if (data.entities[1].type !== 'Van' || data.entities[1].id !== 'van1' || data.entities[1].isPattern !== 'false') {
                        return false;
                    }

                    // Notify conditions
                    condition = data.notifyConditions[0];
                    return condition.type === 'ONCHANGE' && condition.condValues.length === 1 && condition.condValues[0] === 'position';
                }
            });

            connection.createSubscription(
                [
                    {type: 'Technician', id: 'tech*', isPattern: true},
                    {type: 'Van', id: 'van1'},
                ],
                null,
                'PT24H',
                null,
                [{type: 'ONCHANGE', condValues: ['position']}],
                {
                    onNotify: function (data) {
                        notification_data = data;
                    },
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

            waitsForResponse(function () {
                expect(failure).toEqual(false);
                expect(mockedeventsources.length).toEqual(1);
                expect(mockedeventsources[0].url).toEqual('http://ngsiproxy.example.com/eventsource/1');
                expect(mockedeventsources[0].events.init.length).toEqual(0);
                expect(mockedeventsources[0].events.close.length).toEqual(1);
                expect(mockedeventsources[0].events.notification.length).toEqual(1);
                expect(response_data).toEqual({
                    'subscriptionId': 'sub1',
                    'duration': 'PT24H'
                });
            }, done);
        });

        bad_ngsi_proxy_response_test("Connection Error", 0, NGSI.ConnectionError);
        bad_ngsi_proxy_response_test("404", 404, NGSI.InvalidResponseError);
        bad_ngsi_proxy_response_test("200", 200, NGSI.InvalidResponseError);
        bad_ngsi_proxy_response_test("Missing Location Header", 201, NGSI.InvalidResponseError);
        bad_ngsi_proxy_response_test("Connection Error via proxy", 502, NGSI.ConnectionError);
        bad_ngsi_proxy_response_test("Connection timeout via proxy", 504, NGSI.ConnectionError);

        // createSubscription errors not related with the ngsi-proxy
        bad_create_subscription_response_test("Connection Error", 0, NGSI.ConnectionError);
        bad_create_subscription_response_test("404", 404, NGSI.InvalidResponseError);
        bad_create_subscription_response_test("Connection Error via proxy", 502, NGSI.ConnectionError);
        bad_create_subscription_response_test("Connection timeout via proxy", 504, NGSI.ConnectionError);

    });
})();
