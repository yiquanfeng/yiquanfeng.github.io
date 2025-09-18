+++
date = '2025-09-13T23:18:19+08:00'
draft = false
title = 'vllm'
+++
## 快速上手
首先使用uv创建一个虚拟环境和安装点基本的东西
```
uv venv --python 3.12 --seed
source ./venv/bin/activate //according your shell
uv pip install vllm --torch-backend=auto   // can not just use pip
```
然后可以直接使用
```
vllm server
```
this is a test