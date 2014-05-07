service xtuple $xtVersion $xtName restart > /dev/null && pg_ctlcluster $pgVersion $xtName restart -m fast && echo '\nDone.\n' && pg_lsclusters
Restart xTuple Server
root 0 1 0 1 1 30 0 text/plain
xtVersion:0:{xt.version}:0,1:xTuple Version
xtName:1::0,1:xTuple User Account Name
pgVersion:0:{pg.version}:0,1:Postgres Server Version
