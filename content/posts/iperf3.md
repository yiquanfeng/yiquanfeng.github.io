+++
date = '2025-08-04T14:13:04+08:00'
draft = false
title = 'Iperf3'
+++
## 网络测试工具iperf3
直接使用各自的包管理器安装即可

### 使用
需要有两台机器，一台客户端一台服务器
在服务器检查之后放开5201的默认端口  
然后使用命令
```
iperf3 -s
```
然后再客户端上使用
```
iperf3 -c [address] -p [port]
```
之后就可以看到报告了
```
[ ID] Interval           Transfer     Bitrate
[  5]   0.00-10.00  sec  86.2 MBytes  72.3 Mbits/sec                  sender
[  5]   0.00-10.13  sec  84.9 MBytes  70.3 Mbits/sec                  receiver
```
我使用的两边都是无线wifi通信
从bitrate看出来，目前无线通信速率是100兆以内，还是比较慢的  
事实上用有线网测试