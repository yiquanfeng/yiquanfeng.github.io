+++
date = '2025-08-04T07:43:12+08:00'
draft = false
title = 'Sudo'
+++
# Sudo 的妙用
## 后悔药
```
sudo !!
```
使用sudo提权然后执行上一条忘记使用sudo的命令，这里的！！是广泛使用的，都可以代表上一条指令

```
sudo -i
sudo -u postgres
sudo -e
```