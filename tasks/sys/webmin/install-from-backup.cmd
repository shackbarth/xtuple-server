echo "<pre style='color: #ccc; background-color: black'>" && xtuple-server install-$instanceType --xt-name $xtName --xt-version $xtVersion --xt-edition $xtEdition --xt-ghuser $xtGhuser --xt-ghpass $xtGhpass --xt-maindb $xtMaindb --xt-authkey $xtAuthkey --xt-adminpw $xtAdminpw --nginx-domain $nginxDomain --nginx-inkey $nginxInkey --nginx-incrt $nginxIncrt --pg-slots $pgSlots --pg-capacity $pgCapacity $pgEnableSnapshots $pgWorldLogin --pg-snapschedule $pgSnapSchedule --pg-snapcount $pgSnapCount --pg-version $pgVersion 2>&1 | ansi2html && echo "</pre>"
New xTuple Instance from Postgres Backup
root 1 1 0 0 1 3600 0 -
xtName:0::1,1:Account Name
xtVersion:0:4.5.0:1,1:xTuple App Version
instanceType:9:/etc/webmin/xtuple/types.menu:0,1:Instance Type
xtEdition:9:/etc/webmin/xtuple/editions.menu:1,1:xTuple Edition
xtGhuser:0::1,0:Github Account Username
xtGhpass:8::1,0:Github Account Password
xtMaindb:5::1,1:xTuple Database File
xtAdminpw:8::1,0:xTuple "admin" Password
xtAuthkey:0:xTuple:1,0:Enhanced Auth Key
nginxDomain:0:localhost:1,0:Domain Name
nginxInkey:5::1,0:SSL key (.key)
nginxIncrt:5::1,0:SSL certificate (.crt or .pem)
pgVersion:9:/etc/webmin/xtuple/pgversions.menu:1,1:Postgres Server Version
pgCapacity:0:32:1,1:Capacity (slots)
pgSlots:0:1:1,1:Provision (slots)
pgWorldLogin:7:--pg-worldlogin:0,0:Allow Postgres Login from Anywhere
pgEnableSnapshots:7:--pg-snapenable:0,0:Enable Snapshot Manager?
pgSnapSchedule:0:@daily:1,1:Snapshot Schedule
pgSnapCount:0:7:1,1:Snapshots to Retain
