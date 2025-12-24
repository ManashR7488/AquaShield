#!/usr/bin/env node

/**
 * AquaShield Health Surveillance System - Database Seeding Script
 * 
 * This script populates the database with realistic dummy data for Odisha state,
 * focusing on 2 districts (Khordha and Puri) with multiple blocks and villages.
 * 
 * DEFAULT CREDENTIALS FOR TESTING:
 * 
 * Admin:
 *   Username: admin1, admin2, admin3
 *   Password: Admin@123
 * 
 * Health Officials:
 *   Username: health_officer_khordha1, health_officer_puri1, etc.
 *   Password: Health@123
 * 
 * Block Officers:
 *   Username: block_officer_balianta, block_officer_brahmagiri, etc.
 *   Password: Block@123
 * 
 * ASHA Workers:
 *   Username: asha_<villagename><number>
 *   Password: Asha@123
 * 
 * Volunteers:
 *   Username: volunteer_<villagename><number>
 *   Password: Volunteer@123
 * 
 * Community Members:
 *   Username: user_<villagename><number>
 *   Password: User@123
 * 
 * USAGE:
 *   npm run db:feed              - Full seeding (default)
 *   node feed.js                 - Full seeding
 *   node feed.js --clear-only    - Clear database only
 *   node feed.js --minimal       - Minimal seeding (1 district, 2 blocks, 5 villages)
 *   node feed.js --users-only    - Seed only users
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { connectDB } from './src/config/dbConfig.js';

// Import all models
import District from './src/models/district.model.js';
import Block from './src/models/block.model.js';
import Village from './src/models/village.model.js';
import User from './src/models/user.model.js';
import PatientRecord from './src/models/patientRecord.model.js';
import WaterQualityTest from './src/models/waterQualityTest.model.js';
import HealthReport from './src/models/healthReport.model.js';

// Load environment variables
dotenv.config();

// Parse command-line arguments
const args = process.argv.slice(2);
const clearOnly = args.includes('--clear-only');
const usersOnly = args.includes('--users-only');
const minimal = args.includes('--minimal');

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

let phoneCounter = 0;
let emailCounter = 0;

/**
 * Generate unique Indian phone number
 */
function generatePhoneNumber(startFrom = 6543210) {
  return `+91987${String(startFrom + phoneCounter++).padStart(7, '0')}`;
}

/**
 * Generate email address
 */
function generateEmail(username, domain = 'example.com') {
  return `${username}@${domain}`;
}

/**
 * Generate random coordinates within radius
 */
function generateCoordinates(baseLatitude = 20.2961, baseLongitude = 85.8245, radiusKm = 50) {
  const radiusInDegrees = radiusKm / 111.32; // 1 degree ≈ 111.32 km
  const u = Math.random();
  const v = Math.random();
  const w = radiusInDegrees * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);
  
  return {
    latitude: baseLatitude + x,
    longitude: baseLongitude + y
  };
}

/**
 * Generate realistic Indian name
 */
function generateIndianName(gender = 'male') {
  const maleFirstNames = ['Rajesh', 'Suresh', 'Ramesh', 'Prakash', 'Biswajit', 'Subhash', 'Mahesh', 'Dinesh', 'Santosh', 'Ashok', 
    'Ravi', 'Kumar', 'Anil', 'Vijay', 'Ajay', 'Sanjay', 'Manoj', 'Deepak', 'Rahul', 'Amit'];
  const femaleFirstNames = ['Sunita', 'Anita', 'Mamata', 'Sarita', 'Pramila', 'Bijaya', 'Lakshmi', 'Kavita', 'Rekha', 'Meena',
    'Rani', 'Sita', 'Gita', 'Nita', 'Priya', 'Smita', 'Puja', 'Neha', 'Pooja', 'Sneha'];
  const lastNames = ['Kumar', 'Patra', 'Sahoo', 'Nayak', 'Behera', 'Das', 'Swain', 'Jena', 'Mohanty', 'Mishra',
    'Pradhan', 'Sethy', 'Rout', 'Sahu', 'Maharana', 'Biswal', 'Malik', 'Singh', 'Barik', 'Parida'];
  
  const firstName = gender === 'male' ? randomChoice(maleFirstNames) : randomChoice(femaleFirstNames);
  const lastName = randomChoice(lastNames);
  
  return { firstName, lastName };
}

/**
 * Hash password using bcrypt
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

/**
 * Generate random date between start and end
 */
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/**
 * Return random element from array
 */
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate random integer between min and max (inclusive)
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate truncated username that stays within 30 character limit
 */
function generateUsername(prefix, blockName, villageName, counter) {
  // Clean names (remove spaces, convert to lowercase)
  const cleanBlock = blockName.toLowerCase().replace(/\s+/g, '');
  const cleanVillage = villageName.toLowerCase().replace(/\s+/g, '');
  
  // Calculate available space: 30 - prefix length - counter length (max 2 digits)
  const counterStr = String(counter);
  const maxLength = 30;
  const availableSpace = maxLength - prefix.length - counterStr.length;
  
  // Truncate block and village names to fit
  const halfSpace = Math.floor(availableSpace / 2);
  const truncatedBlock = cleanBlock.substring(0, halfSpace);
  const truncatedVillage = cleanVillage.substring(0, availableSpace - truncatedBlock.length);
  
  return `${prefix}${truncatedBlock}${truncatedVillage}${counterStr}`;
}

// ============================================================================
// ODISHA GEOGRAPHIC DATA
// ============================================================================

