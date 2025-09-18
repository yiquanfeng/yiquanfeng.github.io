+++
date = '2025-08-09T21:13:03+08:00'
draft = false
title = 'rsync'
+++
# rsync -- 一个强大的文件传输工具
## 基本使用
虽然优势不在这，但是rsync还是可以作为cp/mv的替代品的  
普通的模式就是cp  
```
rsync -r -P sourceDir destDir
```
其中-r是递归复制，-P是展示process  
如果需要mv的行为的话,可以使用--remove-source-files选项  

不过他在单纯复制和转移和原来不同的是，可以走网络协议  
```
rsync source host:dest
```
走的是ssh协议，并且host可以读取config文件，那么就可以很方便使用缩写  
有一点值得注意的事情，rsync处理末尾/的方式和一般的cp不一样  
wiki上解释的是gnu和bsd之间的不同  
rsync是这样处理的
```
rsync -r iso test
# turns out
ls test/
iso

rsync -r source/ dest
# turns out
ls iso/
Win10_22H2_Chinese_Simplified_x64v1.iso  debian-13.0.0-amd64-netinst.iso
ls test/
Win10_22H2_Chinese_Simplified_x64v1.iso  debian-13.0.0-amd64-netinst.iso
```

## 作为备份工具
rsync在不同文件系统复制文件的性能优势、增量复制的特性以及能够走ssh协议进行网络复制，  
这些特性注定了他是一个很好的备份工具。  
不过备份的策略有很多，我这里只讲我自己比较可行的方法
### ssh定时增量备份
workinng ...
### 快照备份
working ...
### 全盘系统备份
```
sudo rsync -aAXHv --exclude='/dev/*' --exclude='/proc/*' --exclude='/sys/*' --exclude='/tmp/*' --exclude='/run/*' --exclude='/mnt/*' --exclude='/media/*' --exclude='/lost+found/' / /path/to/backup
```
-a保证rsync打包的时候使用的是归档模式  
-A  
-X  
-H  
-v保证的是在进行备份的时候有log输出，如果是定期备份的话可以去掉选项不需要log  
--exclude保证的是排除一些只有系统运行后才会有数据的文件夹  
/是需要备份的文件  
/path/to/backup是打包之后的文件路径  
### 还原备份
working...

# 参考文献
https://wiki.archlinuxcn.org/wiki/Rsync