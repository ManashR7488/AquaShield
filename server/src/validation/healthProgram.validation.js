import Joi from 'joi';

/**
 * Joi validation schemas for health program operations
 */

// Common schemas for reuse
const budgetAllocationSchema = Joi.object({
  totalBudget: Joi.number().min(0).required(),
  allocations: Joi.array().items(
    Joi.object({
      category: Joi.string().valid(
        'personnel', 'equipment', 'supplies', 'transportation', 
        'training', 'infrastructure', 'outreach', 'monitoring'
      ).required(),
      amount: Joi.number().min(0).required(),
      description: Joi.string().max(200)
    })
  ).required(),
  contingencyFund: Joi.number().min(0).default(0)
});

const coverageAreaSchema = Joi.object({
  areaType: Joi.string().valid('village', 'block', 'district', 'multi_district').required(),
  areas: Joi.array().items(Joi.string()).min(1).required(),
  population: Joi.object({
    total: Joi.number().min(0).required(),
    targetDemographic: Joi.number().min(0).required(),
    estimatedBeneficiaries: Joi.number().min(0).required()
  }),
  geographicChallenges: Joi.array().items(Joi.string())
});

const targetDemographicsSchema = Joi.object({
  ageGroups: Joi.array().items(
    Joi.object({
      label: Joi.string().required(),
      minAge: Joi.number().min(0).max(120).required(),
      maxAge: Joi.number().min(0).max(120).required(),
      targetCount: Joi.number().min(0)
    })
  ).min(1).required(),
  
  genderFocus: Joi.array().items(Joi.string().valid('male', 'female', 'all')).default(['all']),
  
  specialGroups: Joi.array().items(
    Joi.string().valid(
      'pregnant_women', 'children_under_5', 'elderly', 'immunocompromised',
      'chronic_disease_patients', 'school_children', 'adolescents'
    )
  ),
  
  socioeconomicCriteria: Joi.object({
    includesBPL: Joi.boolean().default(false), // Below Poverty Line
    includesTribal: Joi.boolean().default(false),
    includesMinorities: Joi.boolean().default(false)
  })
});

const staffAssignmentSchema = Joi.object({
  userId: Joi.string().required(),
  role: Joi.string().valid(
    'coordinator', 'supervisor', 'field_worker', 'data_collector', 'trainer'
  ).required(),
  responsibilities: Joi.array().items(Joi.string().max(200)).required(),
  workload: Joi.object({
    expectedHoursPerWeek: Joi.number().min(1).max(60),
    targetBeneficiaries: Joi.number().min(0),
    coverageAreas: Joi.array().items(Joi.string())
  }),
  compensation: Joi.object({
    type: Joi.string().valid('salary', 'honorarium', 'per_session', 'volunteer'),
    amount: Joi.number().min(0),
    currency: Joi.string().default('INR')
  })
});

const successMetricSchema = Joi.object({
  metricName: Joi.string().required(),
  measurementType: Joi.string().valid('count', 'percentage', 'rate', 'score').required(),
  targetValue: Joi.number().min(0).required(),
  currentValue: Joi.number().min(0).default(0),
  unit: Joi.string().required(),
  reportingFrequency: Joi.string().valid('daily', 'weekly', 'monthly', 'quarterly').required(),
  dataSource: Joi.string().max(200)
});

// Program type specific validation
const vaccinationCampaignSchema = Joi.object({
  vaccineTypes: Joi.array().items(Joi.string()).min(1).required(),
  targetDiseases: Joi.array().items(Joi.string()).min(1).required(),
  administrationMethod: Joi.string().valid('injection', 'oral', 'nasal').required(),
  coldChainRequirements: Joi.object({
    storageTemp: Joi.string().required(),
    transportRequirements: Joi.string().required()
  }),
  vaccinationSites: Joi.array().items(
    Joi.object({
      siteName: Joi.string().required(),
      address: Joi.string().required(),
      capacity: Joi.number().min(1).required(),
      operatingHours: Joi.string().required()
    })
  ).min(1).required()
});

const healthScreeningSchema = Joi.object({
  screeningTypes: Joi.array().items(
    Joi.string().valid(
      'diabetes', 'hypertension', 'tuberculosis', 'cancer_screening',
      'maternal_health', 'child_development', 'vision_hearing'
    )
  ).min(1).required(),
  
  testingProtocols: Joi.array().items(
    Joi.object({
      testName: Joi.string().required(),
      procedure: Joi.string().required(),
      equipmentNeeded: Joi.array().items(Joi.string()),
      qualifiedPersonnel: Joi.string().required()
    })
  ).required(),
  
  referralCriteria: Joi.array().items(
    Joi.object({
      condition: Joi.string().required(),
      referralLevel: Joi.string().valid('primary', 'secondary', 'tertiary').required(),
      urgency: Joi.string().valid('routine', 'urgent', 'emergency').required()
    })
  )
});

