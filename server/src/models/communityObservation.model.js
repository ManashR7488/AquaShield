import mongoose from 'mongoose';
import { getNextSequence } from './counter.model.js';

const { Schema } = mongoose;

// Community Observation Schema for tracking community-level health observations
const communityObservationSchema = new Schema({
  // Observation Identification
  observationId: {
    type: String,
    unique: true,
    required: true,
    match: /^COB-VLG-\d{4}$/,
    uppercase: true
  },

  // Observer Information
  observer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  observationDate: {
    type: Date,
    required: true,
    default: Date.now,
    validate: {
      validator: function(v) {
        return v <= new Date();
      },
      message: 'Observation date cannot be in the future'
    }
  },

  observationMethod: {
    type: String,
    enum: ['field_visit', 'community_meeting', 'household_survey', 'focus_group', 'direct_observation', 'interview', 'photography', 'measurement'],
    required: true,
    lowercase: true
  },

  // Observation Categorization
  observationType: {
    type: String,
    required: true,
    enum: [
      'community_health_pattern',
      'environmental_health_factor',
      'behavioral_observation',
      'infrastructure_assessment',
      'social_determinant',
      'disease_surveillance',
      'community_engagement_metric',
      'water_sanitation_hygiene',
      'nutrition_status',
      'maternal_child_health',
      'vector_control',
      'waste_management'
    ],
    lowercase: true
  },

  // Observation Details
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },

  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },

  affectedPopulation: {
    estimatedCount: Number,
    demographics: {
      households: { type: Number, default: 0 },
      individuals: { type: Number, default: 0 },
      children: { type: Number, default: 0 },
      adults: { type: Number, default: 0 },
      elderly: { type: Number, default: 0 },
      pregnant: { type: Number, default: 0 }
    },
    vulnerableGroups: [String],
    riskFactors: [String]
  },

  geographicScope: {
    scopeLevel: {
      type: String,
      enum: ['household', 'hamlet', 'village_section', 'entire_village', 'multiple_villages'],
      required: true,
      lowercase: true
    },
    specificLocation: {
      type: String,
      trim: true
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        validate: {
          validator: function(val) {
            return val.length === 2 && 
                   val[0] >= -180 && val[0] <= 180 && 
                   val[1] >= -90 && val[1] <= 90;
          },
          message: 'Coordinates must be [longitude, latitude] with valid ranges'
        }
      }
    },
    landmarks: [String]
  },

  severityAssessment: {
    severity: {
      type: String,
      enum: ['minimal', 'mild', 'moderate', 'severe', 'critical'],
      required: true,
      lowercase: true
    },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent', 'immediate'],
      required: true,
      lowercase: true
    },
    potentialImpact: {
      type: String,
      enum: ['individual', 'household', 'community', 'village', 'block', 'district'],
      required: true,
      lowercase: true
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'very_high', 'extreme'],
      required: true,
      lowercase: true
    }
  },

  // Environmental Context
  environmentalContext: {
    weatherConditions: {
      temperature: Number, // Celsius
      humidity: Number,    // Percentage
      rainfall: Number,    // mm
      windSpeed: Number,   // km/h
      weatherDescription: String
    },
    seasonalFactors: {
      season: {
        type: String,
        enum: ['summer', 'monsoon', 'winter', 'post_monsoon'],
        lowercase: true
      },
      seasonalRisks: [String],
      climateImpact: String
    },
    waterQualityObservations: {
      sourceType: String, // 'well', 'borehole', 'river', 'pond'
      visualInspection: String,
      odor: String,
      color: String,
      turbidity: {
        type: String,
        enum: ['clear', 'slightly_turbid', 'turbid', 'very_turbid']
      },
      suspectedContaminants: [String]
    },
    sanitationStatus: {
      toiletAvailability: {
        type: String,
        enum: ['adequate', 'insufficient', 'poor', 'absent']
      },
      wasteDisposal: String,
      drainageSystem: String,
      publicHygiene: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor', 'very_poor']
      }
    },
    vectorBreedingSites: [{
      vectorType: String, // 'mosquito', 'fly', 'rodent'
      breedingSite: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high']
      },
      interventionNeeded: Boolean
    }],
    pollutionLevels: {
      airQuality: String,
      noiseLevel: String,
      waterPollution: String,
      soilContamination: String
    },
    infrastructureConditions: {
      roads: String,
      electricity: String,
      communicationNetwork: String,
      healthFacilities: String,
      schools: String,
      markets: String
    }
  },

  // Social Context
  socialContext: {
    communityPractices: [{
      practice: String,
      prevalence: {
        type: String,
        enum: ['rare', 'occasional', 'common', 'very_common', 'universal']
      },
      healthImpact: {
        type: String,
        enum: ['positive', 'neutral', 'negative', 'mixed']
      },
      culturalSignificance: String
    }],
    healthSeekingBehavior: {
      preferredProvider: String, // 'public_health', 'private', 'traditional', 'self_medication'
      treatmentDelay: String,
      barriers: [String], // 'distance', 'cost', 'cultural', 'availability'
      facilitators: [String]
    },
    complianceWithHealthPrograms: {
      vaccinationCompliance: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor']
      },
      nutritionProgramParticipation: {
        type: String,
        enum: ['high', 'medium', 'low']
      },
      awarenessLevel: {
        type: String,
        enum: ['high', 'medium', 'low']
      },
      motivationFactors: [String],
      resistanceFactors: [String]
    },
    socialSupportSystems: {
      familySupport: String,
      communitySupport: String,
      peerNetworks: String,
      leadershipInfluence: String
    },
    culturalFactors: {
      beliefs: [String],
      traditions: [String],
      taboos: [String],
      rituals: [String],
      influentialPersons: [String]
    }
  },

  // Trend Analysis
  trendAnalysis: {
    historicalPattern: {
      isRecurring: Boolean,
      frequency: String, // 'daily', 'weekly', 'monthly', 'seasonal', 'annual'
      previousOccurrences: [{
        date: Date,
        severity: String,
        description: String
      }],
      trendDirection: {
        type: String,
        enum: ['improving', 'stable', 'worsening', 'fluctuating']
      }
    },
    seasonalVariations: [{
      season: String,
      typical_characteristics: String,
      risk_factors: [String]
    }],
    correlationFactors: [{
      factor: String,
      correlation_strength: {
        type: String,
        enum: ['strong', 'moderate', 'weak']
      },
      description: String
    }],
    predictiveIndicators: [{
      indicator: String,
      threshold: String,
      action_required: String
    }]
  },

  // Follow-up Tracking
  followUpTracking: {
    recommendedActions: [{
      action: {
        type: String,
        required: true
      },
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        required: true
      },
      responsibleParty: String,
      timeline: String,
      status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'cancelled'],
        default: 'pending'
      }
    }],
    interventionsImplemented: [{
      intervention: String,
      implementedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      implementationDate: Date,
      outcome: String,
      effectiveness: {
        type: String,
        enum: ['very_effective', 'effective', 'moderately_effective', 'ineffective']
      }
    }],
    monitoringSchedule: [{
      scheduledDate: Date,
      monitoringType: String,
      assignedTo: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      completionStatus: {
        type: String,
        enum: ['scheduled', 'in_progress', 'completed', 'postponed', 'cancelled'],
        default: 'scheduled'
      }
    }],
    outcomeAssessment: {
      assessmentDate: Date,
      assessedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      overallOutcome: {
        type: String,
        enum: ['resolved', 'improved', 'stable', 'worsened', 'unresolved']
      },
      lessons_learned: [String],
      recommendations: [String]
    }
  },

  // Location Reference
  location: {
    village: {
      type: Schema.Types.ObjectId,
      ref: 'Village',
      required: true
    },
    hamlet: String,
    area_description: String
  },

  // Supporting Evidence
  evidence: {
    photos: [{
      url: String,
      description: String,
      timestamp: { type: Date, default: Date.now },
      gps_coordinates: {
        latitude: Number,
        longitude: Number
      }
    }],
    measurements: [{
      parameter: String,
      value: Number,
      unit: String,
      measurement_method: String,
      timestamp: { type: Date, default: Date.now }
    }],
    interviews: [{
      interviewee_role: String,
      key_points: [String],
      direct_quotes: [String],
      interview_date: { type: Date, default: Date.now }
    }],
    documents: [{
      document_type: String,
      filename: String,
      url: String,
      upload_date: { type: Date, default: Date.now }
    }]
  },

  // Quality Assurance
  dataQuality: {
    completeness: {
      type: Number,
      min: 0,
      max: 100
    },
    accuracy: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    reliability: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending_verification', 'verified', 'disputed'],
      default: 'unverified'
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    verificationDate: Date
  },

  // System Fields
  isActive: {
    type: Boolean,
    default: true
  },

  // Metadata
  metadata: {
    source: String, // 'routine_survey', 'special_investigation', 'complaint', 'surveillance'
    confidence_level: {
      type: String,
      enum: ['very_high', 'high', 'medium', 'low'],
      default: 'medium'
    },
    data_collection_duration: Number, // minutes
    weather_during_observation: String,
    additional_notes: String
  }
}, {
  timestamps: true,
  collection: 'communityObservations',
  suppressReservedKeysWarning: true
});

