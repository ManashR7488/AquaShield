import Joi from 'joi';
import mongoose from 'mongoose';

// Custom validators
const objectIdValidator = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
}, 'ObjectId validation');

// Vital Signs Validation Schemas
const bloodPressureSchema = Joi.object({
  systolic: Joi.number().min(50).max(300).messages({
    'number.min': 'Systolic pressure must be at least 50 mmHg',
    'number.max': 'Systolic pressure cannot exceed 300 mmHg'
  }),
  diastolic: Joi.number().min(30).max(200).messages({
    'number.min': 'Diastolic pressure must be at least 30 mmHg',
    'number.max': 'Diastolic pressure cannot exceed 200 mmHg'
  }),
  unit: Joi.string().default('mmHg')
});

const heartRateSchema = Joi.object({
  value: Joi.number().min(30).max(250).messages({
    'number.min': 'Heart rate must be at least 30 bpm',
    'number.max': 'Heart rate cannot exceed 250 bpm'
  }),
  unit: Joi.string().default('bpm')
});

const temperatureSchema = Joi.object({
  value: Joi.number().min(90).max(115).messages({
    'number.min': 'Temperature must be at least 90°F',
    'number.max': 'Temperature cannot exceed 115°F'
  }),
  unit: Joi.string().valid('Fahrenheit', 'Celsius').default('Fahrenheit')
});

const weightSchema = Joi.object({
  value: Joi.number().min(0.5).max(1000).messages({
    'number.min': 'Weight must be at least 0.5 kg',
    'number.max': 'Weight cannot exceed 1000 kg'
  }),
  unit: Joi.string().valid('kg', 'lbs').default('kg')
});

const heightSchema = Joi.object({
  value: Joi.number().min(30).max(300).messages({
    'number.min': 'Height must be at least 30 cm',
    'number.max': 'Height cannot exceed 300 cm'
  }),
  unit: Joi.string().valid('cm', 'inches').default('cm')
});

const oxygenSaturationSchema = Joi.object({
  value: Joi.number().min(70).max(100).messages({
    'number.min': 'Oxygen saturation must be at least 70%',
    'number.max': 'Oxygen saturation cannot exceed 100%'
  }),
  unit: Joi.string().default('%')
});

const respiratoryRateSchema = Joi.object({
  value: Joi.number().min(8).max(60).messages({
    'number.min': 'Respiratory rate must be at least 8 breaths/min',
    'number.max': 'Respiratory rate cannot exceed 60 breaths/min'
  }),
  unit: Joi.string().default('breaths/min')
});

const vitalSignsSchema = Joi.object({
  bloodPressure: bloodPressureSchema,
  heartRate: heartRateSchema,
  temperature: temperatureSchema,
  weight: weightSchema,
  height: heightSchema,
  bmi: Joi.number().min(10).max(80),
  oxygenSaturation: oxygenSaturationSchema,
  respiratoryRate: respiratoryRateSchema
});

// Symptoms Validation Schema
const symptomsSchema = Joi.object({
  primarySymptoms: Joi.array().items(Joi.string().trim().max(100)).min(1).required(),
  severity: Joi.string().valid('mild', 'moderate', 'severe', 'critical').required(),
  duration: Joi.object({
    value: Joi.number().positive().required(),
    unit: Joi.string().valid('minutes', 'hours', 'days', 'weeks', 'months').required()
  }),
  onset: Joi.string().valid('sudden', 'gradual'),
  triggers: Joi.array().items(Joi.string().trim().max(100)),
  associatedSymptoms: Joi.array().items(Joi.string().trim().max(100)),
  painScale: Joi.number().min(0).max(10)
});

// Medical History Validation Schema
const medicalHistorySchema = Joi.object({
  condition: Joi.string().required().trim().max(200),
  diagnosis: Joi.string().trim().max(500),
  treatmentPlan: Joi.string().trim().max(1000),
  medications: Joi.array().items(Joi.string().trim().max(100)),
  procedures: Joi.array().items(Joi.string().trim().max(100)),
  outcome: Joi.string().valid('resolved', 'ongoing', 'improved', 'worsened'),
  followUpRequired: Joi.boolean(),
  followUpDate: Joi.date().greater('now')
});

// Medication Validation Schema
const medicationSchema = Joi.object({
  name: Joi.string().required().trim().max(100),
  dosage: Joi.string().required().trim().max(50),
  frequency: Joi.string().required().trim().max(50),
  route: Joi.string().valid('oral', 'topical', 'injection', 'inhalation', 'other'),
  startDate: Joi.date().max('now'),
  endDate: Joi.date().greater(Joi.ref('startDate')),
  prescribedBy: Joi.string().trim().max(100),
  indication: Joi.string().trim().max(200),
  sideEffects: Joi.array().items(Joi.string().trim().max(100)),
  adherence: Joi.string().valid('excellent', 'good', 'fair', 'poor')
});

