FROM node:20

RUN apt-get update
RUN apt-get install -y git curl unzip

RUN apt-get update && apt-get install -y docker.io

# Get railpacks installed
RUN curl -sSL https://railpack.com/install.sh | sh

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"\
&& unzip awscliv2.zip \
&& ./aws/install

# I dont care about the version rn so just hardcode it.
ENV BUILDKIT_VERSION=v0.20.2

RUN curl -L https://github.com/moby/buildkit/releases/download/${BUILDKIT_VERSION}/buildkit-${BUILDKIT_VERSION}.linux-amd64.tar.gz \
    | tar -xz --strip-components=1 -C /usr/local/bin bin/buildctl

WORKDIR /home/app

COPY main.sh main.sh
COPY script.js script.js
COPY package*.json .

RUN npm install

RUN chmod +x main.sh

ENTRYPOINT ["/home/app/main.sh"]