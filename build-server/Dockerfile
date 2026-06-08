FROM node:20

RUN apt-get update
RUN apt-get install -y git curl

WORKDIR /home/app

COPY package*.json .
COPY tsconfig.json .

RUN npm install

# make a .dockerignore file that is important
COPY main.sh main.sh
COPY src ./src

RUN npm run build

# we gotta do chmod as without it the main.sh will not be executed as it will not have the permission
RUN chmod +x main.sh

ENTRYPOINT [ "/home/app/main.sh" ]