const odishaData = {
  khordha: {
    name: 'Khordha',
    blocks: [
      {
        name: 'Balianta',
        villages: ['Chandapur', 'Balakati', 'Similipada', 'Ghatikia', 'Kendua']
      },
      {
        name: 'Balipatna',
        villages: ['Balipatna', 'Banpur', 'Gopinathpur', 'Nuagaon']
      },
      {
        name: 'Banapur',
        villages: ['Banapur Town', 'Champatisahi', 'Badagada', 'Ranapur']
      },
      {
        name: 'Begunia',
        villages: ['Begunia', 'Manitira', 'Bada Asan', 'Chhotarapur']
      },
      {
        name: 'Bhubaneswar',
        villages: ['Patia', 'Raghunathpur', 'Sundarpada', 'Bhimatangi']
      },
      {
        name: 'Bolagarh',
        villages: ['Bolagarh', 'Kantilo', 'Badakul', 'Sasan']
      },
      {
        name: 'Chilika',
        villages: ['Balugaon', 'Rambha', 'Sorana', 'Parikud']
      },
      {
        name: 'Jatni',
        villages: ['Jatni Town', 'Kandarpur', 'Gopalpur', 'Khandagiri']
      },
      {
        name: 'Khordha',
        villages: ['Khordha Town', 'Baghamari', 'Bhatasahi', 'Naharajpur']
      },
      {
        name: 'Tangi',
        villages: ['Tangi', 'Tankapani', 'Jagannathpur', 'Birabalabhadrapur']
      }
    ]
  },
  puri: {
    name: 'Puri',
    blocks: [
      {
        name: 'Astaranga',
        villages: ['Astaranga', 'Nuapatna', 'Birapratappur', 'Bamanal']
      },
      {
        name: 'Brahmagiri',
        villages: ['Brahmagiri', 'Satasankha', 'Alaripur', 'Niali']
      },
      {
        name: 'Delanga',
        villages: ['Delanga', 'Gunupur', 'Nuasahi', 'Kantiagada']
      },
      {
        name: 'Gop',
        villages: ['Gop', 'Konark', 'Kurujanga', 'Sukal']
      },
      {
        name: 'Kakat Pur',
        villages: ['Kakatpur', 'Bishnupur', 'Mangalapur', 'Biraramachandrapur']
      },
      {
        name: 'Kanas',
        villages: ['Kanas', 'Tarava', 'Bhagabata', 'Biraramachandrapur']
      },
      {
        name: 'Krushnaprasad',
        villages: ['Krushnaprasad', 'Sarala', 'Bhogabati', 'Kadua']
      },
      {
        name: 'Nimapada',
        villages: ['Nimapada', 'Odasingh', 'Tulasipur', 'Bhanapur']
      },
      {
        name: 'Pipili',
        villages: ['Pipili', 'Jadupur', 'Biragobindapur', 'Tarapur']
      },
      {
        name: 'Sadar',
        villages: ['Puri Town', 'Baliharachandi', 'Baliguali', 'Mangalaganda']
      },
      {
        name: 'Satyabadi',
        villages: ['Satyabadi', 'Suando', 'Pubasasan', 'Sevaksevak']
      }
    ]
  }
};

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Clear all existing data from database
 */
