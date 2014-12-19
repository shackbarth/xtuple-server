#! /bin/sh
### BEGIN INIT INFO
# Provides:          Xvfb
# Required-Start:    $remote_fs $syslog
# Required-Stop:     $remote_fs $syslog
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: run Xvfb for use by OpenRPT
# Description:       Control the Xvfb X11 server so xTuple's OpenRPT can
#                    render reports when called by the xTuple ERP web client.
### END INIT INFO

# Author: Gil Moskowitz <gmoskowitz@xtuple.com>

# Do NOT "set -e"

PATH=/sbin:/usr/sbin:/bin:/usr/bin
DESC="Xvfb for use by OpenRPT"
NAME=Xvfb
DAEMON=/usr/bin/$NAME
DAEMON_ARGS=""
SCRIPTNAME=/etc/init.d/$NAME
PIDFILE=/var/run/$NAME.pid

# Exit if the package is not installed
[ -x "$DAEMON" ] || exit 0

# Read configuration variable file if it is present
[ -r /etc/default/$NAME ] && . /etc/default/$NAME

# Load the VERBOSE setting and other rcS variables
. /lib/init/vars.sh

# Define LSB log_* functions.
# Depend on lsb-base (>= 3.2-14) to ensure that this file is present
# and status_of_proc is working.
. /lib/lsb/init-functions

do_start()
{
  # Return
  #   0 if daemon has been started
  #   1 if daemon was already running
  #   2 if daemon could not be started
  start-stop-daemon --start --pidfile $PIDFILE --quiet --test \
                    --exec $DAEMON > /dev/null  || return 1
  start-stop-daemon --start --pidfile $PIDFILE --make-pidfile --background \
                    --exec $DAEMON $DAEMON_ARGS || return 2
}

do_stop()
{
  # Return
  #   0 if daemon has been stopped
  #   1 if daemon was already stopped
  #   2 if daemon could not be stopped
  #   other if a failure occurred
  start-stop-daemon --stop --pidfile $PIDFILE --quiet --name $NAME \
                    --retry=TERM/30/KILL/5
  RETVAL="$?"
  [ "$RETVAL" = 2 ] && return 2
  # Wait for children to finish too if this is a daemon that forks
  # and if the daemon is only ever run from this initscript.
  # If the above conditions are not satisfied then add some other code
  # that waits for the process to drop all resources that could be
  # needed by services started subsequently.  A last resort is to
  # sleep for some time.
  start-stop-daemon --stop --quiet --oknodo --retry=0/30/KILL/5 --exec $DAEMON
  [ "$?" = 2 ] && return 2
  # Many daemons don't delete their pidfiles when they exit.
  rm -f $PIDFILE
  return "$RETVAL"
}

do_reload() {
  start-stop-daemon --stop --signal 1 --quiet --pidfile $PIDFILE --name $NAME
  return 0
}

CMD="$1"
shift
if [ $# -gt 0 ] ; then
  DAEMON_ARGS="$*"
fi

case "$CMD" in
  start)
	[ "$VERBOSE" != no ] && log_daemon_msg "Starting $DESC" "$NAME"
	do_start
	case "$?" in
		0|1) [ "$VERBOSE" != no ] && log_end_msg 0 ;;
		2) [ "$VERBOSE" != no ] && log_end_msg 1 ;;
	esac
	;;
  stop)
	[ "$VERBOSE" != no ] && log_daemon_msg "Stopping $DESC" "$NAME"
	do_stop
	case "$?" in
		0|1) [ "$VERBOSE" != no ] && log_end_msg 0 ;;
		2) [ "$VERBOSE" != no ] && log_end_msg 1 ;;
	esac
	;;
  status)
	status_of_proc "$DAEMON" "$NAME" && exit 0 || exit $?
	;;
  reload|force-reload)
	log_daemon_msg "Reloading $DESC" "$NAME"
	do_reload
	log_end_msg $?
	;;
  restart)
	log_daemon_msg "Restarting $DESC" "$NAME"
	do_stop
	case "$?" in
	  0|1)
		do_start
		case "$?" in
			0) log_end_msg 0 ;;
			1) log_end_msg 1 ;; # Old process is still running
			*) log_end_msg 1 ;; # Failed to start
		esac
		;;
	  *)
		# Failed to stop
		log_end_msg 1
		;;
	esac
	;;
  *)
	echo "Usage: $SCRIPTNAME {start|stop|status|restart|reload|force-reload}" >&2
	exit 3
	;;
esac

:
