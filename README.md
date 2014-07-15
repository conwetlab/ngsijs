ngsijs
======

This repository houses the Javascript library used for implementing NGSI
clients. The library has been tested to work against version 0.6.0 of the
Orion Context Broker.

Using ngsijs from browsers
--------------------------

    <script type="text/javascript" src="url_to_NGSI.js"></script>

Using ngsijs from WireCloud widgets/operators
---------------------------------------------

Take a look to the [Using Oriong Context Broker tutorial](http://conwet.fi.upm.es/docs/display/wirecloud/Using+Orion+Context+Broker)
available on the WireCloud tutorials page.

Running ngsi-proxy
------------------

    npm install
    npm run start

Using ngsijs from Node.js
-------------------------

    npm install ngsijs

After installing the ngsijs node module, you will be able to use the API as usual:

    var NGSI = require('ngsijs');

**Note:** Node.js doesn't require the usage of a ngsi-proxy as you can create
an HTTP endpoint easily (e.g. using express).
