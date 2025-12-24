import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

// Define subdocument schemas
const primaryHealthCenterSchema = new mongoose.Schema({
  name: String,
  coordinates: { latitude: Number, longitude: Number },
  contactNumber: String,
  incharge: ObjectId
}, { _id: false });

const subCenterSchema = new mongoose.Schema({
  name: String,
  coordinates: { latitude: Number, longitude: Number },
  catchmentVillages: [String]
}, { _id: false });

const ashaWorkerSchema = new mongoose.Schema({
  userId: ObjectId,
  assignedVillages: [ObjectId],
  joiningDate: Date,
  status: String
}, { _id: false });

const volunteerSchema = new mongoose.Schema({
  userId: ObjectId,
  assignedVillages: [ObjectId],
  joiningDate: Date,
  status: String
}, { _id: false });

const villageTokenSchema = new mongoose.Schema({
  token: String,
  generatedFor: String,
  generatedBy: ObjectId,
  assignedLeader: {
    userId: ObjectId,
    role: String
  },
  isUsed: Boolean,
  usedBy: ObjectId,
  expiresAt: Date,
  createdAt: Date
}, { _id: false });

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
      primaryHealthCenters: [primaryHealthCenterSchema],
      subCenters: [subCenterSchema],
    },

    // Staff Management
    staff: {
      ashaWorkers: [ashaWorkerSchema],
      volunteers: [volunteerSchema],
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
    villageTokens: [villageTokenSchema],

    status: String, // enum: ['pending_approval', 'active', 'inactive']
    createdBy: ObjectId,
  },
  { timestamps: true }
);

export default mongoose.model("Block", blockSchema);
