echo "<pre style='color: #ccc; background-color: black'>" && xtuple-server uninstall-$instanceType --xt-version $xtVersion --xt-name $xtName | ansi2html && echo "</pre>"
Destroy xTuple Instance (xtuple-server uninstall)
root 1 1 0 0 1 3600 0 -
xtName:0::1,1:xTuple User Account Name
xtVersion:0:4.5.0:1,1:xTuple Version
instanceType:9:/etc/webmin/xtuple/types.menu:0,1:Instance Type
