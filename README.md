# How to run this

This repo is for troubleshooting purposes only.

### clone repository

```sh
git clone https://github.com/rstoye/opencv-troubleshoot-2.git
cd opencv-troubleshoot-2
```

### build the docker image

```sh
docker build -t cvtest .
```

### start a docker container

```sh
docker run --name cv -d -it cvtest:latest
```

### look at the logs

```sh
docker logs cv
```
