+++
date = '2025-09-19T01:58:18+08:00'
draft = false
title = 'Obsidian and hugo'
+++

# general
Obsidian一直是我最喜欢的Markdown编辑器，同时我还会写使用hugo部署的github pages的博客，之前这两个东西我一直联系不起来，现在，他们终于联通了

# Obsidian plugin
找到**shell commands**这个插件，然后编辑shell脚本，将新创建的obsidian valut作为原本blog的备份或者说本地版本。
因为我的blog完整代码在远程机器，所以我使用这样的脚本，但是这个脚本稍微改一改也十分适合本地代码
```
rsync -av --delete about/ n100:/home/spriple/log/content/about/
rsync -av --delete posts/ n100:/home/spriple/log/content/posts/
ssh n100 << 'EOF'
cd /home/spriple/log
git add ./content/*
git commit -m "[update]"
git pull
git push
EOF
```
稍微解释一下
rsync是一个文件同步工具，--delete是保持两处文件夹的完全一致
然后后面是使用ssh在远程机器上执行一些git操作
还要注意一点，rsync需要本地和远程都需要安装rsync，这个软件在很多系统可能没有，需要注意安装

# hugo templates
除了文件脚本之外，你还需要复刻一个常用的hugo new命令，起始很简单，就是在obsidian里面弄一个模版，来作为新建post的模版，以便hugo能够部署编译，正确识别文章。我之前直接复制了一个人的模版，导致我不停报错，所以这个模版还是挺重要的
```
+++
date = '{{date:YYYY-MM-DD}}T{{time:HH:mm:ss}}+08:00'
draft = false
title = '{{Title}}'
+++




**If you have some problem with my blog, feel free to contact me via yiquanfeng@qq.com**
```


# unsolved problem
shell command这个插件，我还没有折腾明白，如果能够在obsidian快捷调用的时候能够传参的话，我们就可以自定义commit的内容，这一点还是比较遗憾

~~然后还有就是obsidian的新建post，默认是新建在根目录下面，无法自定义在某一个文件夹下面，导致我每次还得挪动一下文件~~
> [!info] haha
> 刚一上传之后，稍微看了一下,结果发现有这一设置，挺好


# Summary
总体体验还是不错的，我终于能够在obsidian编辑我的code-review啥的，而不是vscode那个简陋的环境，vscode还是专门coding和小的readme比较好


**If you have some problem with my blog, feel free to contact me via yiquanfeng@qq.com**