// Generate unique observationId before saving
communityObservationSchema.pre('save', async function(next) {
  if (this.isNew) {
    const sequence = await getNextSequence('communityObservation');
    this.observationId = `COB-VLG-${sequence.toString().padStart(4, '0')}`;
  }
  next();
});

// Middleware to calculate data quality completeness
communityObservationSchema.pre('save', function(next) {
  let completedFields = 0;
  let totalFields = 15; // Base important fields

  // Check completion of key sections
  if (this.title && this.title.length > 10) completedFields++;
  if (this.description && this.description.length > 50) completedFields++;
  if (this.affectedPopulation?.estimatedCount > 0) completedFields++;
  if (this.geographicScope?.coordinates?.coordinates && this.geographicScope.coordinates.coordinates.length === 2) completedFields++;
  if (this.environmentalContext?.weatherConditions?.temperature) completedFields++;
  if (this.socialContext?.communityPractices?.length > 0) completedFields++;
  if (this.evidence?.photos?.length > 0 || this.evidence?.measurements?.length > 0) completedFields++;
  if (this.trendAnalysis?.historicalPattern?.isRecurring !== undefined) completedFields++;
  if (this.followUpTracking?.recommendedActions?.length > 0) completedFields++;
  if (this.severityAssessment?.severity) completedFields++;
  if (this.severityAssessment?.urgency) completedFields++;
  if (this.severityAssessment?.riskLevel) completedFields++;
  if (this.observationMethod) completedFields++;
  if (this.location?.village) completedFields++;
  if (this.observer) completedFields++;

  this.dataQuality.completeness = Math.round((completedFields / totalFields) * 100);
  next();
});

