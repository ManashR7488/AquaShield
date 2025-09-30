import mongoose from 'mongoose';
import { getNextSequence } from './counter.model.js';

const { Schema } = mongoose;

// Health Program Schema for managing health programs, campaigns, and initiatives
const healthProgramSchema = new Schema({
  // Program Identification
  programId: {
    type: String,
    unique: true,
    required: true,
    match: /^HPG-DIST-\d{4}$/,
    uppercase: true
  },

  // Program Management
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  programCoordinator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  startDate: {
    type: Date,
    required: true
  },

  endDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },

  // Program Categorization
  programType: {
    type: String,
    required: true,
    enum: [
      'vaccination_campaign',
      'health_screening_program',
      'awareness_campaign',
      'maternal_health_program',
      'child_health_initiative',
      'disease_prevention_program',
      'water_quality_monitoring',
      'emergency_response_program',
      'nutrition_program',
      'mental_health_program',
      'elderly_care_program',
      'community_health_education'
    ],
    lowercase: true
  },

  // Program Details
  name: {
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

  objectives: [{
    objective: {
      type: String,
      required: true,
      trim: true
    },
    targetValue: Number,
    currentValue: {
      type: Number,
      default: 0
    },
    unit: String, // 'percentage', 'count', 'ratio'
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    }
  }],

  targetDemographics: {
    ageGroups: [{
      minAge: { type: Number, min: 0 },
      maxAge: { type: Number, min: 0 },
      priority: {
        type: String,
        enum: ['primary', 'secondary', 'optional'],
        default: 'primary'
      }
    }],
    gender: {
      type: String,
      enum: ['male', 'female', 'all', 'pregnant_women'],
      default: 'all'
    },
    specialGroups: [String], // 'pregnant_women', 'lactating_mothers', 'elderly', 'children_under_5'
    riskCategories: [String] // 'high_risk', 'chronic_patients', 'immunocompromised'
  },

  coverageAreas: {
    districts: [{
      type: Schema.Types.ObjectId,
      ref: 'District',
      required: true
    }],
    blocks: [{
      type: Schema.Types.ObjectId,
      ref: 'Block'
    }],
    villages: [{
      type: Schema.Types.ObjectId,
      ref: 'Village'
    }],
    coverageType: {
      type: String,
      enum: ['universal', 'targeted', 'phased_rollout'],
      default: 'universal'
    }
  },

  // Budget and Resources
  budget: {
    totalAllocated: {
      type: Number,
      required: true,
      min: 0
    },
    spent: {
      type: Number,
      default: 0,
      min: 0
    },
    remainingBudget: Number,
    budgetBreakdown: [{
      category: String, // 'personnel', 'supplies', 'transportation', 'equipment'
      allocated: Number,
      spent: { type: Number, default: 0 }
    }],
    fundingSource: String // 'government', 'ngo', 'international', 'private'
  },

  successMetrics: {
    primaryMetrics: [{
      metricName: String,
      targetValue: Number,
      currentValue: { type: Number, default: 0 },
      unit: String,
      measurementMethod: String
    }],
    secondaryMetrics: [{
      metricName: String,
      targetValue: Number,
      currentValue: { type: Number, default: 0 },
      unit: String
    }]
  },

  // Implementation Tracking
  assignedStaff: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['coordinator', 'supervisor', 'field_worker', 'data_manager', 'logistics_coordinator'],
      required: true
    },
    assignmentDate: { type: Date, default: Date.now },
    responsibilities: [String],
    workload: {
      type: Number,
      min: 0,
      max: 100 // percentage
    },
    performance: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      lastEvaluated: Date,
      comments: String
    }
  }],

  blockAssignments: [{
    blockId: {
      type: Schema.Types.ObjectId,
      ref: 'Block',
      required: true
    },
    supervisor: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedWorkers: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    targetPopulation: Number,
    currentCoverage: {
      type: Number,
      default: 0
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  }],

  villageAssignments: [{
    villageId: {
      type: Schema.Types.ObjectId,
      ref: 'Village',
      required: true
    },
    assignedWorkers: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    targetPopulation: Number,
    enrolledParticipants: {
      type: Number,
      default: 0
    },
    completedParticipants: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'on_hold'],
      default: 'not_started'
    }
  }],

  // Implementation Timeline
  implementationTimeline: {
    phases: [{
      phaseName: String,
      startDate: Date,
      endDate: Date,
      milestones: [{
        milestoneName: String,
        targetDate: Date,
        completionDate: Date,
        status: {
          type: String,
          enum: ['pending', 'in_progress', 'completed', 'delayed', 'cancelled'],
          default: 'pending'
        },
        completionPercentage: {
          type: Number,
          default: 0,
          min: 0,
          max: 100
        }
      }],
      deliverables: [String],
      resources: [{
        resourceType: String,
        quantity: Number,
        unit: String,
        cost: Number
      }]
    }],
    currentPhase: {
      type: Number,
      default: 0
    }
  },

  // Progress Monitoring
  progressTracking: {
    overallProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    lastUpdated: Date,
    progressReports: [{
      reportDate: { type: Date, default: Date.now },
      reportedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      achievements: [String],
      challenges: [String],
      recommendations: [String],
      nextSteps: [String],
      attachments: [{
        filename: String,
        url: String,
        uploadDate: { type: Date, default: Date.now }
      }]
    }],
    kpiTracking: [{
      kpiName: String,
      currentValue: Number,
      targetValue: Number,
      trend: {
        type: String,
        enum: ['improving', 'declining', 'stable'],
        default: 'stable'
      },
      lastMeasured: Date
    }]
  },

  // Participant Management
  participantManagement: {
    targetPopulation: {
      type: Number,
      required: true,
      min: 0
    },
    enrolledParticipants: {
      type: Number,
      default: 0
    },
    activeParticipants: {
      type: Number,
      default: 0
    },
    completedParticipants: {
      type: Number,
      default: 0
    },
    dropoutCount: {
      type: Number,
      default: 0
    },
    dropoutReasons: [{
      reason: String,
      count: { type: Number, default: 0 }
    }],
    eligibilityCriteria: [String],
    exclusionCriteria: [String]
  },

  // Outcome Measurements
  outcomeMeasurements: {
    healthOutcomes: [{
      outcomeName: String,
      baselineValue: Number,
      currentValue: Number,
      targetValue: Number,
      measurementDate: Date,
      measurementMethod: String
    }],
    behaviorChanges: [{
      behaviorName: String,
      baselinePercentage: Number,
      currentPercentage: Number,
      targetPercentage: Number
    }],
    knowledgeImprovements: [{
      topicArea: String,
      preScore: Number,
      postScore: Number,
      improvementPercentage: Number
    }],
    satisfactionScores: [{
      category: String,
      score: {
        type: Number,
        min: 1,
        max: 10
      },
      responseCount: Number,
      evaluationDate: Date
    }]
  },

  // Resource Management
  resourceManagement: {
    equipmentNeeds: [{
      equipmentType: String,
      quantity: Number,
      unit: String,
      status: {
        type: String,
        enum: ['required', 'procured', 'deployed', 'maintenance'],
        default: 'required'
      },
      supplier: String,
      cost: Number
    }],
    supplyChain: [{
      itemName: String,
      quantityRequired: Number,
      quantityAvailable: Number,
      unit: String,
      supplier: String,
      lastRestocked: Date,
      stockStatus: {
        type: String,
        enum: ['adequate', 'low', 'critical', 'out_of_stock'],
        default: 'adequate'
      }
    }],
    trainingRequirements: [{
      trainingTopic: String,
      targetAudience: String,
      trainedCount: { type: Number, default: 0 },
      targetCount: Number,
      trainingSchedule: [{
        date: Date,
        location: String,
        attendees: Number
      }]
    }],
    logisticsCoordination: {
      transportationNeeds: [String],
      storageRequirements: [String],
      distributionPlan: String
    }
  },

  // Program Status
  status: {
    type: String,
    enum: ['planning', 'approved', 'active', 'on_hold', 'completed', 'cancelled', 'under_review'],
    default: 'planning',
    required: true,
    lowercase: true
  },

  // Reporting and Analytics
  reporting: {
    reportingFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly'],
      default: 'monthly'
    },
    nextReportDue: Date,
    reportingFormat: String,
    dashboardUrl: String
  },

  analytics: {
    costEffectiveness: Number, // cost per beneficiary
    impactScore: {
      type: Number,
      min: 0,
      max: 100
    },
    sustainabilityRating: {
      type: Number,
      min: 1,
      max: 5
    },
    replicationPotential: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  },

  // System Fields
  isActive: {
    type: Boolean,
    default: true
  },

  // Communication and Collaboration
  communication: {
    stakeholderGroups: [{
      groupName: String,
      members: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
      }],
      communicationFrequency: String
    }],
    meetingSchedule: [{
      meetingType: String,
      frequency: String,
      attendees: [String],
      lastMeeting: Date,
      nextMeeting: Date
    }]
  }
}, {
  timestamps: true,
  collection: 'healthPrograms',
  suppressReservedKeysWarning: true
});

