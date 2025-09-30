import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const blockSchema = new mongoose.Schema(
  {
    blockId: String, // unique identifier BLK-DIST-XXXX
    name: String, // required
    districtId: ObjectId, // reference to District

    // Registration Details
    registration: {
      registrationToken: String, // token used during registration
      approvedBy: ObjectId, // district officer who approved
      approvalDate: Date,
      registrationCode: String, // unique code for this block
    },

    // Block Administrative Officer
    blockOfficer: {
      userId: ObjectId, // reference to User (can be health_official or senior asha_worker)
      appointedBy: ObjectId, // district officer
      appointedDate: Date,
      contactNumber: String,
    },

    // Geographic Information
    boundaries: {
      coordinates: [[Number]], // polygon coordinates
      area: Number, // in square kilometers
      headquarters: {
        latitude: Number,
        longitude: Number,
        address: String,
      },
    },

    // Demographics
    demographics: {
      totalPopulation: Number,
      totalVillages: Number,
      totalHouseholds: Number,
      literacyRate: Number,
    },

    // Health Infrastructure
    healthInfrastructure: {
      primaryHealthCenters: [
        {
          name: String,
          coordinates: { latitude: Number, longitude: Number },
          contactNumber: String,
          incharge: ObjectId, // reference to User
        },
      ],
      subCenters: [
        {
          name: String,
          coordinates: { latitude: Number, longitude: Number },
          catchmentVillages: [String],
        },
      ],
    },

    // Staff Management
    staff: {
      ashaWorkers: [
        {
          userId: ObjectId,
          assignedVillages: [ObjectId], // reference to Village
          joiningDate: Date,
          status: String, // 'active', 'inactive', 'transferred'
        },
      ],
      volunteers: [
        {
          userId: ObjectId,
          assignedVillages: [ObjectId],
          joiningDate: Date,
          status: String,
        },
      ],
      totalActiveStaff: Number,
    },

    // Village Registration Management
    villageRegistration: {
      registrationEnabled: Boolean, // default: true
      requiresApproval: Boolean, // default: true
      autoGenerateTokens: Boolean, // default: true
      tokenValidityDays: Number, // default: 15
      maxVillagesAllowed: Number,
    },

    // Generated Tokens for Village Registration
    villageTokens: [
      {
        token: String, // unique 6-digit alphanumeric
        generatedFor: String, // intended village name
        generatedBy: ObjectId, // block officer
        assignedLeader: {
          userId: ObjectId, // chosen local leader
          role: String, // 'volunteer' or 'community_member'
        },
        isUsed: Boolean, // default: false
        usedBy: ObjectId, // reference to Village
        expiresAt: Date,
        createdAt: Date,
      },
    ],

    status: String, // enum: ['pending_approval', 'active', 'inactive']
    createdBy: ObjectId,
  },
  { timestamps: true }
);

export default mongoose.model("Block", blockSchema);