async function clearDatabase() {
  console.log('\n🗑️  Clearing existing database...');
  
  try {
    await District.deleteMany({});
    console.log('   ✅ Districts cleared');
    
    await Block.deleteMany({});
    console.log('   ✅ Blocks cleared');
    
    await Village.deleteMany({});
    console.log('   ✅ Villages cleared');
    
    await User.deleteMany({});
    console.log('   ✅ Users cleared');
    
    await PatientRecord.deleteMany({});
    console.log('   ✅ Patient records cleared');
    
    await WaterQualityTest.deleteMany({});
    console.log('   ✅ Water quality tests cleared');
    
    await HealthReport.deleteMany({});
    console.log('   ✅ Health reports cleared');
    
    console.log('✅ Database cleared successfully\n');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
}

/**
 * Seed districts (Khordha and Puri)
 */
async function seedDistricts(minimalMode = false) {
  console.log('\n🏛️  Seeding Districts...');
  
  const districts = [];
  let districtCounter = 1;
  
  // In minimal mode, only seed Khordha district
  const dataToSeed = minimalMode 
    ? Object.entries(odishaData).slice(0, 1) 
    : Object.entries(odishaData);
  
  for (const [key, districtData] of dataToSeed) {
    const centerLat = key === 'khordha' ? 20.2961 : 19.8135;
    const centerLng = key === 'khordha' ? 85.8245 : 85.8312;
    
    // Generate block registration tokens
    const tokens = [];
    for (let i = 0; i < districtData.blocks.length; i++) {
      tokens.push({
        token: `BLK-TOK-${key.toUpperCase()}-${String(i + 1).padStart(4, '0')}`,
        generatedFor: districtData.blocks[i].name,
        generatedBy: null, // Will be set when district officer is assigned
        isUsed: true, // Mark as used since we're creating the blocks
        usedBy: null, // Will be updated after block creation
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdAt: new Date()
      });
    }
    
    // Add extra unused tokens
    for (let i = districtData.blocks.length; i < 8; i++) {
      tokens.push({
        token: `BLK-TOK-${key.toUpperCase()}-${String(i + 1).padStart(4, '0')}`,
        generatedFor: null,
        generatedBy: null,
        isUsed: false,
        usedBy: null,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date()
      });
    }
    
    const district = await District.create({
      districtId: `DIST-ODISHA-${String(districtCounter++).padStart(4, '0')}`,
      name: districtData.name,
      state: 'Odisha',
      boundaries: {
        coordinates: [
          [centerLng - 0.5, centerLat + 0.5],
          [centerLng + 0.5, centerLat + 0.5],
          [centerLng + 0.5, centerLat - 0.5],
          [centerLng - 0.5, centerLat - 0.5],
          [centerLng - 0.5, centerLat + 0.5] // close the polygon
        ],
        headquarters: {
          latitude: centerLat,
          longitude: centerLng,
          address: `${districtData.name} District Headquarters, Odisha`
        }
      },
      demographics: {
        totalPopulation: randomInt(1500000, 2500000),
        ruralPopulation: randomInt(1000000, 1800000),
        urbanPopulation: randomInt(500000, 700000),
        totalBlocks: districtData.blocks.length,
        totalVillages: districtData.blocks.reduce((sum, b) => sum + b.villages.length, 0)
      },
      blockRegistration: {
        registrationEnabled: true,
        requiresApproval: true,
        autoGenerateTokens: true,
        tokenValidityDays: 30
      },
      blockTokens: tokens,
      status: 'active'
    });
    
    districts.push(district);
    console.log(`   ✅ Created district: ${district.name}`);
  }
  
  console.log(`✅ ${districts.length} districts created\n`);
  return districts;
}

/**
 * Seed blocks for each district
 */
async function seedBlocks(districts, minimalMode = false) {
  console.log('\n🏘️  Seeding Blocks...');
  
  const blocks = [];
  let blockCounter = 1;
  
  for (const district of districts) {
    const districtKey = district.name.toLowerCase();
    const districtData = odishaData[districtKey];
    
    // In minimal mode, only seed first 2 blocks
    const numBlocks = minimalMode ? Math.min(2, districtData.blocks.length) : districtData.blocks.length;
    
    for (let i = 0; i < numBlocks; i++) {
      const blockData = districtData.blocks[i];
      const coords = generateCoordinates(
        district.boundaries.headquarters.latitude,
        district.boundaries.headquarters.longitude,
        30
      );
      
      // Get a token from district
      const token = district.blockTokens[i];
      
      // Generate village registration tokens
      const villageTokens = [];
      for (let j = 0; j < blockData.villages.length; j++) {
        villageTokens.push({
          token: `VLG-TOK-${blockData.name.toUpperCase()}-${String(j + 1).padStart(4, '0')}`,
          generatedFor: blockData.villages[j],
          generatedBy: null, // Will be set when block officer is assigned
          isUsed: true, // Mark as used since we're creating the villages
          usedBy: null, // Will be updated after village creation
          expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
          createdAt: new Date()
        });
      }
      
      // Add extra unused tokens
      for (let j = blockData.villages.length; j < 8; j++) {
        villageTokens.push({
          token: `VLG-TOK-${blockData.name.toUpperCase()}-${String(j + 1).padStart(4, '0')}`,
          generatedFor: null,
          generatedBy: null,
          isUsed: false,
          usedBy: null,
          expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          createdAt: new Date()
        });
      }
      
      const block = await Block.create({
        blockId: `BLK-DIST-${String(blockCounter++).padStart(4, '0')}`,
        name: blockData.name,
        districtId: district._id,
        registration: {
          registrationToken: token.token,
          registeredDate: new Date(),
          approvalDate: new Date(),
          approvedBy: null, // Will be set after admin creation
          registrationStatus: 'approved'
        },
        boundaries: {
          coordinates: [
            [coords.longitude - 0.1, coords.latitude + 0.1],
            [coords.longitude + 0.1, coords.latitude + 0.1],
            [coords.longitude + 0.1, coords.latitude - 0.1],
            [coords.longitude - 0.1, coords.latitude - 0.1],
            [coords.longitude - 0.1, coords.latitude + 0.1]
          ],
          headquarters: {
            latitude: coords.latitude,
            longitude: coords.longitude,
            address: `${blockData.name} Block Office, ${district.name}`
          }
        },
        demographics: {
          totalPopulation: randomInt(10000, 50000),
          totalVillages: blockData.villages.length,
          totalHouseholds: randomInt(2000, 10000),
          literacyRate: randomInt(60, 85)
        },
        villageRegistration: {
          registrationEnabled: true,
          requiresApproval: true,
          tokenValidityDays: 15
        },
        villageTokens,
        status: 'active'
      });
      
      blocks.push(block);
      console.log(`   ✅ Created block: ${block.name} (${district.name})`);
    }
  }
  
  console.log(`✅ ${blocks.length} blocks created\n`);
  return blocks;
}

/**
 * Seed villages for each block
 */
async function seedVillages(blocks, minimalMode = false) {
  console.log('\n🏡 Seeding Villages...');
  
  const villages = [];
  let villageCounter = 1;
  
  for (const block of blocks) {
    // Find district data
    const district = await District.findById(block.districtId);
    const districtKey = district.name.toLowerCase();
    const blockData = odishaData[districtKey].blocks.find(b => b.name === block.name);
    
    // In minimal mode, only seed 2-3 villages per block
    const numVillages = minimalMode ? Math.min(3, blockData.villages.length) : blockData.villages.length;
    
    for (let i = 0; i < numVillages; i++) {
      const villageName = blockData.villages[i];
      const coords = generateCoordinates(
        block.boundaries.headquarters.latitude,
        block.boundaries.headquarters.longitude,
        10
      );
      
      // Get token from block
      const token = block.villageTokens[i];
      
      // Generate water sources
      const waterSources = [];
      const waterSourceTypes = ['well', 'borewell', 'pond', 'pipeline'];
      const numSources = randomInt(2, 4);
      
      for (let j = 0; j < numSources; j++) {
        const sourceCoords = generateCoordinates(coords.latitude, coords.longitude, 1);
        waterSources.push({
          type: randomChoice(waterSourceTypes),
          name: `${randomChoice(waterSourceTypes).toUpperCase()} ${villageName} ${j + 1}`,
          coordinates: sourceCoords,
          status: randomChoice(['functional', 'functional', 'functional', 'non_functional']),
          qualityLastTested: randomDate(new Date(2023, 0, 1), new Date()),
          servesHouseholds: randomInt(20, 100)
        });
      }
      
      // Generate health facilities
      const healthFacilities = [];
      const facilityTypes = ['subcenter', 'anganwadi'];
      const numFacilities = randomInt(1, 2);
      
      for (let j = 0; j < numFacilities; j++) {
        const facilityCoords = generateCoordinates(coords.latitude, coords.longitude, 1);
        healthFacilities.push({
          type: facilityTypes[j] || randomChoice(facilityTypes),
          name: `${facilityTypes[j] || randomChoice(facilityTypes)} ${villageName}`,
          coordinates: facilityCoords,
          services: randomChoice([['vaccination', 'checkup'], ['maternal_care', 'child_care'], ['primary_care']])
        });
      }
      
      const totalPop = randomInt(500, 5000);
      const malePercent = randomInt(48, 52) / 100;
      
      const village = await Village.create({
        villageId: `VLG-BLK-${String(villageCounter++).padStart(4, '0')}`,
        name: villageName,
        blockId: block._id,
        registration: {
          registrationToken: token.token,
          registeredDate: new Date(),
          approvalDate: new Date(),
          approvedBy: null, // Will be set after block officer creation
          villageCode: `VC-${villageName.toUpperCase().substring(0, 3)}-${randomInt(100, 999)}`
        },
        location: {
          coordinates: coords,
          boundaries: [
            [coords.longitude - 0.01, coords.latitude + 0.01],
            [coords.longitude + 0.01, coords.latitude + 0.01],
            [coords.longitude + 0.01, coords.latitude - 0.01],
            [coords.longitude - 0.01, coords.latitude - 0.01],
            [coords.longitude - 0.01, coords.latitude + 0.01]
          ],
          accessibility: randomChoice(['good', 'moderate', 'poor'])
        },
        demographics: {
          totalPopulation: totalPop,
          totalHouseholds: Math.floor(totalPop / randomInt(4, 6)),
          malePopulation: Math.floor(totalPop * malePercent),
          femalePopulation: Math.floor(totalPop * (1 - malePercent)),
          children: Math.floor(totalPop * 0.25),
          elderly: Math.floor(totalPop * 0.08),
          literacyRate: randomInt(55, 80),
          mainOccupations: randomChoice([['agriculture', 'dairy'], ['agriculture', 'labor'], ['fishing', 'agriculture']])
        },
        infrastructure: {
          waterSources,
          sanitationFacilities: {
            totalToilets: Math.floor(totalPop / 5),
            publicToilets: randomInt(2, 5),
            wasteManagement: randomChoice(['proper', 'improper', 'none', 'proper'])
          },
          healthFacilities,
          connectivity: {
            roadConnectivity: randomChoice(['all_weather', 'seasonal', 'footpath']),
            mobileNetwork: randomChoice(['2G', '3G', '4G', '4G']),
            internetAccess: Math.random() > 0.4,
            nearestBusStop: randomInt(1, 10),
            nearestRailwayStation: randomInt(10, 50)
          }
        },
        healthProfile: {
          vulnerabilityScore: randomInt(1, 10),
          commonDiseases: randomChoice([
            ['malaria', 'diarrhea'],
            ['typhoid', 'dengue'],
            ['cholera', 'dysentery'],
            ['tuberculosis', 'anemia']
          ])
        },
        status: 'active'
      });
      
      villages.push(village);
      console.log(`   ✅ Created village: ${village.name} (${block.name})`);
    }
  }
  
  console.log(`✅ ${villages.length} villages created\n`);
  return villages;
}

/**
 * Seed users with different roles
 */
async function seedUsers(districts, blocks, villages) {
  console.log('\n👥 Seeding Users...');
  
  const users = {
    admins: [],
    healthOfficials: [],
    blockOfficers: [],
    ashaWorkers: [],
    volunteers: [],
    communityMembers: []
  };
  
  // Seed Admin Users (3)
  console.log('   Creating admin users...');
  for (let i = 1; i <= 3; i++) {
    const { firstName, lastName } = generateIndianName('male');
    const hashedPassword = await hashPassword('Admin@123');
    
    const admin = await User.create({
      authentication: {
        username: `admin${i}`,
        email: generateEmail(`admin${i}`, 'aquashield.gov.in'),
        password: hashedPassword,
        phone: generatePhoneNumber()
      },
      personalInfo: {
        firstName,
        lastName,
        dateOfBirth: randomDate(new Date(1970, 0, 1), new Date(1990, 0, 1)),
        gender: 'male'
      },
      contactInfo: {
        address: {
          street: `Admin Block ${i}`,
          city: 'Bhubaneswar',
          state: 'Odisha',
          pincode: '751001',
          country: 'India'
        }
      },
      roleInfo: {
        role: 'admin'
      },
      status: 'active',
      termsAccepted: true,
      privacyPolicyAccepted: true,
      isEmailVerified: true,
      isPhoneVerified: true
    });
    
    users.admins.push(admin);
    console.log(`      ✅ Created admin: ${admin.authentication.username}`);
  }
  
  // Seed Health Officials (2 per district = 4 total)
  console.log('   Creating health officials...');
  for (const district of districts) {
    for (let i = 1; i <= 2; i++) {
      const { firstName, lastName } = generateIndianName(i % 2 === 0 ? 'female' : 'male');
      const hashedPassword = await hashPassword('Health@123');
      const districtKey = district.name.toLowerCase();
      
      const official = await User.create({
        authentication: {
          username: `healthofficer${districtKey}${i}`,
          email: generateEmail(`officer.${districtKey}${i}`, 'health.odisha.gov.in'),
          password: hashedPassword,
          phone: generatePhoneNumber()
        },
        personalInfo: {
          firstName,
          lastName,
          dateOfBirth: randomDate(new Date(1975, 0, 1), new Date(1995, 0, 1)),
          gender: i % 2 === 0 ? 'female' : 'male'
        },
        contactInfo: {
          address: {
            street: `District Health Office`,
            city: district.name,
            state: 'Odisha',
            pincode: `75${randomInt(1000, 9999)}`,
            country: 'India'
          }
        },
        roleInfo: {
          role: 'health_official',
          hierarchy: {
            districtId: district._id,
            hierarchyLevel: 'district'
          }
        },
        professionalInfo: {
          qualification: 'MBBS',
          experience: randomInt(5, 15),
          languages: ['Odia', 'English', 'Hindi']
        },
        status: 'active',
        termsAccepted: true,
        privacyPolicyAccepted: true,
        isEmailVerified: true,
        isPhoneVerified: true
      });
      
      users.healthOfficials.push(official);
      
      // Update district with first officer
      if (i === 1) {
        await District.findByIdAndUpdate(district._id, {
          'districtOfficer.userId': official._id,
          'districtOfficer.name': `${firstName} ${lastName}`,
          'districtOfficer.contactNumber': official.authentication.phone,
          'districtOfficer.email': official.authentication.email
        });
      }
      
      console.log(`      ✅ Created health official: ${official.authentication.username}`);
    }
  }
  
  // Seed Block Officers (1 per block)
  console.log('   Creating block officers...');
  for (const block of blocks) {
    const { firstName, lastName } = generateIndianName(Math.random() > 0.5 ? 'female' : 'male');
    const hashedPassword = await hashPassword('Block@123');
    const blockNameClean = block.name.toLowerCase().replace(/\s+/g, '');
    
    const officer = await User.create({
      authentication: {
        username: `blockofficer${blockNameClean}`,
        email: generateEmail(`officer.${blockNameClean}`, 'health.odisha.gov.in'),
        password: hashedPassword,
        phone: generatePhoneNumber()
      },
      personalInfo: {
        firstName,
        lastName,
        dateOfBirth: randomDate(new Date(1980, 0, 1), new Date(1998, 0, 1)),
        gender: Math.random() > 0.5 ? 'female' : 'male'
      },
      contactInfo: {
        address: {
          street: `Block Health Office`,
          city: block.name,
          state: 'Odisha',
          pincode: `75${randomInt(1000, 9999)}`,
          country: 'India'
        }
      },
      roleInfo: {
        role: 'health_official',
        subRole: 'block_officer',
        hierarchy: {
          blockId: block._id,
          hierarchyLevel: 'block'
        }
      },
      professionalInfo: {
        qualification: randomChoice(['BSc Nursing', 'MBBS', 'MD']),
        experience: randomInt(3, 10),
        languages: ['Odia', 'English', 'Hindi']
      },
      status: 'active',
      termsAccepted: true,
      privacyPolicyAccepted: true,
      isEmailVerified: true,
      isPhoneVerified: true
    });
    
    users.blockOfficers.push(officer);
    
    // Update block with officer
    await Block.findByIdAndUpdate(block._id, {
      'blockOfficer.userId': officer._id,
      'blockOfficer.name': `${firstName} ${lastName}`,
      'blockOfficer.contactNumber': officer.authentication.phone,
      'blockOfficer.email': officer.authentication.email
    });
    
    console.log(`      ✅ Created block officer: ${officer.authentication.username}`);
  }
  
  // Seed ASHA Workers (2-3 per village)
  console.log('   Creating ASHA workers...');
  for (const village of villages) {
    const numWorkers = randomInt(2, 3);
    const block = await Block.findById(village.blockId);
    const supervisor = users.blockOfficers.find(o => o.roleInfo.hierarchy.blockId.toString() === block._id.toString());
    
    for (let i = 1; i <= numWorkers; i++) {
      const { firstName, lastName } = generateIndianName('female'); // ASHAs are typically female
      const hashedPassword = await hashPassword('Asha@123');
      
      const asha = await User.create({
        authentication: {
          username: generateUsername('asha', block.name, village.name, i),
          email: generateEmail(`asha.${block.name.toLowerCase().replace(/\s+/g, '')}.${village.name.toLowerCase().replace(/\s+/g, '')}${i}`, 'village.odisha.gov.in'),
          password: hashedPassword,
          phone: generatePhoneNumber()
        },
        personalInfo: {
          firstName,
          lastName,
          dateOfBirth: randomDate(new Date(1985, 0, 1), new Date(2002, 0, 1)),
          gender: 'female'
        },
        contactInfo: {
          address: {
            street: village.name,
            city: block.name,
            state: 'Odisha',
            pincode: `75${randomInt(1000, 9999)}`,
            country: 'India'
          }
        },
        roleInfo: {
          role: 'asha_worker',
          hierarchy: {
            villageId: village._id,
            hierarchyLevel: 'village'
          },
          workAssignment: {
            assignedBy: supervisor._id,
            assignmentDate: randomDate(new Date(2022, 0, 1), new Date()),
            workArea: 'village',
            supervisor: supervisor._id
          }
        },
        professionalInfo: {
          qualification: randomChoice(['10th Pass', '12th Pass', 'Graduate']),
          experience: randomInt(1, 5),
          languages: ['Odia', 'Hindi']
        },
        status: 'active',
        termsAccepted: true,
        privacyPolicyAccepted: true,
        isEmailVerified: true,
        isPhoneVerified: true
      });
      
      users.ashaWorkers.push(asha);
      
      // Update block with ASHA worker
      await Block.findByIdAndUpdate(block._id, {
        $push: {
          'staff.ashaWorkers': {
            userId: asha._id,
            name: `${firstName} ${lastName}`,
            assignedVillages: [village._id],
            joinedDate: new Date()
          }
        }
      });
      
      console.log(`      ✅ Created ASHA worker: ${asha.username}`);
    }
  }
  
  // Seed Volunteers (1-2 per village)
  console.log('   Creating volunteers...');
  for (const village of villages) {
    const numVolunteers = randomInt(1, 2);
    
    for (let i = 1; i <= numVolunteers; i++) {
      const { firstName, lastName } = generateIndianName(Math.random() > 0.5 ? 'female' : 'male');
      const hashedPassword = await hashPassword('Volunteer@123');
      const block = await Block.findById(village.blockId);
      
      const volunteer = await User.create({
        authentication: {
          username: generateUsername('vol', block.name, village.name, i),
          email: generateEmail(`volunteer.${block.name.toLowerCase().replace(/\s+/g, '')}.${village.name.toLowerCase().replace(/\s+/g, '')}${i}`, 'aquashield.org'),
          password: hashedPassword,
          phone: generatePhoneNumber()
        },
        personalInfo: {
          firstName,
          lastName,
          dateOfBirth: randomDate(new Date(1990, 0, 1), new Date(2005, 0, 1)),
          gender: Math.random() > 0.5 ? 'female' : 'male'
        },
        contactInfo: {
          address: {
            street: village.name,
            city: block.name,
            state: 'Odisha',
            pincode: `75${randomInt(1000, 9999)}`,
            country: 'India'
          }
        },
        roleInfo: {
          role: 'volunteer',
          hierarchy: {
            villageId: village._id,
            hierarchyLevel: 'village'
          }
        },
        status: 'active',
        termsAccepted: true,
        privacyPolicyAccepted: true,
        isEmailVerified: true,
        isPhoneVerified: true
      });
      
      users.volunteers.push(volunteer);
      
      // Update village with first volunteer as local leader
      if (i === 1) {
        await Village.findByIdAndUpdate(village._id, {
          'leadership.localLeader.userId': volunteer._id,
          'leadership.localLeader.name': `${firstName} ${lastName}`,
          'leadership.localLeader.contactNumber': volunteer.authentication.phone
        });
      }
      
      console.log(`      ✅ Created volunteer: ${volunteer.authentication.username}`);
    }
  }
  
  // Seed Community Members (5-10 per village)
  console.log('   Creating community members...');
  for (const village of villages) {
    const numMembers = randomInt(5, 10);
    
    for (let i = 1; i <= numMembers; i++) {
      const gender = Math.random() > 0.5 ? 'female' : 'male';
      const { firstName, lastName } = generateIndianName(gender);
      const hashedPassword = await hashPassword('User@123');
      const block = await Block.findById(village.blockId);
      
      const member = await User.create({
        authentication: {
          username: generateUsername('user', block.name, village.name, i),
          email: generateEmail(`user.${block.name.toLowerCase().replace(/\s+/g, '')}.${village.name.toLowerCase().replace(/\s+/g, '')}${i}`, 'example.com'),
          password: hashedPassword,
          phone: generatePhoneNumber()
        },
        personalInfo: {
          firstName,
          lastName,
          dateOfBirth: randomDate(new Date(1940, 0, 1), new Date(2005, 0, 1)),
          gender
        },
        contactInfo: {
          address: {
            street: village.name,
            city: block.name,
            state: 'Odisha',
            pincode: `75${randomInt(1000, 9999)}`,
            country: 'India'
          }
        },
        roleInfo: {
          role: 'user',
          hierarchy: {
            villageId: village._id,
            hierarchyLevel: 'village'
          }
        },
        status: 'active',
        termsAccepted: true,
        privacyPolicyAccepted: true,
        isEmailVerified: true,
        isPhoneVerified: true
      });
      
      users.communityMembers.push(member);
      
      if (i <= 3) { // Only log first few to avoid clutter
        console.log(`      ✅ Created community member: ${member.authentication.username}`);
      }
    }
    console.log(`      ... created ${numMembers} community members for ${village.name}`);
  }
  
  console.log(`✅ Total users created: ${users.admins.length + users.healthOfficials.length + users.blockOfficers.length + users.ashaWorkers.length + users.volunteers.length + users.communityMembers.length}\n`);
  return users;
}

/**
 * Seed patient records
 */
async function seedPatientRecords(villages, ashaWorkers) {
  console.log('\n🏥 Seeding Patient Records...');
  
  const patients = [];
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const chronicConditions = ['diabetes', 'hypertension', 'asthma', 'heart_disease', 'arthritis'];
  const educationLevels = ['illiterate', 'primary', 'secondary', 'higher_secondary', 'graduate', 'post_graduate'];
  const occupations = ['agriculture', 'daily_wage_labor', 'skilled_labor', 'business_trade', 'government_service', 'student', 'homemaker', 'retired'];
  const rationCardTypes = ['APL', 'BPL', 'AAY', 'NONE'];
  
  let patientCounter = 1;
  
  for (const village of villages) {
    const numPatients = randomInt(10, 20);
    const villageAshas = ashaWorkers.filter(a => 
      a.roleInfo.hierarchy.villageId.toString() === village._id.toString()
    );
    
    for (let i = 0; i < numPatients; i++) {
      const gender = Math.random() > 0.5 ? 'female' : 'male';
      const { firstName, lastName } = generateIndianName(gender);
      const age = randomInt(0, 90);
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - age);
      
      const assignedAsha = randomChoice(villageAshas);
      
      // Generate 10-digit mobile number (no country code)
      const primaryPhone = `${randomInt(6, 9)}${String(randomInt(0, 999999999)).padStart(9, '0')}`;
      const emergencyPhone = `${randomInt(6, 9)}${String(randomInt(0, 999999999)).padStart(9, '0')}`;
      
      const patient = await PatientRecord.create({
        patientId: `PAT-VLG-${String(patientCounter++).padStart(4, '0')}`,
        personalInfo: {
          firstName,
          lastName,
          dateOfBirth: dob,
          age: {
            years: age,
            months: randomInt(0, 11),
            calculated: new Date()
          },
          gender,
          maritalStatus: age >= 18 ? randomChoice(['single', 'married', 'divorced', 'widowed']) : 'single'
        },
        contactInfo: {
          mobileNumber: {
            primary: primaryPhone,
            secondary: Math.random() > 0.7 ? `${randomInt(6, 9)}${String(randomInt(0, 999999999)).padStart(9, '0')}` : undefined
          },
          emergencyContacts: [
            {
              name: generateIndianName(Math.random() > 0.5 ? 'female' : 'male').firstName,
              relationship: randomChoice(['spouse', 'parent', 'child', 'sibling', 'relative']),
              phoneNumber: emergencyPhone,
              isPrimary: true
            }
          ]
        },
        familyInfo: {
          householdSize: randomInt(3, 8),
          householdIncome: {
            amount: randomInt(5000, 30000),
            frequency: 'monthly',
            belowPovertyLine: Math.random() > 0.6
          }
        },
        healthProfile: {
          bloodGroup: randomChoice(bloodGroups),
          allergies: Math.random() > 0.8 ? [
            {
              allergen: randomChoice(['penicillin', 'sulfa_drugs', 'aspirin']),
              type: 'medication',
              severity: randomChoice(['mild', 'moderate', 'severe'])
            }
          ] : [],
          chronicConditions: Math.random() > 0.7 ? [
            {
              condition: randomChoice(chronicConditions),
              severity: randomChoice(['mild', 'moderate', 'severe']),
              status: 'active',
              diagnosedDate: randomDate(new Date(2020, 0, 1), new Date())
            }
          ] : [],
          currentMedications: Math.random() > 0.6 ? [
            {
              medicationName: randomChoice(['Metformin', 'Amlodipine', 'Aspirin', 'Insulin']),
              dosage: '1 tablet',
              frequency: 'daily',
              isActive: true
            }
          ] : []
        },
        location: {
          villageId: village._id,
          address: {
            houseNumber: String(randomInt(1, 999)),
            streetName: village.name,
            landmark: randomChoice(['Near Temple', 'Near School', 'Main Road', 'Village Center']),
            pincode: `75${randomInt(1000, 9999)}`,
            coordinates: {
              latitude: village.location.coordinates.latitude,
              longitude: village.location.coordinates.longitude
            }
          }
        },
        socioeconomic: {
          education: {
            level: randomChoice(educationLevels)
          },
          occupation: {
            primary: randomChoice(occupations)
          },
          economicStatus: {
            rationCardType: randomChoice(rationCardTypes)
          }
        },
        registration: {
          registeredBy: assignedAsha._id,
          registrationDate: randomDate(new Date(2024, 0, 1), new Date())
        },
        careManagement: {
          assignedAshaWorker: assignedAsha._id,
          lastCheckupDate: randomDate(new Date(2024, 6, 1), new Date())
        },
        specialPrograms: {
          maternalHealth: {
            isPregnant: gender === 'female' && age >= 18 && age <= 40 && Math.random() > 0.9
          },
          childHealth: {
            isChild: age < 18
          },
          elderlycare: {
            isElderly: age >= 60
          }
        },
        status: {
          isActive: true,
          isDeceased: Math.random() > 0.98
        },
        createdBy: assignedAsha._id
      });
      
      patients.push(patient);
    }
    
    console.log(`   ✅ Created ${numPatients} patients for ${village.name}`);
  }
  
  console.log(`✅ ${patients.length} patient records created\n`);
  return patients;
}

