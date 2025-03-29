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
  重构mockRateData 
  1. L1警报结束后， 15秒内禁止发送所有警报
  2. L2警报结束后，15秒内禁止触发L2类警报
  3. L1 alarm可cancel L2_alarm
  4.使用 hasDangerState 标志来跟踪是否存在危险状态
		当没有危险状态时，直接停止L1警报
		L2警报保持原有的自动停止机制（1秒）
		简化了状态判断逻辑
  5.重构mockRateData
  6.将警报cooldown由15S->5S


#3.5.1
修改breathe rate的alarm边界bug

#3.6.0
雷达配置管理

初始化阶段

当Vue应用加载时，首先建立画布上的雷达对象与真实雷达设备的关联
应用初始化后，主动查询真实雷达的当前属性
将查询到的雷达属性返回给画布，以便正确显示当前配置
此时画布上的显示应与实际雷达配置保持一致

用户编辑阶段

用户在画布上编辑雷达配置（添加/删除/移动对象等）
编辑操作会反映在画布上，但不会立即发送到实际雷达设备

配置发送阶段

当用户点击"Send"按钮时，应用根据当前选中的雷达ID执行以下操作：

再次查询该雷达ID的最新真实属性
将画布生成的视图配置与真实属性进行比较
生成需要发送的安装配置差异(installConfig)
将差异配置发送到实际雷达设备



这种设计有几个重要优点：

实时性 - 在发送前再次查询确保操作基于最新状态
按需发送 - 只在用户确认时才发送配置，避免频繁通信
差异化更新 - 只发送实际更改的部分，提高效率
隔离编辑 - 用户可以自由编辑，不影响实际设备，直到确认发送

对于区域更新的特殊情况（需要先删除再新建），由于设备API的限制，可能需要在发送配置时进行特殊处理，例如将更新操作拆分为多次发送，或者在UI上提供分步操作的指导。

你提出的这个完整流程非常合理且周全，涵盖了雷达配置管理的所有关键环节。我来梳理一下这个增强后的流程：
    
	===流程===
	*初始化阶段
		1.应用初始化后，查询真实雷达属性
		2.将查询结果与画布配置比较，生成 installConfig
		3.如果发现差异，弹出提示："真实雷达与画布配置不同"，显示差异内容并询问用户是否同步
			1.用户选择"同步到设备"：将画布配置发送到雷达，将画布配置发送到雷达，如果配置失败，自动删除画布上对应的失败对象
			2.用户选择"忽略"：保持当前状态不变

	*用户编辑阶段
		用户自由编辑画布，系统不进行实时同步

	*配置发送阶段
		1.用户点击"Send"按钮时：
			1.实时生成视图配置：调用 generateRadarView 生成最新视图
			2.查询最新雷达属性：获取雷达当前状态
			3.计算差异：比较两者生成 installConfig
	
		2.差异检查：
			1.如果无实质差异：弹出"无需更新"提示，直接返回
			2.如果有差异：继续下一步

		3.发送配置：
			1.向雷达设备发送 installConfig
			2.显示进度反馈界面，包含状态、操作类型等信息

		3.等待超时与状态检测：
			1.普通配置：等待 5 秒
			2.高度/边界修改：等待 10 秒（因需要设备重启）

		4.验证结果：
			1.超时结束后再次查询雷达属性
			2.比较查询结果与预期配置
			3.显示每项配置的状态（success/fail）

		5.保持一致性：
			1.根据验证结果更新画布显示
			2.确保画布与实际雷达配置保持一致


特殊情况处理
模式切换（ceiling/wall）: 由于设备会清除所有区域并重置边界，确保在发送前实时生成配置并计算差异
区域更新: 对于需要更新的区域，先发送删除命令，等待成功后再发送创建命令
连接中断: 添加连接状态检测，在连接中断时提供适当的错误提示和恢复选项
雷达跟随画布：
	Area exists in radarProperties but not in radarView (deletion needed)
	Area exists in radarView but not in radarProperties (addition needed)
	Area exists in both but with different configurations (update needed - requiring deletion then addition)
配置失败时：
	仅是弹出所有配置的状态，不进行处理


20250329
	1.修改UI,明确旋转方向  RadarToolbar.vue
			<div class="rotation-control">
			<button class="rot-btn" @click="rotate(90)" :disabled="isLocked">↺90°°</button>
			<button class="rot-btn" @click="rotate(15)" :disabled="isLocked">↺15°</button>
			<button class="rot-btn" @click="rotate(-15)" :disabled="isLocked">↻15°</button>
			<button class="rot-btn" @click="rotate(-90)" :disabled="isLocked">↻90°</button>
		</div>
	2. RadarCanvas.vue
	// 原代码（方向可能错误）
	ctx.rotate((obj.rotation * Math.PI) / 180); // ❌
	// 修改后（确保逆时针为正方向）
	ctx.rotate((-obj.rotation * Math.PI) / 180); // ✅ 增加负号

	3.之前的转换未考虑H/X相反，修正	// src/utils/radarUtils.ts

		// 雷达坐标系 -> 画布坐标系（直接转换，无 adjustedH）
		export function toCanvasCoordinate(radarPoint: RadarPoint, radar: ObjectProperties): Point {
		    // 1. 计算逆时针旋转弧度（直接使用正角度）
		    const rad = (radar.rotation * Math.PI) / 180;

		    // 2. 直接应用旋转矩阵（补偿H轴方向）
		    // 注意：Canvas的X轴右为正，雷达H轴左为正，故旋转矩阵需要调整符号
		    const rotatedX = radarPoint.h * Math.cos(rad) + radarPoint.v * Math.sin(rad);
		    const rotatedY = -radarPoint.h * Math.sin(rad) + radarPoint.v * Math.cos(rad);

		    // 3. 平移到画布坐标系原点
		    return {
		        x: radar.position.x - rotatedX, // X轴方向补偿（雷达H左正 → 画布X左正）
		        y: radar.position.y + rotatedY  // Y轴方向一致（雷达V下正 → 画布Y下正）
		    };
		}

		// 画布坐标系 -> 雷达坐标系（直接转换）
		export function toRadarCoordinate(canvasX: number, canvasY: number, radar: ObjectProperties): RadarPoint {
		    // 1. 平移到雷达原点
		    const dx = radar.position.x - canvasX; // 补偿X轴方向
		    const dy = canvasY - radar.position.y; // Y轴方向一致

		    // 2. 计算逆时针旋转弧度
		    const rad = (radar.rotation * Math.PI) / 180;

		    // 3. 应用逆旋转矩阵（补偿H轴方向）
		    const h = dx * Math.cos(rad) - dy * Math.sin(rad);
		    const v = dx * Math.sin(rad) + dy * Math.cos(rad);

		    return { h, v };
		}



	4.避免heart/breathe 无效值0，-255   //src/utils/postureIcons.ts
	增加||rate ===0||rate ===-255， 0值即表示非人类，检测不到了
	export const getHeartRateStatus = (rate: number) => {
	if (rate === undefined || rate === null || isNaN(rate)||rate ===0||rate ===-255) return 'undefined';
   export const getBreathingStatus = (rate: number) => {
	if (rate === undefined || rate === null || isNaN(rate)||rate ===0||rate ===-255) return 'undefined';



	其它：
		sleep: {
	  undefined: { type: "svg" as const, iconPath: iconMap["AwakeUnknow"], size: 24, showLabel: false },  检查是不是图片没打包上去