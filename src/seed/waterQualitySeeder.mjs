import WaterQualityData from "../models/WaterQualityData.mjs";

export const seedWaterQuality = async () => {

  const waterQualitySeed = [
    {
      deviceId: "WM-1001",
      pH: 7.2,
      tds: 320,
      electricalConductivity: 450,
      turbidity: 1.5,
      waterQualityIndex: 88,
      location: { district: "Lilongwe", treatmentPlantId: "TP-01" }
    },
    {
      deviceId: "WM-1002",
      pH: 6.9,
      tds: 350,
      electricalConductivity: 470,
      turbidity: 2.0,
      waterQualityIndex: 82,
      location: { district: "Blantyre", treatmentPlantId: "TP-02" }
    },
    {
      deviceId: "WM-1003",
      pH: 7.5,
      tds: 300,
      electricalConductivity: 420,
      turbidity: 1.1,
      waterQualityIndex: 90,
      location: { district: "Mzuzu", treatmentPlantId: "TP-03" }
    },
    {
      deviceId: "WM-1004",
      pH: 6.8,
      tds: 400,
      electricalConductivity: 500,
      turbidity: 2.5,
      waterQualityIndex: 78,
      location: { district: "Zomba", treatmentPlantId: "TP-04" }
    },
    {
      deviceId: "WM-1005",
      pH: 7.1,
      tds: 310,
      electricalConductivity: 430,
      turbidity: 1.7,
      waterQualityIndex: 86,
      location: { district: "Kasungu", treatmentPlantId: "TP-05" }
    },
    {
      deviceId: "WM-1006",
      pH: 7.3,
      tds: 290,
      electricalConductivity: 410,
      turbidity: 1.3,
      waterQualityIndex: 91,
      location: { district: "Salima", treatmentPlantId: "TP-06" }
    },
    {
      deviceId: "WM-1007",
      pH: 6.7,
      tds: 420,
      electricalConductivity: 520,
      turbidity: 3.0,
      waterQualityIndex: 74,
      location: { district: "Mangochi", treatmentPlantId: "TP-07" }
    },
    {
      deviceId: "WM-1008",
      pH: 7.4,
      tds: 305,
      electricalConductivity: 435,
      turbidity: 1.4,
      waterQualityIndex: 89,
      location: { district: "Dedza", treatmentPlantId: "TP-08" }
    },
    {
      deviceId: "WM-1009",
      pH: 7.0,
      tds: 340,
      electricalConductivity: 455,
      turbidity: 1.9,
      waterQualityIndex: 84,
      location: { district: "Nkhotakota", treatmentPlantId: "TP-09" }
    },
    {
      deviceId: "WM-1010",
      pH: 7.6,
      tds: 280,
      electricalConductivity: 400,
      turbidity: 1.0,
      waterQualityIndex: 93,
      location: { district: "Karonga", treatmentPlantId: "TP-10" }
    }
  ];

  await WaterQualityData.deleteMany();
  await WaterQualityData.insertMany(waterQualitySeed);

  console.log("Water quality data seeded");
};