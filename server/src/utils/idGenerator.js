import District from '../models/district.model.js';
import Block from '../models/block.model.js';

/**
 * Generates unique district ID
 * Format: ST-DIST-YYYY-XXXX
 * Example: MH-DIST-2024-0001, KA-DIST-2024-0002
 */
export const generateDistrictId = async (state) => {
  try {
    // Get state code (first 2 letters of state name in uppercase)
    const stateCode = getStateCode(state);
    
    // Get current year
    const currentYear = new Date().getFullYear();
    
    // Create base pattern
    const basePattern = `${stateCode}-DIST-${currentYear}`;
    
    // Find the highest existing sequence number for this year and state
    const existingDistricts = await District.find({
      districtId: { $regex: `^${basePattern}-\\d{4}$` }
    }).sort({ districtId: -1 }).limit(1);
    
    let nextSequence = 1;
    
    if (existingDistricts.length > 0) {
      const lastId = existingDistricts[0].districtId;
      const lastSequence = parseInt(lastId.split('-').pop());
      nextSequence = lastSequence + 1;
    }
    
    // Format sequence number with leading zeros (4 digits)
    const sequenceStr = nextSequence.toString().padStart(4, '0');
    
    return `${basePattern}-${sequenceStr}`;
    
  } catch (error) {
    throw new Error(`Error generating district ID: ${error.message}`);
  }
};

/**
 * Generates unique block ID
 * Format: DISTRICT_ID-BLOCK-XXXX
 * Example: MH-DIST-2024-0001-BLOCK-0001
 */
export const generateBlockId = async (districtId) => {
  try {
    // Create base pattern using district ID
    const basePattern = `${districtId}-BLOCK`;
    
    // Find the highest existing sequence number for this district
    const existingBlocks = await Block.find({
      blockId: { $regex: `^${basePattern}-\\d{4}$` }
    }).sort({ blockId: -1 }).limit(1);
    
    let nextSequence = 1;
    
    if (existingBlocks.length > 0) {
      const lastId = existingBlocks[0].blockId;
      const lastSequence = parseInt(lastId.split('-').pop());
      nextSequence = lastSequence + 1;
    }
    
    // Format sequence number with leading zeros (4 digits)
    const sequenceStr = nextSequence.toString().padStart(4, '0');
    
    return `${basePattern}-${sequenceStr}`;
    
  } catch (error) {
    throw new Error(`Error generating block ID: ${error.message}`);
  }
};

/**
 * Generates unique user employee ID
 * Format: EMP-YYYY-XXXXXX
 * Example: EMP-2024-000001
 */
export const generateEmployeeId = async () => {
  try {
    const currentYear = new Date().getFullYear();
    const basePattern = `EMP-${currentYear}`;
    
    // Find the highest existing sequence number for this year
    const User = (await import('../models/user.model.js')).default;
    const existingUsers = await User.find({
      'personalInfo.employeeId': { $regex: `^${basePattern}-\\d{6}$` }
    }).sort({ 'personalInfo.employeeId': -1 }).limit(1);
    
    let nextSequence = 1;
    
    if (existingUsers.length > 0) {
      const lastId = existingUsers[0].personalInfo.employeeId;
      const lastSequence = parseInt(lastId.split('-').pop());
      nextSequence = lastSequence + 1;
    }
    
    // Format sequence number with leading zeros (6 digits)
    const sequenceStr = nextSequence.toString().padStart(6, '0');
    
    return `${basePattern}-${sequenceStr}`;
    
  } catch (error) {
    throw new Error(`Error generating employee ID: ${error.message}`);
  }
};

/**
 * Generates unique application/reference ID for various purposes
 * Format: APP-YYYYMMDD-XXXXXX
 * Example: APP-20241215-000001
 */
export const generateApplicationId = async () => {
  try {
    const currentDate = new Date();
    const dateStr = currentDate.toISOString().slice(0, 10).replace(/-/g, '');
    const basePattern = `APP-${dateStr}`;
    
    // This would typically be stored in a separate counter collection
    // For now, we'll use a timestamp-based approach with random component
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    const sequence = (timestamp + random) % 1000000;
    
    const sequenceStr = sequence.toString().padStart(6, '0');
    
    return `${basePattern}-${sequenceStr}`;
    
  } catch (error) {
    throw new Error(`Error generating application ID: ${error.message}`);
  }
};

/**
 * Validates district ID format
 */
export const validateDistrictId = (districtId) => {
  const pattern = /^[A-Z]{2}-DIST-\d{4}-\d{4}$/;
  return pattern.test(districtId);
};

/**
 * Validates block ID format
 */
export const validateBlockId = (blockId) => {
  const pattern = /^[A-Z]{2}-DIST-\d{4}-\d{4}-BLOCK-\d{4}$/;
  return pattern.test(blockId);
};

/**
 * Validates employee ID format
 */
export const validateEmployeeId = (employeeId) => {
  const pattern = /^EMP-\d{4}-\d{6}$/;
  return pattern.test(employeeId);
};

/**
 * Extracts information from district ID
 */
export const parseDistrictId = (districtId) => {
  if (!validateDistrictId(districtId)) {
    throw new Error('Invalid district ID format');
  }
  
  const parts = districtId.split('-');
  return {
    stateCode: parts[0],
    type: parts[1],
    year: parseInt(parts[2]),
    sequence: parseInt(parts[3])
  };
};

/**
 * Extracts information from block ID
 */