// Generate unique programId before saving
healthProgramSchema.pre('save', async function(next) {
  if (this.isNew) {
    const sequence = await getNextSequence('healthProgram');
    this.programId = `HPG-DIST-${sequence.toString().padStart(4, '0')}`;
  }
  next();
});

// Middleware to calculate remaining budget
healthProgramSchema.pre('save', function(next) {
  this.budget.remainingBudget = this.budget.totalAllocated - this.budget.spent;
  next();
});

// Middleware to update overall progress
healthProgramSchema.pre('save', function(next) {
  // Calculate overall progress based on completed milestones
  let totalMilestones = 0;
  let completedMilestones = 0;

  if (this.implementationTimeline?.phases?.length) {
    this.implementationTimeline.phases.forEach(phase => {
      if (phase.milestones?.length) {
        totalMilestones += phase.milestones.length;
        completedMilestones += phase.milestones.filter(m => m.status === 'completed').length;
      }
    });
  }

  if (totalMilestones > 0) {
    if (!this.progressTracking) this.progressTracking = {};
    this.progressTracking.overallProgress = Math.round((completedMilestones / totalMilestones) * 100);
  }

  if (!this.progressTracking) this.progressTracking = {};
  this.progressTracking.lastUpdated = new Date();
  next();
});

// Virtual for enrollment rate
healthProgramSchema.virtual('enrollmentRate').get(function() {
  if (this.participantManagement.targetPopulation === 0) return 0;
  return Math.round((this.participantManagement.enrolledParticipants / this.participantManagement.targetPopulation) * 100);
});

