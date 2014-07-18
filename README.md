ngsijs
======

This repository houses the Javascript library used for implementing NGSI
clients. The library has been tested to work against version 0.14.0 of the
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

Run the following command from the ngsi-proxy directory for installing any
missing dependency:

``` bash
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

Using ngsijs from Node.js
-------------------------

``` bash
  npm install ngsijs
```

After installing the ngsijs node module, you will be able to use the API as usual:

``` js
  var NGSI = require('ngsijs');
```

**Note:** Node.js doesn't require the usage of a ngsi-proxy as you can create
an HTTP endpoint easily (e.g. using express).
