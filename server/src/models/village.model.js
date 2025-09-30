import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const villageSchema = new mongoose.Schema(
  {
    villageId: String, // unique identifier VLG-BLK-XXXX
    name: String, // required
    blockId: ObjectId, // reference to Block

    // Registration Details
    registration: {
      registrationToken: String, // token used during registration
      approvedBy: ObjectId, // block officer who approved
      approvalDate: Date,
      villageCode: String, // unique code for this village
    },

    // Village Leadership
    leadership: {
      localLeader: {
        userId: ObjectId, // reference to User
        appointedBy: ObjectId, // block officer
        appointedDate: Date,
        role: String, // 'volunteer' or 'community_member'
        contactNumber: String,
      },
      panchayatHead: {
        name: String,
        contactNumber: String,
        email: String,
      },
    },

    // Geographic Information
    location: {
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
      boundaries: [[Number]], // polygon if available
      area: Number, // in square kilometers
      distanceFromBlock: Number, // in kilometers
      accessibility: String, // 'good', 'moderate', 'poor'
    },

    // Demographics
    demographics: {
      totalPopulation: Number,
      totalHouseholds: Number,
      malePopulation: Number,
      femalePopulation: Number,
      children: Number, // under 18
      elderly: Number, // over 60
      belowPovertyLine: Number,
      literacyRate: Number,
      mainOccupations: [String],
    },

    // Infrastructure
    infrastructure: {
      waterSources: [
        {
          type: String, // 'well', 'borewell', 'river', 'pond', 'pipeline'
          name: String,
          coordinates: { latitude: Number, longitude: Number },
          status: String, // 'functional', 'non_functional', 'contaminated'
          qualityLastTested: Date,
          servesHouseholds: Number,
        },
      ],
      sanitationFacilities: {
        totalToilets: Number,
        publicToilets: Number,
        wasteManagement: String, // 'proper', 'improper', 'none'
      },
      healthFacilities: [
        {
          type: String, // 'subcenter', 'anganwadi', 'private_clinic'
          name: String,
          coordinates: { latitude: Number, longitude: Number },
          staff: [ObjectId], // reference to Users
          services: [String],
        },
      ],
      connectivity: {
        roadConnectivity: String, // 'all_weather', 'seasonal', 'footpath'
        mobileNetwork: String, // '2G', '3G', '4G', 'poor', 'none'
        internetAccess: Boolean,
        nearestBusStop: Number, // distance in km
        nearestRailwayStation: Number, // distance in km
      },
    },

    // Health Profile
    healthProfile: {
      vulnerabilityScore: Number, // 1-10 (calculated)
      commonDiseases: [String],
      seasonalPatterns: [
        {
          season: String, // 'monsoon', 'winter', 'summer'
          commonIssues: [String],
          riskLevel: String, // 'low', 'medium', 'high'
        },
      ],
      lastOutbreak: {
        disease: String,
        date: Date,
        casesReported: Number,
        duration: Number, // days
      },
      immunizationCoverage: {
        children: Number, // percentage
        adults: Number, // percentage
      },
    },

    // User Registration Management
    userRegistration: {
      registrationEnabled: Boolean, // default: true
      requiresVerification: Boolean, // default: true
      maxUsersAllowed: Number,
    },

    status: String, // enum: ['pending_approval', 'active', 'inactive']
    createdBy: ObjectId, // reference to block officer
  },
  { timestamps: true }
);

export default mongoose.model("Village", villageSchema);
