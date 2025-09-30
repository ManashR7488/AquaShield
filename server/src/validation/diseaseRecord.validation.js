import Joi from 'joi';

/**
 * Disease Record Validation Schemas
 * Comprehensive Joi validation schemas for disease record operations
 */

// Common schemas
const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/).message('Invalid ObjectId format');
const dateSchema = Joi.date().iso();

const paginationSchema = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('onsetDate', 'diagnosisDate', 'diseaseName', 'severity', 'createdAt').default('onsetDate'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
};

// Disease classification and types
const diseaseClassifications = ['infectious', 'non_infectious', 'chronic', 'acute', 'genetic', 'occupational'];

const diseaseCategories = [
  'communicable', 'vector_borne', 'water_borne', 'food_borne', 'air_borne', 
  'lifestyle', 'nutritional', 'respiratory', 'cardiovascular', 'gastrointestinal',
  'neurological', 'metabolic', 'reproductive', 'skin', 'mental_health'
];

const severityLevels = ['mild', 'moderate', 'severe', 'critical'];

const diseaseStatuses = [
  'suspected', 'confirmed', 'under_treatment', 'recovered', 'chronic_management', 
  'deceased', 'transferred', 'lost_to_followup'
];

const diagnosisStatuses = ['presumptive', 'clinical', 'laboratory_confirmed', 'epidemiological_link'];

const transmissionModes = [
  'direct_contact', 'droplet', 'airborne', 'vector_borne', 'water_borne', 
  'food_borne', 'sexual', 'blood_borne', 'maternal_fetal', 'unknown'
];

/**
 * Schema for creating disease records
 */
