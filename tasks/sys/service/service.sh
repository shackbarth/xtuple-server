#!/bin/bash 
# Description: xTuple Service Manager
# processname: xtuple
#
### BEGIN INIT INFO
# Provides:          xtupled
# Required-Start: $local_fs $remote_fs
# Required-Stop: $local_fs $remote_fs
# Should-Start: $network
# Should-Stop: $network
# Default-Start:        2 3 4 5
# Default-Stop:         0 1 6
# Short-Description: xTuple service
# Description: xTuple Mobile Web Service Manager
### END INIT INFO

help() {
  echo -e 'xTuple Service Manager'
  echo -e ''

  if [[ $(id -u) -eq 0 ]]; then
    echo -e 'Usage: service xtuple {stop|restart|reload|status|help}'
    echo -e '       service xtuple [name] [version]-[type] {stop|restart|reload|status|help}'
    echo -e ''
    echo -e 'Examples:'
    echo -e '   Restart all instances:        service xtuple restart'
    echo -e '   Restart a single instance:    service xtuple 4.5.0-pilot acme restart'
    echo -e '   Display status:               service xtuple status'
    echo -e ''
  else
    echo -e 'Usage: service xtuple <name> [version]-[type] {stop|restart|status|help}'
    echo -e '   <name>    is the name of the account (--xt-name)'
    echo -e '   [version] is the xTuple version of the instance (--xt-version)'
    echo -e '   [type]    is probably either "pilot" or "live"'
    echo -e ''
    echo -e 'xTuple Log Path: /var/log/xtuple/'
    echo -e 'xTuple Config Path: /etc/xtuple/'
    echo -e 'Postgres Log Path: /var/log/postgresql/'
    echo -e ''
  fi
  echo -e 'Having trouble? Email us: <dev@xtuple.com>'
  
  exit $RETVAL
}

#trap help ERR SIGINT SIGTERM

export PATH=$PATH:/usr/bin:/usr/local/bin

ACCOUNT="$1"
VERSION="$2"
ACTION="$3"

if [[ -z $ACTION ]]; then
  ACTION="$2"
  VERSION=
fi
if [[ -z $ACTION ]]; then
  ACTION="$1"
  ACCOUNT=
fi

PG_VERSION=$(psql -V | grep [[:digit:]].[[:digit:]] --only-matching)

xtupled() {
  eval /usr/local/bin/xtupled "$@"
}

start() {
  echo -e "Initializing xTuple services..."

  if [[ $(id -u) -eq 0 && -z $ACCOUNT ]]; then
    service nginx start &> /dev/null
    service postgresql start &> /dev/null
  fi
  xtupled "$@"
  echo -e "Done."
}

stop() {
  echo -e "Stopping xTuple services... "

  if [[ -n "$VERSION" && -n "$ACCOUNT" ]]; then
    pg_ctlcluster $PG_VERSION $ACCOUNT-$VERSION stop -m fast &> /dev/null
  fi
  xtupled "$@"
  echo -e "Done."
}

restart() {
  echo -e "Restarting xTuple services..."

  if [[ -z $ACCOUNT ]]; then
    service postgresql restart &> /dev/null
    service nginx restart &> /dev/null
  elif [[ -n "$VERSION" ]]; then
    pg_ctlcluster $PG_VERSION $ACCOUNT-$VERSION restart -m fast &> /dev/null
  fi
  xtupled "$@"

  echo -e "Done."
}

reload() {
  restart "$@"
}

status() {
  xtupled "$@"
}

case "$ACTION" in
  start)
      start
      ;;
  stop)
      stop
      ;;
  restart|force-reload)
      restart
      ;;
  reload)
      reload
      ;;
  status)
      status
      ;;
  *)
      help
      ;;
esac
