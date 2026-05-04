import dotenv from 'dotenv';
import path from 'path';

// Explicitly load the .env.local file
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { db, pool } from "../src/db/index";
import {
  regions,
  crops,
  markets,
  priceHistory,
  demandData,
} from "../src/db/schema";

const rawData = `
2020
REGION XII (SOCCSKSARGEN)
Rice Special 45.42 44.74 44.30 46.12 47.05 46.43 45.45 45.55 45.09 44.56 44.39 44.40
Rice Premium 41.15 40.52 40.37 43.07 44.24 44.68 42.77 42.48 41.91 40.88 40.95 41.34
Well Milled Rice (WMR) 38.00 36.83 36.53 39.19 41.72 42.94 40.18 39.60 38.73 37.81 36.82 36.62
Regular Milled Rice (RMR) 34.43 33.59 33.98 37.86 39.70 40.73 37.79 37.23 36.40 34.80 32.16 32.59
Tomato, ripe 33.00 31.00 31.00 37.00 35.75 37.00 46.80 37.50 30.68 41.75 66.00 65.80
Corngrain Yellow 13.20 11.63 .. .. .. .. .. .. .. .. .. ..
Corngrain White 11.78 11.26 .. .. .. .. .. .. .. .. .. ..
Corngrits Yellow 25.02 24.49 23.68 22.78 23.24 23.28 23.36 23.73 23.87 23.13 22.17 22.79
Corngrits White 27.20 25.32 24.84 30.58 31.67 30.97 29.20 29.78 28.92 28.22 26.40 27.17
2021
North Cotabato
FRESH FRUIT, BANANA, LAKATAN, MEDIUM, 1 KG 35.63 36.88 38.13 39.38 40.00 36.25 36.88 35.17 35.00 35.00 36.25 38.13
FRESH FRUIT, BANANA, SABA, MEDIUM, 1 KG 28.75 30.00 31.25 33.75 34.38 33.75 33.13 32.58 32.03 33.69 33.69 32.03
FRESH FRUIT, MANGO, PIKO, RIPE, MEDIUM, 1 KG 90.63 98.75 98.75 106.88 83.75 77.50 88.75 91.25 87.50 86.25 85.00 82.50
FRESH FRUIT, PINEAPPLE, PINYA, MEDIUM, 1 KG 31.25 30.63 29.38 28.75 31.88 30.63 31.25 31.25 30.63 30.63 31.25 31.25
FRESH FRUIT, WATERMELON, PAKWAN, MEDIUM, 1 KG 28.13 30.00 30.63 28.13 26.25 22.25 24.75 25.00 27.50 27.50 29.38 29.38
CALAMANSI, 1 KG 43.75 48.75 48.13 45.00 47.50 48.75 43.75 40.55 44.60 47.64 44.93 43.22
FRESH FRUIT, PAPAYA, NATIVE, MEDIUM, 1 KG 30.63 30.00 30.00 27.50 30.00 27.50 27.50 27.50 30.63 31.25 31.25 31.25
2025
REGION XII (SOCCSKSARGEN)
Rice Special 50.02 48.96 46.69 45.67 43.88 42.21 40.67 40.67 44.13 46.46 50.21 51.31
Rice Premium 46.82 43.93 41.32 38.98 38.74 38.45 38.35 38.28 38.11 38.61 40.74 46.84
Well Milled Rice (WMR) 42.74 40.67 39.07 37.20 36.46 36.23 35.35 34.96 34.82 34.94 35.93 40.34
Regular Milled Rice (RMR) 39.94 37.25 36.15 35.04 34.88 35.03 34.46 33.67 32.76 32.97 34.16 37.35
`;