export const createDiseaseRecordSchema = Joi.object({
  patientId: objectId.required()
    .messages({
      'any.required': 'Patient ID is required',
      'string.pattern.base': 'Invalid patient ID format'
    }),
    
  diseaseName: Joi.string().min(2).max(200).required()
    .messages({
      'any.required': 'Disease name is required',
      'string.min': 'Disease name must be at least 2 characters',
      'string.max': 'Disease name cannot exceed 200 characters'
    }),
    
  reporterId: objectId.required()
    .messages({
      'any.required': 'Reporter ID is required',
      'string.pattern.base': 'Invalid reporter ID format'
    }),
    
  onsetDate: dateSchema.required()
    .max('now')
    .messages({
      'any.required': 'Onset date is required',
      'date.max': 'Onset date cannot be in the future'
    }),
    
  // Disease classification
  classification: Joi.string().valid(...diseaseClassifications).required()
    .messages({
      'any.required': 'Disease classification is required'
    }),
    
  category: Joi.string().valid(...diseaseCategories),
  
  // Disease coding (ICD-10, local codes)
  diseaseCodes: Joi.object({
    icd10: Joi.string().regex(/^[A-Z]\d{2}(\.\d{1,2})?$/),
    localCode: Joi.string().max(20),
    whoCode: Joi.string().max(20)
  }),
  
  // Clinical information
  severity: Joi.string().valid(...severityLevels).required()
    .messages({
      'any.required': 'Severity level is required'
    }),
    
  diagnosisStatus: Joi.string().valid(...diagnosisStatuses).default('presumptive'),
  
  diagnosisDate: dateSchema.min(Joi.ref('onsetDate')),
  
  diagnosedBy: objectId,
  
  // Symptom tracking
  symptoms: Joi.object({
    primary: Joi.array().items(Joi.object({
      symptom: Joi.string().max(100).required(),
      severity: Joi.string().valid('mild', 'moderate', 'severe').required(),
      duration: Joi.string().max(50),
      notes: Joi.string().max(300)
    })).min(1).required(),
    
    secondary: Joi.array().items(Joi.object({
      symptom: Joi.string().max(100).required(),
      severity: Joi.string().valid('mild', 'moderate', 'severe'),
      duration: Joi.string().max(50),
      notes: Joi.string().max(300)
    })),
    
    systemicSymptoms: Joi.array().items(Joi.string().valid(
      'fever', 'chills', 'fatigue', 'weakness', 'weight_loss', 'appetite_loss',
      'night_sweats', 'malaise', 'headache', 'body_ache'
    ))
  }).required(),
  
  // Treatment details
  treatment: Joi.object({
    medications: Joi.array().items(Joi.object({
      name: Joi.string().max(100).required(),
      dosage: Joi.string().max(50).required(),
      frequency: Joi.string().max(50).required(),
      duration: Joi.string().max(50),
      route: Joi.string().valid('oral', 'iv', 'im', 'topical', 'inhaled', 'other').default('oral'),
      startDate: dateSchema.required(),
      endDate: dateSchema.min(Joi.ref('startDate'))
    })),
    
    nonPharmacological: Joi.array().items(Joi.object({
      intervention: Joi.string().max(200).required(),
      frequency: Joi.string().max(50),
      duration: Joi.string().max(50),
      notes: Joi.string().max(300)
    })),
    
    hospitalizations: Joi.array().items(Joi.object({
      facility: Joi.string().max(200).required(),
      admissionDate: dateSchema.required(),
      dischargeDate: dateSchema.min(Joi.ref('admissionDate')),
      reason: Joi.string().max(500),
      outcome: Joi.string().valid('discharged', 'transferred', 'deceased', 'absconded')
    }))
  }),
  
  // Epidemiological data
  epidemiologicalData: Joi.object({
    transmissionMode: Joi.string().valid(...transmissionModes),
    
    exposureHistory: Joi.array().items(Joi.object({
      exposureType: Joi.string().max(100).required(),
      exposureDate: dateSchema.required(),
      location: Joi.string().max(200),
      duration: Joi.string().max(50),
      description: Joi.string().max(500)
    })),
    
    contacts: Joi.array().items(Joi.object({
      contactId: objectId,
      relationship: Joi.string().max(50),
      contactType: Joi.string().valid('household', 'close', 'casual', 'healthcare', 'community'),
      lastContact: dateSchema,
      riskLevel: Joi.string().valid('high', 'medium', 'low')
    })),
    
    travelHistory: Joi.array().items(Joi.object({
      destination: Joi.string().max(200).required(),
      departureDate: dateSchema.required(),
      returnDate: dateSchema.min(Joi.ref('departureDate')),
      purpose: Joi.string().max(100),
      accommodationType: Joi.string().max(100)
    })),
    
    occupationalExposure: Joi.object({
      hasExposure: Joi.boolean().default(false),
      workplace: Joi.string().max(200),
      exposureType: Joi.string().max(200),
      protectiveEquipment: Joi.boolean(),
      coworkersCases: Joi.number().integer().min(0)
    }),
    
    vectorExposure: Joi.object({
      vectorType: Joi.string().valid('mosquito', 'tick', 'flea', 'rat', 'bat', 'dog', 'other'),
      exposureLocation: Joi.string().max(200),
      seasonalPattern: Joi.boolean(),
      controlMeasures: Joi.array().items(Joi.string())
    })
  }),
  
  // Laboratory results
  laboratoryResults: Joi.array().items(Joi.object({
    testType: Joi.string().max(100).required(),
    sampleType: Joi.string().valid('blood', 'urine', 'stool', 'sputum', 'csf', 'tissue', 'other').required(),
    testDate: dateSchema.required(),
    result: Joi.string().max(500).required(),
    normalRange: Joi.string().max(100),
    interpretation: Joi.string().valid('normal', 'abnormal', 'positive', 'negative', 'inconclusive'),
    laboratory: Joi.string().max(200),
    reportDate: dateSchema.min(Joi.ref('testDate'))
  })),
  
  // Outcome tracking
  outcome: Joi.object({
    status: Joi.string().valid(...diseaseStatuses).default('suspected'),
    recoveryDate: dateSchema,
    complications: Joi.array().items(Joi.object({
      complication: Joi.string().max(200).required(),
      onsetDate: dateSchema.required(),
      severity: Joi.string().valid(...severityLevels).required(),
      resolved: Joi.boolean().default(false),
      resolutionDate: dateSchema
    })),
    sequelae: Joi.array().items(Joi.string().max(200)),
    causeOfDeath: Joi.when('status', {
      is: 'deceased',
      then: Joi.string().max(500),
      otherwise: Joi.string()
    }),
    deathDate: Joi.when('status', {
      is: 'deceased',
      then: dateSchema.required(),
      otherwise: dateSchema
    })
  }),
  
  // Outbreak information
  outbreakData: Joi.object({
    isPartOfOutbreak: Joi.boolean().default(false),
    outbreakId: Joi.when('isPartOfOutbreak', {
      is: true,
      then: objectId,
      otherwise: objectId
    }),
    caseNumber: Joi.string().max(20),
    indexCase: Joi.boolean().default(false),
    linkedCases: Joi.array().items(objectId)
  }),
  
  // Follow-up and monitoring
  followUp: Joi.object({
    required: Joi.boolean().default(true),
    frequency: Joi.string().valid('daily', 'weekly', 'monthly', 'as_needed').default('weekly'),
    nextFollowUpDate: dateSchema.greater('now'),
    assignedTo: objectId,
    monitoringParameters: Joi.array().items(Joi.string())
  }),
  
  // Reporting and notifications
  reporting: Joi.object({
    notifiable: Joi.boolean().default(false),
    reportedToAuthorities: Joi.boolean().default(false),
    reportingDate: dateSchema,
    authorityNotified: Joi.string().max(200),
    urgentNotification: Joi.boolean().default(false)
  }),
  
  // Additional information
  notes: Joi.string().max(2000),
  
  // Privacy and access control
  confidentialityLevel: Joi.string().valid('public', 'restricted', 'confidential').default('restricted'),
  
  // Data sources and validation
  dataQuality: Joi.object({
    completeness: Joi.string().valid('complete', 'partial', 'minimal'),
    reliability: Joi.string().valid('high', 'medium', 'low'),
    verificationStatus: Joi.string().valid('verified', 'pending', 'unverified').default('pending'),
    verifiedBy: objectId,
    verificationDate: dateSchema
  })
});

