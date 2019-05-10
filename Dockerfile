FROM node:latest
RUN apt-get update -y && apt-get install -y mongodb
RUN mkdir -p /usr/src/app/linkedin/services/mongo-saver
WORKDIR /usr/src/app/linkedin/services/mongo-saver
COPY ./package.json /usr/src/app/linkedin/services/mongo-saver
RUN npm install
COPY . /usr/src/app/linkedin/services/mongo-saver
CMD [ "npm", "start" ]