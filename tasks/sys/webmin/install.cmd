xtuple-server install-$instanceType --xt-name $xtName --xt-version $xtVersion --xt-edition $xtEdition $xtDatabases --xt-maindb $xtMaindb --xt-adminpw $xtAdminpw --nginx-domain $nginxDomain --nginx-inkey $nginxInkey --nginx-incrt $nginxIncrt --pg-slots $pgSlots --pg-capacity $pgCapacity $pgEnableSnapshots
New xTuple Deployment (xtuple-server install)
root 0 0 0 0 1 3600 0 -
xtName:0::1,1:Account Name
xtVersion:0:4.5.0:1,1:xTuple App Version
instanceType:9:/etc/webmin/xtuple/types.menu:1,1:Instance Type
xtEdition:9:/etc/webmin/xtuple/editions.menu:1,1:xTuple Edition
xtDatabases:12:/etc/webmin/xtuple/databases.menu:0,1:Initialize Databases
xtMaindb:5::1,0:xTuple Main Database File
xtAdminpw:8::1,0:xTuple "admin" Password
nginxDomain:0::1,0:Domain Name
nginxInkey:5::1,0:SSL key (.key)
nginxIncrt:5::1,0:SSL certificate (.crt or .pem)
pgCapacity:0:48:1,0:Capacity (slots)
pgSlots:0:1:1,0:Provision
pgEnableSnapshots:7:--pg-snapenable:0,0:Enable Snapshot Manager?
