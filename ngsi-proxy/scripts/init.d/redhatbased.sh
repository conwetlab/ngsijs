#!/bin/bash
#
# Service script for a Node.js application running under Forever.
#
# This is suitable for Fedora, Red Hat, CentOS and similar distributions.
# It will not work on Ubuntu or other Debian-style distributions!
#
# There is some perhaps unnecessary complexity going on in the relationship between
# Forever and the server process. See: https://github.com/indexzero/forever
#
# 1) Forever starts its own watchdog process, and keeps its own configuration data
# in /var/run/forever.
#
# 2) If the process dies, Forever will restart it: if it fails but continues to run,
# it won't be restarted.
#
# 3) If the process is stopped via this script, the pidfile is left in place; this
# helps when issues happen with failed stop attempts.
#
# 4) Which means the check for running/not running is complex, and involves parsing
# of the Forever list output.
#
# chkconfig: 2345 80 20
# description: A proxy for NGSI-9/10 servers
# processname: ngsi-proxy
# logfile: /var/log/ngsi-proxy.log
#

. /etc/rc.d/init.d/functions

NAME=ngsi-proxy
APP_DIR=/opt/ngsijs/ngsi-proxy
FOREVER_DIR=/var/run/forever

USER=node
PIDFILE=/var/run/$NAME.pid
LOGFILE=/var/log/$NAME.log

FOREVER=forever
AWK=awk
SED=sed

start() {
    echo -n "Starting $NAME node instance: "

    # Create the log and pid files, making sure that
    # the target use has access to them
    touch $LOGFILE
    chown $USER $LOGFILE

    touch $PIDFILE
    chown $USER $PIDFILE

    # Launch the application
    su $USER -c "$FOREVER start -s -p \"$FOREVER_DIR\" --pidFile \"$PIDFILE\" --sourceDir \"$APP_DIR\"  -l $LOGFILE -a app.js" >&/dev/null
    RETVAL=$?
    echo "."

}

stop() {
    echo -n "Shutting down $NAME node instance: "
    su $USER -c "$FOREVER stop -s -p \"$FOREVER_DIR\" --sourceDir \"$APP_DIR\" app.js" >&/dev/null
    RETVAL=$?
    rm -rf $PIDFILE
    echo "."
}


rh_status() {
    status -p $PIDFILE $NAME
}

rh_status_q() {
    rh_status >/dev/null 2>&1
}

case "$1" in
    restart)
        start
        stop
        ;;
    status)
        rh_status
        RETVAL=$?
        ;;
    start)
        rh_status_q && exit 0
        start
        ;;
    stop)
        stop
        ;;
    *)
        echo "Usage:  {start|stop|restart|status}"
        exit 1
        ;;
esac

exit $RETVAL
