+++
date = '2025-09-15T20:37:42+08:00'
draft = false
title = 'Pbot'
+++
## General intro
Pbot是我写的第一个正经开源项目，使用bot通信协议标准是[OneBot11](https://github.com/botuniverse/onebot)，协议的实现层是开源项目[NapCat](https://github.com/NapNeko/NapCatQQ),这两个都是bot实现的经典选择。  
然后此时我正在学习Java，发送请求的客户端就使用Java来写了  
## problems
关于新闻的获取，一开始我想的是发挥我实习爬虫的作用，后面发现Phoronix的网站套了cloudflare的保护，我只能使用selenium加上undetected-chromedriver才能过cf盾，但是selenium和chromdriver即使使用headless模式，你的服务器上至少要有图形化才能运行，所以陷入了瓶颈。  
> 写这个思路的时候，询问了LLM发现selenium和webdriver的程序似乎能够在无图形化的服务上运行，也许当时这部分思考有点问题，之后可以仔细考究一下
## 新思路
之后和另一位开发bot的学长商量了一下，可以解析Phoronix官网的RSS文件来获取每日新闻然后推送。然后在使用curl获取文件的时候发现,获取不到，403了，说明我没有权限  
这就是一个很奇怪的事情，明明提供了RSS文件，却不让人简单得获取，令人十分费解，之后因为这个问题，绕了很大一个圈子，想去找一个RSSHub来中继，但是效果总是不尽如人意。
## 转机
直到有一次我上厕所的时候搜索了一下这个问题，发现在[Phoronix这个帖子](https://www.phoronix.com/forums/forum/phoronix/site-discussion/1414581-unable-to-access-rss-feed-due-to-cloudflare-protection)找到了原因，他们把中国和Honkong区域屏蔽了，我日常用的魔法是香港的，所以不行。  
然后我换用American的魔法，wget立马就成功了。 
## general 
最后就是翻译模型的选用和部署，这一部分我比较熟悉，但是这部分也确实相当容易。目前有两种简单的方式自部署LLM，ollama和lmstudio。一开始我在本机调试，由于是mac，就使用的是lmstudio，因为有些模型有mlx格式，对于m系列芯片有加速。Java里面使用openai- compatible api的库调用也很顺利

# code review
## communication with napcat server
```
static void http_handler(String url, String json){
        private static final HttpClient mainClient = HttpClient.newHttpClient();

        HttpRequest mainRequest = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(20))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();
//        System.out.println(json);
        try {
            HttpResponse<String> response =
                    mainClient.send(mainRequest, HttpResponse.BodyHandlers.ofString());
            System.out.println(response.statusCode());
            System.out.println(response.body());
//            Thread.sleep(1000); // 20mins
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
```
十分基础的一个http client，这个http client主要是给napcat使用的，之后在翻译模块里还有一个client是和lmstudio通信使用的。这里的主要是创建了一个request，然后发送到制定的url，然后接受response。  
首先build的过程，需要注意的就是header，需要填写你发送消息的content-type，napcat接受的是json格式的消息，所以这里也就是application/json。常见的type还有text/plain....。然后就是注意post或者get方法,我常用的是这两种方法。  
除了这些比较显式且常用的点呢，在我开发的时候，我还碰到的问题就是http的版本问题，java17中request默认使用的是http2.0的协议，后面调试lmstudio的时候会在这个地方有问题。  
## build the json message
```
Gson gson = new Gson();
    GroupMessage gmsg = new GroupMessage();
    String json = gson.toJson(gmsg);
    String url = "http://127.0.0.1:3001/{api_type}";
    JsonHandler(){

    }

    JsonHandler(String apiType, String type, String text){
        this.url = this.url.replace("{api_type}", apiType);
        this.gmsg = new GroupMessage(type, text);
        json = gson.toJson(gmsg);
    }

    public String getJson(){
        return json;
    }

class GroupMessage {
    String group_id = "xxxx";
    ArrayList<Message> message = new ArrayList<>();

    GroupMessage(){
        message.add(new Message("text", "default text"));
    }
    // default is the linux group
    GroupMessage(String type, String text){
        message.add(new Message(type, text));
    }
    // choose the pacific group
    GroupMessage(String group_id, String type, String text){
        this.group_id = group_id;
        message.add(new Message(type, text));
    }
}

class Message {
    String type = "default text";
    Data data = new Data("default text");
    Message(String type, String text) {
        this.type = type;
        this.data.text = text;
    }
}

class Data {
    public String text;
    Data(String text){
        this.text = text;
    }
}
```
从一开始我使用的就是Gson库，然后我的bot只需要一条一条的发送群消息就行了。  
之后尝试之后发现，如果一条一条发送，会使得群聊消息变得杂乱，全都充斥着新闻了，qq群的观感不好。不过一开始没有好的办法，就只能每发一次，就sleep几分钟，再发一次。    
这样做，实际上就是构建好json消息，然后在Main类中使用http client发送到napcat server即可。  
之后在qq群中，有群友建议可以发送消息集合，我觉得是个很好的主意，然后代码就比较复杂，嵌套就多起来了  
```
class NodesMessage {
    String group_id = "";
    List<NodeContent> message = new ArrayList<>();

    NodesMessage(){

    }
    NodesMessage(String group_id){
        this.group_id = group_id;
    }

    void add(String user_id, String nickname, String type, String data){
        NodeContent tmp1 = new NodeContent(user_id, nickname);
        SingalContent tmp2 = new SingalContent(type, data);
        tmp1.add(tmp2);
        message.add(tmp1);
    }
}

class SingalMessage {
    String group_id = "";
    List<SingalContent> message = new ArrayList<>();
//    NodeContent nodeMsg = new NodeContent();
//    String jsonMsg = JsonHandler.gson.toJson(Msg);

    SingalMessage(String group_id, String type, String data) {
        this.group_id = group_id;
        this.message.add(new SingalContent(type, data));
    }

}

class NodeContent {
    String type = "node";
    Node data = new Node();

    NodeContent(){

    }
    NodeContent(String user_id, String nickname){
        this.data.set(user_id, nickname);
    }

    void add(SingalContent content){
        this.data.add(content);
    }
}

class Node {
    String user_id = "";
    String nickname = "";
    List<SingalContent> content = new ArrayList<>();
    Node() {

    }
    Node(String user_id, String nickname){
        this.user_id = user_id;
        this.nickname = nickname;
    }

    void set(String user_id, String nickname){
        this.user_id = user_id;
        this.nickname = nickname;
    }

    void add(SingalContent toAdd){
        content.add(toAdd);
    }
}

class SingalContent {
    String type = "";
    Map<String, String> data = new LinkedHashMap<>();

    SingalContent(){

    }

    SingalContent(String type, String content){
        if (type.equals("text"))
        {
            this.data.put("text", content);
        }
        else {
            System.out.println("not text");
        }
        this.type = type;
    }

    void set(String type, String content){
        if (type.equals("text"))
        {
            this.data.put("text", content);
        }
        else {
            System.out.println("not text");
        }
        this.type = type;
    }
}
```
其中，singlemessage是对于发送单条群消息的兼容，nodecontent是消息集合中的其中一条消息
![a image](static/images/image.png)
这是发送单条消息的json构造图  
![a image](static/images/image-1.png)
这是发送消息集合的json构造图  


## get the RSS file and parse it to plain text
```
ArrayList<String> getContent(){
        try {
            DocumentBuilder dBuilder = dbfactory.newDocumentBuilder();
            Document doc = dBuilder.parse(inputxml);
            doc.getDocumentElement().normalize();
            NodeList Passages = doc.getElementsByTagName("item");
            int limit = Passages.getLength()-1;
            for (int index = limit; index >= 0; index--)
            {
                Node nNode = Passages.item(index);
                if(nNode.getNodeType() == Node.ELEMENT_NODE) {
                    Element eElement = (Element) nNode;
                    title = eElement.getElementsByTagName("title").item(0).getTextContent();
                    link = eElement.getElementsByTagName("link").item(0).getTextContent();
                    description = eElement.getElementsByTagName("description").item(0).getTextContent();
                    pubDate = eElement.getElementsByTagName("pubDate").item(0).getTextContent();
                    creator = eElement.getElementsByTagName("dc:creator").item(0).getTextContent();
                }
                if(timeMachine.getTime().before(timeMachine.String2Date(pubDate)))
                {
                    Passage = "#  " + title + "\n\n" +
                            description;

                    info =  timeMachine.pubdate(pubDate) + "\n\n" +
                            "作者： " + creator + "\n\n" +
                            link;
                    timeMachine.writeTime(timeMachine.String2Date(pubDate));
                    extraContent.add(info);
                    mainContent.add(Passage);
                }
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        } catch (Throwable e) {
            throw new RuntimeException(e);
        }

        return mainContent;
    }
```
这里是主要的解析代码,使用的是DOM解析
```
Document doc = dBuilder.parse(inputxml);
```
这里是直接将xml文件转换成DOM树，然后之后根据根节点去访问各种元素提取自己要的文本。
这里是一个标准过程，不需要过多讲解  
## translate the news using self-host ai server
```
static String BASE_URL = "http://xxx/v1";
    static HttpClient client = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_1_1)
            .connectTimeout(Duration.ofSeconds(10)) // 10秒连接超时
            .build();

    static String system = "你是一位熟悉中文、英文和科技，尤其是操作系统、硬件和 Linux 相关知识的科技翻译人员。" +
            "用户会给出一则英文科技新闻摘要，你的任务是将其翻译为中文。你的翻译应当准确表达原文内容；" +
            "在此前提下你可以适当调整翻译内容，保证翻译结果符合中文语言习惯。输出的翻译中不应包含其他内容。\n" +
            "输出应当以Markdown格式给出，其中标题以#开头即可，不应添加粗体标记.";



    String trans(String toTrans) {
        String ans = "";
        Message message = new Message("qwen/qwen3-14b", toTrans);
        String json = JsonHandler.gson.toJson(message);
//        System.out.println(json);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/chat/completions"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

        try {
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
//            System.out.println(response.statusCode());
            Content content = JsonHandler.gson.fromJson(response.body(), Content.class);
//            System.out.println(content.getContent());
            ans = content.getContent();
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        return ans;

    }

class Content {
    String id;
    String object;
    String created;
    String model;
    List<Object> choices;
    Map<String, String> usage;
    Map<String, String> stats;
    String system_fingerprint;
    Content(){

    }

    String getContent(){
        Map<String, Object> tmp1 = (Map<String, Object>) this.choices.get(0);
        Map<String, Object> tmp2 = (Map<String, Object>) tmp1.get("message");
        String tmp3 =  tmp2.get("content").toString();

        return tmp3.split("</think>")[1].strip();
    }
}

class Message {
    String model = "";
    List<Role> messages = new ArrayList<>();

    Message(String model, String content){
        Role system = new Role("system", TranslatorMy.system);
        this.model = model;
        Role user = new Role("user", content);
        messages.add(system);
        messages.add(user);
    }
}

class Role {
    String role = "";
    String content = "";

    Role(String id, String content){
        this.role = id;
        this.content = content;
    }
}
```
第一步是构建要发给ai server的message，最少需要的东西就三个  
system prompt， user prompt， model name。有了这三个之后，使用Gson构造json消息即可。system prompt需要细调一下。user prompt就是需要翻译的新闻内容，model name主要是看lm-studio的部署模型是哪个。  
### problem
在这里，http协议版本就开始发力了，一开始我使用常规的方法去发起请求，然后没有响应。我以为是我的路由填错了，然后在cherry studio试了一下，发现是正常的。  
然后我就开始专心调整java代码了，不过一开始调整并没有找到方向，之后偶然在b站中刷到了一个调试网络问题的视频。总结着看了一下，调试http网络接口，如果在postman中尝试了一下是正常的话，然后使用命令行或者程序总是不行，可以怀疑的方向就下面几个

- http协议版本  2.0和1.1
- tls的版本协议 1.3 和 1.2

最终极的办法就是直接上wireshark抓包，抓这个去分析成功的请求用的是哪些参数  
我这里的问题呢，直接怀疑http版本即可，因为我没有上tls加密协议  
一下子就排查出来了。

调试好这个之后，接下来就是解析ai server传回来的消息了
他传过来的也是一个json消息，只需要使用Gson中的fromJson将其转换成java中的类即可。然后就直接通过类的成员来访问对应的消息内容，我只需要其中的choices内容。  
然后查看消息发现qwen 14b的消息默认是开启think的，那它传回来的消息是带有<think></think>的标签的。所以我直接使用</think>提取正式内容，然后ai传回来的消息默认有两行的空行，我直接使用strip就可以消除。


### Optimize process
在测试的过程中发现，如果将RSS file中解析的所有信息一股脑全都塞进ai翻译中，ai的翻译会十分不稳定，尤其是对于时间的翻译，phoronix使用的时间是西八区的，我们想要使用中国的东八区，但是ai对于这个翻译总是会出错或者格式不统一  
因此我选择直接将时间和作者信息等，直接手动提取之后塞入最终发送的消息中  
```
        for (int i=0; i<fulls.size(); i++) {
            jsonHandler.addNode(sender_id, sneder_name, "text", translator.trans(fulls.get(i))+"\n\n\n"+rssHandler.extraContent.get(i));
        }
```
也就是这里的extraContent

# Summary
写这个项目呢，主要是当时爬虫的实习让我觉得自己有能力为别人创造价值了，然后满怀信心开始找方向，然后自身也是一个linux爱好者，群里有时候十分冷清，我想着给群里增加一点linux氛围，就想到可以获取知名linux信息发布站phoronix信息然后发布到qq群聊中。  
当时也是初学java，打算为之后找工作准备，所以写的东西还是比较基础，但我还是学到了很多经验，包括网络调试，架构设计，多方搜索意见。  