+++
date = '2025-09-20T21:53:49+08:00'
draft = false
title = 'git'
+++
except this blog, I recommand this [site](https://learngitbranching.js.org/?locale=zh_CN) to learn git
## quick start
to init your git repo
```
git init
```
then the '.git' dir will appear in your main dir
this is the config file of your repo

then if you can make some change in your project
like edit the file1.txt like this 
```file1.txt
this is the first file after 'git init'
```
then you can add the file1 and your readme into your git buffer
```
git add file1.txt README.md
```
then you can see this change via
```
git status
```
```example
~/Codes/learning-git main* ❯ git status                                                        22:00:21
On branch main

No commits yet

Changes to be committed:
  (use "git rm --cached <file>..." to unstage)
	new file:   README.md
	new file:   file1.txt
```
then you can commit your buffer to actually change the git log.
```
git commit -m "some tips"
```
```
~/Codes/learning-git main* ❯ git commit -m "this is the first commit"                          22:00:47
[main (root-commit) a935b15] this is the first commit
 2 files changed, 2 insertions(+)
 create mode 100644 README.md
 create mode 100644 file1.txt
 ~/Codes/learning-git main ❯ git status                                                         22:08:32
On branch main
nothing to commit, working tree clean
```
you can see this commit use log
```
~/Codes/learning-git main ❯ git log                                                            22:08:47
commit a935b1558d42a50ab3116c55e07adbc676ede859 (HEAD -> main)
Author: yiquanfeng <yiquanfeng@qq.com>
Date:   Sat Sep 20 22:08:32 2025 +0800

    this is the first commit
```
# System Intro
## branch
branch is a important concept

git merge 
git rebase
detached-HEAD
relative reference
revert(remote) and reset(local)
cherry-pick
rebase -i
git tag
git describe
git bisect


**If you have some problem with my blog, feel free to contact me via yiquanfeng@qq.com**
