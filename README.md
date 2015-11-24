ngsijs
======

This repository houses the Javascript library used for implementing NGSI
clients. The library has been tested to work against version 0.14.0+ of the
Orion Context Broker.

Using ngsijs from WireCloud widgets/operators
---------------------------------------------

Take a look to the "3.2.1. Using Orion Context Broker" tutorial available at
[FIWARE Academy] and to the [reference documentation].

[FIWARE Academy]: http://edu.fiware.org/course/view.php?id=53#section-3
[reference documentation]: https://wirecloud.readthedocs.org/en/latest/development/ngsi_api/

Using ngsijs from normal web pages
----------------------------------

Altough the documentation provided in the previous section is oriented to
provide documentation on howto use this library from WireCloud widgets and
operators, it can be usefull also for developing web pages using this library.

The main difference is that you don't have to edit a `config.xml` file, instead
you have to add the library as usually in web pages:

```html
    <script type="text/javascript" src="url_to_NGSI.js"></script>
```

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
