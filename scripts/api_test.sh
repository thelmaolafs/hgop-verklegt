#!/bin/bash

cd /var/lib/jenkins/terraform/hgop/apitest
API_URL=http://$(terraform output public_ip):3000
echo $API_URL
cd -
echo $API_URL
API_URL=$API_URL npm run test:api