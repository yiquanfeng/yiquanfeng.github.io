+++
date = '2025-08-05T15:41:08+08:00'
draft = false
title = 'JS'
+++
# a language for backend
because I have the base of other language, so I just note the diff between otherr and this.  
## module management 
there are two ways to manage your lib
one is commonjs(CJS), another is ES modules
if you use CJS, then add following in your packages.json
```
type: "commonjs",
```
if ESM
```
"type":"module",
```
## for loop
in js, **for .. in** and **for .. of** is completely different  
there is a modern way, it is **forEach**
### for ... in
```
for file in files
```
the file is just the index of files  
look like [0, 1, 2]
### for ... of
the modern way  
return the content of the loop object
### forEach
```
files.forEach((file, index) =>{
    console.log(index+1 + ": " + file);
})
```

## async and await
async is a decortaion word for function  
await is only be used in a function decorated by async  

## JavaScriptObject or Json ?
in node-postgres, if you query like this
```
    const result = await client.query('SELECT name FROM company WHERE ID = 1');
    console.log(result.rows[0]);
    await client.end();
```
you may look this output
```
{ name: 'Paul' }
```
you may think you still need to work on this json messge, but this is not right  
because this is the result of console.log  
in fact, the result.rows[0] is a JavaScriptObject  
you can do this to get it's value  
```
console.log(result.rows[0].name);
```
then the output will be
```
Paul
```
this is good
