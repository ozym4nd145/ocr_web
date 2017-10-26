#! /bin/bash
. /appenv/bin/activate
cd /home/docker/app
mkdir db
echo $CONFIG > db/users.json
npm start