const awarenessCampaignSchema = Joi.object({
  topics: Joi.array().items(Joi.string()).min(1).required(),
  deliveryMethods: Joi.array().items(
    Joi.string().valid(
      'community_meetings', 'door_to_door', 'mass_media', 'schools',
      'health_centers', 'digital_campaigns', 'street_plays'
    )
  ).min(1).required(),
  
  educationalMaterials: Joi.array().items(
    Joi.object({
      materialType: Joi.string().valid('pamphlet', 'poster', 'video', 'audio', 'demo_kit').required(),
      language: Joi.string().required(),
      quantity: Joi.number().min(1).required(),
      distributionPlan: Joi.string().required()
    })
  ),
  
  communityEngagement: Joi.object({
    localLeaders: Joi.array().items(Joi.string()),
    communityGroups: Joi.array().items(Joi.string()),
    culturalConsiderations: Joi.string()
  })
});

// Main validation schemas

/**
 * Schema for creating health programs
 */
const createHealthProgramSchema = Joi.object({
  // Required basic information
  name: Joi.string().min(5).max(200).required(),
  description: Joi.string().min(20).max(1000).required(),
  
  programType: Joi.string().valid(
    'vaccination_campaign',
    'health_screening',
    'awareness_campaign',
    'maternal_health',
    'child_health',
    'disease_prevention',
    'nutrition_program',
    'water_sanitation'
  ).required(),

  // Management
  programCoordinator: Joi.string().required(), // User ID
  sponsoringOrganization: Joi.string().max(200),
  partnerOrganizations: Joi.array().items(Joi.string()),

  // Timeline
  startDate: Joi.date().min('now').required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).required(),
  registrationDeadline: Joi.date().less(Joi.ref('startDate')),
  
  // Coverage and targeting
  coverageAreas: coverageAreaSchema.required(),
  targetDemographics: targetDemographicsSchema.required(),
  
  // Resources and budget
  budgetAllocation: budgetAllocationSchema.required(),
  
  // Success measurement
  successMetrics: Joi.array().items(successMetricSchema).min(1).required(),
  expectedOutcomes: Joi.array().items(Joi.string().max(200)).min(1).required(),

  // Program type specific data
  vaccinationDetails: Joi.when('programType', {
    is: 'vaccination_campaign',
    then: vaccinationCampaignSchema.required(),
    otherwise: vaccinationCampaignSchema
  }),

  screeningDetails: Joi.when('programType', {
    is: 'health_screening',
    then: healthScreeningSchema.required(),
    otherwise: healthScreeningSchema
  }),

  awarenessDetails: Joi.when('programType', {
    is: 'awareness_campaign',
    then: awarenessCampaignSchema.required(),
    otherwise: awarenessCampaignSchema
  }),

  // Implementation details
  implementationPlan: Joi.object({
    phases: Joi.array().items(
      Joi.object({
        phaseName: Joi.string().required(),
        startDate: Joi.date().required(),
        endDate: Joi.date().greater(Joi.ref('startDate')).required(),
        objectives: Joi.array().items(Joi.string()).required(),
        deliverables: Joi.array().items(Joi.string()).required()
      })
    ).min(1).required(),
    riskMitigation: Joi.array().items(
      Joi.object({
        risk: Joi.string().required(),
        probability: Joi.string().valid('low', 'medium', 'high').required(),
        impact: Joi.string().valid('low', 'medium', 'high').required(),
        mitigation: Joi.string().required()
      })
    )
  }),

  // Registration and participation
  registrationRequired: Joi.boolean().default(false),
  maxParticipants: Joi.number().min(1),
  prerequisites: Joi.array().items(Joi.string()),
  
  // Communication
  contactInformation: Joi.object({
    primaryContact: Joi.string().required(),
    phoneNumber: Joi.string().pattern(/^[0-9+\-\s()]+$/).required(),
    emailAddress: Joi.string().email(),
    officeAddress: Joi.string()
  }).required()
});

/**
 * Schema for updating health programs (partial updates allowed)
 */
