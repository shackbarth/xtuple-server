#!/bin/bash 
# Description: xTuple Process Manager
# processname: xtupled
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
# Description: xTuple Process Manager
### END INIT INFO

help() {
  echo -e 'xTuple Service Manager'
  echo -e ''

  if [[ $(id -u) -eq 0 ]]; then
    echo -e 'Usage: service xtuple {stop|restart|reload|status|help}'
    echo -e '       service xtuple {stop|restart|reload|status|help} [name] [version] [type]'
    echo -e '   [name]    is the name of the account (--xt-name)'
    echo -e '   [version] is the xTuple version of the instance (--xt-version)'
    echo -e '   [type]    is probably either "pilot" or "live"'
    echo -e ''
    echo -e 'Examples:'
    echo -e '   Restart all instances:        service xtuple restart'
    echo -e '   Restart a single instance:    service xtuple restart myapp 4.5.0 pilot'
    echo -e '   Display status:               service xtuple status'
    echo -e ''
  else
    echo -e 'Usage: service xtuple {stop|restart|status|help} <name> [version] [type]'
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

trap help ERR SIGINT SIGTERM

export PATH=$PATH:/usr/bin:/usr/local/bin

ARGV=$@
ACTION="$1"

if [[ -z $ACTION ]]; then
  help
fi

echo -e "$(xtupled $ARGV)"
