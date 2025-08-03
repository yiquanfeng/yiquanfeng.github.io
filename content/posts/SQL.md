+++
date = '2025-08-04T06:35:54+08:00'
draft = false
title = 'SQL'
+++

## postgres的初始化
开局就会遇到不利，在linux server安装postgres之后
会有postgres的用户，一开始我们需要以postgres的身份执行
```
initdb -D /var/lib/postgres/data
```
用来初始化postgres的数据库
但是你会发现你如果直接sudo或者su postgres，要么就是没有权限执行初始化的代码，要么就是由于不知道postgres的账户密码导致无法进行。
接下来就是sudo发挥妙用的时候了
```
sudo -u postgres initdb -D /var/lib/postgres/data
```
然后输出你自己的账户密码即可
更多sudo妙用参照[sudo.md](/2025/08/04/sudo/)