export const parseBlockId = (blockId) => {
  if (!validateBlockId(blockId)) {
    throw new Error('Invalid block ID format');
  }
  
  const parts = blockId.split('-');
  return {
    stateCode: parts[0],
    districtType: parts[1],
    year: parseInt(parts[2]),
    districtSequence: parseInt(parts[3]),
    blockType: parts[4],
    blockSequence: parseInt(parts[5])
  };
};

/**
 * Gets state code from state name
 * Maps full state names to 2-letter codes
 */
const getStateCode = (stateName) => {
  const stateCodeMap = {
    // Major Indian States
    'andhra pradesh': 'AP',
    'arunachal pradesh': 'AR',
    'assam': 'AS',
    'bihar': 'BR',
    'chhattisgarh': 'CG',
    'goa': 'GA',
    'gujarat': 'GJ',
    'haryana': 'HR',
    'himachal pradesh': 'HP',
    'jharkhand': 'JH',
    'karnataka': 'KA',
    'kerala': 'KL',
    'madhya pradesh': 'MP',
    'maharashtra': 'MH',
    'manipur': 'MN',
    'meghalaya': 'ML',
    'mizoram': 'MZ',
    'nagaland': 'NL',
    'odisha': 'OR',
    'punjab': 'PB',
    'rajasthan': 'RJ',
    'sikkim': 'SK',
    'tamil nadu': 'TN',
    'telangana': 'TG',
    'tripura': 'TR',
    'uttar pradesh': 'UP',
    'uttarakhand': 'UK',
    'west bengal': 'WB',
    
    // Union Territories
    'andaman and nicobar islands': 'AN',
    'chandigarh': 'CH',
    'dadra and nagar haveli and daman and diu': 'DN',
    'delhi': 'DL',
    'jammu and kashmir': 'JK',
    'ladakh': 'LA',
    'lakshadweep': 'LD',
    'puducherry': 'PY'
  };
  
  const normalizedState = stateName.toLowerCase().trim();
  const stateCode = stateCodeMap[normalizedState];
  
  if (!stateCode) {
    // If state not found, create code from first 2 letters
    return stateName.substring(0, 2).toUpperCase();
  }
  
  return stateCode;
};

/**
 * Gets full state name from state code
 */
export const getStateNameFromCode = (stateCode) => {
  const codeToStateMap = {
    'AP': 'Andhra Pradesh',
    'AR': 'Arunachal Pradesh',
    'AS': 'Assam',
    'BR': 'Bihar',
    'CG': 'Chhattisgarh',
    'GA': 'Goa',
    'GJ': 'Gujarat',
    'HR': 'Haryana',
    'HP': 'Himachal Pradesh',
    'JH': 'Jharkhand',
    'KA': 'Karnataka',
    'KL': 'Kerala',
    'MP': 'Madhya Pradesh',
    'MH': 'Maharashtra',
    'MN': 'Manipur',
    'ML': 'Meghalaya',
    'MZ': 'Mizoram',
    'NL': 'Nagaland',
    'OR': 'Odisha',
    'PB': 'Punjab',
    'RJ': 'Rajasthan',
    'SK': 'Sikkim',
    'TN': 'Tamil Nadu',
    'TG': 'Telangana',
    'TR': 'Tripura',
    'UP': 'Uttar Pradesh',
    'UK': 'Uttarakhand',
    'WB': 'West Bengal',
    'AN': 'Andaman and Nicobar Islands',
    'CH': 'Chandigarh',
    'DN': 'Dadra and Nagar Haveli and Daman and Diu',
    'DL': 'Delhi',
    'JK': 'Jammu and Kashmir',
    'LA': 'Ladakh',
    'LD': 'Lakshadweep',
    'PY': 'Puducherry'
  };
  
  return codeToStateMap[stateCode.toUpperCase()] || stateCode;
};

/**
 * Generate batch IDs for bulk operations
 */
export const generateBatchIds = async (type, count, additionalParam = null) => {
  const ids = [];
  
  for (let i = 0; i < count; i++) {
    let id;
    
    switch (type) {
      case 'district':
        if (!additionalParam) {
          throw new Error('State name required for district ID generation');
        }
        id = await generateDistrictId(additionalParam);
        break;
        
      case 'block':
        if (!additionalParam) {
          throw new Error('District ID required for block ID generation');
        }
        id = await generateBlockId(additionalParam);
        break;
        
      case 'employee':
        id = await generateEmployeeId();
        break;
        
      case 'application':
        id = await generateApplicationId();
        break;
        
      default:
        throw new Error(`Invalid ID type: ${type}`);
    }
    
    ids.push(id);
    
    // Small delay to ensure uniqueness in timestamp-based generation
    await new Promise(resolve => setTimeout(resolve, 1));
  }
  
  return ids;
};

/**
 * Check if an ID already exists
 */
export const checkIdExists = async (type, id) => {
  try {
    switch (type) {
      case 'district':
        const district = await District.findOne({ districtId: id });
        return !!district;
        
      case 'block':
        const block = await Block.findOne({ blockId: id });
        return !!block;
        
      case 'employee':
        const User = (await import('../models/user.model.js')).default;
        const user = await User.findOne({ 'personalInfo.employeeId': id });
        return !!user;
        
      default:
        return false;
    }
  } catch (error) {
    throw new Error(`Error checking ID existence: ${error.message}`);
  }
};

export default {
  generateDistrictId,
  generateBlockId,
  generateEmployeeId,
  generateApplicationId,
  validateDistrictId,
  validateBlockId,
  validateEmployeeId,
  parseDistrictId,
  parseBlockId,
  getStateNameFromCode,
  generateBatchIds,
  checkIdExists
};