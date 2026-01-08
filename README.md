# GPU Frame Animation

将帧动画转为GPU帧动画，通过shader进行播放，隔绝CPU开销。

通过对任意图集进行生成，保留了多动画可合批、图集利用率高、可任意排序和空白裁剪等优点，同时支持平铺。

### 如何使用

- 使用 [FreeTP](http://free-tex-packer.com/) 进行打包，并输出 **JSON 格式**图集文件。

  > 文件命名需要为 [动画名字]_[索引] ，比如Attack_01/Attack_02
  >
  > Dead_1/Dead_2

- 运行任务，为图集生成所需要的必要文件

  > tsc && node dist/plist2png static/test.json

  会生成两个info文件，分别为 info.png / info.json

  - png文件

    有序保存了图集中所有动画组的每帧位置，每帧占用4个纹素，前两个为**图片在图集中的位置**，后两个为**图片的原始大小和裁剪后大小**。

    > 注：存入时将整数按照低8位、高8位进行存储
    >
    > ​               r     g                   b    a
    >
    > 左上角x 低8高8 左上角y 低8高8
    >
    > ​               r     g                   b    a
    >
    > 右下角x 低8高8 右下角y 低8高8
    >
    > ​             r     g                 b    a
    >
    > 原始宽 低8高8 原始高 低8高8
    >
    > ​             r     g                 b    a
    >
    > 图片宽 低8高8 图片高 低8高8

  - info文件

    记录了图集中所有动画组名和对应png文件中的数据起始、结束索引

- shader解析、播放

<img src="README\2.png" style="zoom: 10%;" />

------

<img src="README\1.gif" style="zoom: 50%;" />