// Virtual for days since observation
communityObservationSchema.virtual('daysSinceObservation').get(function() {
  const now = new Date();
  const observationDate = new Date(this.observationDate);
  return Math.floor((now - observationDate) / (1000 * 60 * 60 * 24));
});

// Virtual for follow-up completion rate
communityObservationSchema.virtual('followUpCompletionRate').get(function() {
  const totalActions = this.followUpTracking.recommendedActions.length;
  if (totalActions === 0) return 0;
  
  const completedActions = this.followUpTracking.recommendedActions.filter(
    action => action.status === 'completed'
  ).length;
  
  return Math.round((completedActions / totalActions) * 100);
});

// Virtual for risk score calculation
communityObservationSchema.virtual('riskScore').get(function() {
  const severityScores = { minimal: 1, mild: 2, moderate: 3, severe: 4, critical: 5 };
  const urgencyScores = { low: 1, medium: 2, high: 3, urgent: 4, immediate: 5 };
  const impactScores = { individual: 1, household: 2, community: 3, village: 4, block: 5, district: 6 };
  
  const severity = severityScores[this.severityAssessment.severity] || 1;
  const urgency = urgencyScores[this.severityAssessment.urgency] || 1;
  const impact = impactScores[this.severityAssessment.potentialImpact] || 1;
  
  return Math.round((severity * urgency * impact) / 3);
});

// Instance method to add follow-up action
communityObservationSchema.methods.addFollowUpAction = function(action, priority, responsibleParty, timeline) {
  this.followUpTracking.recommendedActions.push({
    action: action,
    priority: priority,
    responsibleParty: responsibleParty,
    timeline: timeline,
    status: 'pending'
  });
  
  return this.save();
};

// Instance method to update action status
communityObservationSchema.methods.updateActionStatus = function(actionIndex, status, outcome) {
  if (this.followUpTracking.recommendedActions[actionIndex]) {
    this.followUpTracking.recommendedActions[actionIndex].status = status;
    if (outcome) {
      this.followUpTracking.recommendedActions[actionIndex].outcome = outcome;
    }
  }
  
  return this.save();
};

// Instance method to add intervention
communityObservationSchema.methods.addIntervention = function(intervention, implementedBy, outcome, effectiveness) {
  this.followUpTracking.interventionsImplemented.push({
    intervention: intervention,
    implementedBy: implementedBy,
    implementationDate: new Date(),
    outcome: outcome,
    effectiveness: effectiveness
  });
  
  return this.save();
};

// Instance method to verify observation
communityObservationSchema.methods.verifyObservation = function(verifiedBy, verificationComments) {
  this.dataQuality.verificationStatus = 'verified';
  this.dataQuality.verifiedBy = verifiedBy;
  this.dataQuality.verificationDate = new Date();
  this.metadata.verificationComments = verificationComments;
  
  return this.save();
};

// Static method to get observations by severity
communityObservationSchema.statics.getObservationsBySeverity = function(severity, limit = 50) {
  return this.find({
    'severityAssessment.severity': severity,
    isActive: true
  })
  .populate('observer', 'personalInfo.firstName personalInfo.lastName roleInfo.role')
  .populate('location.village', 'name block district')
  .sort({ observationDate: -1 })
  .limit(limit);
};

