<template>
	<div class="config-dialog-overlay" @click.self="$emit('close')">
	  <div class="config-dialog">
		<div class="dialog-header">
		  <h3>{{ title }}</h3>
		  <button class="close-button" @click="$emit('close')">×</button>
		</div>
		
		<div class="dialog-content">
		  <!-- Configuration Differences Found -->
		  <div v-if="state === 'difference_found'">
			<p>Configuration differences found between canvas and radar device. Would you like to sync?</p>
			<div class="differences-list">
			  <table>
				<thead>
				  <tr>
					<th>Setting</th>
					<th>Canvas Value</th>
					<th>Device Value</th>
				  </tr>
				</thead>
				<tbody>
				  <tr v-for="(value, key) in differences" :key="key.toString()">
					<td>{{ formatSettingName(key.toString()) }}</td>
					<td>{{ formatSettingValue(key.toString(), value) }}</td>
					<td>{{ formatSettingValue(key.toString(), getDeviceValue(key.toString())) }}</td>
				  </tr>
				</tbody>
			  </table>
			</div>
			<div class="button-group">
			  <button class="primary-button" @click="$emit('sync-to-device')">Sync to Device</button>
			  <button class="secondary-button" @click="$emit('ignore')">Ignore</button>
			</div>
		  </div>
		  
		  <!-- No Changes -->
		  <div v-else-if="state === 'no_changes'" class="centered-content">
			<div class="status-icon info">ℹ</div>
			<p>No configuration changes to send</p>
		  </div>
		  
		  <!-- Sending Configuration -->
		  <div v-else-if="state === 'sending'" class="centered-content">
			<p>Sending configuration...</p>
			<div class="progress-container">
			  <div class="progress-bar">
				<div class="progress-fill" :style="{ width: `${progress}%` }"></div>
			  </div>
			  <div class="progress-text">{{ progress }}%</div>
			</div>
			<p class="status-text">{{ statusMessage }}</p>
		  </div>
		  
		  <!-- Success -->
		  <div v-else-if="state === 'success'" class="centered-content">
			<div class="status-icon success">✓</div>
			<p>Configuration successfully sent!</p>
			<button class="primary-button" @click="$emit('close')">OK</button>
		  </div>
		  
		  <!-- Partial Success -->
		  <div v-else-if="state === 'partial_success'">
			<div class="status-icon warning">!</div>
			<p>Some configuration items failed to apply</p>
			<div class="status-list">
			  <div v-for="(item, index) in successItems" :key="`success-${index}`" class="status-item success">
				<span class="status-icon small">✓</span>
				<span>{{ formatSettingName(item.key) }}</span>
			  </div>
			  <div v-for="(item, index) in failedItems" :key="`fail-${index}`" class="status-item error">
				<span class="status-icon small">×</span>
				<span>{{ formatSettingName(item.key) }} - {{ item.reason || 'Failed to apply' }}</span>
			  </div>
			</div>
			<button class="primary-button" @click="$emit('close')">OK</button>
		  </div>
		  
		  <!-- Error -->
		  <div v-else-if="state === 'error'" class="centered-content">
			<div class="status-icon error">×</div>
			<p>Configuration send failed</p>
			<p class="error-details">{{ errorMessage || 'Connection error, please check device connection' }}</p>
			<div class="button-group">
			  <button class="primary-button" @click="$emit('retry')">Retry</button>
			  <button class="secondary-button" @click="$emit('close')">Cancel</button>
			</div>
		  </div>
		</div>
	  </div>
	</div>
  </template>
  
  <script setup lang="ts">
  import { ref, watch } from 'vue';
  
  // Define more specific types to replace 'any'
  type ConfigValue = string | number | boolean | null | undefined;
  
  interface ConfigItem {
	key: string;
	value: ConfigValue;
	originalValue: ConfigValue;
	reason?: string;
  }
  
  interface ConfigResult {
	succeededItems?: ConfigItem[];
	failedItems?: ConfigItem[];
  }
  
  // 定义类型安全的差异字典类型
  interface StringKeyDictionary {
	[key: string]: ConfigValue;
  }
  
  // Props with improved typing
  interface Props {
	title: string;
	state: string;
	differences?: StringKeyDictionary & Partial<ConfigResult>;
	errorMessage?: string;
  }
  
  const props = withDefaults(defineProps<Props>(), {
	title: 'Radar Configuration',
	state: '',
	differences: () => ({}),
	errorMessage: ''
  });
  
  // Computed properties for accessing result items
  const successItems = ref<ConfigItem[]>([]);
  const failedItems = ref<ConfigItem[]>([]);
  
  // Watch for changes in differences to update success and failed items
  watch(() => props.differences, (newVal) => {
	if (newVal) {
	  // TypeScript treats this as safe because we're using a Partial type
	  successItems.value = newVal.succeededItems || [];
	  failedItems.value = newVal.failedItems || [];
	}
  }, { immediate: true });
  
  // Emits
  defineEmits(['close', 'sync-to-device', 'ignore', 'retry']);
  
  // Progress simulation for sending state
  const progress = ref(0);
  const statusMessage = ref('Initializing...');
  
  // Simulate progress when in sending state
  watch(() => props.state, (newState) => {
	if (newState === 'sending') {
	  // Reset progress
	  progress.value = 0;
	  statusMessage.value = 'Initializing...';
	  
	  // Simulate progress updates
	  const interval = setInterval(() => {
		if (progress.value < 100) {
		  progress.value += 5;
		  
		  // Update status message based on progress
		  if (progress.value < 30) {
			statusMessage.value = 'Preparing configuration...';
		  } else if (progress.value < 60) {
			statusMessage.value = 'Sending settings...';
		  } else if (progress.value < 90) {
			statusMessage.value = 'Applying configuration...';
		  } else {
			statusMessage.value = 'Finalizing...';
		  }
		} else {
		  clearInterval(interval);
		}
	  }, 200);
	  
	  // Clean up interval on unmount
	  return () => clearInterval(interval);
	}
  });
  
  // Helper methods
  function formatSettingName(key: string): string {
	if (key === 'radar_install_style') return 'Installation Method';
	if (key === 'radar_install_height') return 'Installation Height';
	if (key === 'rectangle') return 'Detection Boundary';
	if (key.startsWith('declare_area_')) return `Area: ${key.replace('declare_area_', '')}`;
	return key;
  }
  
  function formatSettingValue(key: string, value: ConfigValue): string {
	if (value === undefined || value === null) {
	  return '';
	}
	
	if (key === 'radar_install_style') {
	  return value === '0' ? 'Ceiling Mount' : 'Wall Mount';
	}
	
	if (key === 'radar_install_height') {
	  return `${value} dm`;
	}
	
	if (typeof value === 'string' && value.length > 20) {
	  return `${value.substring(0, 20)}...`;
	}
	
	return String(value);
  }
  
  function getDeviceValue(key: string): ConfigValue {
	// In a real implementation, this would come from props.differences
	// For now, return a placeholder
	return 'Different Value';
  }
  </script>
  
  <style scoped>
  .config-dialog-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
  }
  
  .config-dialog {
	width: 90%;
	max-width: 500px;
	background: white;
	border-radius: 4px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	overflow: hidden;
  }
  
  .dialog-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px 16px;
	background: #f8f8f8;
	border-bottom: 1px solid #eee;
  }
  
  .dialog-header h3 {
	margin: 0;
	font-size: 16px;
  }
  
  .close-button {
	background: none;
	border: none;
	font-size: 20px;
	cursor: pointer;
	color: #999;
  }
  
  .dialog-content {
	padding: 16px;
	max-height: 400px;
	overflow-y: auto;
  }
  
  .centered-content {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-align: center;
  }
  
  .differences-list {
	margin: 16px 0;
	max-height: 200px;
	overflow-y: auto;
	border: 1px solid #eee;
	border-radius: 4px;
  }
  
  .differences-list table {
	width: 100%;
	border-collapse: collapse;
  }
  
  .differences-list th,
  .differences-list td {
	padding: 8px 12px;
	text-align: left;
	border-bottom: 1px solid #eee;
  }
  
  .differences-list th {
	background: #f8f8f8;
  }
  
  .button-group {
	display: flex;
	justify-content: flex-end;
	margin-top: 16px;
	gap: 8px;
  }
  
  .primary-button {
	padding: 6px 16px;
	background: #1890ff;
	color: white;
	border: none;
	border-radius: 4px;
	cursor: pointer;
  }
  
  .primary-button:hover {
	background: #40a9ff;
  }
  
  .secondary-button {
	padding: 6px 16px;
	background: white;
	color: #666;
	border: 1px solid #ccc;
	border-radius: 4px;
	cursor: pointer;
  }
  
  .secondary-button:hover {
	background: #f5f5f5;
  }
  
  .progress-container {
	width: 100%;
	margin: 20px 0;
  }
  
  .progress-bar {
	height: 8px;
	background: #f0f0f0;
	border-radius: 4px;
	overflow: hidden;
  }
  
  .progress-fill {
	height: 100%;
	background: #1890ff;
	transition: width 0.3s ease;
  }
  
  .progress-text {
	text-align: center;
	margin-top: 4px;
	font-size: 12px;
	color: #666;
  }
  
  .status-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 60px;
	height: 60px;
	margin: 0 auto 16px;
	border-radius: 50%;
	font-size: 36px;
  }
  
  .status-icon.success {
	background: rgba(82, 196, 26, 0.1);
	color: #52c41a;
  }
  
  .status-icon.warning {
	background: rgba(250, 173, 20, 0.1);
	color: #faad14;
  }
  
  .status-icon.error {
	background: rgba(255, 77, 79, 0.1);
	color: #ff4d4f;
  }
  
  .status-icon.info {
	background: rgba(24, 144, 255, 0.1);
	color: #1890ff;
  }
  
  .status-icon.small {
	width: 20px;
	height: 20px;
	font-size: 12px;
	margin: 0 8px 0 0;
  }
  
  .status-list {
	margin: 16px 0;
	width: 100%;
  }
  
  .status-item {
	display: flex;
	align-items: center;
	padding: 8px 0;
	border-bottom: 1px solid #f0f0f0;
  }
  
  .status-item.success {
	color: #52c41a;
  }
  
  .status-item.error {
	color: #ff4d4f;
  }
  
  .status-text,
  .error-details {
	margin: 8px 0;
	font-size: 14px;
	color: #666;
  }
  
  .error-details {
	color: #ff4d4f;
  }
  </style>