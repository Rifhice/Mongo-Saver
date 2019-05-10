cd /var/www/mongo_saver
git pull
docker rm -f mongo_saver
docker image rm -f mongo_saver
docker build -t mongo_saver --label mongo_saver .
docker run --network="main" --name="mongo_saver" mongo_saver