// Static method to get observations requiring follow-up
communityObservationSchema.statics.getObservationsRequiringFollowUp = function() {
  return this.find({
    'followUpTracking.recommendedActions': {
      $elemMatch: {
        status: { $in: ['pending', 'in_progress'] }
      }
    },
    isActive: true
  })
  .populate('observer', 'personalInfo.firstName personalInfo.lastName roleInfo.role authentication.phone')
  .populate('location.village', 'name block district')
  .sort({ 'severityAssessment.urgency': 1, observationDate: 1 });
};

// Static method to get trend analysis by location (simplified)
communityObservationSchema.statics.getTrendAnalysisByLocation = function(villageId, observationType, days = 90) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  // Simple aggregation with basic grouping
  return this.aggregate([
    {
      $match: {
        'location.village': mongoose.Types.ObjectId(villageId),
        observationType: observationType,
        observationDate: { $gte: cutoffDate },
        isActive: true
      }
    },
    {
      $group: {
        _id: {
          month: { $month: '$observationDate' },
          year: { $year: '$observationDate' }
        },
        count: { $sum: 1 },
        severityLevels: { $push: '$severityAssessment.severity' }
      }
    },
    {
      $sort: { '_id.year': -1, '_id.month': -1 }
    },
    {
      $limit: 12 // Limit to prevent excessive results
    }
  ]);
};

// Static method to get environmental health indicators (simplified)
communityObservationSchema.statics.getEnvironmentalHealthIndicators = function(areaId, areaType = 'village') {
  const matchQuery = { isActive: true };
  
  if (areaType === 'village') {
    matchQuery['location.village'] = mongoose.Types.ObjectId(areaId);
  }
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$observationType',
        totalObservations: { $sum: 1 },
        severityLevels: { $push: '$severityAssessment.severity' },
        riskLevels: { $push: '$severityAssessment.riskLevel' },
        latestObservation: { $max: '$observationDate' }
      }
    },
    {
      $sort: { totalObservations: -1 }
    },
    {
      $limit: 10 // Limit results to prevent performance issues
    }
    ]);

};

// Static method to get community engagement metrics
communityObservationSchema.statics.getCommunityEngagementMetrics = function(villageId, days = 30) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        'location.village': mongoose.Types.ObjectId(villageId),
        observationDate: { $gte: cutoffDate },
        isActive: true
      }
    },
    {
      $group: {
        _id: '$observer',
        observationCount: { $sum: 1 },
        avgDataQuality: { $avg: '$dataQuality.completeness' },
        verifiedObservations: {
          $sum: {
            $cond: [{ $eq: ['$dataQuality.verificationStatus', 'verified'] }, 1, 0]
          }
        },
        observationTypes: { $addToSet: '$observationType' },
        followUpActions: {
          $sum: { $size: '$followUpTracking.recommendedActions' }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'observerInfo'
      }
    },
    {
      $unwind: '$observerInfo'
    },
    {
      $project: {
        observerName: '$observerInfo.name',
        observerRole: '$observerInfo.role',
        observationCount: 1,
        avgDataQuality: { $round: ['$avgDataQuality', 1] },
        verificationRate: {
          $round: [
            { $multiply: [{ $divide: ['$verifiedObservations', '$observationCount'] }, 100] },
            1
          ]
        },
        diversityScore: { $size: '$observationTypes' },
        followUpActions: 1
      }
    },
    {
      $sort: { observationCount: -1 }
    }
  ]);
};

// Indexes for efficient querying
communityObservationSchema.index({ observer: 1, observationDate: -1 });
communityObservationSchema.index({ observationType: 1, 'severityAssessment.severity': 1 });
communityObservationSchema.index({ 'location.village': 1, observationDate: -1 });
communityObservationSchema.index({ 'severityAssessment.urgency': 1, 'severityAssessment.severity': 1 });
communityObservationSchema.index({ 'dataQuality.verificationStatus': 1, observationDate: -1 });
communityObservationSchema.index({ observationDate: -1 });
communityObservationSchema.index({ isActive: 1, 'severityAssessment.riskLevel': 1 });

// Compound indexes for complex queries
communityObservationSchema.index({ 
  observationType: 1, 
  'location.village': 1, 
  observationDate: -1 
});

communityObservationSchema.index({ 
  'severityAssessment.severity': 1, 
  'severityAssessment.urgency': 1, 
  observationDate: -1 
});

communityObservationSchema.index({ 
  'followUpTracking.recommendedActions.status': 1, 
  'severityAssessment.urgency': 1 
});

// Geospatial index for location-based queries
communityObservationSchema.index({ 'geographicScope.coordinates': '2dsphere' });

export default mongoose.model('CommunityObservation', communityObservationSchema);