async function seedFromRawText(allCrops: any[], allRegions: any[]) {
  console.log("🌱 Seeding from raw text data...");
  const lines = rawData.trim().split("\n");
  let currentYear = 0;
  let currentRegionName = "";
  const priceData: any[] = [];

  const cropNameMapping: Record<string, string> = {
    "Rice Special": "Rice",
    "Rice Premium": "Rice",
    "Well Milled Rice (WMR)": "Rice",
    "Regular Milled Rice (RMR)": "Rice",
    "Corngrain Yellow": "Corn (Maize)",
    "Corngrain White": "Corn (Maize)",
    "Corngrits Yellow": "Corn (Maize)",
    "Corngrits White": "Corn (Maize)",
    "FRESH FRUIT, BANANA, LAKATAN, MEDIUM, 1 KG": "Banana",
    "FRESH FRUIT, BANANA, SABA, MEDIUM, 1 KG": "Banana",
    "FRESH FRUIT, MANGO, PIKO, RIPE, MEDIUM, 1 KG": "Mango",
    "FRESH FRUIT, PINEAPPLE, PINYA, MEDIUM, 1 KG": "Pineapple",
    "FRESH FRUIT, WATERMELON, PAKWAN, MEDIUM, 1 KG": "Watermelon",
    "CALAMANSI, 1 KG": "Calamansi",
    "FRESH FRUIT, PAPAYA, NATIVE, MEDIUM, 1 KG": "Papaya",
    "Tomato, ripe": "Tomato",
  };

  const cotabatoMunicipalities = allRegions.filter(r => r.province === "Cotabato");
  const defaultRegion = allRegions.find(r => r.name === "Kidapawan City");

  for (const line of lines) {
    if (line.match(/^\d{4}$/)) {
      currentYear = parseInt(line);
      console.log(`\nProcessing year: ${currentYear}`);
      continue;
    }
    if (line.includes("REGION XII") || line.includes("North Cotabato")) {
      currentRegionName = line.trim();
      console.log(`Processing region: ${currentRegionName}`);
      continue;
    }

    const parts = line.split(/(\d+\.\d+)/).filter(p => p.trim() !== "");
    if (parts.length < 2) {
      console.log(`Skipping line (not enough parts): "${line}"`);
      continue;
    }

    const rawCropName = parts[0].trim();
    const dbCropName = cropNameMapping[rawCropName];
    if (!dbCropName) {
      console.log(`Skipping line (no crop mapping for): "${rawCropName}"`);
      continue;
    }

    const crop = allCrops.find(c => c.name === dbCropName);
    if (!crop) {
      console.log(`Skipping line (crop not found in DB): "${dbCropName}"`);
      continue;
    }

    console.log(`Found crop: ${dbCropName} (ID: ${crop.id})`);
    const prices = line.match(/\d+\.\d+/g) || [];
    console.log(`  - Prices: [${prices.join(", ")}]`);

    // If it's the 2025 data, apply it to all municipalities
    if (currentYear === 2025 && dbCropName === 'Rice') {
      for (const region of cotabatoMunicipalities) {
        for (let i = 0; i < prices.length; i++) {
          const price = parseFloat(prices[i]);
          if (!isNaN(price)) {
            priceData.push({
              cropId: crop.id,
              regionId: region.id,
              price: price.toFixed(2),
              month: i + 1,
              year: currentYear,
              quantity: Math.round(1000 + Math.random() * 5000),
            });
          }
        }
      }
    } else { // For other years, use the default region logic
      if (!defaultRegion) continue;
      for (let i = 0; i < prices.length; i++) {
        const price = parseFloat(prices[i]);
        if (!isNaN(price)) {
          priceData.push({
            cropId: crop.id,
            regionId: defaultRegion.id,
            price: price.toFixed(2),
            month: i + 1,
            year: currentYear,
            quantity: Math.round(1000 + Math.random() * 5000),
          });
        }
      }
    }
  }

  if (priceData.length > 0) {
    for (let i = 0; i < priceData.length; i += 100) {
      const batch = priceData.slice(i, i + 100);
      await db.insert(priceHistory).values(batch);
    }
    console.log(`✅ Inserted ${priceData.length} price history records from raw text`);
  }
}


