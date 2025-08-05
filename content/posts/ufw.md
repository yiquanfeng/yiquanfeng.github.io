+++
date = '2025-08-04T11:39:54+08:00'
draft = false
title = 'Ufw'
+++
## 防火墙ufw
ufw使用iptables或者nftables作为后端，管理地址加端口的出入站规则  
## 下载并使用基础功能
```
sudo systemctl enable --now ufw.service
ufw allow 22/tcp
ufw default deny
ufw enable
```
上述代码显示将systemd管理的ufw启用并且设置了开机自启  
然后将22端口的tcp流量设置了通过，然后将默认的入站流量设置了deny  
最后就是启动ufw，会有确认提醒

## 查看运行状态
一般查看规则的时候，可以使用
```
ufw status
```
会列出一些基本的显式deny或者allow的端口信息
要查看当前对进出的流量的默认设置
```
ufw status verbose
```
会有三种默认情况  
```
Default: deny (incoming), allow (outgoing), deny (routed)
```
incoming 代表所有外界主动向你发起的流量  
outgoing是你主动向外面发起的流量（比如下载，你主动发起，但是是请求外面的流量）  
routed代表的是转发流量，如果你的主机是作为中转流量的网关或者跳板机的话，可以研究一下如何设置  

## 删除创建的规则
there are two ways to del the rules
```
ufw delete allow 22/tcp
ufw delete [the line number of status]
```

## how to tag the rules in status


## tips
ufw在archlinux上安装之后，需要enable两个地方之后，重新启动一下  
然后才能成功reload并且进行规则的设置，不然很容易出现
```
Firewall not enabled xx
```
类似的报错，重启一下就行，具体原因未知
