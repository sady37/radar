// src/services/radarApiService.ts
import type { 
	RadarProperties, 
	PersonData, 
	VitalSignData
  } from '../stores/types';
  import { useRadarDataStore } from '../stores/radarData';
  
  // 自定义错误类型
  export class RadarApiError extends Error {
	constructor(message: string, public code: string) {
	  super(message);
	  this.name = 'RadarApiError';
	}
  }
  
  // 定义更具体的回调类型
  export interface DataCallback<T> {
	(data: T): void;
  }
  
  // 事件处理器类型
  export type ConnectionEventHandler = (data: { radarId: string, deviceId: string }) => void;
  export type DisconnectionEventHandler = (data: Record<string, never>) => void;
  export type ErrorEventHandler = (error: Error) => void;
  export type TrackEventHandler = (data: PersonData[]) => void;
  export type VitalsEventHandler = (data: VitalSignData) => void;
  export type NotificationEventHandler = (data: { type: string, message: string }) => void;
  
  // 事件处理器映射
  interface EventHandlerMap {
	connection: ConnectionEventHandler[];
	disconnection: DisconnectionEventHandler[];
	error: ErrorEventHandler[];
	track: TrackEventHandler[];
	vitals: VitalsEventHandler[];
	notification: NotificationEventHandler[];
  }
  
  export interface RadarStreamSubscription {
	unsubscribe: () => void;
  }
  
  export class RadarApiService {
	private baseUrl: string;
	private queryTimeout: number;
	private configTimeout: number;
	private connected: boolean = false;
	private deviceId: string | null = null;
	private eventHandlers: EventHandlerMap;
	
	constructor(
	  baseUrl: string = '/api/radar', 
	  queryTimeout: number = 500, 
	  configTimeout: number = 5000
	) {
	  this.baseUrl = baseUrl;
	  this.queryTimeout = queryTimeout;
	  this.configTimeout = configTimeout;
	  
	  // 初始化事件处理字典
	  this.eventHandlers = {
		'connection': [],
		'disconnection': [],
		'error': [],
		'track': [],
		'vitals': [],
		'notification': []
	  };
	}
	
	// 雷达绑定功能 - 将画布雷达与真实雷达绑定
	async bindRadar(radarId: string, deviceId: string): Promise<boolean> {
	  try {
		// 实现与真实雷达的绑定
		const response = await fetch(`${this.baseUrl}/bind`, {
		  method: 'POST',
		  headers: {
			'Content-Type': 'application/json'
		  },
		  body: JSON.stringify({
			radarId,
			deviceId
		  }),
		  signal: AbortSignal.timeout(this.queryTimeout)
		});
		
		if (!response.ok) {
		  throw new RadarApiError(
			`Failed to bind radar: ${response.statusText}`, 
			'BIND_FAILED'
		  );
		}
		
		const result = await response.json() as { success: boolean };
		this.connected = result.success;
		
		if (this.connected) {
		  this.deviceId = deviceId;
		  this.triggerConnectionEvent({ radarId, deviceId });
		}
		
		return result.success;
	  } catch (error) {
		if (error instanceof DOMException && error.name === 'TimeoutError') {
		  throw new RadarApiError(
			'Radar connection timeout. Please check radar connection status.', 
			'TIMEOUT'
		  );
		}
		this.triggerErrorEvent(error instanceof Error ? error : new Error(String(error)));
		throw error;
	  }
	}
	
	// 查询雷达属性
	async getRadarProperties(radarId: string): Promise<RadarProperties> {
	  if (!this.connected) {
		throw new RadarApiError('Radar not connected', 'NOT_CONNECTED');
	  }
	  
	  try {
		const response = await fetch(`${this.baseUrl}/${radarId}/properties`, {
		  method: 'GET',
		  headers: {
			'Content-Type': 'application/json'
		  },
		  signal: AbortSignal.timeout(this.queryTimeout)
		});
		
		if (!response.ok) {
		  throw new RadarApiError(
			`Failed to get radar properties: ${response.statusText}`, 
			'QUERY_FAILED'
		  );
		}
		
		return await response.json() as RadarProperties;
	  } catch (error) {
		if (error instanceof DOMException && error.name === 'TimeoutError') {
		  throw new RadarApiError(
			'Radar query timeout. Please check radar connection status.', 
			'TIMEOUT'
		  );
		}
		this.triggerErrorEvent(error instanceof Error ? error : new Error(String(error)));
		throw error;
	  }
	}
	
	// 发送配置到雷达
	async sendRadarConfig(
	  radarId: string, 
	  config: Record<string, string>
	): Promise<{ success: boolean, failedItems?: string[] }> {
	  if (!this.connected) {
		throw new RadarApiError('Radar not connected', 'NOT_CONNECTED');
	  }
	  
	  try {
		const response = await fetch(`${this.baseUrl}/${radarId}/config`, {
		  method: 'POST',
		  headers: {
			'Content-Type': 'application/json'
		  },
		  body: JSON.stringify(config),
		  signal: AbortSignal.timeout(this.configTimeout)
		});
		
		if (!response.ok) {
		  throw new RadarApiError(
			`Failed to send radar config: ${response.statusText}`, 
			'CONFIG_FAILED'
		  );
		}
		
		return await response.json() as { success: boolean, failedItems?: string[] };
	  } catch (error) {
		if (error instanceof DOMException && error.name === 'TimeoutError') {
		  throw new RadarApiError(
			'Radar configuration timeout. Please check radar connection status.', 
			'TIMEOUT'
		  );
		}
		this.triggerErrorEvent(error instanceof Error ? error : new Error(String(error)));
		throw error;
	  }
	}
	
	// 重启雷达设备
	async restartRadar(
	  radarId: string, 
	  component: 'all' | 'radar' | 'controller' = 'all'
	): Promise<boolean> {
	  if (!this.connected) {
		throw new RadarApiError('Radar not connected', 'NOT_CONNECTED');
	  }
	  
	  try {
		// 转换为type 24消息中的seq值
		const seqValue = 
		  component === 'all' ? 0 : 
		  component === 'radar' ? 1 : 2;
		
		const response = await fetch(`${this.baseUrl}/${radarId}/restart`, {
		  method: 'POST',
		  headers: {
			'Content-Type': 'application/json'
		  },
		  body: JSON.stringify({ 
			component,
			seq: seqValue
		  }),
		  signal: AbortSignal.timeout(this.configTimeout)
		});
		
		if (!response.ok) {
		  throw new RadarApiError(
			`Failed to restart radar: ${response.statusText}`, 
			'RESTART_FAILED'
		  );
		}
		
		const result = await response.json() as { success: boolean };
		return result.success;
	  } catch (error) {
		this.triggerErrorEvent(error instanceof Error ? error : new Error(String(error)));
		throw error;
	  }
	}
	
	// 订阅实时轨迹数据
	subscribeTrackData(
	  radarId: string, 
	  callback: DataCallback<PersonData[]>,
	  duration: number = 60
	): RadarStreamSubscription {
	  if (!this.connected) {
		throw new RadarApiError('Radar not connected', 'NOT_CONNECTED');
	  }
	  
	  // 订阅成功后，添加回调到事件处理器
	  const handler: TrackEventHandler = (data: PersonData[]) => {
		callback(data);
	  };
	  
	  this.eventHandlers['track'].push(handler);
	  
	  // 向雷达发送订阅请求 (type 26 消息)
	  this.sendSubscriptionRequest(radarId, duration).catch(error => {
		console.error('Failed to send subscription request:', error);
	  });
	  
	  // 返回取消订阅的方法
	  return {
		unsubscribe: () => {
		  const index = this.eventHandlers['track'].indexOf(handler);
		  if (index >= 0) {
			this.eventHandlers['track'].splice(index, 1);
		  }
		}
	  };
	}
	
	// 订阅生理数据
	subscribeVitalSigns(
	  radarId: string, 
	  callback: DataCallback<VitalSignData>,
	  duration: number = 60
	): RadarStreamSubscription {
	  if (!this.connected) {
		throw new RadarApiError('Radar not connected', 'NOT_CONNECTED');
	  }
	  
	  // 添加回调到事件处理器
	  const handler: VitalsEventHandler = (data: VitalSignData) => {
		callback(data);
	  };
	  
	  this.eventHandlers['vitals'].push(handler);
	  
	  // 向雷达发送订阅请求 (type 26 消息)
	  this.sendSubscriptionRequest(radarId, duration).catch(error => {
		console.error('Failed to send subscription request:', error);
	  });
	  
	  // 返回取消订阅的方法
	  return {
		unsubscribe: () => {
		  const index = this.eventHandlers['vitals'].indexOf(handler);
		  if (index >= 0) {
			this.eventHandlers['vitals'].splice(index, 1);
		  }
		}
	  };
	}
	
	// 启动模拟数据
	startMockData(radarId: string): void {
	  const radarDataStore = useRadarDataStore();
	  radarDataStore.startDataStream();
	  
	  // 模拟连接状态
	  this.connected = true;
	  this.deviceId = radarId;
	  this.triggerConnectionEvent({ radarId, deviceId: radarId });
	}
	
	// 停止模拟数据
	stopMockData(): void {
	  const radarDataStore = useRadarDataStore();
	  radarDataStore.stopDataStream();
	  
	  // 模拟断开连接
	  this.connected = false;
	  this.deviceId = null;
	  this.triggerDisconnectionEvent({});
	}
	
	// 内部方法：发送订阅请求
	private async sendSubscriptionRequest(radarId: string, seconds: number): Promise<void> {
	  try {
		const response = await fetch(`${this.baseUrl}/${radarId}/subscribe`, {
		  method: 'POST',
		  headers: {
			'Content-Type': 'application/json'
		  },
		  body: JSON.stringify({
			seq: 1,
			seconds
		  }),
		  signal: AbortSignal.timeout(this.configTimeout)
		});
		
		if (!response.ok) {
		  throw new RadarApiError(
			`Failed to subscribe: ${response.statusText}`, 
			'SUBSCRIBE_FAILED'
		  );
		}
	  } catch (error) {
		this.triggerErrorEvent(error instanceof Error ? error : new Error(String(error)));
		throw error;
	  }
	}
	
	// 内部方法：触发事件处理器
	private triggerConnectionEvent(data: { radarId: string, deviceId: string }): void {
	  this.eventHandlers.connection.forEach(handler => {
		try {
		  handler(data);
		} catch (error) {
		  console.error('Error in connection event handler:', error);
		}
	  });
	}
	
	private triggerDisconnectionEvent(data: Record<string, never>): void {
	  this.eventHandlers.disconnection.forEach(handler => {
		try {
		  handler(data);
		} catch (error) {
		  console.error('Error in disconnection event handler:', error);
		}
	  });
	}
	
	private triggerErrorEvent(error: Error): void {
	  this.eventHandlers.error.forEach(handler => {
		try {
		  handler(error);
		} catch (handlerError) {
		  console.error('Error in error event handler:', handlerError);
		}
	  });
	}
	
	private triggerTrackEvent(data: PersonData[]): void {
	  this.eventHandlers.track.forEach(handler => {
		try {
		  handler(data);
		} catch (error) {
		  console.error('Error in track event handler:', error);
		}
	  });
	}
	
	private triggerVitalsEvent(data: VitalSignData): void {
	  this.eventHandlers.vitals.forEach(handler => {
		try {
		  handler(data);
		} catch (error) {
		  console.error('Error in vitals event handler:', error);
		}
	  });
	}
	
	private triggerNotificationEvent(data: { type: string, message: string }): void {
	  this.eventHandlers.notification.forEach(handler => {
		try {
		  handler(data);
		} catch (error) {
		  console.error('Error in notification event handler:', error);
		}
	  });
	}
	
	// 添加事件监听器 - 具体事件类型
	addEventListener(eventType: 'connection', handler: ConnectionEventHandler): void;
	addEventListener(eventType: 'disconnection', handler: DisconnectionEventHandler): void;
	addEventListener(eventType: 'error', handler: ErrorEventHandler): void;
	addEventListener(eventType: 'track', handler: TrackEventHandler): void;
	addEventListener(eventType: 'vitals', handler: VitalsEventHandler): void;
	addEventListener(eventType: 'notification', handler: NotificationEventHandler): void;
	addEventListener(eventType: keyof EventHandlerMap, handler: ConnectionEventHandler | DisconnectionEventHandler | ErrorEventHandler | TrackEventHandler | VitalsEventHandler | NotificationEventHandler): void {
	  if (eventType in this.eventHandlers) {
		this.eventHandlers[eventType].push(handler as never);
	  }
	}
	
	// 移除事件监听器 - 具体事件类型
	removeEventListener(eventType: 'connection', handler: ConnectionEventHandler): void;
	removeEventListener(eventType: 'disconnection', handler: DisconnectionEventHandler): void;
	removeEventListener(eventType: 'error', handler: ErrorEventHandler): void;
	removeEventListener(eventType: 'track', handler: TrackEventHandler): void;
	removeEventListener(eventType: 'vitals', handler: VitalsEventHandler): void;
	removeEventListener(eventType: 'notification', handler: NotificationEventHandler): void;
	removeEventListener(eventType: keyof EventHandlerMap, handler: ConnectionEventHandler | DisconnectionEventHandler | ErrorEventHandler | TrackEventHandler | VitalsEventHandler | NotificationEventHandler): void {
	  if (eventType in this.eventHandlers) {
		const handlers = this.eventHandlers[eventType];
		const index = handlers.indexOf(handler as never);
		if (index >= 0) {
		  handlers.splice(index, 1);
		}
	  }
	}
	
	// 处理从雷达接收的数据 - 可以由外部系统调用
	handleRadarData(dataType: string, data: string): void {
	  try {
		// 根据数据类型解析数据并触发相应事件
		if (dataType === 'track') {
		  // 解析轨迹数据 (type 13)
		  const parsedData = this.parseTrackData(data);
		  this.triggerTrackEvent(parsedData);
		} 
		else if (dataType === 'vitals') {
		  // 解析生理数据 (type 14)
		  const parsedData = this.parseVitalData(data);
		  this.triggerVitalsEvent(parsedData);
		}
		else if (dataType === 'notification') {
		  // 处理简单通知消息
		  try {
			const notification = JSON.parse(data) as { type: string, message: string };
			this.triggerNotificationEvent(notification);
		  } catch (error) {
			this.triggerNotificationEvent({ 
			  type: 'radarNotification', 
			  message: data 
			});
		  }
		}
	  } catch (error) {
		console.error('Error handling radar data:', error);
		this.triggerErrorEvent(error instanceof Error ? error : new Error(String(error)));
	  }
	}
	
	// 解析轨迹数据
	private parseTrackData(data: string): PersonData[] {
	  // 实际解析逻辑应根据雷达数据格式实现
	  try {
		return JSON.parse(data) as PersonData[];
	  } catch (error) {
		console.error('Error parsing track data:', error);
		return [];
	  }
	}
	
	// 解析生理数据
	private parseVitalData(data: string): VitalSignData {
	  // 实际解析逻辑应根据雷达数据格式实现
	  try {
		return JSON.parse(data) as VitalSignData;
	  } catch (error) {
		console.error('Error parsing vital data:', error);
		return {
		  type: 0,
		  breathing: 0,
		  heartRate: 0,
		  sleepState: 0
		};
	  }
	}
	
	// 接收系统通知 - 此方法用于接收简单通知
	receiveNotification(type: string, message: string): void {
	  this.triggerNotificationEvent({ type, message });
	}
	
	// 获取连接状态
	isConnected(): boolean {
	  return this.connected;
	}
	
	// 获取当前绑定的设备ID
	getDeviceId(): string | null {
	  return this.deviceId;
	}
	
	// 断开连接
	disconnect(): void {
	  this.connected = false;
	  this.deviceId = null;
	  this.triggerDisconnectionEvent({});
	}
  }