async function seed() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await db.delete(demandData);
  await db.delete(priceHistory);
  await db.delete(markets);
  await db.delete(crops);
  await db.delete(regions);

  // 1. Regions
  const regionData = await db
    .insert(regions)
    .values([
      { name: "Kidapawan City", province: "Cotabato", latitude: "7.0083", longitude: "125.0894" },
      { name: "Alamada", province: "Cotabato", latitude: "7.3667", longitude: "124.5500" },
      { name: "Aleosan", province: "Cotabato", latitude: "7.1500", longitude: "124.5833" },
      { name: "Antipas", province: "Cotabato", latitude: "7.2333", longitude: "125.0500" },
      { name: "Arakan", province: "Cotabato", latitude: "7.3667", longitude: "125.1333" },
      { name: "Banisilan", province: "Cotabato", latitude: "7.4833", longitude: "124.7167" },
      { name: "Carmen", province: "Cotabato", latitude: "7.2000", longitude: "124.7833" },
      { name: "Kabacan", province: "Cotabato", latitude: "7.1167", longitude: "124.8167" },
      { name: "Libungan", province: "Cotabato", latitude: "7.2333", longitude: "124.5167" },
      { name: "M'lang", province: "Cotabato", latitude: "6.9500", longitude: "124.8833" },
      { name: "Magpet", province: "Cotabato", latitude: "7.1000", longitude: "125.1167" },
      { name: "Makilala", province: "Cotabato", latitude: "6.9667", longitude: "125.0833" },
      { name: "Matalam", province: "Cotabato", latitude: "7.0000", longitude: "124.9000" },
      { name: "Midsayap", province: "Cotabato", latitude: "7.1833", longitude: "124.5333" },
      { name: "Pigcawayan", province: "Cotabato", latitude: "7.2833", longitude: "124.4333" },
      { name: "Pikit", province: "Cotabato", latitude: "7.0500", longitude: "124.6167" },
      { name: "President Roxas", province: "Cotabato", latitude: "7.1500", longitude: "125.0500" },
      { name: "Tulunan", province: "Cotabato", latitude: "6.8333", longitude: "124.8667" },
      // Keeping these other regions for context, but they won't be shown in the dropdown
      { name: "Davao City", province: "Davao del Sur", latitude: "7.0644", longitude: "125.6078" },
      { name: "General Santos", province: "South Cotabato", latitude: "6.1129", longitude: "125.1717" },
    ])
    .returning();
  console.log(`✅ Inserted ${regionData.length} regions`);

  // 2. Crops
  const cropData = await db
    .insert(crops)
    .values([
      { name: "Corn (Maize)", category: "grain", unit: "kg", seasonStart: 5, seasonEnd: 10, basePrice: "12.50", region: "SOCCSKSARGEN" },
      { name: "Rice", category: "grain", unit: "kg", seasonStart: 6, seasonEnd: 11, basePrice: "45.26", region: "SOCCSKSARGEN" },
      { name: "Banana", category: "fruit", unit: "kg", seasonStart: 1, seasonEnd: 12, basePrice: "36.89", region: "North Cotabato" },
      { name: "Coconut", category: "fruit", unit: "pc", seasonStart: 1, seasonEnd: 12, basePrice: "15.00", region: "North Cotabato" },
      { name: "Eggplant", category: "vegetable", unit: "kg", seasonStart: 9, seasonEnd: 3, basePrice: "35.00", region: "North Cotabato" },
      { name: "Tomato", category: "vegetable", unit: "kg", seasonStart: 10, seasonEnd: 4, basePrice: "40.00", region: "North Cotabato" },
      { name: "Okra", category: "vegetable", unit: "kg", seasonStart: 3, seasonEnd: 8, basePrice: "25.00", region: "North Cotabato" },
      { name: "String Beans", category: "vegetable", unit: "kg", seasonStart: 4, seasonEnd: 9, basePrice: "28.00", region: "North Cotabato" },
      { name: "Cabbage", category: "vegetable", unit: "kg", seasonStart: 11, seasonEnd: 4, basePrice: "38.00", region: "North Cotabato" },
      { name: "Coffee", category: "grain", unit: "kg", seasonStart: 10, seasonEnd: 3, basePrice: "120.00", region: "North Cotabato" },
      { name: "Calamansi", category: "fruit", unit: "kg", seasonStart: 1, seasonEnd: 12, basePrice: "45.55", region: "North Cotabato" },
      { name: "Mango", category: "fruit", unit: "kg", seasonStart: 4, seasonEnd: 7, basePrice: "90.00", region: "North Cotabato" },
      { name: "Pineapple", category: "fruit", unit: "kg", seasonStart: 5, seasonEnd: 7, basePrice: "30.00", region: "North Cotabato" },
      { name: "Watermelon", category: "fruit", unit: "kg", seasonStart: 3, seasonEnd: 6, basePrice: "28.00", region: "North Cotabato" },
      { name: "Papaya", category: "fruit", unit: "kg", seasonStart: 1, seasonEnd: 12, basePrice: "30.00", region: "North Cotabato" },
    ])
    .returning();
  console.log(`✅ Inserted ${cropData.length} crops`);

  // 3. Markets
  const marketData = await db
    .insert(markets)
    .values([
      { name: "Midsayap Public Market", regionId: 2, latitude: "7.1900", longitude: "124.5300", type: "public" },
      { name: "Kidapawan City Public Market", regionId: 3, latitude: "7.0100", longitude: "125.0900", type: "public" },
      { name: "North Cotabato Agri-Trading Center", regionId: 1, latitude: "7.2200", longitude: "124.2500", type: "wholesale" },
      { name: "Davao City Farmers Market", regionId: 4, latitude: "7.0700", longitude: "125.6100", type: "wholesale" },
      { name: "General Santos Fishport Complex", regionId: 5, latitude: "6.1200", longitude: "125.1700", type: "public" },
      { name: "Cotabato Corn Processing Center", regionId: 1, latitude: "7.2150", longitude: "124.2480", type: "wholesale" },
    ])
    .returning();
  console.log(`✅ Inserted ${marketData.length} markets`);

  // Seed from raw text data
  await seedFromRawText(cropData, regionData);

  // 4. Historical Price Data (2022-2024)
  const priceData: any[] = [];
  const years = [2022, 2023, 2024];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const cotabatoRegions = regionData.filter(r => r.province === 'Cotabato');

  const basePrices: { [key: string]: number } = {
    "Corn (Maize)": 14.10,
    "Rice": 24.81,
    "Banana": 16.87,
    "Coconut": 15.00,
    "Eggplant": 35.00,
    "Tomato": 40.00,
    "Okra": 25.00,
    "String Beans": 28.00,
    "Cabbage": 38.00,
    "Coffee": 120.00,
    "Calamansi": 45.55,
  };

  for (const region of cotabatoRegions) {
    for (const crop of cropData) {
      const basePrice = basePrices[crop.name];
      if (!basePrice) continue;

      for (const year of years) {
        for (const month of months) {
          // Introduce municipality-specific variation (e.g., based on a hash of its name)
          const regionVariation = (region.name.charCodeAt(0) % 10 - 5) / 100; // -5% to +4%

          // Seasonal variation
          const seasonalFactor = Math.sin((month - (crop.seasonStart || 6)) * (Math.PI / 6)) * 0.1; // +/- 10%

          // Annual trend
          const trendFactor = (year - 2022) * 0.05; // 5% annual increase

          // Random fluctuation
          const randomFactor = (Math.random() - 0.5) * 0.1; // +/- 5%

          const price = basePrice * (1 + regionVariation + seasonalFactor + trendFactor + randomFactor);

          priceData.push({
            cropId: crop.id,
            regionId: region.id,
            price: price.toFixed(2),
            month,
            year,
            quantity: Math.round(1000 + Math.random() * 5000),
          });
        }
      }
    }
  }

  if (priceData.length > 0) {
    for (let i = 0; i < priceData.length; i += 100) {
      const batch = priceData.slice(i, i + 100);
      await db.insert(priceHistory).values(batch);
    }
    console.log(`✅ Inserted ${priceData.length} historical price records for all municipalities.`);
  }

  // 5. Demand Data
  const demandDataEntries: any[] = [];

  for (const region of cotabatoRegions) {
    for (const crop of cropData) {
      for (const year of years) {
        for (const month of months) {
          // Seasonal demand: higher during harvest season
          const harvestSeason = month >= (crop.seasonStart || 1) && month <= (crop.seasonEnd || 12);
          const demandRand = Math.random();
          let demand: string;
          if (harvestSeason) {
            demand = demandRand < 0.6 ? "High" : demandRand < 0.85 ? "Medium" : "Low";
          } else {
            demand = demandRand < 0.2 ? "High" : demandRand < 0.5 ? "Medium" : "Low";
          }

          demandDataEntries.push({
            cropId: crop.id,
            regionId: region.id,
            demandLevel: demand,
            month,
            year,
            populationEstimate: Math.round(150000 + Math.random() * 50000),
          });
        }
      }
    }
  }

  if (demandDataEntries.length > 0) {
    for (let i = 0; i < demandDataEntries.length; i += 100) {
      const batch = demandDataEntries.slice(i, i + 100);
      await db.insert(demandData).values(batch);
    }
    console.log(`✅ Inserted ${demandDataEntries.length} demand data records for all municipalities.`);
  }

  console.log("🎉 Seeding complete!");
}

seed()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });