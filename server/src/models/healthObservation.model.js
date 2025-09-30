import mongoose from 'mongoose';
import { getNextSequence } from './counter.model.js';

const healthObservationSchema = new mongoose.Schema({
  // Observation Identification
  observationId: {
    type: String,
    unique: true,
    required: true,
    match: /^HOB-VLG-\d{4}$/,
    uppercase: true
  },
  
  // Observer Information
  observerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Location Context
  location: {
    villageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Village',
      required: true
    },
    specificLocation: {
      area: String,
      landmark: String,
      coordinates: {
        latitude: { type: Number, min: -90, max: 90 },
        longitude: { type: Number, min: -180, max: 180 },
        accuracy: { type: Number, default: 10 }
      }
    },
    coverageArea: {
      hamlets: [String],
      households: Number,
      approximatePopulation: Number,
      geographicScope: {
        type: String,
        enum: ['single_household', 'multiple_households', 'hamlet', 'village_section', 'entire_village'],
        default: 'multiple_households'
      }
    }
  },
  
  // Observation Details
  observationInfo: {
    observationDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    observationType: {
      type: String,
      required: true,
      enum: [
        'symptom_pattern',
        'environmental_health',
        'behavioral_observation',
        'infrastructure_health',
        'vector_surveillance',
        'disease_outbreak',
        'health_seeking_behavior',
        'community_practice',
        'nutritional_status',
        'maternal_child_health',
        'elderly_care',
        'disability_care',
        'mental_health',
        'other'
      ],
      lowercase: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000
    },
    severityLevel: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high', 'critical', 'emergency'],
      default: 'medium',
      lowercase: true
    },
    urgencyLevel: {
      type: String,
      enum: ['routine', 'attention_needed', 'urgent', 'immediate'],
      default: 'routine',
      lowercase: true
    },
    confidenceLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
      description: 'Observer confidence in the observation'
    }
  },
  
  // Observation Categories
  
  // 1. Symptom Patterns
  symptomPatterns: {
    symptomsObserved: [{
      symptom: {
        type: String,
        required: true
      },
      frequency: {
        type: String,
        enum: ['rare', 'occasional', 'frequent', 'very_frequent'],
        default: 'occasional'
      },
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe'],
        default: 'moderate'
      },
      ageGroups: [{
        type: String,
        enum: ['infants', 'children', 'adolescents', 'adults', 'elderly', 'all_ages']
      }],
      genderPattern: {
        type: String,
        enum: ['male_predominant', 'female_predominant', 'equal', 'unknown'],
        default: 'equal'
      },
      seasonalPattern: Boolean,
      clusteredCases: Boolean,
      familialClustering: Boolean
    }],
    suspectedDisease: {
      primarySuspicion: String,
      alternativeDiagnoses: [String],
      transmissionSuspected: {
        type: String,
        enum: ['person_to_person', 'vector_borne', 'food_water_borne', 'environmental', 'unknown']
      }
    },
    affectedDemographics: {
      totalAffected: Number,
      ageDistribution: {
        under5: Number,
        age5to14: Number,
        age15to44: Number,
        age45to64: Number,
        above65: Number
      },
      genderDistribution: {
        male: Number,
        female: Number
      },
      vulnerableGroups: {
        pregnant: Number,
        lactating: Number,
        disabled: Number,
        malnourished: Number,
        immunocompromised: Number
      }
    },
    temporalPattern: {
      onsetPeriod: String,
      peakPeriod: String,
      duration: String,
      isOngoing: Boolean,
      recurringPattern: Boolean
    }
  },
  
  // 2. Environmental Health
  environmentalHealth: {
    waterSources: {
      primarySources: [{
        sourceType: {
          type: String,
          enum: ['piped_water', 'tube_well', 'dug_well', 'spring', 'river', 'pond', 'tank', 'other']
        },
        quality: {
          type: String,
          enum: ['good', 'fair', 'poor', 'contaminated']
        },
        accessibility: {
          type: String,
          enum: ['easily_accessible', 'moderate_access', 'difficult_access', 'inaccessible']
        },
        adequacy: {
          type: String,
          enum: ['adequate', 'seasonal_shortage', 'frequent_shortage', 'chronic_shortage']
        },
        issues: [String]
      }],
      waterQualityIssues: {
        visualContamination: Boolean,
        tasteOdorIssues: Boolean,
        suspectedChemicalContamination: Boolean,
        suspectedBiologicalContamination: Boolean,
        fluorideIssues: Boolean,
        ironIssues: Boolean
      }
    },
    sanitation: {
      toiletFacilities: {
        householdsWithToilets: Number,
        toiletTypes: [{
          type: {
            type: String,
            enum: ['flush_toilet', 'pit_latrine', 'composting_toilet', 'none']
          },
          count: Number,
          condition: {
            type: String,
            enum: ['good', 'fair', 'poor', 'non_functional']
          }
        }],
        openDefecation: {
          practiced: Boolean,
          commonAreas: [String],
          timeOfDay: [String]
        }
      },
      wasteManagement: {
        solidWasteDisposal: {
          type: String,
          enum: ['municipal_collection', 'burning', 'burial', 'composting', 'open_dumping', 'mixed']
        },
        liquidWasteDisposal: {
          type: String,
          enum: ['sewerage', 'septic_tank', 'soak_pit', 'open_drainage', 'none']
        },
        wasteSegregation: Boolean,
        recycling: Boolean
      }
    },
    vectorBreeding: {
      mosquitoes: {
        breedingSites: [String],
        density: {
          type: String,
          enum: ['low', 'moderate', 'high', 'very_high']
        },
        species: [String],
        controlMeasures: [String]
      },
      flies: {
        breedingSites: [String],
        density: {
          type: String,
          enum: ['low', 'moderate', 'high', 'very_high']
        }
      },
      rodents: {
        signs: [String],
        harborage: [String],
        controlMeasures: [String]
      },
      otherVectors: [{
        vector: String,
        density: String,
        issues: [String]
      }]
    },
    airQuality: {
      indoorPollution: {
        cookingFuel: {
          type: String,
          enum: ['lpg', 'kerosene', 'wood', 'coal', 'dung', 'crop_residue', 'mixed']
        },
        ventilation: {
          type: String,
          enum: ['good', 'adequate', 'poor', 'very_poor']
        },
        smokingPrevalence: String
      },
      outdoorPollution: {
        dust: Boolean,
        industrialEmissions: Boolean,
        vehicleEmissions: Boolean,
        burningSources: [String]
      }
    }
  },
  
  // 3. Behavioral Observations
  behavioralObservations: {
    healthSeekingBehavior: {
      preferredProvider: {
        type: String,
        enum: ['government_facility', 'private_clinic', 'traditional_healer', 'pharmacy', 'self_medication', 'mixed']
      },
      delayFactors: [String],
      barriersToCare: [String],
      healthAwareness: {
        type: String,
        enum: ['very_low', 'low', 'moderate', 'good', 'very_good']
      },
      complianceWithTreatment: {
        type: String,
        enum: ['very_poor', 'poor', 'fair', 'good', 'excellent']
      }
    },
    preventiveBehaviors: {
      handHygiene: {
        practiceLevel: {
          type: String,
          enum: ['very_poor', 'poor', 'fair', 'good', 'excellent']
        },
        criticalTimes: [String],
        facilitiesAvailable: Boolean
      },
      personalHygiene: {
        practiceLevel: {
          type: String,
          enum: ['very_poor', 'poor', 'fair', 'good', 'excellent']
        },
        barriersToPractice: [String]
      },
      foodSafety: {
        storageConditions: String,
        preparationHygiene: String,
        waterTreatment: String,
        knowledgeLevel: String
      },
      immunizationAcceptance: {
        acceptanceLevel: {
          type: String,
          enum: ['very_low', 'low', 'moderate', 'high', 'very_high']
        },
        refusalReasons: [String],
        misinformation: [String]
      }
    },
    communityPractices: {
      traditionalPractices: [{
        practice: String,
        prevalence: String,
        healthImpact: {
          type: String,
          enum: ['beneficial', 'neutral', 'harmful', 'mixed', 'unknown']
        },
        ageGroups: [String],
        occasions: [String]
      }],
      socialGatherings: {
        frequency: String,
        crowdingLevel: String,
        hygieneObserved: String,
        riskLevel: String
      },
      migrationPatterns: {
        seasonalMigration: Boolean,
        migrationReasons: [String],
        returnPatterns: String,
        healthRisks: [String]
      }
    }
  },
  
  // 4. Infrastructure Health
  infrastructureHealth: {
    healthFacilities: [{
      facilityType: {
        type: String,
        enum: ['sub_center', 'phc', 'chc', 'private_clinic', 'anganwadi', 'other']
      },
      name: String,
      condition: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor', 'very_poor']
      },
      accessibility: {
        type: String,
        enum: ['easily_accessible', 'moderate_access', 'difficult_access', 'inaccessible']
      },
      staffAvailability: {
        type: String,
        enum: ['fully_staffed', 'adequate', 'understaffed', 'critically_understaffed', 'no_staff']
      },
      equipmentStatus: {
        type: String,
        enum: ['fully_functional', 'mostly_functional', 'partially_functional', 'non_functional']
      },
      serviceAvailability: [String],
      issues: [String],
      utilizationLevel: String
    }],
    transportation: {
      roadConditions: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor', 'very_poor']
      },
      publicTransport: {
        availability: Boolean,
        frequency: String,
        accessibility: String,
        affordability: String
      },
      emergencyTransport: {
        availability: Boolean,
        responseTime: String,
        barriers: [String]
      }
    },
    communication: {
      mobileNetwork: {
        coverage: {
          type: String,
          enum: ['excellent', 'good', 'fair', 'poor', 'no_coverage']
        },
        reliability: String
      },
      internetAccess: {
        availability: Boolean,
        speed: String,
        penetration: String
      }
    }
  },
  
  // Affected Population Analysis
  affectedPopulation: {
    estimatedCount: {
      households: Number,
      individuals: Number,
      families: Number
    },
    demographics: {
      ageGroups: {
        infants: Number,
        children: Number,
        adolescents: Number,
        adults: Number,
        elderly: Number
      },
      gender: {
        male: Number,
        female: Number,
        other: Number
      },
      specialPopulations: {
        pregnant: Number,
        lactating: Number,
        disabled: Number,
        chronicallyIll: Number,
        malnourished: Number
      }
    },
    vulnerabilityAssessment: {
      overallVulnerability: {
        type: String,
        enum: ['low', 'moderate', 'high', 'very_high', 'critical'],
        default: 'moderate'
      },
      vulnerabilityFactors: [String],
      riskMitigationNeeded: Boolean,
      immediateNeedsAssessment: [String]
    },
    geographicDistribution: {
      clustered: Boolean,
      dispersed: Boolean,
      isolatedCases: Boolean,
      expansionPattern: String,
      boundaryAreas: [String]
    }
  },
  
  // Environmental Context
  environmentalContext: {
    weather: {
      temperature: {
        current: Number,
        trend: String,
        impact: String
      },
      humidity: Number,
      precipitation: {
        recent: String,
        seasonal: String,
        impact: String
      },
      windConditions: String,
      extremeWeather: [String]
    },
    seasonalFactors: {
      season: {
        type: String,
        enum: ['summer', 'monsoon', 'post_monsoon', 'winter']
      },
      cropCycle: String,
      animalBehavior: String,
      humanActivities: [String],
      diseaseSeasonality: String
    },
    recentEvents: [{
      eventType: {
        type: String,
        enum: ['natural_disaster', 'festival', 'market', 'construction', 'migration', 'other']
      },
      description: String,
      date: Date,
      impact: String,
      relevanceToObservation: String
    }],
    contributingFactors: [{
      factor: String,
      relevance: {
        type: String,
        enum: ['direct', 'indirect', 'possible', 'unlikely']
      },
      impact: String,
      actionRequired: Boolean
    }]
  },
  
  // Follow-up and Actions
  followUp: {
    immediateActionsRequired: [{
      action: {
        type: String,
        required: true
      },
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent', 'emergency'],
        default: 'medium'
      },
      responsibility: {
        type: String,
        enum: ['asha_worker', 'anm', 'mo', 'block_team', 'district_team', 'community', 'other']
      },
      timeline: String,
      resourcesNeeded: [String]
    }],
    actionsTaken: [{
      action: String,
      takenBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      dateTaken: {
        type: Date,
        default: Date.now
      },
      outcome: String,
      effectiveness: {
        type: String,
        enum: ['highly_effective', 'effective', 'partially_effective', 'ineffective', 'pending']
      },
      followUpNeeded: Boolean
    }],
    escalationStatus: {
      escalated: {
        type: Boolean,
        default: false
      },
      escalatedTo: {
        level: {
          type: String,
          enum: ['block', 'district', 'state', 'national']
        },
        authority: String,
        date: Date,
        reason: String
      },
      escalationResponse: String
    },
    monitoringPlan: {
      followUpRequired: {
        type: Boolean,
        default: true
      },
      nextReviewDate: Date,
      monitoringFrequency: String,
      keyIndicators: [String],
      responsiblePerson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    resolutionStatus: {
      status: {
        type: String,
        enum: ['open', 'in_progress', 'partially_resolved', 'resolved', 'closed'],
        default: 'open'
      },
      resolutionDate: Date,
      resolutionSummary: String,
      lessonsLearned: [String],
      preventiveMeasures: [String]
    }
  },
  
  // Quality and Verification
  dataQuality: {
    completeness: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    reliability: {
      type: String,
      enum: ['very_reliable', 'reliable', 'somewhat_reliable', 'questionable'],
      default: 'reliable'
    },
    sourcesOfInformation: [{
      source: {
        type: String,
        enum: ['direct_observation', 'community_members', 'health_workers', 'records', 'other']
      },
      reliability: String,
      details: String
    }],
    verificationStatus: {
      verified: {
        type: Boolean,
        default: false
      },
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      verificationDate: Date,
      verificationMethod: String,
      discrepancies: [String]
    },
    qualityAssurance: {
      dataChecked: Boolean,
      checkedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      checkDate: Date,
      qualityScore: {
        type: Number,
        min: 0,
        max: 100
      }
    }
  },
  
  // Reporting and Communication
  reporting: {
    reportStatus: {
      type: String,
      enum: ['draft', 'submitted', 'reviewed', 'approved', 'published'],
      default: 'draft'
    },
    reportedTo: [{
      authority: {
        type: String,
        enum: ['asha_supervisor', 'anm', 'mo_phc', 'mo_chc', 'block_mo', 'district_team', 'other']
      },
      reportDate: Date,
      acknowledgment: Boolean,
      response: String
    }],
    communicationLog: [{
      communicationType: {
        type: String,
        enum: ['phone_call', 'sms', 'whatsapp', 'email', 'in_person', 'meeting', 'escalation', 'other']
      },
      communicatedWith: String,
      date: Date,
      purpose: String,
      outcome: String,
      followUpRequired: Boolean
    }],
    sharedWith: [{
      sharedWith: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      shareDate: Date,
      permission: {
        type: String,
        enum: ['view', 'edit', 'full_access']
      },
      purpose: String
    }]
  },
  
  // Additional Information
  attachments: [{
    type: {
      type: String,
      enum: ['photo', 'document', 'audio', 'video', 'map', 'other']
    },
    url: String,
    filename: String,
    description: String,
    uploadDate: {
      type: Date,
      default: Date.now
    },
    fileSize: Number,
    mimeType: String
  }],
  
  relatedObservations: [{
    observationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HealthObservation'
    },
    relationship: {
      type: String,
      enum: ['related', 'follow_up', 'duplicate', 'conflicting', 'supporting']
    },
    notes: String
  }],
  
  tags: [String],
  
  notes: {
    type: String,
    maxlength: 2000
  },
  
  // Privacy and Consent
  privacy: {
    containsSensitiveData: {
      type: Boolean,
      default: false
    },
    consentObtained: {
      type: Boolean,
      default: true
    },
    anonymizationLevel: {
      type: String,
      enum: ['none', 'partial', 'full'],
      default: 'partial'
    },
    dataSharingRestrictions: [String]
  },
  
  // Administrative
  isActive: {
    type: Boolean,
    default: true
  },
  
  isConfidential: {
    type: Boolean,
    default: false
  },
  
  accessLevel: {
    type: String,
    enum: ['public', 'internal', 'restricted', 'confidential'],
    default: 'internal'
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  suppressReservedKeysWarning: true
});

