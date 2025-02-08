// stores/radarData.ts
import { defineStore } from "pinia";
import { ref, watch } from "vue";

import { MockRadarService } from "../utils/mockRadarData";
import type { PersonData, VitalSignData, PersonPosture } from './types'
import { getHeartRateStatus, getBreathingStatus, getPostureLevel } from "../utils/postureIcons"
export const useRadarDataStore = defineStore("radarData", () => {
 // Basic states
 const currentPersons = ref<PersonData[]>([])
 const currentVital = ref<VitalSignData | null>(null)
 const mockService = ref(new MockRadarService())

const l1CooldownUntil = ref(0)  // Timestamp when L1 cooldown ends
const l2CooldownUntil = ref(0)  // Timestamp when L2 cooldown ends

 // Alarm states 
 const l1Audio = ref<HTMLAudioElement | null>(null)
 const l2Audio = ref<HTMLAudioElement | null>(null)
 const lastVitalUpdate = ref(Date.now())
 const lastPostureUpdate = ref(Date.now())

 // Constants   // 时间常量
 const VITAL_TIMEOUT = 2000  // 2s生命体征超时
 const POSTURE_TIMEOUT = 2000 // 2s 姿势超时

const L1_ALARM_DURATION = 11000 // 10s L1 警报持续时间
const L2_ALARM_DURATION = 1000  // 1s
const ALARM_COOLDOWN = 15000    // 15 seconds cooldown 避免警报频繁触发

const FALL_CONFIRM_DURATION = 5000  // 5秒检测时间
const fallConfirmStartTime = ref(0)  // 跟踪确认跌倒的开始时间


 // Alarm initialization
 function initAlarms() {
	  l1Audio.value = new Audio('/alarms/L1_alarm.mp3');
	  l2Audio.value = new Audio('/alarms/L2_alarm.mp3');
	  if(l1Audio.value) l1Audio.value.loop = true;
	  if(l2Audio.value) l2Audio.value.loop = false;
  }
  
  /*
Adds cooldown timers that track when each type of alarm can play again
After L1 alarm ends, blocks all alarms for 15 seconds
After L2 alarm ends, only blocks L2 alarms for 15 seconds
Respects existing alarm priorities (L1 still cancels L2)
Resets cooldown timers when alarms are manually stopped
*/
// 播放 L1 警报
function playL1Alarm() {
	const now = Date.now()
	
	// Check if in any cooldown period
	if (now < l1CooldownUntil.value) {
	  return // Still in cooldown, don't play
	}
  
	if(l2Audio.value) {
		l2Audio.value.pause()
		l2Audio.value.currentTime = 0
	  }

  if(l1Audio.value) {
    console.log('Starting L1 alarm')
    l1Audio.value.play().catch(e => console.error('L1 audio play error:', e))
    // 不再设置自动停止的定时器，而是依赖状态检查来停止警报
    l1CooldownUntil.value = Date.now() + ALARM_COOLDOWN
  }
	
  }
  
// 播放 L2 警报
function playL2Alarm() {
	const now = Date.now()
	
	// 检查 cooldown
	if (now < l1CooldownUntil.value || now < l2CooldownUntil.value) {
	  console.log('L2 blocked by cooldown')
	  return
	}
  
	// 检查是否正在播放，使用 paused 属性
	if(l2Audio.value && !l2Audio.value.paused) {
	  console.log('L2 already playing')
	  return
	}
  
	if(l1Audio.value) return;
	if(l2Audio.value) {
	  console.log('Starting L2 alarm')
	  // 立即设置 cooldown，而不是等到播放结束
	  l2CooldownUntil.value = Date.now() + ALARM_COOLDOWN
	  
	  l2Audio.value.play();
	  setTimeout(() => {
		if(l2Audio.value) {
		  console.log('L2 alarm finished')
		  l2Audio.value.pause();
		  l2Audio.value.currentTime = 0;
		}
	  }, L2_ALARM_DURATION);
	}
  }

  function stopAlarms() {
	l1Audio.value?.pause()
	l2Audio.value?.pause()
	// Reset cooldown timers
	l1CooldownUntil.value = 0
	l2CooldownUntil.value = 0
  }

 // Data stream control
 function startDataStream() {
   initAlarms() // 
   mockService.value.startMockDataStream(
     (personsData) => {
       currentPersons.value = personsData
       lastPostureUpdate.value = Date.now()
     },
     (vitalData) => {
       currentVital.value = vitalData
       lastVitalUpdate.value = Date.now()
     }
   )
 }

 function stopDataStream() {
   mockService.value.stopDataStream()
   stopAlarms()
 }

 // Cleanup old data
 function cleanupStaleData() {
   const now = Date.now()
   
   // Clear vital signs if no updates
   if (now - lastVitalUpdate.value > VITAL_TIMEOUT) {
     currentVital.value = null
   }

   // Clear posture if no updates
   if (now - lastPostureUpdate.value > POSTURE_TIMEOUT && currentPersons.value.length > 0) {
     const updatedPerson = { ...currentPersons.value[0] }
     updatedPerson.posture = 0
     currentPersons.value = [updatedPerson]
   }
 }

 // Check for alarm conditions
 function checkAlarmTriggers() {
	const person = currentPersons.value[0]
	const vital = currentVital.value
	const now = Date.now()
  
	// 检查是否存在危险状态
	let hasDangerState = false
  
	// 1. 检查跌倒状态
	if(person?.posture === 5 || person?.posture === 8) {  // FallConfirm 或 SitGroundConfirm
	  if(fallConfirmStartTime.value === 0) {
		fallConfirmStartTime.value = now
		console.log('Fall/SitGround confirm detected, starting timer')
	  } else if(now - fallConfirmStartTime.value >= FALL_CONFIRM_DURATION) {
		console.log('Fall/SitGround confirm exceeded threshold, triggering L1 alarm')
		hasDangerState = true
		playL1Alarm()
	  }
	} else {
	  if(fallConfirmStartTime.value !== 0) {
		console.log('Fall/SitGround confirm cleared')
		fallConfirmStartTime.value = 0
	  }
	}
  
	// 2. 检查生命体征
	if(vital) {
	  const heartStatus = getHeartRateStatus(vital.heartRate)
	  const breathStatus = getBreathingStatus(vital.breathing)
  
	  if(heartStatus === 'danger' || breathStatus === 'danger') {
		hasDangerState = true
		playL1Alarm()
	  } else if(heartStatus === 'warning' || breathStatus === 'warning') {
		playL2Alarm()
	  }
	}
  
	// 3. 如果没有危险状态，停止L1警报
	if(!hasDangerState && l1Audio.value && !l1Audio.value.paused) {
	  console.log('No danger state detected, stopping L1 alarm')
	  l1Audio.value.pause()
	  l1Audio.value.currentTime = 0
	}
  }

 // Update functions
 function updatePersonsData(data: PersonData[]) {
   currentPersons.value = data
   lastPostureUpdate.value = Date.now()
 }

 function updateVitalSign(data: VitalSignData) {
   currentVital.value = data
   lastVitalUpdate.value = Date.now()
 }

 // Watchers
 watch([currentPersons, currentVital], () => {
   checkAlarmTriggers()
 })

 // Cleanup timer
 const cleanupInterval = setInterval(cleanupStaleData, 1000)

 return {
   currentPersons,
   currentVital,
   startDataStream,
   stopDataStream,
   updatePersonsData,
   updateVitalSign,
   initAlarms,
   stopAlarms
 }
})