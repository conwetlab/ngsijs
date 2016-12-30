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

/* globals ajaxMockFactory, mockedeventsources, EventSource, beforeEach, expect, it, NGSI, waitsFor */

(function () {

    "use strict";

    var connection, response, response_data, response_error_data, response_details, failure, ajaxMockup, notification_data;

    var waitsForResponse = function waitsForResponse(next, done) {
        setTimeout(function() {
            if (response) {
                try {
                    next();
                } catch (e) {
                    done.fail(e);
                }
            } else {
                done.fail("No response from server");
            }
            done();
        }, 0);
    };

    var clone = function clone(obj1) {
        var result, value;

        result = Array.isArray(obj1) ? [] : {};

        for (var key in obj1) {
            value = obj1[key];
            if (value !== null && typeof value === 'object') {
                result[key] = clone(value);
            } else {
                result[key] = value;
            }
        }

        return result;
    };

    var merge = function merge(obj1, obj2) {
        if (obj1 == null) {
            obj1 = {};
        }

        for (var key in obj2) {
            obj1[key] = obj2[key];
        }

        return obj1;
    };

    var fix_entity = function fix_entity(entity) {
        if ("isPattern" in entity) {
            entity.isPattern = "" + entity.isPattern;
        } else {
            entity.isPattern = "false";
        }
    };

    var use_contextvalue = function use_contextvalue(entry) {
        entry.contextValue = entry.value;
        delete entry.value;
    };

    var use_metadatas = function use_metadatas(entry) {
        // v2 of the Orion Context broker uses the correct name: metadata
        // v1 uses "metadatas"
        if ('metadata' in entry) {
            entry.metadatas = entry.metadata;
            delete entry.metadata;
        }
    };

    var connection_error_on_query_test = function connection_error_on_query_test(description, code) {
        ajaxMockup.addStaticURL("http://ngsi.server.com/v1/queryContext", {status: code});

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

    var bad_ngsi_proxy_response_test = function bad_ngsi_proxy_response_test(description, response_status, error_class, exception) {
        it("ngsi-proxy errors when making subscribe context requests (" + description + ")", function (done) {
            ajaxMockup.addStaticURL("http://ngsiproxy.example.com/eventsource", {status: response_status, exception: exception});

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
                if (exception == null) {
                    expect(failure.cause instanceof error_class).toBeTruthy();
                } else {
                    expect(failure.cause).toBe(exception);
                }
            }, done);
        });
    };

    var arguments_error_test = function arguments_error_test(method, args, cond) {
        it(method + ' throws TypeError exceptions when ' + cond, function () {
            expect(function () {
                connection[method].apply(connection, args);
            }).toThrowError(TypeError);
        });
    };

    var check_update_context_method_arg_errors = function check_update_context_method_arg_errors(method, arg_name) {
        arguments_error_test(method, [], 'missing all arguments');
        arguments_error_test(method, [null, null], 'passing a null ' + arg_name + ' argument');
        arguments_error_test(method, [[], null], 'passing a empty array ' + arg_name + ' argument');
        arguments_error_test(method, ["string", null], 'passing a string ' + arg_name + ' argument');
        arguments_error_test(method, [5, null], 'passing a number ' + arg_name + ' argument');
        arguments_error_test(method, [{}, null], 'passing a plain object ' + arg_name + ' argument');
        arguments_error_test(method, [false, null], 'passing a boolean ' + arg_name + ' argument');
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
            request.open('GET', '/base/responses/registerContext1.json', false);
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
            request.open('GET', '/base/responses/registerContext1.json', false);
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
            request.open('GET', '/base/responses/registerContext1.json', false);
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
            request.open('GET', '/base/responses/registerContext2.json', false);
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
            request.open('GET', '/base/responses/discoverContextAvailability1.json', false);
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
            request.open('GET', '/base/responses/subscribeContextAvailability1.json', false);
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
            request.open('GET', '/base/responses/updateContextAvailabilitySubscription1.json', false);
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
            request.open('GET', '/base/responses/unsubscribeContextAvailability1.json', false);
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

        describe("query(entities, attrNames, options)", function () {

            var check_query_method = function check_query_method(label, response_file, entities, attrNames, options, expected_response, parameters, details) {
                var expected_request, fixed_entities;

                fixed_entities = clone(entities);
                fixed_entities.forEach(fix_entity);

                expected_request = {
                    "entities": fixed_entities
                };

                if (attrNames != null && attrNames.length > 0) {
                    expected_request.attributes = attrNames;
                }

                if (options.restriction != null) {
                    expected_request.restriction = clone(options.restriction);
                    expected_request.restriction.scopes.forEach(function (scope) {
                        if ('polygon' in scope.value && scope.value.polygon.inverted === true) {
                            scope.value.polygon.inverted = "true";
                        }
                        if ('circle' in scope.value && scope.value.circle.inverted === true) {
                            scope.value.circle.inverted = "true";
                        }
                    });
                }

                it(label, function (done) {
                    // TODO
                    var request = new XMLHttpRequest();
                    request.open('GET', '/base/responses/' + response_file, false);
                    request.send();
                    ajaxMockup.addStaticURL("http://ngsi.server.com/v1/queryContext", {
                        status: 200,
                        responseText: request.responseText,
                        checkRequestContent: function (url, options) {
                            var data = JSON.parse(options.postBody);
                            if (parameters != null) {
                                expect(options.parameters).toEqual(parameters);
                            } else {
                                expect(options.parameters).toEqual({details: "off"});
                            }
                            expect(data).toEqual(expected_request);

                            return true;
                        }
                    });

                    options = merge(
                        options,
                        {
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

                    connection.query(entities, attrNames, options);

                    waitsForResponse(function () {
                        expect(failure).toEqual(false);
                        expect(response_data).toEqual(expected_response);
                        expect(response_details).toEqual(details);
                    }, done);
                });
            };

            var check_query_method_error = function check_query_method_error(label, response_file, entities, attrNames, options, parameters, error_class, details) {
                var expected_request, fixed_entities;

                fixed_entities = clone(entities);
                fixed_entities.forEach(fix_entity);

                expected_request = {
                    "entities": fixed_entities
                };

                if (attrNames != null && attrNames.length > 0) {
                    expected_request.attributes = attrNames;
                }

                it(label, function (done) {
                    // TODO
                    var request = new XMLHttpRequest();
                    request.open('GET', '/base/responses/' + response_file, false);
                    request.send();
                    ajaxMockup.addStaticURL("http://ngsi.server.com/v1/queryContext", {
                        status: 200,
                        responseText: request.responseText,
                        checkRequestContent: function (url, options) {
                            var data = JSON.parse(options.postBody);
                            if (parameters != null) {
                                expect(options.parameters).toEqual(parameters);
                            } else {
                                expect(options.parameters).toEqual({details: "off"});
                            }
                            expect(data).toEqual(expected_request);

                            return true;
                        }
                    });

                    options = merge(
                        options,
                        {
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

                    connection.query(entities, attrNames, options);

                    waitsForResponse(function () {
                        expect(failure instanceof error_class).toBeTruthy();
                        expect(failure.details).toEqual(details);
                        expect(response_data).toEqual(null);
                        expect(response_details).toEqual(null);
                    }, done);
                });
            };

            var query1_response = [
                {
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
            ];

            check_query_method(
                "supports passing null values to attrNames",
                "query1.json",
                [
                    {type: 'Technician', id: 'tech1'},
                    {type: 'Technician', id: 'tech2'}
                ],
                null,
                {},
                query1_response
            );

            check_query_method(
                "supports passing [] to attrNames",
                "query1.json",
                [
                    {type: 'Technician', id: 'tech1'},
                    {type: 'Technician', id: 'tech2'}
                ],
                [],
                {},
                query1_response
            );

            check_query_method(
                "supports passing an attribute list to attrNames",
                "query_with_attribute_list.json",
                [
                    {type: 'Technician', id: 'tech1'},
                    {type: 'Technician', id: 'tech2'}
                ],
                ["name", "van"],
                {},
                [
                    {
                        'entity': {
                            'id': 'tech1',
                            'type': 'Technician'
                        },
                        'attributes': [
                            {
                                'name': 'name',
                                'type': 'string',
                                'contextValue': 'Jacinto Salas Torres'
                            },
                            {
                                'name': 'van',
                                'type': 'string',
                                'contextValue': 'van1'
                            }
                        ]
                    }
                ]
            );

            check_query_method(
                "handles structured attributes",
                "query6.json",
                [
                    {type: 'Technician', id: 'tech1'}
                ],
                null,
                {},
                [
                    {
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
                ]
            );

            check_query_method(
                "handles empty responses",
                "query_empty_result.json",
                [
                    {type: 'BankAccount', id: '.*', isPattern: true}
                ],
                null,
                {},
                []
            );

            check_query_method(
                "supports the flat option",
                "query1.json",
                [
                    {type: 'Technician', id: 'entity1'}
                ],
                null,
                {flat: true},
                {
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
                }
            );

            check_query_method(
                "handles empty responses when using the flat option",
                "query_empty_result.json",
                [
                    {type: 'BankAccount', id: '.*', isPattern: true}
                ],
                null,
                {flat: true},
                {}
            );

            check_query_method(
                "handles structured attributes when using the flat option",
                "query6.json",
                [
                    {type: 'Technician', id: 'tech1'}
                ],
                null,
                {flat: true},
                {
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
                }
            );

            check_query_method(
                "supports the limit option",
                "query1.json",
                [
                    {type: 'Technician', id: '.*', isPattern: true}
                ],
                null,
                {"limit": 100},
                query1_response,
                {details: "off", limit: 100}
            );

            check_query_method(
                "supports the offset option",
                "query1.json",
                [
                    {type: 'Technician', id: '.*', isPattern: true}
                ],
                null,
                {offset: 200},
                query1_response,
                {details: "off", offset: 200}
            );

            check_query_method(
                "supports the details option",
                "query3.json",
                [
                    {type: 'Technician', id: '.*', isPattern: true}
                ],
                null,
                {details: true},
                [
                    {
                        "entity": {
                            "id": "OUTSMART.NODE_3513",
                            "type": "Node"
                        },
                        "attributes": []
                    },
                    {
                        "entity": {
                            "id": "OUTSMART.NODE_3503",
                            "type": "Node"
                        },
                        "attributes": [
                            {
                                "name": "TimeInstant",
                                "type": "urn:x-ogc:def:trs:IDAS:1.0:ISO8601",
                                "contextValue": "2014-07-10T00:01:06+0200"
                            },
                            {
                                "name": "batteryCharge",
                                "type": "urn:x-ogc:def:phenomenon:IDAS:1.0:batteryCharge",
                                "contextValue": "2"
                            }
                        ]
                    }
                ],
                {details: "on"},
                {count: 47855}
            );

            check_query_method(
                "handles empty responses when using the details option",
                "query_empty_result.json",
                [
                    {type: 'BankAccount', id: '.*', isPattern: true}
                ],
                null,
                {details: true},
                [],
                {details: "on"},
                {count: 0}
            );

            check_query_method_error(
                "handles out of boundary responses when using the details option",
                "query4.json",
                [
                    {type: 'Technician', id: '.*', isPattern: true}
                ],
                null,
                {limit: 100, offset: 1000, details: true},
                {limit: 100, offset: 1000, details: "on"},
                NGSI.InvalidRequestError,
                {
                    text: "Number of matching entities: 5. Offset is 1000",
                    matches: 5,
                    offset: 1000
                }
            );

            var query5_response = [
                {
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
            ];

            check_query_method(
                "supports restrictions (polygon)",
                "query5.json",
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
                    }
                },
                query5_response
            );

            check_query_method(
                "supports restrictions (inverted polygon)",
                "query5.json",
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
                    }
                },
                query5_response
            );

            check_query_method(
                "supports restrictions (circle)",
                "query_empty_result.json",
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
                    }
                },
                []
            );

            check_query_method(
                "supports restrictions (inverted circle)",
                "query_empty_result.json",
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
                    }
                },
                []
            );

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

            arguments_error_test('query', [[{id: 'a'}], null, {limit: "a"}], 'passing a string value to the limit option');
            arguments_error_test('query', [[{id: 'a'}], null, {limit: 1}], 'passing a number lower than 20 to the limit option');
            arguments_error_test('query', [[{id: 'a'}], null, {offset: "a"}], 'passing a string value to the offset option');
            arguments_error_test('query', [[{id: 'a'}], null, {offset: -1}], 'passing a number lower than 0 to the offset option');
            arguments_error_test('query', [[{id: 'a'}], null, {details: "a"}], 'passing a string value to the details option');
            arguments_error_test('query', [[{id: 'a'}], null, {details: {}}], 'passing an object to the details option');

            connection_error_on_query_test('Connection Error', 0);
            connection_error_on_query_test('Connection Error via proxy', 502);
            connection_error_on_query_test('Connection timeout via proxy', 504);

            var bad_query_response_test = function bad_query_response_test(content) {
                it("handles invalid error codes from the server (error " + content.status + ")", function (done) {
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
                it("handles bad response content from the server (" + description + ")", function (done) {
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

        });

        describe('updateAttributes(update, options)', function () {
            var check_raw_update_attributes_method = function check_update_attributes_method(label, updated_attributes, response_file, expected_request, expected_response, flat, errors) {
                errors = errors == null ? [] : errors;

                it(label, function (done) {
                    // TODO
                    var request = new XMLHttpRequest();
                    request.open('GET', '/base/responses/' + response_file, false);
                    request.send();
                    ajaxMockup.addStaticURL("http://ngsi.server.com/v1/updateContext", {
                        status: 200,
                        responseText: request.responseText,
                        checkRequestContent: function (url, options) {
                            var data = JSON.parse(options.postBody);
                            expect(data).toEqual(expected_request);

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

            var check_update_attributes_method = function check_update_attributes_method(label, updated_attributes, response_file, expected_response, flat, errors) {

                var expected_request, updated_attributes_contextValue;

                // Check the API using the standard way
                expected_request = {
                    contextElements: [
                        {
                            id: 'entity1',
                            isPattern: 'false',
                            type: 'Technician',
                            attributes: updated_attributes
                        }
                    ],
                    updateAction: 'UPDATE'
                };

                check_raw_update_attributes_method(label, updated_attributes, response_file, expected_request, expected_response, flat, errors);

                // Check the API using the deprecated contextValue attribute
                updated_attributes_contextValue = clone(updated_attributes);
                updated_attributes_contextValue.forEach(use_contextvalue);

                check_raw_update_attributes_method(label + " (using the deprecated contextValue attribute)", updated_attributes_contextValue, response_file, expected_request, expected_response, flat, errors);
            };

            check_update_attributes_method(
                "supports empty string values",
                [{"name": "mobile_phone", "type": "string", "value": ""}],
                "update_empty_string.json",
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
                [{"name": "new_attribute", "type": "string", "value": null}],
                "update2.json",
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
                        value: [
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
                    {name: 'mobile_phone', type: 'string', value: '0034223456789'},
                    {name: 'attr2', value: 'value'},
                    {name: 'attr3', value: 5}
                ],
                "update1.json",
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
                    {name: 'mobile_phone', type: 'string', value: '0034223456789'},
                    {name: 'attr2', value: 'value'},
                    {name: 'attr3', value: 5}
                ],
                "update1.json",
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
                    {name: 'position', type: 'coords', value: '40.418889, -3.691944'},
                    {name: 'mobile_phone', type: 'string', value: '0034223456789'}
                ],
                "update_attribute_not_found.json",
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

            check_update_context_method_arg_errors('updateAttributes', 'update');
        });


        describe('addAttributes(toAdd, options)', function () {
            var check_raw_add_attributes_method = function check_raw_add_attributes_method(label, appended_attributes, response_file, expected_request, expected_response, flat, errors) {
                errors = errors == null ? [] : errors;

                it(label, function (done) {
                    // TODO
                    var request = new XMLHttpRequest();
                    request.open('GET', '/base/responses/' + response_file, false);
                    request.send();
                    ajaxMockup.addStaticURL("http://ngsi.server.com/v1/updateContext", {
                        status: 200,
                        responseText: request.responseText,
                        checkRequestContent: function (url, options) {
                            var data = JSON.parse(options.postBody);
                            expect(data).toEqual(expected_request);

                            return true;
                        }

                    });

                    connection.addAttributes(
                        [
                            {
                                'entity': {type: 'Technician', id: 'entity1'},
                                'attributes': appended_attributes
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

            var check_add_attributes_method = function check_add_attributes_method(label, appended_attributes, response_file, expected_response, flat, errors) {
                var expected_request, appended_attributes_metadatas, appended_attributes_contextValue;

                appended_attributes_metadatas = clone(appended_attributes);
                appended_attributes_metadatas.forEach(use_metadatas);

                // Check the API using the standard way
                expected_request = {
                    contextElements: [
                        {
                            id: 'entity1',
                            isPattern: 'false',
                            type: 'Technician',
                            attributes: appended_attributes_metadatas
                        }
                    ],
                    updateAction: 'APPEND'
                };

                check_raw_add_attributes_method(label, appended_attributes, response_file, expected_request, expected_response, flat, errors);

                // Check the API using the deprecated contextValue attribute
                appended_attributes_contextValue = clone(appended_attributes);
                appended_attributes_contextValue.forEach(use_contextvalue);

                check_raw_add_attributes_method(label + " (using the deprecated contextValue attribute)", appended_attributes_contextValue, response_file, expected_request, expected_response, flat, errors);
            };

            check_add_attributes_method(
                "supports simple string values",
                [{"name": "new_attribute", "type": "string", "value": "value"}],
                "update2.json",
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
                [
                    {
                        name: 'position',
                        type: 'coords',
                        value: '40.418889, -3.691944',
                        metadata: [
                            {name: 'location', type: 'string', value: 'WGS84'}
                        ]
                    }
                ],
                "update3.json",
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
                [
                    {
                        name: 'structuredattr',
                        type: 'structure',
                        value: [
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
                [{"name": "new_attribute", "type": "string", "value": "value"}],
                "update2.json",
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
                [{"name": "new_attribute", "type": "string", "value": ""}],
                "update2.json",
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
                [{"name": "new_attribute", "type": "string", "value": null}],
                "update2.json",
                {
                    'tech1': {
                        'id': 'tech1',
                        'type': 'Technician',
                        'new_attribute': ''
                    }
                },
                true // flat
            );

            check_update_context_method_arg_errors('addAttributes', 'toAdd');
        });

        it("basic delete context attributes requests", function (done) {
            // TODO
            var request = new XMLHttpRequest();
            request.open('GET', '/base/responses/update4.json', false);
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
            request.open('GET', '/base/responses/update5.json', false);
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
            request.open('GET', '/base/responses/update6.json', false);
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
            request.open('GET', '/base/responses/update8.json', false);
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
            request.open('GET', '/base/responses/subscribeContext1.json', false);
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
            request.open('GET', '/base/responses/updateContextSubscription1.json', false);
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
                request.open('GET', '/base/responses/unsubscribeContext1.json', false);
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
            request.open('GET', '/base/responses/contextTypes.json', false);
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
            request.open('GET', '/base/responses/contextTypes_empty.json', false);
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
            request.open('GET', '/base/responses/contextTypes3.json', false);
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

        describe('getTypeInfo(type, options)', function () {

            it("basic get type info requests", function (done) {
                var request = new XMLHttpRequest();
                request.open('GET', '/base/responses/contextTypes2.json', false);
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

            var check_get_type_info_error = function check_get_type_info_error(label, code, response_file, error_class, error_details) {
                it(label, function (done) {
                    var request, response_info;

                    response_info = {status: code};
                    if (response_file) {
                        request = new XMLHttpRequest();
                        request.open('GET', '/base/responses/' + response_file, false);
                        request.send();
                        response_info.responseText = request.responseText;
                    }
                    ajaxMockup.addStaticURL("http://ngsi.server.com/v1/contextTypes/Agrarium", response_info);

                    connection.getTypeInfo(
                        "Agrarium",
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
                        expect(failure != null && failure instanceof error_class).toBeTruthy();
                        if (error_details) {
                            expect(failure.details).toEqual(error_details);
                        }
                    }, done);
                });
            };

            check_get_type_info_error(
                "handles not found errors",
                200,
                "contextTypes_type_not_found.json",
                NGSI.NotFoundError,
                {
                    "name" : "Agrarium",
                    "statusCode" : {
                        "code" : 404,
                        "reasonPhrase" : "No context element found"
                    }
                }
            );

            check_get_type_info_error("handles connection errors", 0, null, NGSI.ConnectionError);
            check_get_type_info_error("handles connection errors via proxy", 502, null, NGSI.ConnectionError);
            check_get_type_info_error("handles connection timeout via proxy", 504, null, NGSI.ConnectionError);

            check_get_type_info_error("handles invalid error code from server (201)", 201, null, NGSI.InvalidResponseError);
            check_get_type_info_error("handles invalid error code from server (204)", 204, null, NGSI.InvalidResponseError);
            check_get_type_info_error("handles invalid error code from server (402)", 402, null, NGSI.InvalidResponseError);
            check_get_type_info_error("handles invalid error code from server (503)", 503, null, NGSI.InvalidResponseError);

            check_get_type_info_error("handles invalid responses from server (unrelated json)", 200, "invalid_content_array.json", NGSI.InvalidResponseError);
            check_get_type_info_error("handles invalid responses from server (totally invalid content)", 200, "full_invalid_content.json", NGSI.InvalidResponseError);
            check_get_type_info_error("handles invalid responses from server (partial response)", 200, "partial_content.json", NGSI.InvalidResponseError);
            check_get_type_info_error("handles invalid responses from server (missing statusCode)", 200, "missing_statuscode_content.json", NGSI.InvalidResponseError);

            arguments_error_test('getTypeInfo', [], 'missing all arguments');

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

        // deleteAttributes
        check_update_context_method_arg_errors('deleteAttributes', 'toDelete');

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
            request.open('GET', '/base/responses/subscribeContextAvailability1.json', false);
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
            request.open('GET', '/base/responses/subscribeContext1.json', false);
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
        bad_ngsi_proxy_response_test("custom exceptions from requestFunction", 502, NGSI.ConnectionError, new NGSI.ConnectionError('WireCloud proxy is not responding'));

        // createSubscription errors not related with the ngsi-proxy
        bad_create_subscription_response_test("Connection Error", 0, NGSI.ConnectionError);
        bad_create_subscription_response_test("404", 404, NGSI.InvalidResponseError);
        bad_create_subscription_response_test("Connection Error via proxy", 502, NGSI.ConnectionError);
        bad_create_subscription_response_test("Connection timeout via proxy", 504, NGSI.ConnectionError);

    });
})();
