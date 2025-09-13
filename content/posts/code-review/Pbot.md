+++
date = '2025-09-12T20:37:42+08:00'
draft = false
title = 'Pbot'
+++
## General and problems
Pbot是我写的第一个正经开源项目，使用bot通信协议标准是[OneBot11](https://github.com/botuniverse/onebot)，协议的实现层是开源项目[NapCat](https://github.com/NapNeko/NapCatQQ),这两个都是bot实现的经典选择。  
然后此时我正在学习Java，发送请求的客户端就使用Java来写了  
### problems
关于新闻的获取，一开始我想的是发挥我实习爬虫的作用，后面发现Phoronix的网站套了cloudflare的保护，我只能使用selenium加上undetected-chromedriver才能过cf盾，但是selenium和chromdriver即使使用headless模式，你的服务器上至少要有图形化才能运行，所以陷入了瓶颈。  
> 写这个思路的时候，询问了LLM发现selenium和webdriver的程序似乎能够在无图形化的服务上运行，也许当时这部分思考有点问题，之后可以仔细考究一下

之后和另一位开发bot的学长商量了一下，可以解析Phoronix官网的RSS文件来获取每日新闻然后推送。然后在使用curl获取文件的时候发现,获取不到，403了，说明我没有权限  
这就是一个很奇怪的事情，明明提供了RSS文件，却不让人简单得获取，令人十分费解，之后因为这个问题，绕了很大一个圈子，想去找一个RSSHub来中继，但是效果总是不尽如人意。直到有一次我上厕所的时候搜索了一下这个问题，发现在[Phoronix这个帖子](https://www.phoronix.com/forums/forum/phoronix/site-discussion/1414581-unable-to-access-rss-feed-due-to-cloudflare-protection)找到了原因，他们把中国和Honkong区域屏蔽了，我日常用的魔法是香港的，所以不行。  
然后我换用American的魔法，wget立马就成功了。  
最后就是翻译模型的选用和部署，这一部分我比较熟悉，但是这部分也确实相当容易。目前有两种简单的方式自部署LLM，ollama和lmstudio。一开始我在本机调试，由于是mac，就使用的是lmstudio，因为有些模型有mlx格式，对于m系列芯片有加速。Java里面使用openai- compatible api的库调用也很顺利

