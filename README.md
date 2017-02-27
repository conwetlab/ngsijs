ngsijs
======

[![License](https://img.shields.io/badge/license-AGPLv3+%20with%20classpath--like%20exception-blue.svg)](LICENSE)
[![Build Status](https://build.conwet.etsiinf.upm.es/jenkins/job/wirecloud-ngsijs/badge/icon)](https://build.conwet.etsiinf.upm.es/jenkins/job/wirecloud-ngsijs/)
[![Coverage Status](https://coveralls.io/repos/github/conwetlab/ngsijs/badge.svg?branch=master)](https://coveralls.io/github/conwetlab/ngsijs?branch=master)

Ngsijs is the JavaScript library used by
[WireCloud](https://github.com/Wirecloud/wirecloud) for adding FIWARE NGSI
capabilities to widgets and operators. However, this library has also be
designed to be used in other environments as normal web pages and
clients/servers running on Node.js.

This library has been developed following the
[FIWARE NGSI v2 Specification](http://fiware.github.io/specifications/ngsiv2/stable/)
and has been tested to work against version 0.26.0+ of the Orion Context Broker.


Using ngsijs from normal web pages
----------------------------------

Just include a `<script>` element linking to the `NGSI.min.js` file:

```html
    <script type="text/javascript" src="url_to_NGSI.js"></script>
```

Once added the `<script>` element, you will be able to use all the features
provided by the ngsijs library except receiving notifications. To be able to
receive notifications inside a web browser the library requires the use of a
ngsi-proxy server.


Using ngsijs from Node.js
-------------------------

```bash
  npm install ngsijs
```

After installing the ngsijs node module, you will be able to use the API as usual:

```js
  var NGSI = require('ngsijs');
  var connection = new NGSI.Connection("http://orion.example.com:1026");
```

**Note:** Node.js doesn't require the usage of a ngsi-proxy as you can create
an HTTP endpoint easily (e.g. using express).


Running ngsi-proxy
------------------

Run the following command from the ngsi-proxy directory for installing any
missing dependency:

```bash
  $ npm install
```

Once all dependencies are available, you will be able to run ngsi-proxy from
the command line:

``` bash
  $ npm run start
```

You will find some init script templates in the script folder inside the
ngsi-proxy folder. Those scripts depend on the forever command line tool:

``` bash
  $ [sudo] npm install forever -g
```

ngsi-proxy will listen on port 3000 by default.


Using ngsijs from WireCloud widgets/operators
---------------------------------------------

Take a look to the "3.2.1. Using Orion Context Broker" tutorial available at
[FIWARE Academy].

[FIWARE Academy]: http://edu.fiware.org/course/view.php?id=53#section-3