// Virtual for completion rate
healthProgramSchema.virtual('completionRate').get(function() {
  if (this.participantManagement.enrolledParticipants === 0) return 0;
  return Math.round((this.participantManagement.completedParticipants / this.participantManagement.enrolledParticipants) * 100);
});

// Virtual for dropout rate
healthProgramSchema.virtual('dropoutRate').get(function() {
  if (this.participantManagement.enrolledParticipants === 0) return 0;
  return Math.round((this.participantManagement.dropoutCount / this.participantManagement.enrolledParticipants) * 100);
});

// Virtual for budget utilization
healthProgramSchema.virtual('budgetUtilization').get(function() {
  if (this.budget.totalAllocated === 0) return 0;
  return Math.round((this.budget.spent / this.budget.totalAllocated) * 100);
});

// Virtual for days until completion
healthProgramSchema.virtual('daysUntilCompletion').get(function() {
  const now = new Date();
  const endDate = new Date(this.endDate);
  return Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
});

// Instance method to add staff assignment
healthProgramSchema.methods.assignStaff = function(userId, role, responsibilities, workload) {
  this.assignedStaff.push({
    userId: userId,
    role: role,
    responsibilities: responsibilities || [],
    workload: workload || 100,
    assignmentDate: new Date()
  });
  
  return this.save();
};

// Instance method to update progress
healthProgramSchema.methods.updateProgress = function(reportedBy, achievements, challenges, recommendations) {
  this.progressTracking.progressReports.push({
    reportedBy: reportedBy,
    achievements: achievements || [],
    challenges: challenges || [],
    recommendations: recommendations || [],
    nextSteps: []
  });
  
  return this.save();
};

// Instance method to update participant counts
healthProgramSchema.methods.updateParticipantCounts = function(enrolled, completed, dropouts) {
  if (enrolled !== undefined) this.participantManagement.enrolledParticipants = enrolled;
  if (completed !== undefined) this.participantManagement.completedParticipants = completed;
  if (dropouts !== undefined) this.participantManagement.dropoutCount = dropouts;
  
  this.participantManagement.activeParticipants = 
    this.participantManagement.enrolledParticipants - 
    this.participantManagement.completedParticipants - 
    this.participantManagement.dropoutCount;
  
  return this.save();
};

// Instance method to complete milestone
healthProgramSchema.methods.completeMilestone = function(phaseIndex, milestoneIndex, completionDate) {
  if (this.implementationTimeline?.phases?.[phaseIndex]?.milestones?.[milestoneIndex]) {
    this.implementationTimeline.phases[phaseIndex].milestones[milestoneIndex].status = 'completed';
    this.implementationTimeline.phases[phaseIndex].milestones[milestoneIndex].completionDate = completionDate || new Date();
    this.implementationTimeline.phases[phaseIndex].milestones[milestoneIndex].completionPercentage = 100;
  }
  
  return this.save();
};

// Static method to get programs by status
healthProgramSchema.statics.getProgramsByStatus = function(status, limit = 50) {
  return this.find({ 
    status: status,
    isActive: true 
  })
  .populate('programCoordinator', 'personalInfo.firstName personalInfo.lastName roleInfo.role authentication.phone')
  .populate('coverageAreas.districts', 'name state')
  .sort({ createdAt: -1 })
  .limit(limit);
};