// Indexes for performance
healthObservationSchema.index({ 'location.villageId': 1, 'observationInfo.observationDate': -1 });
healthObservationSchema.index({ observerId: 1, 'observationInfo.observationDate': -1 });
healthObservationSchema.index({ 'observationInfo.observationType': 1, 'observationInfo.severityLevel': 1 });
healthObservationSchema.index({ 'followUp.resolutionStatus.status': 1 });
healthObservationSchema.index({ 'reporting.reportStatus': 1 });
healthObservationSchema.index({ 'observationInfo.urgencyLevel': 1, 'observationInfo.observationDate': -1 });

// Compound indexes
healthObservationSchema.index({
  'observationInfo.observationType': 1,
  'location.villageId': 1,
  'observationInfo.observationDate': -1
});

healthObservationSchema.index({
  'observationInfo.severityLevel': 1,
  'followUp.resolutionStatus.status': 1,
  'observationInfo.observationDate': -1
});

// Virtual for observation age
healthObservationSchema.virtual('observationAge').get(function() {
  return Math.floor((Date.now() - this.observationInfo.observationDate) / (1000 * 60 * 60 * 24));
});

// Virtual for priority score
healthObservationSchema.virtual('priorityScore').get(function() {
  const severityWeights = { low: 1, medium: 2, high: 3, critical: 4, emergency: 5 };
  const urgencyWeights = { routine: 1, attention_needed: 2, urgent: 3, immediate: 4 };
  
  const severityScore = severityWeights[this.observationInfo.severityLevel] || 1;
  const urgencyScore = urgencyWeights[this.observationInfo.urgencyLevel] || 1;
  
  return severityScore * urgencyScore;
});

