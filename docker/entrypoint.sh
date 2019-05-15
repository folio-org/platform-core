#!/bin/sh
SERVER_NAME=${1:-localhost}
echo "okapi_url: $SERVER_NAME"
sed -i "s|localhost|$SERVER_NAME|" /etc/nginx/conf.d/default.conf
/usr/sbin/nginx -g 'daemon off;'
