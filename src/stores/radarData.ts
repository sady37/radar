// stores/radarData.ts
import { defineStore } from "pinia";
import { ref, watch } from "vue";
import type { PersonData, VitalSignData } from "./types";
import { MockRadarService } from "../utils/mockRadarData";
import { getHeartRateStatus, getBreathingStatus, getPostureLevel } from "../utils/postureIcons";

export const useRadarDataStore = defineStore("radarData", () => {
 // Basic states
 const currentPersons = ref<PersonData[]>([])
 const currentVital = ref<VitalSignData | null>(null)
 const mockService = ref(new MockRadarService())

 // Alarm states 
 const l1Audio = ref<HTMLAudioElement | null>(null)
 const l2Audio = ref<HTMLAudioElement | null>(null)
 const lastVitalUpdate = ref(Date.now())
 const lastPostureUpdate = ref(Date.now())

 // Constants
 const VITAL_TIMEOUT = 5000  // 5s
 const POSTURE_TIMEOUT = 2000 // 2s

 // Alarm initialization
 function initAlarms() {
   l1Audio.value = new Audio('/assets/alarms/l1-alarm.mp3')
   l2Audio.value = new Audio('/assets/alarms/l2-alarm.mp3')
   if(l1Audio.value) l1Audio.value.loop = true
   if(l2Audio.value) l2Audio.value.loop = false
 }

 // Alarm controls
 function playL1Alarm() {
   if(l2Audio.value) l2Audio.value.pause()
   if(l1Audio.value) {
     l1Audio.value.play()
     setTimeout(() => l1Audio.value?.pause(), 3000)
   }
 }

 function playL2Alarm() {
   if(l1Audio.value) l1Audio.value.pause()
   if(l2Audio.value) {
     l2Audio.value.play()
     setTimeout(() => l2Audio.value?.pause(), 1000)
   }
 }

 function stopAlarms() {
   l1Audio.value?.pause()
   l2Audio.value?.pause()
 }

 // Data stream control
 function startDataStream() {
   console.log('Starting data stream...')
   mockService.value.startMockDataStream(
     (personsData) => {
       currentPersons.value = personsData
       lastPostureUpdate.value = Date.now()
     },
     (vitalData) => {
       console.log('Vital data:', vitalData)
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

   if(!person || !vital) {
     stopAlarms()
     return
   }

   // Check posture level
   const postureLevel = getPostureLevel(person.posture)
   
   // Check vital signs
   const heartStatus = getHeartRateStatus(vital.heartRate)
   const breathStatus = getBreathingStatus(vital.breathing)

   if(postureLevel === 'danger' || heartStatus === 'danger' || breathStatus === 'danger') {
     playL1Alarm()
   } else if(postureLevel === 'warning' || heartStatus === 'warning' || breathStatus === 'warning') {
     playL2Alarm()
   } else {
     stopAlarms()
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