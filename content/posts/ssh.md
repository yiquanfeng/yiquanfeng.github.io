+++
date = '2025-08-06T10:54:57+08:00'
draft = false
title = 'Ssh'
+++
# a protocol to connect to remote server
the most popular protocol to connect
## the difference of ssh and sshd

## ssh config file

## ssh public key verification
you can user this command to generate public key file
```
ssh-keygen -t rsa  -C "xxx@mail.com"
```
then following the guide to create your key config  
you key file will be ~/.ssh/  
then you can excute this command to pass your key file to the server  
```
ssh-copy-id username@ip
```
then you can enter your server without password  