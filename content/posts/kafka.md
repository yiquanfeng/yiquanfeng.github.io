+++
date = '2025-09-16T01:13:28+08:00'
draft = false
title = 'Kafka'
+++
## install
```mac
brew install kafka
kafka-topics --version
```
```docker
docker pull apache/kafka:4.1.0
docker run -d --name kafka -p 9092:9092 apache/kafka:4.1.0
docker exec -it kafka bash
// -d 是在后台运行
// --name是设定容器名称
// -it是交互式运行，bash是运行的程序
cd /opt/kafka
bin/kafka-topics --version
```
输出了版本号就算安装完成

## Simple Use in shell
