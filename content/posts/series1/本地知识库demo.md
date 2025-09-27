+++
date = '2025-09-27T18:01:12+08:00'
draft = false
title = '本地知识库demo'
+++
# MVP goal
- [x] the basic ai talk function
- [ ] choose a good tokenizer or make one
- [x] the embedding function
- [x] the document process(md,pdf)
- [ ] the rag system
- [ ] let the ai can get the knowledge


## the embedding process
- tokenizer(分词器)
- 
## the talk function
```python

client = OpenAI(

base_url="https://api.siliconflow.cn/v1",

api_key=os.environ.get("OPENAI_API_KEY")

)


def talk(user_prompt:str)-> str:

completion = client.chat.completions.create(

model="moonshotai/Kimi-K2-Instruct-0905",

messages=[

{ "role" : "system", "content": "You are a helpful assistant"},

{ "role" : "user", "content": user_prompt }

],

temperature=0.9

)

return completion.choices[0].message.content
```

## the embedding function

```python
emb = OpenAIEmbeddings(

base_url="https://api.siliconflow.cn/v1",

api_key=os.environ.get("OPENAI_API_KEY"),

model="Qwen/Qwen3-Embedding-4B"

)
```


## the process of markdown and pdf
```python
def process_md(path:str)->str:

from langchain_community.document_loaders.markdown import UnstructuredMarkdownLoader

loader = UnstructuredMarkdownLoader(path)

md = loader.load()

return md[0]

print(f"the content is\n\n {md[0]}")

  

def process_pdf(path:str)->list:

from langchain_community.document_loaders.pdf import PyMuPDFLoader

loader = PyMuPDFLoader(path)

pdf = loader.load()

return pdf
```
## the RAG system
### data preprocess
not have
### the chunk strategy
```python
splitter = RecursiveCharacterTextSplitter(

chunk_size=200,

chunk_overlap=50

)

  

split_docs = splitter.split_documents(docs)
```
### chroma database and search
```python
persist_directory = './database'

  

vectordb = Chroma.from_documents(

documents=split_docs,

embedding=emb,

persist_directory=persist_directory

)

  

question = "what is the title of 2.4"

sim_docs = vectordb.similarity_search(question,k=3)

# mmr = vectordb.max_marginal_relevance_search(question,k=3)

print(f"检索到的内容数：{len(sim_docs)}")

for i, sim_doc in enumerate(sim_docs):

print(f"检索到的第{i}个内容: \n{sim_doc.page_content[:200]}", end="\n--------------\n")
```
## How to increase the accuracy of the RAG system
现在这个RAG系统的检索准确度相当糟糕啊
让他检索一个几十页的pdf文档，毫无准确度

- the chunk strategy
- the material
- add reranker




**If you have some problem with my blog, feel free to contact me via yiquanfeng@qq.com**