// Pre-save middleware to generate observationId
healthObservationSchema.pre('save', async function(next) {
  if (this.isNew && !this.observationId) {
    const seq = await getNextSequence('HOB-VLG');
    this.observationId = `HOB-VLG-${String(seq).padStart(4, '0')}`;
  }
  next();
});

// Pre-save middleware to calculate data completeness
healthObservationSchema.pre('save', function(next) {
  if (this.isNew || this.isModified()) {
    this.calculateDataCompleteness();
  }
  next();
});

// Method to calculate data completeness
healthObservationSchema.methods.calculateDataCompleteness = function() {
  const requiredFields = [
    'observationInfo.observationType',
    'observationInfo.title',
    'observationInfo.description',
    'observationInfo.severityLevel',
    'location.villageId'
  ];
  
  const observationTypeFields = {
    'symptom_pattern': ['symptomPatterns.symptomsObserved', 'symptomPatterns.affectedDemographics'],
    'environmental_health': ['environmentalHealth.waterSources', 'environmentalHealth.sanitation'],
    'behavioral_observation': ['behavioralObservations.healthSeekingBehavior'],
    'infrastructure_health': ['infrastructureHealth.healthFacilities']
  };
  
  let completed = 0;
  let total = requiredFields.length;
  
  // Check required fields
  requiredFields.forEach(field => {
    const value = this.get(field);
    if (value !== null && value !== undefined && value !== '') {
      completed++;
    }
  });
  
  // Check observation type specific fields
  const specificFields = observationTypeFields[this.observationInfo.observationType] || [];
  total += specificFields.length;
  
  specificFields.forEach(field => {
    const value = this.get(field);
    if (value !== null && value !== undefined && 
        (Array.isArray(value) ? value.length > 0 : value !== '')) {
      completed++;
    }
  });
  
  this.dataQuality.completeness = Math.round((completed / total) * 100);
};

