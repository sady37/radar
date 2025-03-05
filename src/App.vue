<template>
	<div class="app-container">
	  <div class="radar-system">
		<div class="canvas-container">
		  <RadarCanvas />
		</div>
		<div class="spacer" @click="toggleToolbar">
		  <span class="toggle-icon">{{ isToolbarOpen ? "》" : "《" }}</span>
		</div>
		<div 
		  class="toolbar-container" 
		  :class="{ 'toolbar-closed': !isToolbarOpen }"
		  >
		  <RadarToolbar @send-config="handleSendConfig" />
		</div>
	  </div>
	  
	  <!-- Configuration dialog component -->
	  <RadarConfigDialog
		v-if="configDialogVisible"
		:state="dialogState"
		:differences="configDifferences"
		:title="dialogTitle"
		@close="configDialogVisible = false"
		@sync-to-device="handleSyncToDevice"
		@ignore="handleIgnore"
	  />
	</div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from "vue";
  import RadarCanvas from "./components/RadarCanvas.vue";
  import RadarToolbar from "./components/RadarToolbar.vue";
  import RadarConfigDialog from "./components/RadarConfigDialog.vue";
  import { useRadarConfigStore } from "./stores/radarConfig";
  import { RadarConfigManager } from "./services/radarConfigManager";
  
  const isToolbarOpen = ref(true);
  const configStore = useRadarConfigStore();
  const configManager = new RadarConfigManager(configStore);
  
  // Dialog state management
  const configDialogVisible = ref(false);
  const dialogState = ref('');
  const dialogTitle = ref('');
  const configDifferences = ref({});
  
  const toggleToolbar = () => {
	isToolbarOpen.value = !isToolbarOpen.value;
  };
  
  // Initialize on component mount
  onMounted(async () => {
	// Get active radar ID from store or props
	const currentRadarId = getCurrentRadarId();
	
	// Initialize radar configuration
	const initResult = await configManager.initialize(currentRadarId);
	if (initResult.hasDifferences) {
	  // Show configuration differences dialog
	  configDifferences.value = initResult.differences;
	  dialogState.value = 'difference_found';
	  dialogTitle.value = 'Configuration Differences';
	  configDialogVisible.value = true;
	}
  });
  
  // Get current active radar ID
  function getCurrentRadarId() {
	// This could come from route params, store state, or other sources
	// For now, return a placeholder
	return 'Radar_' + Date.now();
  }
  
  // Handle "Send Configuration" event from toolbar
  async function handleSendConfig(radarId) {
	dialogState.value = 'sending';
	dialogTitle.value = 'Sending Configuration';
	configDialogVisible.value = true;
	
	try {
	  const result = await configManager.sendConfig(radarId);
	  
	  if (result.status === 'no_changes') {
		dialogState.value = 'no_changes';
		dialogTitle.value = 'No Changes';
		setTimeout(() => { configDialogVisible.value = false; }, 2000);
		return;
	  }
	  
	  if (result.allSucceeded) {
		dialogState.value = 'success';
		dialogTitle.value = 'Success';
	  } else {
		dialogState.value = 'partial_success';
		dialogTitle.value = 'Partial Success';
	  }
	  
	  // Store success/failure details for display
	  configDifferences.value = {
		succeededItems: result.succeededItems || [],
		failedItems: result.failedItems || []
	  };
	} catch (error) {
	  dialogState.value = 'error';
	  dialogTitle.value = 'Error';
	  console.error('Configuration send error:', error);
	}
  }
  
  // Handle "Sync to Device" action from dialog
  async function handleSyncToDevice() {
	dialogState.value = 'sending';
	dialogTitle.value = 'Syncing to Device';
	
	try {
	  const currentRadarId = getCurrentRadarId();
	  const result = await configManager.sendConfig(currentRadarId);
	  
	  if (result.allSucceeded) {
		dialogState.value = 'success';
		dialogTitle.value = 'Sync Successful';
	  } else {
		dialogState.value = 'partial_success';
		dialogTitle.value = 'Sync Partially Successful';
		configDifferences.value = {
		  succeededItems: result.succeededItems || [],
		  failedItems: result.failedItems || []
		};
	  }
	} catch (error) {
	  dialogState.value = 'error';
	  dialogTitle.value = 'Sync Failed';
	  console.error('Sync error:', error);
	}
  }
  
  // Handle "Ignore" action from dialog
  function handleIgnore() {
	configDialogVisible.value = false;
  }
  </script>
  
  <style lang="scss">
  .app-container {
	padding: 5px;
	background-color: #f0f0f0;
  }
  
  .radar-system {
	display: flex;
	height: 520px;
	border-radius: 2px;
	overflow: hidden;
  }
  
  .canvas-container {
	width: 620px;
	height: 520px;
	border: 1px solid #ccc;
	background-color: white;
  }
  
  .spacer {
	width: 10px;
	height: 520px;
	background-color: #e0e0e0;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	border-top: 1px solid #ccc;
	border-bottom: 1px solid #ccc;
  
	&:hover {
	  background-color: #d0d0d0;
	}
  
	.toggle-icon {
	  -webkit-user-select: none;  // Safari 3+
	  -moz-user-select: none;     // Firefox
	  -ms-user-select: none;      // IE 10+
	  user-select: none;          // Standard syntax
	  color: #666;
	  user-select: none;
	}
  }
  
  .toolbar-container {
	width: 170px;
	height: 520px;
	background-color: #f8f8f8;
	transition: width 0.3s ease;
	border: 1px solid #ccc;
	border-left: none;
  
	&.toolbar-closed {
	  width: 0;
	  overflow: hidden;
	}
  }
  
  * {
	box-sizing: border-box;
	margin: 0;
	padding: 0;
  }
  </style>
  
  <!-- <userStyle>Normal</userStyle> -->