/**
 * Schema for updating disease records
 */
export const updateDiseaseRecordSchema = Joi.object({
  diseaseName: Joi.string().min(2).max(200),
  
  classification: Joi.string().valid(...diseaseClassifications),
  
  category: Joi.string().valid(...diseaseCategories),
  
  diseaseCodes: Joi.object(),
  
  severity: Joi.string().valid(...severityLevels),
  
  diagnosisStatus: Joi.string().valid(...diagnosisStatuses),
  
  diagnosisDate: dateSchema,
  
  diagnosedBy: objectId,
  
  symptoms: Joi.object(),
  treatment: Joi.object(),
  epidemiologicalData: Joi.object(),
  laboratoryResults: Joi.array(),
  outcome: Joi.object(),
  outbreakData: Joi.object(),
  followUp: Joi.object(),
  reporting: Joi.object(),
  
  notes: Joi.string().max(2000),
  
  confidentialityLevel: Joi.string().valid('public', 'restricted', 'confidential'),
  
  dataQuality: Joi.object()
}).min(1);

/**
 * Schema for confirming diagnosis
 */
export const confirmDiagnosisSchema = Joi.object({
  diagnosisStatus: Joi.string().valid('clinical', 'laboratory_confirmed').required(),
  
  diagnosisDate: dateSchema.required().max('now'),
  
  diagnosedBy: objectId.required(),
  
  confirmationEvidence: Joi.object({
    clinicalFindings: Joi.string().max(1000),
    laboratoryResults: Joi.array().items(objectId),
    imagingResults: Joi.array().items(Joi.string()),
    consultationNotes: Joi.string().max(1000)
  }),
  
  finalDiagnosis: Joi.string().max(200),
  
  differentialDiagnoses: Joi.array().items(Joi.object({
    diagnosis: Joi.string().max(200).required(),
    likelihood: Joi.string().valid('ruled_out', 'unlikely', 'possible', 'likely'),
    reasoning: Joi.string().max(500)
  })),
  
  treatmentPlan: Joi.object({
    medications: Joi.array(),
    followUpSchedule: Joi.object(),
    referrals: Joi.array().items(Joi.object({
      specialist: Joi.string().max(100),
      facility: Joi.string().max(200),
      urgency: Joi.string().valid('routine', 'urgent', 'emergency'),
      reason: Joi.string().max(300)
    }))
  })
});

/**
 * Schema for querying disease records
 */
export const queryDiseaseRecordsSchema = Joi.object({
  patientId: objectId,
  
  diseaseName: Joi.string(),
  
  classification: Joi.string().valid(...diseaseClassifications),
  
  category: Joi.string().valid(...diseaseCategories),
  
  severity: Joi.string().valid(...severityLevels),
  
  status: Joi.string().valid(...diseaseStatuses),
  
  diagnosisStatus: Joi.string().valid(...diagnosisStatuses),
  
  reporterId: objectId,
  
  diagnosedBy: objectId,
  
  // Date filters
  onsetDateFrom: dateSchema,
  onsetDateTo: dateSchema,
  diagnosisDateFrom: dateSchema,
  diagnosisDateTo: dateSchema,
  
  // Outbreak filters
  isPartOfOutbreak: Joi.boolean(),
  outbreakId: objectId,
  
  // Notification filters
  notifiable: Joi.boolean(),
  reportedToAuthorities: Joi.boolean(),
  
  // Location filters
  villageId: objectId,
  
  // Search
  search: Joi.string().min(1).max(200),
  
  ...paginationSchema
});

