import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

// Define subdocument schema
const blockTokenSchema = new mongoose.Schema({
  token: String,
  generatedFor: String,
  generatedBy: ObjectId,
  isUsed: Boolean,
  usedBy: ObjectId,
  expiresAt: Date,
  createdAt: Date
}, { _id: false });

const districtSchema = new mongoose.Schema(
  {
    districtId: String, // unique identifier DIST-STATE-XXXX
    name: String, // required, district name
    state: String, // required
    code: String, // official government district code

    // District Officer (Health Official)
    districtOfficer: {
      userId: ObjectId, // reference to User with role 'health_official'
      appointedDate: Date,
      contactNumber: String,
      email: String,
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

    // Administrative Details
    demographics: {
      totalPopulation: Number,
      ruralPopulation: Number,
      urbanPopulation: Number,
      totalBlocks: Number,
      totalVillages: Number,
    },

    // Health Infrastructure
    healthInfrastructure: {
      districtHospitals: Number,
      communityHealthCenters: Number,
      primaryHealthCenters: Number,
      subCenters: Number,
    },

    // Block Registration Management
    blockRegistration: {
      registrationEnabled: Boolean, // default: true
      requiresApproval: Boolean, // default: true
      autoGenerateTokens: Boolean, // default: true
      tokenValidityDays: Number, // default: 30
      maxBlocksAllowed: Number,
    },

    // Generated Tokens for Block Registration
    blockTokens: [blockTokenSchema],

    status: String, // enum: ['active', 'inactive']
    createdBy: ObjectId, // reference to admin user
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("District", districtSchema);