// Static method to get programs by coordinator
healthProgramSchema.statics.getProgramsByCoordinator = function(coordinatorId) {
  return this.find({
    $or: [
      { programCoordinator: coordinatorId },
      { 'assignedStaff.userId': coordinatorId }
    ],
    isActive: true
  })
  .populate('coverageAreas.villages', 'name block')
  .sort({ startDate: -1 });
};

// Static method to get programs requiring attention
healthProgramSchema.statics.getProgramsRequiringAttention = function() {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  return this.find({
    $or: [
      // Programs ending soon
      { 
        endDate: { $lte: thirtyDaysFromNow },
        status: 'active'
      },
      // Programs with low progress
      {
        'progressTracking.overallProgress': { $lt: 50 },
        status: 'active',
        endDate: { $lte: thirtyDaysFromNow }
      },
      // Programs over budget
      {
        $expr: {
          $gt: ['$budget.spent', { $multiply: ['$budget.totalAllocated', 0.9] }]
        },
        status: 'active'
      }
    ],
    isActive: true
  })
  .populate('programCoordinator', 'personalInfo.firstName personalInfo.lastName roleInfo.role authentication.phone')
  .sort({ endDate: 1 });
};

// Static method to get coverage statistics by area
healthProgramSchema.statics.getCoverageStatistics = function(areaType, areaId, programType = null) {
  const matchQuery = { isActive: true };
  
  if (programType) {
    matchQuery.programType = programType;
  }
  
  if (areaType === 'district') {
    matchQuery['coverageAreas.districts'] = mongoose.Types.ObjectId(areaId);
  } else if (areaType === 'block') {
    matchQuery['coverageAreas.blocks'] = mongoose.Types.ObjectId(areaId);
  } else if (areaType === 'village') {
    matchQuery['coverageAreas.villages'] = mongoose.Types.ObjectId(areaId);
  }
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$programType',
        totalPrograms: { $sum: 1 },
        activePrograms: {
          $sum: {
            $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
          }
        },
        completedPrograms: {
          $sum: {
            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
          }
        },
        totalBudget: { $sum: '$budget.totalAllocated' },
        totalSpent: { $sum: '$budget.spent' },
        avgProgress: { $avg: '$progressTracking.overallProgress' },
        totalTargetPopulation: { $sum: '$participantManagement.targetPopulation' },
        totalEnrolled: { $sum: '$participantManagement.enrolledParticipants' }
      }
    },
    {
      $addFields: {
        budgetUtilization: {
          $cond: [
            { $gt: ['$totalBudget', 0] },
            { $multiply: [{ $divide: ['$totalSpent', '$totalBudget'] }, 100] },
            0
          ]
        },
        enrollmentRate: {
          $cond: [
            { $gt: ['$totalTargetPopulation', 0] },
            { $multiply: [{ $divide: ['$totalEnrolled', '$totalTargetPopulation'] }, 100] },
            0
          ]
        }
      }
    }
  ]);
};

// Static method for bulk staff assignment refresh
healthProgramSchema.statics.refreshStaffWorkload = async function() {
  const programs = await this.find({ status: 'active', isActive: true });
  
  for (const program of programs) {
    // Recalculate workload distribution
    const totalStaff = program.assignedStaff.length;
    if (totalStaff > 0) {
      const baseWorkload = Math.floor(100 / totalStaff);
      program.assignedStaff.forEach((staff, index) => {
        staff.workload = index < (100 % totalStaff) ? baseWorkload + 1 : baseWorkload;
      });
      await program.save();
    }
  }
  
  return { updated: programs.length };
};

// Indexes for efficient querying
healthProgramSchema.index({ programCoordinator: 1, status: 1 });
healthProgramSchema.index({ programType: 1, status: 1 });
healthProgramSchema.index({ 'coverageAreas.districts': 1, programType: 1 });
healthProgramSchema.index({ 'coverageAreas.blocks': 1, status: 1 });
healthProgramSchema.index({ 'coverageAreas.villages': 1, status: 1 });
healthProgramSchema.index({ 'assignedStaff.userId': 1, status: 1 });
healthProgramSchema.index({ startDate: -1, endDate: 1 });
healthProgramSchema.index({ status: 1, endDate: 1 });
healthProgramSchema.index({ isActive: 1, status: 1 });

// Compound indexes for complex queries
healthProgramSchema.index({ 
  status: 1, 
  'progressTracking.overallProgress': 1, 
  endDate: 1 
});

healthProgramSchema.index({ 
  programType: 1, 
  'coverageAreas.districts': 1, 
  status: 1 
});

healthProgramSchema.index({ 
  'budget.totalAllocated': 1, 
  'budget.spent': 1, 
  status: 1 
});

export default mongoose.model('HealthProgram', healthProgramSchema);