/**
 * Seed water quality tests
 */
async function seedWaterQualityTests(villages, volunteers) {
  console.log('\n💧 Seeding Water Quality Tests...');
  
  const tests = [];
  const testTypes = ['routine', 'follow_up', 'complaint_based'];
  const seasons = ['summer', 'monsoon', 'winter', 'post_monsoon'];
  
  let testCounter = 1;
  
  for (const village of villages) {
    const villageVolunteers = volunteers.filter(v => 
      v.roleInfo.hierarchy.villageId.toString() === village._id.toString()
    );
    
    if (villageVolunteers.length === 0) continue;
    
    for (const waterSource of village.infrastructure.waterSources) {
      const numTests = randomInt(2, 5);
      
      for (let i = 0; i < numTests; i++) {
        const volunteer = randomChoice(villageVolunteers);
        
        // Generate realistic water quality parameters
        const phValue = parseFloat((6 + Math.random() * 3).toFixed(1)); // 6.0 - 9.0
        const turbidityValue = parseFloat((Math.random() * 5).toFixed(1)); // 0 - 5 NTU
        const chlorineValue = parseFloat((Math.random() * 2).toFixed(2)); // 0 - 2 mg/L
        const ecoliValue = Math.floor(Math.random() * 10); // 0 - 10 CFU/100mL
        const coliformValue = Math.floor(Math.random() * 20);
        
        // Determine status for each parameter
        const phStatus = (phValue >= 6.5 && phValue <= 8.5) ? 'safe' : (phValue < 6.5 ? 'acidic' : 'alkaline');
        const turbidityStatus = turbidityValue <= 1 ? 'safe' : (turbidityValue <= 3 ? 'borderline' : 'unsafe');
        const ecoliStatus = ecoliValue === 0 ? 'safe' : 'contaminated';
        const coliformStatus = coliformValue === 0 ? 'safe' : 'contaminated';
        
        // Determine overall status based on parameters
        let overallStatus = 'safe';
        let contaminationLevel = 'none';
        let riskAssessment = 'no_risk';
        
        if (ecoliValue > 0 || coliformValue > 0 || turbidityValue > 3) {
          overallStatus = 'contaminated';
          contaminationLevel = 'high';
          riskAssessment = 'high_risk';
        } else if (phValue < 6.5 || phValue > 8.5 || turbidityValue > 1) {
          overallStatus = 'needs_treatment';
          contaminationLevel = 'medium';
          riskAssessment = 'medium_risk';
        }
        
        const test = await WaterQualityTest.create({
          testId: `WQT-VLG-${String(testCounter++).padStart(4, '0')}`,
          waterSourceId: waterSource._id, // Use the MongoDB _id from the subdocument
          villageId: village._id,
          testDate: randomDate(new Date(2024, 6, 1), new Date()),
          testType: randomChoice(testTypes),
          testingMethod: randomChoice(['field_test_kit', 'laboratory_analysis', 'rapid_test']),
          conductedBy: volunteer._id,
          sampleId: `SAMPLE-${village.name.toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
          physicalParameters: {
            turbidity: {
              value: turbidityValue,
              unit: 'NTU',
              threshold: 1,
              status: turbidityStatus
            },
            color: {
              value: randomChoice(['clear', 'slightly_cloudy', 'cloudy']),
              status: randomChoice(['colorless', 'slight_color', 'colored'])
            },
            odor: {
              value: randomChoice(['none', 'slight', 'moderate']),
              status: randomChoice(['odorless', 'slight_odor', 'strong_odor'])
            },
            temperature: {
              value: randomInt(20, 35),
              unit: 'C'
            }
          },
          chemicalParameters: {
            pH: {
              value: phValue,
              status: phStatus
            },
            chlorine: {
              value: chlorineValue,
              unit: 'mg/L',
              threshold: 0.2,
              status: chlorineValue >= 0.2 ? 'adequate' : 'insufficient'
            },
            fluoride: {
              value: parseFloat((Math.random() * 2).toFixed(2)),
              unit: 'mg/L',
              status: 'safe'
            },
            nitrates: {
              value: parseFloat((Math.random() * 60).toFixed(1)),
              unit: 'mg/L',
              threshold: 45,
              status: 'safe'
            },
            heavyMetals: {
              arsenic: {
                value: parseFloat((Math.random() * 5).toFixed(2)),
                unit: 'µg/L',
                threshold: 10,
                status: 'safe'
              },
              lead: {
                value: parseFloat((Math.random() * 5).toFixed(2)),
                unit: 'µg/L',
                threshold: 10,
                status: 'safe'
              },
              mercury: {
                value: parseFloat((Math.random() * 3).toFixed(2)),
                unit: 'µg/L',
                threshold: 6,
                status: 'safe'
              }
            }
          },
          biologicalParameters: {
            eColi: {
              value: ecoliValue,
              unit: 'CFU/100mL',
              threshold: 0,
              status: ecoliStatus
            },
            coliformBacteria: {
              value: coliformValue,
              unit: 'CFU/100mL',
              threshold: 0,
              status: coliformStatus
            }
          },
          testResults: {
            overallStatus,
            contaminationLevel,
            contaminationTypes: overallStatus !== 'safe' ? [
              ecoliValue > 0 || coliformValue > 0 ? 'biological' : null,
              turbidityValue > 3 ? 'physical' : null
            ].filter(Boolean) : [],
            riskAssessment
          },
          location: {
            coordinates: {
              latitude: waterSource.coordinates.latitude,
              longitude: waterSource.coordinates.longitude
            }
          },
          weatherConditions: {
            season: randomChoice(seasons),
            temperature: randomInt(20, 40),
            humidity: randomInt(40, 90)
          },
          remediation: overallStatus !== 'safe' ? {
            recommendedActions: [
              {
                action: overallStatus === 'contaminated' ? 'Immediate chlorination required' : 'Regular monitoring needed',
                priority: overallStatus === 'contaminated' ? 'urgent' : 'medium',
                timeline: overallStatus === 'contaminated' ? 'immediate' : 'within_week'
              }
            ],
            followUpRequired: true
          } : undefined,
          createdBy: volunteer._id,
          isActive: true
        });
        
        tests.push(test);
      }
    }
    
    console.log(`   ✅ Created water quality tests for ${village.name}`);
  }
  
  console.log(`✅ ${tests.length} water quality tests created\n`);
  return tests;
}

/**
 * Seed health reports
 */
async function seedHealthReports(villages, ashaWorkers, volunteers) {
  console.log('\n📊 Seeding Health Reports...');
  
  const reports = [];
  const reportTypes = ['disease_outbreak', 'routine_health_survey', 'water_quality_concern', 'community_health_observation'];
  const severityLevels = ['low', 'medium', 'high', 'critical'];
  const diseaseTypes = ['diarrhea', 'malaria', 'dengue', 'typhoid', 'cholera', 'jaundice', 'respiratory_infection'];
  let reportCounter = 1;
  
  for (const village of villages) {
    const numReports = randomInt(5, 10);
    const villageAshas = ashaWorkers.filter(a => 
      a.roleInfo.hierarchy.villageId.toString() === village._id.toString()
    );
    const villageVolunteers = volunteers.filter(v => 
      v.roleInfo.hierarchy.villageId.toString() === village._id.toString()
    );
    
    const allReporters = [...villageAshas, ...villageVolunteers];
    
    for (let i = 0; i < numReports; i++) {
      if (allReporters.length === 0) break;
      
      const reporter = randomChoice(allReporters);
      const reportType = randomChoice(reportTypes);
      const severity = randomChoice(severityLevels);
      
      let title, description;
      
      switch (reportType) {
        case 'disease_outbreak':
          const disease = randomChoice(diseaseTypes);
          title = `Increased cases of ${disease} reported`;
          description = `Multiple cases of ${disease} have been reported in the village over the past week. Immediate investigation and preventive measures recommended.`;
          break;
        case 'water_quality_concern':
          title = 'Water source contamination reported';
          description = 'Community members report unusual taste and odor in drinking water. Water quality testing recommended.';
          break;
        case 'routine_health_survey':
          title = 'Monthly health survey completed';
          description = 'Routine health checkup and survey conducted in the village. General health parameters recorded.';
          break;
        default:
          title = 'Community health observation';
          description = 'General health status observation and community health awareness session conducted.';
      }
      
      const report = await HealthReport.create({
        reportId: `HRP-VLG-${String(reportCounter++).padStart(4, '0')}`,
        reportType,
        title,
        description,
        reporter: reporter._id,
        reporterRole: reporter.roleInfo.role,
        affectedPopulation: {
          estimatedCount: randomInt(5, 50),
          demographics: {
            children: randomInt(1, 15),
            adults: randomInt(3, 25),
            elderly: randomInt(1, 10)
          }
        },
        geographicScope: {
          scopeType: 'village',
          specificArea: randomChoice(['Main hamlet', 'North section', 'South section', 'Near water source'])
        },
        severityAssessment: {
          level: severity,
          immediateActionRequired: severity === 'critical'
        },
        location: {
          village: village._id,
          gpsCoordinates: village.location.coordinates
        },
        incidentDate: randomDate(new Date(2024, 8, 1), new Date()),
        submissionStatus: randomChoice(['submitted', 'under_review', 'approved', 'action_taken']),
        priority: {
          level: severity === 'critical' ? 'emergency' : severity === 'high' ? 'urgent' : severity === 'medium' ? 'high' : 'medium'
        },
        resolution: Math.random() > 0.7 ? {
          status: 'resolved',
          resolutionDate: randomDate(new Date(2024, 9, 1), new Date()),
          actionsTaken: [
            'Health camp organized',
            'Affected families visited',
            'Medicines distributed'
          ]
        } : undefined,
        isActive: true
      });
      
      reports.push(report);
    }
    
    console.log(`   ✅ Created ${numReports} health reports for ${village.name}`);
  }
  
  console.log(`✅ ${reports.length} health reports created\n`);
  return reports;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

/**
 * Main seeding function
 */
async function seedDatabase() {
  const startTime = Date.now();
  
  console.log('\n🌟 ===================================================');
  console.log('   AquaShield Health Surveillance System');
  console.log('   Database Seeding Script');
  console.log('   Started:', new Date().toISOString());
  console.log('===================================================\n');
  
  try {
    // Handle different modes
    if (clearOnly) {
      await clearDatabase();
      console.log('✅ Database cleared. Exiting (--clear-only flag used).\n');
      return;
    }
    
    // Seed geographic hierarchy
    let districts, blocks, villages;
    
    if (usersOnly) {
      // Load existing data without clearing
      console.log('\n📋 Loading existing geographic data (--users-only mode)...');
      districts = await District.find();
      blocks = await Block.find();
      villages = await Village.find();
      
      if (districts.length === 0) {
        console.log('❌ No districts found. Please run full seeding first.\n');
        return;
      }
      
      // Clear only user-related data
      console.log('🗑️  Clearing existing user-related data...');
      await User.deleteMany({});
      await PatientRecord.deleteMany({});
      await WaterQualityTest.deleteMany({});
      await HealthReport.deleteMany({});
      console.log('✅ User data cleared\n');
    } else {
      // Clear all data for full seeding
      await clearDatabase();
      
      // Handle minimal mode
      if (minimal) {
        console.log('\n📦 Minimal seeding mode enabled\n');
        // Seed only Khordha district with 2 blocks
        districts = await seedDistricts(true); // Pass minimal flag
        blocks = await seedBlocks(districts, true); // Pass minimal flag
        villages = await seedVillages(blocks, true); // Pass minimal flag
      } else {
        districts = await seedDistricts();
        blocks = await seedBlocks(districts);
        villages = await seedVillages(blocks);
      }
    }
    
    // Seed users
    const users = await seedUsers(districts, blocks, villages);
    
    if (usersOnly) {
      console.log('✅ Users seeded. Exiting (--users-only flag used).\n');
      return;
    }
    
    // Seed operational data
    await seedPatientRecords(villages, users.ashaWorkers);
    await seedWaterQualityTests(villages, users.volunteers);
    await seedHealthReports(villages, users.ashaWorkers, users.volunteers);
    
    // Log summary
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n📈 ===================================================');
    console.log('   SEEDING SUMMARY');
    console.log('===================================================');
    console.log(`   Districts:          ${districts.length}`);
    console.log(`   Blocks:             ${blocks.length}`);
    console.log(`   Villages:           ${villages.length}`);
    console.log(`   Admins:             ${users.admins.length}`);
    console.log(`   Health Officials:   ${users.healthOfficials.length}`);
    console.log(`   Block Officers:     ${users.blockOfficers.length}`);
    console.log(`   ASHA Workers:       ${users.ashaWorkers.length}`);
    console.log(`   Volunteers:         ${users.volunteers.length}`);
    console.log(`   Community Members:  ${users.communityMembers.length}`);
    console.log(`   Total Users:        ${users.admins.length + users.healthOfficials.length + users.blockOfficers.length + users.ashaWorkers.length + users.volunteers.length + users.communityMembers.length}`);
    console.log(`   Patient Records:    ${await PatientRecord.countDocuments()}`);
    console.log(`   Water Quality Tests: ${await WaterQualityTest.countDocuments()}`);
    console.log(`   Health Reports:     ${await HealthReport.countDocuments()}`);
    console.log('===================================================');
    console.log(`   ⏱️  Duration: ${duration} seconds`);
    console.log(`   ✅ Database seeding completed successfully!`);
    console.log('===================================================\n');
    
    // Display sample login credentials
    console.log('\n🔐 ===================================================');
    console.log('   SAMPLE LOGIN CREDENTIALS');
    console.log('===================================================');
    console.log('\n   👤 Admin:');
    console.log(`      Username: ${users.admins[0].authentication.username}`);
    console.log(`      Password: Admin@123`);
    console.log(`      Email:    ${users.admins[0].authentication.email}`);
    
    console.log('\n   👨‍⚕️ Health Official (District):');
    console.log(`      Username: ${users.healthOfficials[0].authentication.username}`);
    console.log(`      Password: Health@123`);
    console.log(`      Email:    ${users.healthOfficials[0].authentication.email}`);
    
    console.log('\n   👨‍💼 Block Officer:');
    console.log(`      Username: ${users.blockOfficers[0].authentication.username}`);
    console.log(`      Password: Block@123`);
    console.log(`      Email:    ${users.blockOfficers[0].authentication.email}`);
    
    console.log('\n   👩‍⚕️ ASHA Worker:');
    console.log(`      Username: ${users.ashaWorkers[0].authentication.username}`);
    console.log(`      Password: Asha@123`);
    console.log(`      Email:    ${users.ashaWorkers[0].authentication.email}`);
    
    console.log('\n   🤝 Volunteer:');
    console.log(`      Username: ${users.volunteers[0].authentication.username}`);
    console.log(`      Password: Volunteer@123`);
    console.log(`      Email:    ${users.volunteers[0].authentication.email}`);
    
    console.log('\n   🧑 Community Member:');
    console.log(`      Username: ${users.communityMembers[0].authentication.username}`);
    console.log(`      Password: User@123`);
    console.log(`      Email:    ${users.communityMembers[0].authentication.email}`);
    
    console.log('\n===================================================\n');
    
  } catch (error) {
    console.error('\n❌ Error during database seeding:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// ============================================================================
// SCRIPT EXECUTION
// ============================================================================

// Connect to database and run seeding
connectDB()
  .then(async () => {
    await seedDatabase();
    await mongoose.connection.close();
    console.log('🔌 Database connection closed.\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to connect to database:', error);
    process.exit(1);
  });