// Method to escalate observation
healthObservationSchema.methods.escalate = function(escalationDetails) {
  this.followUp.escalationStatus.escalated = true;
  this.followUp.escalationStatus.escalatedTo = escalationDetails.escalatedTo;
  this.followUp.escalationStatus.date = new Date();
  this.followUp.escalationStatus.reason = escalationDetails.reason;
  
  // Add to communication log
  this.reporting.communicationLog.push({
    communicationType: 'escalation',
    communicatedWith: escalationDetails.escalatedTo.authority,
    date: new Date(),
    purpose: 'Escalation due to: ' + escalationDetails.reason,
    outcome: 'Escalated',
    followUpRequired: true
  });
  
  return this.save();
};

// Method to add follow-up action
healthObservationSchema.methods.addFollowUpAction = function(actionDetails) {
  this.followUp.actionsTaken.push({
    action: actionDetails.action,
    takenBy: actionDetails.takenBy,
    dateTaken: actionDetails.dateTaken || new Date(),
    outcome: actionDetails.outcome,
    effectiveness: actionDetails.effectiveness,
    followUpNeeded: actionDetails.followUpNeeded
  });
  
  return this.save();
};

// Static method to get observations by severity
healthObservationSchema.statics.getObservationsBySeverity = function(villageId, days = 30) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const matchQuery = {
    'observationInfo.observationDate': { $gte: cutoffDate },
    isActive: true
  };
  
  if (villageId) {
    matchQuery['location.villageId'] = mongoose.Types.ObjectId(villageId);
  }
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: {
          severity: '$observationInfo.severityLevel',
          type: '$observationInfo.observationType'
        },
        count: { $sum: 1 },
        openCount: {
          $sum: {
            $cond: [
              { $in: ['$followUp.resolutionStatus.status', ['open', 'in_progress']] },
              1,
              0
            ]
          }
        },
        latestObservation: { $max: '$observationInfo.observationDate' }
      }
    },
    { $sort: { '_id.severity': 1, count: -1 } }
  ]);
};

// Static method to get pending actions
healthObservationSchema.statics.getPendingActions = function(assignedTo) {
  const matchQuery = {
    'followUp.resolutionStatus.status': { $in: ['open', 'in_progress'] },
    isActive: true
  };
  
  if (assignedTo) {
    matchQuery['followUp.monitoringPlan.responsiblePerson'] = mongoose.Types.ObjectId(assignedTo);
  }
  
  return this.find(matchQuery)
    .select('observationInfo followUp location')
    .populate('location.villageId', 'villageName')
    .populate('followUp.monitoringPlan.responsiblePerson', 'name role')
    .sort({ 'observationInfo.urgencyLevel': -1, 'observationInfo.observationDate': -1 });
};

export default mongoose.model('HealthObservation', healthObservationSchema);