const updateHealthProgramSchema = Joi.object({
  name: Joi.string().min(5).max(200),
  description: Joi.string().min(20).max(1000),
  
  sponsoringOrganization: Joi.string().max(200),
  partnerOrganizations: Joi.array().items(Joi.string()),

  endDate: Joi.date(),
  registrationDeadline: Joi.date(),
  
  targetDemographics: targetDemographicsSchema,
  budgetAllocation: budgetAllocationSchema,
  
  successMetrics: Joi.array().items(successMetricSchema),
  expectedOutcomes: Joi.array().items(Joi.string().max(200)),

  vaccinationDetails: vaccinationCampaignSchema,
  screeningDetails: healthScreeningSchema,
  awarenessDetails: awarenessCampaignSchema,

  implementationPlan: Joi.object({
    phases: Joi.array().items(
      Joi.object({
        phaseName: Joi.string().required(),
        startDate: Joi.date().required(),
        endDate: Joi.date().greater(Joi.ref('startDate')).required(),
        objectives: Joi.array().items(Joi.string()).required(),
        deliverables: Joi.array().items(Joi.string()).required()
      })
    ),
    riskMitigation: Joi.array().items(
      Joi.object({
        risk: Joi.string().required(),
        probability: Joi.string().valid('low', 'medium', 'high').required(),
        impact: Joi.string().valid('low', 'medium', 'high').required(),
        mitigation: Joi.string().required()
      })
    )
  }),

  maxParticipants: Joi.number().min(1),
  prerequisites: Joi.array().items(Joi.string()),
  
  contactInformation: Joi.object({
    primaryContact: Joi.string().required(),
    phoneNumber: Joi.string().pattern(/^[0-9+\-\s()]+$/).required(),
    emailAddress: Joi.string().email(),
    officeAddress: Joi.string()
  })
});

/**
 * Schema for assigning staff to programs
 */
const assignStaffSchema = Joi.object({
  staffAssignments: Joi.array().items(staffAssignmentSchema).min(1).required(),
  effectiveDate: Joi.date().default(Date.now),
  assignedBy: Joi.string().required()
});

/**
 * Schema for updating program progress
 */
const updateProgressSchema = Joi.object({
  progressUpdate: Joi.object({
    currentPhase: Joi.string(),
    completionPercentage: Joi.number().min(0).max(100).required(),
    milestonesAchieved: Joi.array().items(Joi.string()),
    challengesFaced: Joi.array().items(Joi.string()),
    nextSteps: Joi.array().items(Joi.string()),
    resourceUtilization: Joi.object({
      budgetUtilized: Joi.number().min(0),
      staffUtilization: Joi.number().min(0).max(100),
      equipmentUsage: Joi.string()
    })
  }).required(),
  
  metricUpdates: Joi.array().items(
    Joi.object({
      metricName: Joi.string().required(),
      currentValue: Joi.number().min(0).required(),
      notes: Joi.string().max(300)
    })
  ),
  
  updatedBy: Joi.string().required(),
  reportDate: Joi.date().default(Date.now)
});

/**
 * Schema for completing programs
 */
const completeProgramSchema = Joi.object({
  completionStatus: Joi.string().valid('completed', 'partially_completed', 'cancelled').required(),
  finalReport: Joi.object({
    summary: Joi.string().min(50).max(2000).required(),
    objectivesAchieved: Joi.array().items(Joi.string()).required(),
    beneficiariesReached: Joi.number().min(0).required(),
    budgetUtilized: Joi.number().min(0).required(),
    successRate: Joi.number().min(0).max(100).required(),
    lessonsLearned: Joi.array().items(Joi.string()),
    recommendations: Joi.array().items(Joi.string())
  }).required(),
  completedBy: Joi.string().required()
});

/**
 * Schema for querying health programs
 */
const queryHealthProgramsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  
  // Filters
  programType: Joi.string().valid(
    'vaccination_campaign', 'health_screening', 'awareness_campaign',
    'maternal_health', 'child_health', 'disease_prevention', 'nutrition_program', 'water_sanitation'
  ),
  status: Joi.string().valid('planning', 'active', 'paused', 'completed', 'cancelled'),
  coordinator: Joi.string(),
  
  // Geographic filters
  areaType: Joi.string().valid('village', 'block', 'district', 'multi_district'),
  areaId: Joi.string(),
  
  // Date filters
  startDateFrom: Joi.date(),
  startDateTo: Joi.date(),
  endDateFrom: Joi.date(),
  endDateTo: Joi.date(),
  
  // Budget filters
  budgetMin: Joi.number().min(0),
  budgetMax: Joi.number().min(0),
  
  // Text search
  search: Joi.string().min(3).max(100),
  
  // Sorting
  sortBy: Joi.string().valid(
    'createdAt', 'startDate', 'endDate', 'name', 'status', 'totalBudget'
  ).default('startDate'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

/**
 * Schema for parameter validation (route params)
 */
const healthProgramParamsSchema = Joi.object({
  id: Joi.string().required(),
  areaId: Joi.string(),
  userId: Joi.string()
});

export {
  createHealthProgramSchema,
  updateHealthProgramSchema,
  assignStaffSchema,
  updateProgressSchema,
  completeProgramSchema,
  queryHealthProgramsSchema,
  healthProgramParamsSchema
};