// Allergy Validation Schema
const allergySchema = Joi.object({
  allergen: Joi.string().required().trim().max(100),
  allergenType: Joi.string().valid('food', 'medication', 'environmental', 'other'),
  reaction: Joi.string().trim().max(500),
  severity: Joi.string().valid('mild', 'moderate', 'severe', 'life-threatening').required(),
  onsetTime: Joi.string().trim().max(100),
  treatment: Joi.string().trim().max(500)
});

// Lab Results Validation Schema
const labResultSchema = Joi.object({
  parameter: Joi.string().required().trim().max(100),
  value: Joi.string().required().trim().max(50),
  unit: Joi.string().trim().max(20),
  referenceRange: Joi.string().trim().max(50),
  status: Joi.string().valid('normal', 'abnormal', 'critical')
});

const labResultsSchema = Joi.object({
  testName: Joi.string().required().trim().max(200),
  testType: Joi.string().trim().max(100),
  results: Joi.array().items(labResultSchema).min(1).required(),
  interpretation: Joi.string().trim().max(1000),
  orderedBy: Joi.string().trim().max(100),
  labName: Joi.string().trim().max(100)
});

// Vaccination Validation Schema
const vaccinationSchema = Joi.object({
  vaccineName: Joi.string().required().trim().max(100),
  manufacturer: Joi.string().trim().max(100),
  lotNumber: Joi.string().trim().max(50),
  doseNumber: Joi.number().integer().min(1).max(10),
  site: Joi.string().trim().max(50),
  route: Joi.string().trim().max(50),
  nextDueDate: Joi.date().greater('now'),
  adverseReactions: Joi.array().items(Joi.string().trim().max(200))
});

// Healthcare Provider Validation Schema
const healthcareProviderSchema = Joi.object({
  name: Joi.string().trim().max(100),
  specialization: Joi.string().trim().max(100),
  hospital: Joi.string().trim().max(100),
  contactInfo: Joi.object({
    phone: Joi.string().pattern(/^[6-9]\d{9}$/).messages({
      'string.pattern.base': 'Phone number must be a valid 10-digit Indian mobile number'
    }),
    email: Joi.string().email()
  }),
  licenseNumber: Joi.string().trim().max(50)
});

// Attachment Validation Schema
const attachmentSchema = Joi.object({
  fileName: Joi.string().required().trim().max(255),
  fileType: Joi.string().required().trim().max(50),
  fileSize: Joi.number().positive().max(10485760), // 10MB max
  url: Joi.string().uri().required(),
  description: Joi.string().trim().max(500)
});

// Reminder Validation Schema
const reminderSchema = Joi.object({
  type: Joi.string().valid('medication', 'followup', 'test', 'appointment').required(),
  date: Joi.date().greater('now').required(),
  message: Joi.string().required().trim().max(500),
  completed: Joi.boolean().default(false)
});

// Share Settings Validation Schema
const shareSettingsSchema = Joi.object({
  shareWithFamily: Joi.boolean().default(true),
  shareWithDoctors: Joi.boolean().default(true),
  emergencyAccess: Joi.boolean().default(true)
});

// Main Health Record Schemas
export const createHealthRecordSchema = Joi.object({
  userId: objectIdValidator.forbidden(),
  familyMemberId: objectIdValidator,
  recordType: Joi.string().valid('vital_signs', 'medical_history', 'symptoms', 'medications', 'allergies', 'lab_results', 'vaccination', 'appointment').required(),
  category: Joi.string().valid('routine', 'emergency', 'chronic_care', 'preventive', 'diagnostic').default('routine'),
  title: Joi.string().required().trim().max(200),
  description: Joi.string().required().trim().max(2000),
  recordDate: Joi.date().required().max('now'),
  vitalSigns: Joi.when('recordType', {
    is: 'vital_signs',
    then: vitalSignsSchema.required(),
    otherwise: vitalSignsSchema
  }),
  symptoms: Joi.when('recordType', {
    is: 'symptoms',
    then: symptomsSchema.required(),
    otherwise: symptomsSchema
  }),
  medicalHistory: Joi.when('recordType', {
    is: 'medical_history',
    then: medicalHistorySchema.required(),
    otherwise: medicalHistorySchema
  }),
  medication: Joi.when('recordType', {
    is: 'medications',
    then: medicationSchema.required(),
    otherwise: medicationSchema
  }),
  allergy: Joi.when('recordType', {
    is: 'allergies',
    then: allergySchema.required(),
    otherwise: allergySchema
  }),
  labResults: Joi.when('recordType', {
    is: 'lab_results',
    then: labResultsSchema.required(),
    otherwise: labResultsSchema
  }),
  vaccination: Joi.when('recordType', {
    is: 'vaccination',
    then: vaccinationSchema.required(),
    otherwise: vaccinationSchema
  }),
  healthcareProvider: healthcareProviderSchema,
  attachments: Joi.array().items(attachmentSchema),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
  confidential: Joi.boolean().default(false),
  tags: Joi.array().items(Joi.string().trim().max(50)),
  reminders: Joi.array().items(reminderSchema),
  shareSettings: shareSettingsSchema
});

