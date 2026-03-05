FROM node:20

RUN apt-get update
RUN apt-get install -y git curl

WORKDIR /home/app

# make a .dockerignore file that is important
COPY main.sh main.sh
COPY script.js script.js
COPY package*.json .

RUN npm install

RUN chmod +x main.sh
# RUN chmod +x script.js

ENTRYPOINT [ "/home/app/main.sh" ]