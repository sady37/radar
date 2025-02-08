# Radar-Visualization
Radar Visualization
本radar项目是基于 Vue 3 构建的 2D 画布系统，用于对象布局、交互控制、雷达信号可视化。该系统支持固定物体、移动物体、雷达对象的拖拽、旋转、属性编辑、信号区域显示，
并包含完整的工具栏、编辑菜单、坐标系统及坐标转换。将固定物体的坐标转换为雷达自身坐标回传给真实雷达，接收真实雷达的人体数据并展示。

技术架构   技术说明
Vue 3 + TypeScript  组件化架构，确保可维护性
Vue Router          处理不同视图的切换
Vuex                状态管理，存储对象信息
SCSS (dart-sass)    预处理样式，提升 UI 设计灵活性

✅ 采用 Prettier 代码格式化，符合 Lint 规则
✅ 工具栏、编辑菜单均符合 Vue 组件结构化开发

src/
├── components/
│   ├── common/              # 保留但目前为空
│   ├── monitoring/          # 监控相关组件
│   │   ├── PostureIndicator.vue  #人体姿态：
│   │   ├── TrajectoryLine.vue  #移动物体轨迹线，本项目暂不实现
│   │   └── VitalsDisplay.vue  #人的生理指标显示
│   ├── RadarCanvas.vue     # 主画布组件
│   └── RadarToolbar.vue    # 工具栏组件
├── stores/                 # 状态管理
│   ├── canvas.ts           #画布设置，width,Hight
│   ├── mouse.ts            #mouse相关
│   ├── objects.ts          #最初的各对像数据
│   ├── radar.ts            #分离前的雷达数据结构
│   ├── radarData.ts        # 存放真实雷达传送过的多人的数据:坐标、姿态、生理指标，并设置报警
│   └── types.ts            #对象属性定义
└── utils/                 # 工具函数
    ├── boundaryUtils.ts   #计算雷达的边界
    ├── drawRadar.ts       #绘制雷达
	├── mockRadarData.ts   #模拟人体数据生成            
	├── postureIcons.ts    #人体姿态icon
    └── trajectoryUtils.ts  #绘制运动物体轨迹

20250130
	当前已完成画布、toolbar等组件，画布坐标、对象创建、移动、旋转、改变大小，雷达模型绘制；人体模板、人体模拟数据框架已完成，但未应用。
	现需要画布固定对象上显示name label

20250201 V3.0
	重构数据结构，固定物体及雷达 统一用 type.ts ObjectProperties{}
	└── utils/                 # 工具函数
	    ├── drawRadar.ts       #绘制雷达
	    ├── drawRadar.ts       #绘制人体默认状态，椭圆形
	    ├── mockRadarData.ts   #模拟人体数据生成            
	    ├── postureIcons.ts    #人体姿态icon
	    └── trajectoryUtils.ts  #绘制运动物体轨迹
	绘制：(固定物体+雷)  ，人
	RadarCanvas.vue 的改动已经确认：
	drawObjects() - 组织绘制顺序
	drawObject() - 处理固定物体和雷达
	drawPersons() - 专门处理人
20250201 v3.1
  ###3.1
  输出指定边界内的固定物体坐标，不含Wall
  设置举例：ceiling检测边界为X轴±300，Y轴±200，则传输格式为：{-300,-200; 300,-200; -300,200; 300,200}
  设置举例：侧装检测边界为X轴±300，Y轴0-400，则传输格式为：{-300,0; 300,0; -300,400; 300,400}

20250202  V3.2
  解决toolbox内部UI逻辑：
     点击template模板时，selectObjectType清除活动对像，重置对像属性为默认值，同时更新ObjectName输入框和isLocked开关
	 点击create键：createObject创建对像后，取消所有选中，重置对像属性为默认值，同时更新ObjectName输入框和isLocked开关
	 点击set键, 设置对像值，取消对像及模板选中
  解决canvas对像传递到toolbar,toolbar watch(selectedId),同步属性及ObjectNmae框及isLocked开关

20250202  V3.3	
	保留现有的画布坐标计算（用于布局）
	添加雷达坐标系转换函数
	确保顶点顺序符合雷达标准
	实现完整的双坐标系报告(方便后期替换雷达)

20250204  v3.4
###3.4
	将房间布局导出单独隔离出来，增加房间/雷达的导入/出按钮
	去掉Set,直接修改并保存生效，所见即所得,使用watch()
	解决一些bug: 点击画布空白处，取消选中对象，但toolbar没有取消
			Canvas点击空白处 
		-> objectsStore.selectObject(null) 
		-> store.selectedId 变为 null 
		-> 触发 Toolbar 的 watch 
		-> 重置 Toolbar UI状态
###3.4.1
   解决wall rotate 90， 不易选取

###3.4.2
    增加mock模拟，增加生理指示板，增加雷达->画布的坐标转换
	优化了一些UI，但模拟产生的坐标不对
###3.4.3
    优化mockRadaData 逻辑，生成mockRadarData服务，可直接调用config/test_layout.josn布局来生成测试数据
###3.5
  完成mockRadarData 测试，播放L1_alarm:Danger/fallconfirm, L2_alarm:warning。 