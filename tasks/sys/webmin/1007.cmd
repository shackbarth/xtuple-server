xtuple-server install --xt-name $xtName --xt-version $xtVersion --xt-edition $xtEdition $xtDemo $xtQuickstart --xt-maindb $xtMaindb $xtPilot --xt-adminpw $xtAdminpw --nginx-domain $nginxDomain --nginx-inkey $nginxInkey --nginx-incrt $nginxIncrt --nginx-inzip $nginxInzip --pg-slots $pgSlots --pg-capacity $pgCapacity $pgEnableSnapshots
New xTuple Deployment (xtuple-server install)
root 0 0 0 1 1 3600 0 text/plain
xtName:0::0,1:Account Name
xtVersion:0:4.4.1:0,1:xTuple App Version
xtEdition:9:/etc/webmin/xtuple/editions.menu:0,1:xTuple Edition
xtDemo:7:--xt-demo:0,0:Install Demo?
xtQuickstart:7:--xt-quickstart:0,0:Install Quickstart?
xtMaindb:5::0,0:xTuple Main Database File
xtPilot:7:--xt-pilot:0,0:Also create a pilot?
xtAdminpw:8::0,0:xTuple "admin" Password
nginxDomain:0:canary.xtuplecloud.com:0,0:Domain Name
nginxInkey:5::0,0:SSL key (.key)
nginxIncrt:5::0,0:SSL certificate (.crt or .pem)
nginxInzip:5::0,0:SSL Bundle (.zip)
pgCapacity:0:32:0,0:Capacity (slots)
pgSlots:0:1:0,0:Provision
pgEnableSnapshots:7:--pg-enablesnap:0,0:Enable Snapshot Manager?
install:16:Install Now!:0,1:Ready?
