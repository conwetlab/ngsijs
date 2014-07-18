ngsi-proxy
----------

Run the following command for installing any missing dependency:

``` bash
  $ npm install
```

Once all dependencies are available, you will be able to run ngsi-proxy from
the command line:

``` bash
  $ npm run start
```

You will find some init script templates in the script folder. Those scripts
depend on the forever command line tool:

``` bash
  $ [sudo] npm install forever -g
```

ngsi-proxy will listen on port 3000 by default.
