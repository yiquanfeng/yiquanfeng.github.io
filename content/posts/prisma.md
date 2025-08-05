+++
date = '2025-08-05T22:33:04+08:00'
draft = false
title = 'Prisma'
+++
# a easy way to manage your databse

## Install
```
npm install prisma tsx typescript @type/node --save-dev
npm install @prisma/client
```

## new config
```
npx prisma init --datasource-provider postgresql --output ../generated/prisma
```
then edit your .env file
```
postgresql://USER:PASSWD@HOST:PORT/DATABASE?/schema=SCHEMA
```
**then there are two conditions in learning**  
if you have no databse now, in this way  
edit your schema.prisma
```
model Post {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  title     String   @db.VarChar(255)
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
}

model Profile {
  id     Int     @id @default(autoincrement())
  bio    String?
  user   User    @relation(fields: [userId], references: [id])
  userId Int     @unique
}

model User {
  id      Int      @id @default(autoincrement())
  email   String   @unique
  name    String?
  posts   Post[]
  profile Profile?
}
```
