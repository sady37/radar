// stores/radarData.ts
import { defineStore } from "pinia";
import type { PersonData, VitalSignData } from "./types";
import { MockRadarService } from "../utils/mockRadarData";

export const useRadarDataStore = defineStore("radarData", {
  state: () => ({
    //currentPerson: null as PersonData | null,
    currentPersons: [] as PersonData[], // 改为数组存储多人数据
    currentVital: null as VitalSignData | null,
    mockService: new MockRadarService(),
  }),

  actions: {
    startDataStream() {
		console.log('Starting data stream...');
      this.mockService.startMockDataStream(
        (personsData) => {
          this.currentPersons = personsData;
        },
        (vitalData) => {
			console.log('Vital data:', vitalData);
          this.currentVital = vitalData;
        },
      );
    },

    stopDataStream() {
      this.mockService.stopDataStream();
    },

    updatePersonsData(data: PersonData[]) {
      this.currentPersons = data;
    },

    updateVitalSign(data: VitalSignData) {
      this.currentVital = data;
    },
  },
});