export const updateHealthRecordSchema = Joi.object({
  title: Joi.string().trim().max(200),
  description: Joi.string().trim().max(2000),
  recordDate: Joi.date().max('now'),
  vitalSigns: vitalSignsSchema,
  symptoms: symptomsSchema,
  medicalHistory: medicalHistorySchema,
  medication: medicationSchema,
  allergy: allergySchema,
  labResults: labResultsSchema,
  vaccination: vaccinationSchema,
  healthcareProvider: healthcareProviderSchema,
  attachments: Joi.array().items(attachmentSchema),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent'),
  confidential: Joi.boolean(),
  tags: Joi.array().items(Joi.string().trim().max(50)),
  reminders: Joi.array().items(reminderSchema),
  shareSettings: shareSettingsSchema,
  status: Joi.string().valid('active', 'archived', 'deleted')
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

export const queryHealthRecordsSchema = Joi.object({
  recordType: Joi.string().valid('vital_signs', 'medical_history', 'symptoms', 'medications', 'allergies', 'lab_results', 'vaccination', 'appointment'),
  category: Joi.string().valid('routine', 'emergency', 'chronic_care', 'preventive', 'diagnostic'),
  familyMemberId: objectIdValidator,
  startDate: Joi.date(),
  endDate: Joi.date().greater(Joi.ref('startDate')),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent'),
  status: Joi.string().valid('active', 'archived', 'deleted').default('active'),
  tags: Joi.array().items(Joi.string().trim().max(50)),
  search: Joi.string().trim().max(200),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('recordDate', 'title', 'priority', 'createdAt').default('recordDate'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

export const healthRecordIdSchema = Joi.object({
  id: objectIdValidator.required().messages({
    'any.required': 'Health record ID is required'
  })
});

// Specialized schemas for specific record types
export const createVitalSignsSchema = Joi.object({
  userId: objectIdValidator.forbidden(),
  familyMemberId: objectIdValidator,
  title: Joi.string().default('Vital Signs Check'),
  description: Joi.string().default('Regular vital signs monitoring'),
  recordDate: Joi.date().default(Date.now),
  vitalSigns: vitalSignsSchema.required(),
  healthcareProvider: healthcareProviderSchema,
  tags: Joi.array().items(Joi.string().trim().max(50)),
  shareSettings: shareSettingsSchema
});

export const createSymptomLogSchema = Joi.object({
  userId: objectIdValidator.forbidden(),
  familyMemberId: objectIdValidator,
  title: Joi.string().required().trim().max(200),
  description: Joi.string().required().trim().max(2000),
  recordDate: Joi.date().default(Date.now),
  symptoms: symptomsSchema.required(),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
  tags: Joi.array().items(Joi.string().trim().max(50)),
  shareSettings: shareSettingsSchema
});

export const createMedicalHistorySchema = Joi.object({
  userId: objectIdValidator.forbidden(),
  familyMemberId: objectIdValidator,
  title: Joi.string().required().trim().max(200),
  description: Joi.string().required().trim().max(2000),
  recordDate: Joi.date().required().max('now'),
  medicalHistory: medicalHistorySchema.required(),
  healthcareProvider: healthcareProviderSchema,
  attachments: Joi.array().items(attachmentSchema),
  tags: Joi.array().items(Joi.string().trim().max(50)),
  shareSettings: shareSettingsSchema
});

// Trend analysis schema
export const healthTrendsSchema = Joi.object({
  recordType: Joi.string().valid('vital_signs', 'symptoms', 'medications', 'lab_results').required(),
  timeframe: Joi.string().valid('1month', '3months', '6months', '1year').default('6months'),
  familyMemberId: objectIdValidator
});

// Health report generation schema
export const generateHealthReportSchema = Joi.object({
  startDate: Joi.date().required(),
  endDate: Joi.date().required().greater(Joi.ref('startDate')),
  recordTypes: Joi.array().items(Joi.string().valid('vital_signs', 'medical_history', 'symptoms', 'medications', 'allergies', 'lab_results', 'vaccination', 'appointment')),
  includeFamily: Joi.boolean().default(true),
  format: Joi.string().valid('pdf', 'excel', 'json').default('pdf')
});

// Custom validation messages
export const validationMessages = {
  'any.required': '{#label} is required',
  'string.empty': '{#label} cannot be empty',
  'string.min': '{#label} must be at least {#limit} characters long',
  'string.max': '{#label} cannot exceed {#limit} characters',
  'string.email': 'Please provide a valid email address',
  'date.base': '{#label} must be a valid date',
  'date.max': '{#label} cannot be in the future',
  'date.greater': '{#label} must be after {#ref}',
  'number.base': '{#label} must be a number',
  'number.integer': '{#label} must be an integer',
  'number.positive': '{#label} must be a positive number',
  'number.min': '{#label} must be at least {#limit}',
  'number.max': '{#label} cannot exceed {#limit}',
  'array.min': '{#label} must contain at least {#limit} items',
  'any.only': '{#label} must be one of {#valids}'
};