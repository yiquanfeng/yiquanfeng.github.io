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
更多sudo妙用参照[sudo.md](/posts/sudo/)

## tips 
### import the sql file
```
psql -u user_name -d database_name -f file_path
```
### upper and lower case
in postgresql, the upper ans lower often case some problem  
if you create a table named "User"  
then you want to search the table in sql language
you input 
```
\d User
```
but you may see
```
prisma_test=# \d User
Did not find any relation named "User".
```
because the psql convert the User to user  
but your db does not have user, so this is the result  
So you need to use
```
\d "User"
```
that is ok
```
prisma_test=# \d "User"
                             Table "public.User"
 Column |  Type   | Collation | Nullable |              Default               
--------+---------+-----------+----------+------------------------------------
 id     | integer |           | not null | nextval('"User_id_seq"'::regclass)
 email  | text    |           | not null | 
 name   | text    |           |          | 
```

## basic function of postgresql
> only **dropdb** and **createdb** is excuted in your shell

\l to list the database   
\d to list the tables   
\c to enter the databse, if you just \c,then re-enter your present database   
CREATE DATABASE + name / createdb  
DROP DATABASE + name / dropdb  
CREATE TABLE to create a data table  
\d table_name to find the col and row data
```
CREATE TABLE COMPANY(
    ID INT PRIMARY KEY NOT NULL,
    NAME CHAR(50)
);
```

### schema
```
CREATE SCHEMA schema_name;
CREATE TABLE schema_name(
    ID INT NOT NULL,
    xxx
);
```
create a schema and a table in it

then you can use \dn to look the schema you create

### INSERT INTO and SELECT FROM
you can this command to insert some data to the table
```
INSERT INTO table_name(col1, col2)
VALUES(row1, row2);
```
example here
```
mac=# INSERT INTO test (id, name)
VALUES(1, 'yiquanfeng');
INSERT 0 1

mac=# select * from test;
 id |                        name
----+----------------------------------------------------
  1 | yiquanfeng
(1 行记录)
```
INSERT INTO is easy to use, so do SELECT
you just use select as following
```
select col1 col2 from table_name;
```
eg.
```
mac=# insert into test(id, name)
values(2, 'spriple');
INSERT 0 1

mac=# select name from test;
                        name
----------------------------------------------------
 yiquanfeng
 spriple
(2 行记录)
```
> here I test can I just use lowcased letter to write sql commmand
> it turns out that it works well

the main usage is just above

## compute signal, compare, logic, bit and expression
### compute signal
about the compute signal, the most is the same as other language  
there are four compute signal and one compare signal need to note  
|/  -- >  |/25.0 = 5
||/ -- > ||/27.0 = 3
!   -- > 5! = 120
!!  -- > !!5 = 120  function as the after !
### compare
<>  means not equal
### logic and expression(exercise)
first let me se the whole table 
```
mac=# select * from company;
 id | name  | age |                      address                       | salary
----+-------+-----+----------------------------------------------------+--------
  1 | Paul  |  32 | California                                         |  20000
  2 | Allen |  25 | Texas                                              |  15000
  3 | Teddy |  23 | Norway                                             |  20000
  4 | Mark  |  25 | Rich-Mond                                          |  65000
  5 | David |  27 | Texas                                              |  85000
  6 | Kim   |  22 | South-Hall                                         |  45000
  7 | James |  24 | Houston                                            |  10000
```
then we can use some logic and expression
```
mac=# select * from company where salary > 50000
mac-# ;
 id | name  | age |                      address                       | salary
----+-------+-----+----------------------------------------------------+--------
  4 | Mark  |  25 | Rich-Mond                                          |  65000
  5 | David |  27 | Texas                                              |  85000
(2 行记录)
```
we can see it works  
then the <> signal example
```
mac=# select * from company where salary <> 20000
mac-# ;
 id | name  | age |                      address                       | salary
----+-------+-----+----------------------------------------------------+--------
  2 | Allen |  25 | Texas                                              |  15000
  4 | Mark  |  25 | Rich-Mond                                          |  65000
  5 | David |  27 | Texas                                              |  85000
  6 | Kim   |  22 | South-Hall                                         |  45000
  7 | James |  24 | Houston                                            |  10000
(5 行记录)
```
then the and example
```
mac=# select * from company where age >= 25 and salary > 20000;
 id | name  | age |                      address                       | salary
----+-------+-----+----------------------------------------------------+--------
  4 | Mark  |  25 | Rich-Mond                                          |  65000
  5 | David |  27 | Texas                                              |  85000
(2 行记录)
```
### bit
| # << >> & ~

### some unusual expression
use as to bind a variable
```
mac=# select (2+3) as addition;
 addition
----------
        5
(1 行记录)
```
use count to sum
```
mac=# select count(*) as record from company;
 record
--------
      7
(1 行记录)
```
a env var to stand for now time 
```
mac=# select current_timestamp
mac-# ;
       current_timestamp
-------------------------------
 2025-08-04 17:47:26.280049+08
(1 行记录)
```
## where expression
## update 
## like subsentence
## Backup and Restore
### export the database to human-readable file
```
pg_dump -U [user_name] -h [host] -p [port] [database_name] > name_date.sql
```
then you can read your name_date.sql file

### export the database to a small and strong file
```
// -F c stand for the custom format
pg_dump -U [user_name] -h [host] -p [port] -F c -f name.dump [database_name]
```

### restore from sql file
```
psql ...
```
### restore from dump file
```
pg_restore ...
```