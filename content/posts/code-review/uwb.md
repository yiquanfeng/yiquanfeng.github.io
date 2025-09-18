+++
date = '2025-09-16T20:34:33+08:00'
draft = false
title = 'uwb-resolve'
+++
## background
这份代码是我给我们学校无人机队写的，他们对于室内的定位需要用到uwb测距和modebus协议的套件，买来的硬件给了点代码，但是实际测量出的数据只有上位机能够获取到，而无人机搭载的上位机不能安装商家给的上位机软件，所以我需要手搓一些代码，让无人机所搭载的标签能够使用串口输出结算的x,y,z轴的数据信息。  
## start follow the process
首先我先梳理一下它原本代码的流程，从main.c入手
```
    uint16_t usart1_rx_length=0;
	Usartx_Init(USART1,115200,72);	
	MYDMA_Config1();  //串口1 DMA打开，发送开DMA
	TIMx_Init(TIM2,3600-1,25-1);//通过定时器2辅助串口接收数据, 2.5ms
	TIMx_Init(TIM3,3600-1,2-1);
```
前面的数据的定义和头文件直接略过，直接看main函数的前面初始化  
首先就是可以看到他使用的串口是USART1，使用的波特率是115200，最后的72参数我去翻了一下Usartx_Init的函数定义，甚至没有看到在函数体里面用了这个参数，我觉得这部分没用，也就不管了  
之后的值得注意的就是TIMx_Init(TIM2,3600-1,25-1);  
这个设置从串口的角度意义不是太大，串口本身没有时钟线，而iic，spi等高速传输的协议都有时钟同步线，以在高速下不出错，这个的timer2有一部分起这个作用，但是这个2.5ms也和modbus协议有关,modbus的帧间隔t3.5在115200的波特率下，大概是0.3ms左右,而modbus协议，建议在19200波特率之后，都使用1.75ms作为帧间隔,这个2.5ms也大于1.75，所以既是保险，也有可能是硬件限制  
## while（1）
做单片机的最常用的就是main函数里面的while(1)里面的东西了  
这里展示了工作的主要流程  
```usart.h
{
	unsigned char buff[USART1_LEN];//缓冲区
    uint16_t usart1_rx_len;//保存的数据长度
    uint8_t usart1_flag;//数据接收完成标志
	uint16_t w;//写
	uint16_t r;//读
	uint8_t is_last_reserve;//上一次接收不全标志位
	uint16_t last_reserve_length;//上一次接收不全的长度
}USART1_RX;
```
```usart.c
/**
 * @brief 从缓冲区读取数据
 * @param *tx_data 	读取数据保存地址
 */
uint16_t Usart1_Annular_txdata(uint8_t *tx_data)
{
    ....
    ....
    return len;
}
```
```main.c
while(1)
	{
		if(USART1_rx.usart1_flag)
		{
			usart1_rx_length = Usart1_Annular_txdata(usart1_rx_buf);//读取缓冲区的内容
			if(usart1_rx_length)	//读取到的长度
			{
				MODBUS(usart1_rx_buf, usart1_rx_length);
			}
		}
		if(ERROR_FLAG > ERROR_MAX)
		{
			ERROR_FLAG = 0;
			USART1_rx.usart1_flag = 0;
			USART1_rx.r = 0;
			USART1_rx.w = 0;
			USART1_rx.usart1_rx_len = 0;
			memset(usart1_rx_buf,0,sizeof(usart1_rx_buf));
		}
	}
```
这一段结合usart.h中串口一的数据定义和usart.c中的函数定义，就很容易理解，接收到数据接受完毕的标志位之后，就立马获取串口传输的信息的长度，然后传给modbus协议解析的函数,后面的错误处理就先不管了
然后我们转向MODBUS函数
```
if(length >= 4)
```
首先看这个if条件，这是因为modbus的帧结构，第一个字节位从机地址，第二字节为操作码，然后后面253字节是给数据准备的，最后两个字节是crc校验码  
因此如果数据为空的话,数据最短也有4个字节
```
if(recv_buffer[index] != MODBUS_ID || recv_buffer[index + 1] != 0x03)  //modbusid或功能码不正确 继续读取缓存区下一个字节的内容
			{
				index++;			//解析下一位数据
				continue;
			}

```
然后看while里面的第一段，这是在不断移位，寻找从机地址地址和功能码0x03   
至于为什么要不断移位，因为他没有固定的帧头和帧尾
```
            recv_length = recv_buffer[index + 2] + 5; //读取寄存器长度
			if(recv_length + index > length) //接收到的数据小于寄存器长度 接受不全 重新接收
			{
				uint16_t reserve_len = length - index;	//剩余的长度
				USART1_rx.is_last_reserve = 1;	//剩余标志位
				USART1_rx.last_reserve_length = reserve_len + 1;	//剩余长度
				if(USART1_rx.r - reserve_len > 0)  //缓存区没有循环过 直接回退
				{
					USART1_rx.r -= reserve_len;
				}
				else  //缓存区发生过循环 需要处理回到真正的队首
				{
					USART1_rx.r = USART1_LEN - reserve_len + USART1_rx.r;
				}
				break;
			}
```
首先前面，程序一直寻找的操作码是0x03,这个操作码的意义是读取指定的寄存器  
进行到这的时候，index的位置对应的是modbusid，那index+2对应的就是
这一部分不会了，没看懂
直接进入下一阶段
```
            //crc校验成功 开始解析
			uint16_t read_idx = index + 3;	//从Modbus地址第3位开始解析
			index += recv_length;			//记录下一包数据的位置
			if(recv_buffer[read_idx] == 0xCA && recv_buffer[read_idx + 1] == 0xDA)	//A基站解析
			{
				Anchor_Resolve_OutputStr(recv_buffer,length,read_idx);
			}
			else if(recv_buffer[read_idx] == 0xAC && recv_buffer[read_idx + 1] == 0xDA)	//标签解析
			{
				Tag_Resolve_OutputStr(recv_buffer,length,read_idx);
			}
			ERROR_FLAG = 0;
```
下一段的核心就是我熟悉的modbus协议解析了  
index在前面的部分没有变化，所以index此时还是从机的addr，然后index+3就是数据的高位，然后再继续讲index挪到下一个数据包的开头位置。  
之后的if判断就可以看出，如果接受到的两个字节的数据是CADA，就说明这个消息是给A基站也就是主基站的如果是ACDA，那就是标签解析消息  
我的工作主要是标签解析，所以我们直接看标签解析，基站解析的流程也差不多


## extra thinking
### 为什么要使用uwb作为物理媒介
uwb的超长带宽，带来的是极短的脉冲时间，那么对于硬件分辨波的到达时间，就会非常容易且迅速。  
室内定位要使用电磁波达到厘米级别的定位精度,需要3.3333333333E-11s左右的时间，这个级别是ps级别的，那么如果传播介质的脉冲时间稍微一长，精度就会大大降低。

