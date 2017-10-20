ngsijs
======

[![License](https://img.shields.io/badge/license-AGPLv3+%20with%20classpath--like%20exception-blue.svg)](LICENSE)
[![Documentation Status](https://img.shields.io/badge/docs-stable-brightgreen.svg?style=flat)](https://conwetlab.github.io/ngsijs/stable)
[![Build Status](https://build.conwet.etsiinf.upm.es/jenkins/job/wirecloud-ngsijs/badge/icon)](https://build.conwet.etsiinf.upm.es/jenkins/job/wirecloud-ngsijs/)
[![Coverage Status](https://coveralls.io/repos/github/conwetlab/ngsijs/badge.svg?branch=master)](https://coveralls.io/github/conwetlab/ngsijs?branch=master)

Ngsijs is the JavaScript library used by
[WireCloud](https://github.com/Wirecloud/wirecloud) for adding FIWARE NGSI
capabilities to widgets and operators. However, this library has also been
designed to be used in other environments as normal web pages and
clients/servers running on Node.js.

This library has been developed following the FIWARE
[NGSI v1](http://telefonicaid.github.io/fiware-orion/api/v1/) and
[NGSI v2](http://fiware.github.io/specifications/ngsiv2/stable/) specifications
and has been tested to work against version 0.26.0+ of the Orion Context Broker.

Reference documentation of the API is available at
[http://conwetlab.github.io/ngsijs/stable/NGSI.html](http://conwetlab.github.io/ngsijs/stable/NGSI.html).


Using ngsijs from normal web pages
----------------------------------

Just include a `<script>` element linking to the `NGSI.min.js` file:

```html
<script type="text/javascript" src="url_to_NGSI.js"></script>
```

Once added the `<script>` element, you will be able to use all the features
provided by the ngsijs library (except receiving notifications):

```javascript
var connection = new NGSI.Connection("http://orion.example.com:1026");
connection.v2.listEntities().then((result) => {
    response.results.forEach((entity) => {
        console.log(entity.id);
    });
});
```

This example will display the `id` of the first 20 entities. See the
documentation of the [`listEntities`](http://conwetlab.github.io/ngsijs/stable/NGSI.Connection.html#.%22v2.listEntities%22__anchor)
method for more info.

To be able to receive notifications inside a web browser the library requires
the use of a [ngsi-proxy](https://github.com/conwetlab/ngsi-proxy) server. You
can use your own instance or you the `ngsi-proxy` available at
`https://ngsiproxy.lab.fiware.org`.

```javascript
var connection = new NGSI.Connection("http://orion.example.com:1026", {
    ngsi_proxy_url: "https://ngsiproxy.lab.fiware.org"
});
```

Using ngsijs from Node.js
-------------------------

```bash
$ npm install ngsijs
```

After installing the ngsijs node module, you will be able to use the API as usual:

```javascript
var NGSI = require('ngsijs');
var connection = new NGSI.Connection("http://orion.example.com:1026");
```

**Note:** Node.js doesn't require the usage of a ngsi-proxy as you can create
an HTTP endpoint easily (e.g. using express). Anyway, you can use it if you
want, you only have to take into account that is better to directly provide the
HTTP endpoint to reduce the overhead.


Using ngsijs from WireCloud widgets/operators
---------------------------------------------

Take a look to the "3.2.1. Using Orion Context Broker" tutorial available at
[FIWARE Academy].

[FIWARE Academy]: http://edu.fiware.org/course/view.php?id=53#section-3

