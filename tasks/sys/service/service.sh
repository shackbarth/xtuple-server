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

  if [[ $EUID -eq 0 ]]; then
    echo -e 'Usage: service xtuple {stop|restart|reload|status|help}'
    echo -e '       service xtuple <version> <name> {stop|restart|reload|status|help}'
    echo -e ''
    echo -e 'Examples:'
    echo -e '   Restart all instances:        service xtuple restart'
    echo -e '   Restart a single instance:    service xtuple 4.5.0-pilot acme restart'
    echo -e '   Display status:               service xtuple status'
    echo -e ''
  else
    echo -e 'Usage: service xtuple <version>-<type> <name> {stop|restart|status|help}'
    echo -e '   <version> is the xTuple version of the instance'
    echo -e '   <type>    is either "pilot" or "live"'
    echo -e '   <name>    is the name of the account (--xt-name)'
    echo -e ''
    echo -e 'xTuple Log Path: /var/log/xtuple/<version>/<name>'
    echo -e 'xTuple Config Path: /etc/xtuple/<version>/<name>'
    echo -e 'Postgres Log Path: /var/log/postgresql/'
    echo -e ''
  fi
  echo -e 'Having trouble? Email us: <dev@xtuple.com>'
  
  exit $RETVAL
}

trap help ERR SIGINT SIGTERM

export PATH=$PATH:/usr/bin:/usr/local/bin

VERSION="$1"
ACCOUNT="$2"
ACTION="$3"

# non-root users must specify account and VERSION
if [[ $EUID -ne 0 && -z $ACCOUNT ]]; then
  help
fi

# if root does not specify account, then the first argument is the ACTION
# e.g. sudo service xtuple status, ACTION = status
if [[ -z $ACCOUNT ]]; then
  VERSION=
  ACTION="$1"
  HOME="/usr/local/xtuple"
else
  HOME=$(getent passwd "$ACCOUNT" | cut -d: -f6)
  if [[ -z $HOME ]]; then
    # looks like user doesn't exist, or at least has no homedir
    echo "User $ACCOUNT not found"
    exit 2
  fi
fi

if [[ -z $ACCOUNT && ! -z $VERSION ]]; then
  help
fi

PG_VERSION=$(psql -V | grep [[:digit:]].[[:digit:]] --only-matching)

xtupled() {
  eval /usr/local/bin/xtupled "$@"
}

start() {
  echo -e "Initializing xTuple services..."

  if [[ $EUID -eq 0 && -z $ACCOUNT ]]; then
    service nginx start &> /dev/null
    service postgresql start &> /dev/null
    xtupled startall
  fi
  echo -e "Done."
}

stop() {
  echo -e "Stopping xTuple services... "

  if [[ -z $ACCOUNT ]]; then
    xtupled stopall
    service postgresql stop &> /dev/null
  else
    xtupled stop $ACCOUNT $VERSION
    pg_ctlcluster $PG_VERSION $ACCOUNT-$VERSION stop -m fast &> /dev/null
  fi
  echo -e "Done."
}

restart() {
  echo -e "Restarting xTuple services..."

  if [[ -z $ACCOUNT ]]; then
    service postgresql restart &> /dev/null
    service nginx restart &> /dev/null
    xtupled restartall
  else
    pg_ctlcluster $PG_VERSION $ACCOUNT-$VERSION restart -m fast &> /dev/null
    xtupled restart $ACCOUNT $VERSION
  fi

  echo -e "Done."
}

reload() {
  echo -e "Reloading xTuple services..."

  if [[ -z $ACCOUNT ]]; then
    service postgresql reload &> /dev/null
    service nginx reload &> /dev/null
    xtupled restartall
  else
    pg_ctlcluster $PG_VERSION $ACCOUNT-$VERSION reload &> /dev/null
    xtupled restart $ACCOUNT $VERSION
  fi

  echo -e "Done."
}

status() {
  if [[ -z $ACCOUNT ]]; then
    xtupled status $ACCOUNT
  else 
    xtupled status
  fi
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
