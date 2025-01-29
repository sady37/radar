// stores/radarData.ts
import { defineStore } from 'pinia';
import type { PersonData, VitalSignData } from './types';
import { MockRadarService } from '../utils/mockRadarData';

export const useRadarDataStore = defineStore('radarData', {
  state: () => ({
    //currentPerson: null as PersonData | null,
    currentPersons: [] as PersonData[],  // 改为数组存储多人数据
    currentVital: null as VitalSignData | null,
    mockService: new MockRadarService()
  }),

  actions: {
    startDataStream() {
      this.mockService.startMockDataStream(
		  (personsData) => {
          this.currentPersons = personsData;
		  },
		  (vitalData) => {
          this.currentVital = vitalData;
		  }
      );
	  },
  

    stopDataStream() {
      this.mockService.stopMockDataStream();
    },

    updatePersonsData(data: PersonData[]) {
      this.currentPersons = data;
	  },
  
	  updateVitalSign(data: VitalSignData) {
      this.currentVital = data;
	  }
  }
});