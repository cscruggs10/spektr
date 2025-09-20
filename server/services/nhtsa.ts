import { db } from "../db";
import { vehicleMakes, vehicleModels, insertVehicleMakeSchema, insertVehicleModelSchema } from "../../shared/schema.js";
import { eq, sql } from "drizzle-orm";

interface NHTSAMakeResult {
  Make_ID: string;
  Make_Name: string;
}

interface NHTSAModelResult {
  Model_ID: string;
  Model_Name: string;
}

interface NHTSADecodeVinResult {
  Value: string;
  ValueId: string;
  Variable: string;
  VariableId: number;
}

const NHTSA_API_URL = 'https://vpic.nhtsa.dot.gov/api';
const CACHE_LIFETIME_MS = 86400000; // 24 hours

let cacheMakesTimestamp: number | null = null;
let cacheModelsTimestamp: { [makeId: string]: number } = {};
let lastVinDecodeCacheClean = Date.now();
let vinDecodeCache: { [vin: string]: any } = {};

/**
 * Fetches all makes from the NHTSA database
 */
export async function getAllMakes(): Promise<NHTSAMakeResult[]> {
  // Check if we have a recent cache
  if (cacheMakesTimestamp && (Date.now() - cacheMakesTimestamp < CACHE_LIFETIME_MS)) {
    const cachedMakes = await db.select().from(vehicleMakes).orderBy(vehicleMakes.name);
    if (cachedMakes.length > 0) {
      return cachedMakes.map(make => ({
        Make_ID: make.id.toString(),
        Make_Name: make.name
      }));
    }
  }

  try {
    const response = await fetch(`${NHTSA_API_URL}/vehicles/getallmakes?format=json`);
    
    if (!response.ok) {
      throw new Error(`NHTSA API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.Results && Array.isArray(data.Results)) {
      // Cache the results in our database
      await cacheAllMakes(data.Results);
      
      // Update cache timestamp
      cacheMakesTimestamp = Date.now();
      
      return data.Results;
    } else {
      throw new Error('Invalid response format from NHTSA API');
    }
  } catch (error) {
    console.error('Error fetching makes from NHTSA:', error);
    
    // Fallback to database if API fails
    const cachedMakes = await db.select().from(vehicleMakes).orderBy(vehicleMakes.name);
    return cachedMakes.map(make => ({
      Make_ID: make.id.toString(),
      Make_Name: make.name
    }));
  }
}

/**
 * Fetches all models for a specific make from the NHTSA database
 */
export async function getModelsForMake(makeId: string, makeName: string): Promise<NHTSAModelResult[]> {
  // Check if we have a recent cache
  if (cacheModelsTimestamp[makeId] && (Date.now() - cacheModelsTimestamp[makeId] < CACHE_LIFETIME_MS)) {
    const cachedModels = await db
      .select()
      .from(vehicleModels)
      .where(eq(vehicleModels.make_id, parseInt(makeId)))
      .orderBy(vehicleModels.name);
    
    if (cachedModels.length > 0) {
      return cachedModels.map(model => ({
        Model_ID: model.id.toString(),
        Model_Name: model.name
      }));
    }
  }

  try {
    const response = await fetch(`${NHTSA_API_URL}/vehicles/getmodelsformake/${makeName}?format=json`);
    
    if (!response.ok) {
      throw new Error(`NHTSA API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.Results && Array.isArray(data.Results)) {
      // Cache the results in our database
      await cacheModelsForMake(makeId, data.Results);
      
      // Update cache timestamp
      cacheModelsTimestamp[makeId] = Date.now();
      
      return data.Results;
    } else {
      throw new Error('Invalid response format from NHTSA API');
    }
  } catch (error) {
    console.error(`Error fetching models for make ${makeName} from NHTSA:`, error);
    
    // Fallback to database if API fails
    const cachedModels = await db
      .select()
      .from(vehicleModels)
      .where(eq(vehicleModels.make_id, parseInt(makeId)))
      .orderBy(vehicleModels.name);
    
    return cachedModels.map(model => ({
      Model_ID: model.id.toString(),
      Model_Name: model.name
    }));
  }
}

/**
 * Decodes a VIN using the NHTSA database
 */
export async function decodeVin(vin: string): Promise<{ [key: string]: string }> {
  // Clean up the cache occasionally
  cleanVinCache();
  
  // Check if VIN is in cache
  if (vinDecodeCache[vin]) {
    return vinDecodeCache[vin];
  }
  
  try {
    const response = await fetch(`${NHTSA_API_URL}/vehicles/decodevin/${vin}?format=json`);
    
    if (!response.ok) {
      throw new Error(`NHTSA API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.Results && Array.isArray(data.Results)) {
      // Convert array of variable results into an object
      const result: { [key: string]: string } = {};
      data.Results.forEach((item: NHTSADecodeVinResult) => {
        if (item.Variable && item.Value) {
          result[item.Variable] = item.Value;
        }
      });
      
      // Store in cache
      vinDecodeCache[vin] = result;
      
      return result;
    } else {
      throw new Error('Invalid response format from NHTSA API');
    }
  } catch (error) {
    console.error(`Error decoding VIN ${vin} from NHTSA:`, error);
    throw error;
  }
}

/**
 * Extracts vehicle information from a decoded VIN
 */
export async function getVehicleInfoFromVin(vin: string): Promise<{
  make: string;
  model: string;
  year: string | null;
  trim: string | null;
  bodyStyle: string | null;
}> {
  const decodedVin = await decodeVin(vin);
  
  return {
    make: decodedVin['Make'] || '',
    model: decodedVin['Model'] || '',
    year: decodedVin['Model Year'] || null,
    trim: decodedVin['Trim'] || null,
    bodyStyle: decodedVin['Body Class'] || null
  };
}

/**
 * Validates if a VIN is correctly formatted
 */
export function isValidVin(vin: string): boolean {
  // Basic VIN validation (17 alphanumeric characters, no I, O, or Q)
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(vin);
}

/**
 * Caches all makes in the database
 */
async function cacheAllMakes(makes: NHTSAMakeResult[]): Promise<void> {
  // Check which makes we already have
  const existingMakes = await db.select().from(vehicleMakes);
  const existingMakeNames = new Set(existingMakes.map(make => make.name.toLowerCase()));
  
  // Filter out makes we already have
  const newMakes = makes.filter(make => !existingMakeNames.has(make.Make_Name.toLowerCase()));
  
  if (newMakes.length > 0) {
    // Insert new makes
    await db.insert(vehicleMakes).values(
      newMakes.map(make => ({
        name: make.Make_Name,
        external_id: make.Make_ID
      }))
    );
  }
}

/**
 * Caches models for a specific make in the database
 */
async function cacheModelsForMake(makeId: string, models: NHTSAModelResult[]): Promise<void> {
  // Check which models we already have for this make
  const existingModels = await db
    .select()
    .from(vehicleModels)
    .where(eq(vehicleModels.make_id, parseInt(makeId)));
  
  const existingModelNames = new Set(existingModels.map(model => model.name.toLowerCase()));
  
  // Filter out models we already have
  const newModels = models.filter(model => !existingModelNames.has(model.Model_Name.toLowerCase()));
  
  if (newModels.length > 0) {
    // Insert new models
    await db.insert(vehicleModels).values(
      newModels.map(model => ({
        make_id: parseInt(makeId),
        name: model.Model_Name,
        external_id: model.Model_ID
      }))
    );
  }
}

/**
 * Cleans up the VIN decode cache
 */
function cleanVinCache(): void {
  const now = Date.now();
  
  // Only clean once per hour
  if (now - lastVinDecodeCacheClean < 3600000) {
    return;
  }
  
  // Reset cache if it gets too big (more than 1000 entries)
  if (Object.keys(vinDecodeCache).length > 1000) {
    vinDecodeCache = {};
  }
  
  lastVinDecodeCacheClean = now;
}