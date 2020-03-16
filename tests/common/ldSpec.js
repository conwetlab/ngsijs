/*
 *     Copyright (c) 2020 Future Internet Consulting and Development Solutions S.L.
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

/* globals ajaxMockFactory, NGSI */

if ((typeof require === 'function') && typeof global != null) {
    // eslint-disable-next-line no-undef
    NGSI = require('../../ngsi-node');
    // eslint-disable-next-line no-undef
    URL = require('whatwg-url').URL;
}

(function () {

    "use strict";

    describe("Connecton.ld", () => {

        var connection;
        var ajaxMockup = ajaxMockFactory.createFunction();

        beforeEach(() => {
            const options = {
                requestFunction: ajaxMockup
            };
            connection = new NGSI.Connection('http://ngsi.server.com', options);
            ajaxMockup.clear();
        });

        describe('getEntity(options)', () => {

            const LD_JSON_ENTITY = {
                "@context": "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
                "id": "urn:ngsi-ld:Road:Spain-Road-A62",
                "type": "https://uri.fiware.org/ns/data-models#Road",
                "https://schema.org/alternateName": {
                    "type": "Property",
                    "value": "E-80"
                },
                "description": {
                    "type": "Property",
                    "value": "Autovía de Castilla"
                },
                "name": {
                    "type": "Property",
                    "value": "A-62"
                },
                "https://uri.fiware.org/ns/data-models#length": {
                    "type": "Property",
                    "value": 355
                },
                "https://uri.fiware.org/ns/data-models#refRoadSegment": {
                    "type": "Relationship",
                    "object": [
                        "urn:ngsi-ld:RoadSegment:Spain-RoadSegment-A62-0-355-forwards",
                        "urn:ngsi-ld:RoadSegment:Spain-RoadSegment-A62-0-355-backwards"
                    ]
                },
                "https://uri.fiware.org/ns/data-models#responsible": {
                    "type": "Property",
                    "value": "Ministerio de Fomento - Gobierno de España"
                },
                "https://uri.fiware.org/ns/data-models#roadClass": {
                    "type": "Property",
                    "value": "https://uri.fiware.org/ns/data-models#motorway"
                }
            };

            const KEY_VALUES_ENTITY = {
                "@context": "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
                "id": "urn:ngsi-ld:Road:Spain-Road-A62",
                "type": "https://uri.fiware.org/ns/data-models#Road",
                "https://schema.org/alternateName": "E-80",
                "description": "Autovía de Castilla",
                "name": "A-62",
                "https://uri.fiware.org/ns/data-models#length": 355,
                "https://uri.fiware.org/ns/data-models#refRoadSegment": [
                    "urn:ngsi-ld:RoadSegment:Spain-RoadSegment-A62-0-355-forwards",
                    "urn:ngsi-ld:RoadSegment:Spain-RoadSegment-A62-0-355-backwards"
                ],
                "https://uri.fiware.org/ns/data-models#responsible": "Ministerio de Fomento - Gobierno de España",
                "https://uri.fiware.org/ns/data-models#roadClass": "https://uri.fiware.org/ns/data-models#motorway"
            };

            it("throws a TypeError exception when not passing the options parameter", () => {
                expect(() => {
                    connection.ld.getEntity();
                }).toThrowError(TypeError);
            });

            it("throws a TypeError exception when not passing the id option", function () {
                expect(() => {
                    connection.ld.getEntity({});
                }).toThrowError(TypeError);
            });

            it("basic get request", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities/urn%3Angsi-ld%3ARoad%3ASpain-Road-A62", {
                    headers: {
                        'Content-Type': 'application/ld+json',
                    },
                    method: 'GET',
                    status: 200,
                    responseText: JSON.stringify(LD_JSON_ENTITY),
                    checkRequestContent: (url, options) => {
                        expect("options" in options.parameters).toBeFalsy();
                    }
                });

                connection.ld.getEntity("urn:ngsi-ld:Road:Spain-Road-A62").then((result) => {
                    expect(result).toEqual({
                        entity: LD_JSON_ENTITY,
                        format: "application/ld+json"
                    });
                }, (e) => {
                    fail("Failure callback called");
                }).finally(done);
            });

            it("basic get request using the keyValues option", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities/urn%3Angsi-ld%3ARoad%3ASpain-Road-A62", {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    method: 'GET',
                    status: 200,
                    responseText: JSON.stringify(KEY_VALUES_ENTITY),
                    checkRequestContent: (url, options) => {
                        expect(options.parameters.options).toBe("keyValues");
                    }
                });

                connection.ld.getEntity({id: "urn:ngsi-ld:Road:Spain-Road-A62", keyValues: true}).then(function (result) {
                    expect(result).toEqual({
                        entity: KEY_VALUES_ENTITY,
                        format: "application/json"
                    });
                }, (e) => {
                    fail("Failure callback called");
                }).finally(done);
            });

            it("get request using the @context option", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities/urn%3Angsi-ld%3ARoad%3ASpain-Road-A62", {
                    headers: {
                        'Content-Type': 'application/ld+json',
                    },
                    method: 'GET',
                    status: 200,
                    responseText: JSON.stringify(LD_JSON_ENTITY),
                    checkRequestContent: (url, options) => {
                        expect(options.requestHeaders.Link).toBe('<https://json-ld.org/contexts/person.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"');
                    }
                });

                connection.ld.getEntity({
                    id: "urn:ngsi-ld:Road:Spain-Road-A62",
                    "@context": "https://json-ld.org/contexts/person.jsonld"
                }).then(function (result) {
                    expect(result).toEqual({
                        entity: LD_JSON_ENTITY,
                        format: "application/ld+json"
                    });
                }, (e) => {
                    fail("Failure callback called");
                }).finally(done);
            });

            it("handles unexpected error codes", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities/urn%3Angsi-ld%3ARoad%3ASpain-Road-A62", {
                    method: "GET",
                    status: 201
                });

                connection.ld.getEntity("urn:ngsi-ld:Road:Spain-Road-A62").then((result) => {
                    fail("Success callback called");
                }, (e) => {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                }).finally(done);
            });

            it("handles responses with invalid payloads", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities/urn%3Angsi-ld%3ARoad%3ASpain-Road-A62", {
                    method: "GET",
                    status: 200,
                    responseText: "invalid json content"
                });

                connection.ld.getEntity("urn:ngsi-ld:Road:Spain-Road-A62").then((result) => {
                    fail("Success callback called");
                }, (e) => {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                }).finally(done);
            });

            it("entity not found", function (done) {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities/urn%3Angsi-ld%3ARoad%3ASpain-Road-A62", {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    method: "GET",
                    status: 404,
                    responseText: '{"type": "https://uri.etsi.org/ngsi-ld/errors/ResourceNotFound", "title": "No context element found", "detail": "no detail"}'
                });

                connection.ld.getEntity("urn:ngsi-ld:Road:Spain-Road-A62").then((result) => {
                    fail("Success callback called");
                }, (e) => {
                    expect(e).toEqual(jasmine.any(NGSI.NotFoundError));
                    expect(e.message).toBe("No context element found");
                    expect(e.details).toBe("no detail");
                }).finally(done);
            });

            it("invalid 404", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities/urn%3Angsi-ld%3ARoad%3ASpain-Road-A62", {
                    method: "GET",
                    status: 404
                });

                connection.ld.getEntity("urn:ngsi-ld:Road:Spain-Road-A62").then((result) => {
                    fail("Success callback called");
                }, (e) => {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                }).finally(done);
            });

            it("invalid 409", (done) => {
                ajaxMockup.addStaticURL("http://ngsi.server.com/ngsi-ld/v1/entities/urn%3Angsi-ld%3ARoad%3ASpain-Road-A62", {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    method: "GET",
                    status: 409,
                    responseText: '{"error":"TooManyResults","description":"More than one matching entity. Please refine your query"}'
                });

                connection.ld.getEntity("urn:ngsi-ld:Road:Spain-Road-A62").then((result) => {
                    fail("Success callback called");
                }, (e) => {
                    expect(e).toEqual(jasmine.any(NGSI.InvalidResponseError));
                }).finally(done);
            });

        });

    });

})();