/**
 * Schema for outbreak tracking
 */
export const outbreakTrackingSchema = Joi.object({
  diseaseType: Joi.string().required(),
  
  location: Joi.object({
    villageIds: Joi.array().items(objectId),
    coordinates: Joi.object({
      latitude: Joi.number().min(-90).max(90),
      longitude: Joi.number().min(-180).max(180)
    }),
    radiusKm: Joi.number().min(0.1).max(100).default(10)
  }),
  
  timeframe: Joi.object({
    startDate: dateSchema.required(),
    endDate: dateSchema.required().min(Joi.ref('startDate'))
  }),
  
  thresholds: Joi.object({
    minimumCases: Joi.number().integer().min(2).default(3),
    timeWindowDays: Joi.number().integer().min(1).max(365).default(14),
    attackRate: Joi.number().min(0).max(100)
  }),
  
  includeMetrics: Joi.array().items(Joi.string().valid(
    'case_count', 'attack_rate', 'case_fatality_rate', 'geographic_spread',
    'temporal_pattern', 'demographic_distribution'
  )).default(['case_count', 'attack_rate'])
});

/**
 * Schema for adding follow-up to disease records
 */
export const addFollowUpSchema = Joi.object({
  followUpType: Joi.string().valid(
    'symptom_update', 'treatment_progress', 'test_results', 
    'contact_check', 'outcome_assessment', 'discharge_planning'
  ).required(),
  
  description: Joi.string().max(1000).required(),
  
  symptoms: Joi.array().items(Joi.string()),
  
  treatmentResponse: Joi.string().valid(
    'improving', 'stable', 'worsening', 'resolved', 'complications'
  ),
  
  testResults: Joi.array().items(Joi.object({
    testType: Joi.string().required(),
    result: Joi.string().required(),
    date: dateSchema.required()
  })),
  
  nextFollowUpDate: dateSchema,
  
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium')
});

/**
 * Schema for disease investigation
 */
export const investigationSchema = Joi.object({
  investigationType: Joi.string().valid(
    'case_investigation', 'outbreak_investigation', 'contact_tracing', 
    'environmental_investigation', 'laboratory_investigation'
  ).required(),
  
  investigator: objectId.required(),
  
  investigationDate: dateSchema.required(),
  
  findings: Joi.string().max(2000).required(),
  
  riskFactors: Joi.array().items(Joi.string()),
  
  exposureHistory: Joi.array().items(Joi.object({
    exposureType: Joi.string().required(),
    location: Joi.string(),
    date: dateSchema,
    description: Joi.string().max(500)
  })),
  
  recommendations: Joi.string().max(1000),
  
  followUpRequired: Joi.boolean().default(false)
});

/**
 * Schema for contact tracing queries
 */
export const contactTracingSchema = Joi.object({
  patientId: objectId,
  
  contactType: Joi.string().valid('household', 'workplace', 'social', 'healthcare', 'travel'),
  
  exposureDateFrom: dateSchema,
  
  exposureDateTo: dateSchema,
  
  riskLevel: Joi.string().valid('low', 'medium', 'high'),
  
  followUpStatus: Joi.string().valid('pending', 'contacted', 'quarantined', 'tested', 'cleared'),
  
  includeSecondaryContacts: Joi.boolean().default(false)
});

/**
 * Custom validator for disease code format
 */
export const validateDiseaseCode = (code, codeType) => {
  const patterns = {
    icd10: /^[A-Z]\d{2}(\.\d{1,2})?$/,
    localCode: /^[A-Z0-9]{2,20}$/,
    whoCode: /^[A-Z0-9]{2,20}$/
  };
  
  return patterns[codeType]?.test(code) ?? true;
};

/**
 * Custom validator for symptom combination patterns
 */
export const validateSymptomPattern = (symptoms, diseaseName) => {
  // This would contain disease-specific symptom validation logic
  // For now, just ensure primary symptoms are provided
  return symptoms.primary && symptoms.primary.length > 0;
};

/**
 * Custom validator for outbreak correlation
 */
export const validateOutbreakCorrelation = (diseaseRecord, existingOutbreaks) => {
  // Logic to determine if this case should be linked to an existing outbreak
  // Based on disease type, location, and temporal proximity
  return true; // Simplified for now
};

export default {
  createDiseaseRecordSchema,
  updateDiseaseRecordSchema,
  confirmDiagnosisSchema,
  queryDiseaseRecordsSchema,
  outbreakTrackingSchema,
  validateDiseaseCode,
  validateSymptomPattern,
  validateOutbreakCorrelation
};