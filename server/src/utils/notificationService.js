import mongoose from 'mongoose';
import AlertSystem from '../models/alertSystem.model.js';

/**
 * Notification Service Utility Module
 * 
 * Handles integration between the alert system and various notification channels
 * Provides functions for multi-channel delivery, templates, and status tracking
 */

// =============================================================================
// NOTIFICATION CHANNEL HANDLERS
// =============================================================================

/**
 * Send SMS notification
 * @param {String} phoneNumber - Recipient phone number
 * @param {String} message - Message content
 * @param {Object} options - Additional options (priority, sender, etc.)
 * @returns {Promise<Object>} Delivery result
 */
const sendSMS = async (phoneNumber, message, options = {}) => {
  try {
    // Placeholder for SMS service provider integration
    // Replace with actual SMS service (Twilio, AWS SNS, etc.)
    console.log(`SMS to ${phoneNumber}: ${message}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Mock successful delivery
    return {
      success: true,
      messageId: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'sent',
      timestamp: new Date(),
      channel: 'sms',
      recipient: phoneNumber,
      cost: 0.05 // Mock cost in currency units
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: 'failed',
      timestamp: new Date(),
      channel: 'sms',
      recipient: phoneNumber
    };
  }
};

/**
 * Send email notification
 * @param {String} emailAddress - Recipient email address
 * @param {String} subject - Email subject
 * @param {String} htmlContent - HTML email content
 * @param {Object} options - Additional options (attachments, priority, etc.)
 * @returns {Promise<Object>} Delivery result
 */
const sendEmail = async (emailAddress, subject, htmlContent, options = {}) => {
  try {
    // Placeholder for email service provider integration
    // Replace with actual email service (SendGrid, AWS SES, etc.)
    console.log(`Email to ${emailAddress}: ${subject}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Mock successful delivery
    return {
      success: true,
      messageId: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'sent',
      timestamp: new Date(),
      channel: 'email',
      recipient: emailAddress,
      subject: subject
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: 'failed',
      timestamp: new Date(),
      channel: 'email',
      recipient: emailAddress
    };
  }
};

/**
 * Send push notification
 * @param {String} deviceToken - Device push notification token
 * @param {String} title - Notification title
 * @param {String} body - Notification body
 * @param {Object} data - Additional notification data
 * @returns {Promise<Object>} Delivery result
 */
const sendPushNotification = async (deviceToken, title, body, data = {}) => {
  try {
    // Placeholder for push notification service integration
    // Replace with actual push service (Firebase FCM, Apple Push, etc.)
    console.log(`Push to ${deviceToken}: ${title} - ${body}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Mock successful delivery
    return {
      success: true,
      messageId: `push_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'sent',
      timestamp: new Date(),
      channel: 'push_notification',
      recipient: deviceToken,
      title: title,
      body: body
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: 'failed',
      timestamp: new Date(),
      channel: 'push_notification',
      recipient: deviceToken
    };
  }
};

/**
 * Send WhatsApp message
 * @param {String} phoneNumber - WhatsApp phone number
 * @param {String} message - Message content
 * @param {Object} options - Additional options (template, media, etc.)
 * @returns {Promise<Object>} Delivery result
 */
const sendWhatsApp = async (phoneNumber, message, options = {}) => {
  try {
    // Placeholder for WhatsApp Business API integration
    console.log(`WhatsApp to ${phoneNumber}: ${message}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock successful delivery
    return {
      success: true,
      messageId: `whatsapp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'sent',
      timestamp: new Date(),
      channel: 'whatsapp',
      recipient: phoneNumber
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: 'failed',
      timestamp: new Date(),
      channel: 'whatsapp',
      recipient: phoneNumber
    };
  }
};

/**
 * Make voice call
 * @param {String} phoneNumber - Recipient phone number
 * @param {String} message - Voice message content (text-to-speech)
 * @param {Object} options - Additional options (voice, language, etc.)
 * @returns {Promise<Object>} Delivery result
 */
const makeVoiceCall = async (phoneNumber, message, options = {}) => {
  try {
    // Placeholder for voice call service integration
    // Replace with actual voice service (Twilio Voice, etc.)
    console.log(`Voice call to ${phoneNumber}: ${message}`);
    
    // Simulate longer API call delay for voice
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock successful delivery
    return {
      success: true,
      callId: `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'initiated',
      timestamp: new Date(),
      channel: 'voice_call',
      recipient: phoneNumber,
      duration: options.estimatedDuration || 30 // seconds
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: 'failed',
      timestamp: new Date(),
      channel: 'voice_call',
      recipient: phoneNumber
    };
  }
};

// =============================================================================
// NOTIFICATION TEMPLATES
// =============================================================================

/**
 * Get notification template for different alert types
 * @param {String} alertType - Type of alert
 * @param {Object} data - Data to populate in template
 * @returns {Object} Template content for different channels
 */
const getNotificationTemplate = (alertType, data = {}) => {
  const templates = {
    health_emergency: {
      sms: `🚨 HEALTH EMERGENCY ALERT 🚨\n${data.title}\nLocation: ${data.location}\nSeverity: ${data.severity}\nImmediate action required. Contact: ${data.contactNumber}`,
      
      email: {
        subject: `🚨 Health Emergency Alert - ${data.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center;">
              <h1>🚨 HEALTH EMERGENCY ALERT</h1>
            </div>
            <div style="padding: 20px; background-color: #f8f9fa;">
              <h2>${data.title}</h2>
              <p><strong>Location:</strong> ${data.location}</p>
              <p><strong>Severity:</strong> ${data.severity}</p>
              <p><strong>Description:</strong> ${data.description}</p>
              <p><strong>Reported by:</strong> ${data.reportedBy}</p>
              <p><strong>Contact:</strong> ${data.contactNumber}</p>
              <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <strong>⚠️ Immediate action required</strong>
              </div>
              <p style="font-size: 12px; color: #6c757d;">Alert generated at: ${new Date().toLocaleString()}</p>
            </div>
          </div>
        `
      },
      
      push: {
        title: '🚨 Health Emergency',
        body: `${data.title} at ${data.location}. Severity: ${data.severity}. Action required.`,
        data: { alertType: 'health_emergency', alertId: data.alertId }
      },
      
      whatsapp: `🚨 *HEALTH EMERGENCY ALERT* 🚨\n\n*${data.title}*\n📍 Location: ${data.location}\n⚠️ Severity: ${data.severity}\n\n${data.description}\n\n👤 Reported by: ${data.reportedBy}\n📞 Contact: ${data.contactNumber}\n\n🚨 *Immediate action required*`,
      
      voice: `This is a health emergency alert. ${data.title} reported at ${data.location}. Severity level ${data.severity}. Immediate action is required. Please contact ${data.contactNumber} for more information.`
    },

    disease_outbreak_notification: {
      sms: `🦠 DISEASE OUTBREAK ALERT\nDisease: ${data.disease}\nCases: ${data.caseCount}\nLocation: ${data.location}\nFollow prevention protocols. More info: ${data.infoUrl}`,
      
      email: {
        subject: `🦠 Disease Outbreak Alert - ${data.disease}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #fd7e14; color: white; padding: 20px; text-align: center;">
              <h1>🦠 DISEASE OUTBREAK ALERT</h1>
            </div>
            <div style="padding: 20px; background-color: #f8f9fa;">
              <h2>${data.disease} Outbreak</h2>
              <p><strong>Confirmed Cases:</strong> ${data.caseCount}</p>
              <p><strong>Location:</strong> ${data.location}</p>
              <p><strong>First Case Reported:</strong> ${data.firstCaseDate}</p>
              <p><strong>Risk Level:</strong> ${data.riskLevel}</p>
              
              <div style="background-color: #d1ecf1; padding: 15px; margin: 20px 0; border-left: 4px solid #bee5eb;">
                <h3>Prevention Measures:</h3>
                <ul>
                  ${data.preventionMeasures?.map(measure => `<li>${measure}</li>`).join('') || '<li>Follow standard health protocols</li>'}
                </ul>
              </div>
              
              <p><strong>More Information:</strong> <a href="${data.infoUrl}">${data.infoUrl}</a></p>
              <p style="font-size: 12px; color: #6c757d;">Alert issued at: ${new Date().toLocaleString()}</p>
            </div>
          </div>
        `
      },
      
      push: {
        title: '🦠 Disease Outbreak',
        body: `${data.disease} outbreak: ${data.caseCount} cases in ${data.location}. Follow protocols.`,
        data: { alertType: 'disease_outbreak', disease: data.disease }
      }
    },

    water_contamination_warning: {
      sms: `💧 WATER CONTAMINATION ALERT\nSource: ${data.waterSource}\nContaminant: ${data.contaminant}\nArea: ${data.affectedArea}\n⚠️ DO NOT USE for drinking. Boil water or use alternatives.`,
      
      email: {
        subject: `💧 Water Contamination Warning - ${data.waterSource}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #17a2b8; color: white; padding: 20px; text-align: center;">
              <h1>💧 WATER CONTAMINATION WARNING</h1>
            </div>
            <div style="padding: 20px; background-color: #f8f9fa;">
              <h2>Water Source Contaminated</h2>
              <p><strong>Source:</strong> ${data.waterSource}</p>
              <p><strong>Contaminant:</strong> ${data.contaminant}</p>
              <p><strong>Affected Area:</strong> ${data.affectedArea}</p>
              <p><strong>Test Date:</strong> ${data.testDate}</p>
              
              <div style="background-color: #f8d7da; padding: 15px; margin: 20px 0; border-left: 4px solid #dc3545;">
                <h3>⚠️ IMPORTANT SAFETY MEASURES:</h3>
                <ul>
                  <li>DO NOT use this water for drinking</li>
                  <li>DO NOT use for cooking</li>
                  <li>Boil water for at least 5 minutes before use</li>
                  <li>Use bottled water for drinking</li>
                  <li>Seek alternative water sources</li>
                </ul>
              </div>
              
              <p><strong>Expected Resolution:</strong> ${data.expectedResolution}</p>
              <p style="font-size: 12px; color: #6c757d;">Warning issued at: ${new Date().toLocaleString()}</p>
            </div>
          </div>
        `
      },
      
      push: {
        title: '💧 Water Contamination',
        body: `${data.waterSource} contaminated with ${data.contaminant}. Do not use for drinking!`,
        data: { alertType: 'water_contamination', source: data.waterSource }
      }
    },

    vaccination_reminder: {
      sms: `💉 VACCINATION REMINDER\nChild: ${data.childName}\nVaccine: ${data.vaccineName}\nDue: ${data.dueDate}\nLocation: ${data.location}\nTime: ${data.time}`,
      
      email: {
        subject: `💉 Vaccination Reminder - ${data.childName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #28a745; color: white; padding: 20px; text-align: center;">
              <h1>💉 VACCINATION REMINDER</h1>
            </div>
            <div style="padding: 20px; background-color: #f8f9fa;">
              <h2>Vaccination Due for ${data.childName}</h2>
              <p><strong>Vaccine:</strong> ${data.vaccineName}</p>
              <p><strong>Due Date:</strong> ${data.dueDate}</p>
              <p><strong>Location:</strong> ${data.location}</p>
              <p><strong>Time:</strong> ${data.time}</p>
              <p><strong>Contact Person:</strong> ${data.contactPerson}</p>
              
              <div style="background-color: #d4edda; padding: 15px; margin: 20px 0; border-left: 4px solid #28a745;">
                <h3>What to bring:</h3>
                <ul>
                  <li>Child's vaccination card</li>
                  <li>Identity proof</li>
                  <li>Previous vaccination records</li>
                </ul>
              </div>
              
              <p style="font-size: 12px; color: #6c757d;">Reminder sent at: ${new Date().toLocaleString()}</p>
            </div>
          </div>
        `
      },
      
      push: {
        title: '💉 Vaccination Due',
        body: `${data.vaccineName} vaccination due for ${data.childName} on ${data.dueDate}`,
        data: { alertType: 'vaccination_reminder', childId: data.childId }
      }
    },

    appointment_notification: {
      sms: `📅 APPOINTMENT REMINDER\nPatient: ${data.patientName}\nDoctor: ${data.doctorName}\nDate: ${data.appointmentDate}\nTime: ${data.appointmentTime}\nLocation: ${data.location}`,
      
      push: {
        title: '📅 Appointment Reminder',
        body: `Appointment with ${data.doctorName} on ${data.appointmentDate} at ${data.appointmentTime}`,
        data: { alertType: 'appointment', appointmentId: data.appointmentId }
      }
    },

    system_alert: {
      sms: `🔧 SYSTEM ALERT: ${data.alertMessage}. Priority: ${data.priority}. Contact support if needed.`,
      
      email: {
        subject: `🔧 System Alert - ${data.priority} Priority`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #6c757d; color: white; padding: 20px; text-align: center;">
              <h1>🔧 SYSTEM ALERT</h1>
            </div>
            <div style="padding: 20px; background-color: #f8f9fa;">
              <h2>System Notification</h2>
              <p><strong>Alert:</strong> ${data.alertMessage}</p>
              <p><strong>Priority:</strong> ${data.priority}</p>
              <p><strong>System:</strong> ${data.systemName}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              
              ${data.actionRequired ? `
                <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-left: 4px solid #ffc107;">
                  <strong>Action Required:</strong> ${data.actionRequired}
                </div>
              ` : ''}
              
              <p>Contact system support if you need assistance.</p>
            </div>
          </div>
        `
      }
    },

    administrative_notification: {
      sms: `📋 ADMIN NOTICE: ${data.message}. From: ${data.sender}. Priority: ${data.priority}.`,
      
      email: {
        subject: `📋 Administrative Notification`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #007bff; color: white; padding: 20px; text-align: center;">
              <h1>📋 ADMINISTRATIVE NOTIFICATION</h1>
            </div>
            <div style="padding: 20px; background-color: #f8f9fa;">
              <h2>${data.title}</h2>
              <p>${data.message}</p>
              <p><strong>From:</strong> ${data.sender}</p>
              <p><strong>Priority:</strong> ${data.priority}</p>
              
              ${data.deadline ? `
                <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-left: 4px solid #ffc107;">
                  <strong>Deadline:</strong> ${data.deadline}
                </div>
              ` : ''}
              
              <p style="font-size: 12px; color: #6c757d;">Sent at: ${new Date().toLocaleString()}</p>
            </div>
          </div>
        `
      }
    }
  };

  return templates[alertType] || {
    sms: data.message || 'Health surveillance notification',
    email: {
      subject: 'Health Surveillance Notification',
      html: `<p>${data.message || 'You have received a health surveillance notification.'}</p>`
    },
    push: {
      title: 'Health Notification',
      body: data.message || 'You have received a notification'
    }
  };
};

// =============================================================================
// TEMPLATE PERSONALIZATION
// =============================================================================

/**
 * Personalize notification template with user and location data
 * @param {Object} template - Base template
 * @param {Object} user - User information
 * @param {Object} locationData - Location specific information
 * @returns {Object} Personalized template
 */
const personalizeTemplate = (template, user = {}, locationData = {}) => {
  const personalizedTemplate = JSON.parse(JSON.stringify(template)); // Deep clone
  
  // User personalization
  const userName = user.personalInfo?.firstName || user.personalInfo?.localName || 'User';
  if (userName && userName !== 'User') {
    // Add user greeting to messages
    if (personalizedTemplate.sms) {
      personalizedTemplate.sms = `Hello ${userName},\n\n${personalizedTemplate.sms}`;
    }
    
    if (personalizedTemplate.email && personalizedTemplate.email.html) {
      personalizedTemplate.email.html = personalizedTemplate.email.html.replace(
        '<div style="padding: 20px; background-color: #f8f9fa;">',
        `<div style="padding: 20px; background-color: #f8f9fa;"><p>Dear ${userName},</p>`
      );
    }
  }
  
  // Location personalization
  if (locationData.village) {
    const locationInfo = `Village: ${locationData.village}${locationData.block ? `, Block: ${locationData.block}` : ''}${locationData.district ? `, District: ${locationData.district}` : ''}`;
    
    // Add location context where relevant
    if (personalizedTemplate.sms && !personalizedTemplate.sms.includes('Location:')) {
      personalizedTemplate.sms += `\n\nYour area: ${locationInfo}`;
    }
  }
  
  // Role-specific messaging
  const userRole = user.roleInfo?.role;
  if (userRole) {
    const roleSpecificMessages = {
      asha_worker: 'As an ASHA worker, please take immediate action.',
      medical_officer: 'Medical officer review required.',
      block_coordinator: 'Block coordinator oversight needed.',
      district_coordinator: 'District coordinator attention required.'
    };
    
    if (roleSpecificMessages[userRole]) {
      if (personalizedTemplate.sms) {
        personalizedTemplate.sms += `\n\n${roleSpecificMessages[userRole]}`;
      }
    }
  }
  
  return personalizedTemplate;
};

// =============================================================================
// DELIVERY TRACKING AND STATUS
// =============================================================================

/**
 * Update delivery status for an alert
 * @param {String} alertId - Alert ID
 * @param {String} recipientId - Recipient user ID
 * @param {String} channel - Delivery channel
 * @param {String} status - Delivery status
 * @param {String} errorMessage - Error message if failed
 * @returns {Promise<Boolean>} Success status
 */
const updateDeliveryStatus = async (alertId, recipientId, channel, status, errorMessage = null) => {
  try {
    const alert = await AlertSystem.findOne({ alertId: alertId });
    if (!alert) {
      throw new Error('Alert not found');
    }
    
    await alert.updateDeliveryStatus(recipientId, channel, status, errorMessage);
    return true;
  } catch (error) {
    console.error('Error updating delivery status:', error);
    return false;
  }
};

/**
 * Track delivery confirmation
 * @param {String} messageId - External message ID
 * @param {String} status - Confirmation status
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Boolean>} Success status
 */
const trackDeliveryConfirmation = async (messageId, status, metadata = {}) => {
  try {
    // In a real implementation, you would:
    // 1. Find the alert/recipient by messageId
    // 2. Update the delivery status
    // 3. Log the confirmation
    
    console.log(`Delivery confirmation for ${messageId}: ${status}`, metadata);
    return true;
  } catch (error) {
    console.error('Error tracking delivery confirmation:', error);
    return false;
  }
};

// =============================================================================
// BATCH NOTIFICATION PROCESSING
// =============================================================================

/**
 * Send notifications to multiple recipients across multiple channels
 * @param {Array} recipients - Array of recipient objects
 * @param {Object} notificationContent - Content for different channels
 * @param {Object} options - Delivery options
 * @returns {Promise<Array>} Array of delivery results
 */
const sendBatchNotifications = async (recipients, notificationContent, options = {}) => {
  const results = [];
  const { priority = 'normal', rateLimitDelay = 100 } = options;
  
  for (const recipient of recipients) {
    const recipientResults = [];
    
    // Send to each preferred channel
    for (const channel of recipient.channels || ['sms']) {
      try {
        let deliveryResult;
        
        // Add rate limiting delay
        if (rateLimitDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, rateLimitDelay));
        }
        
        switch (channel) {
          case 'sms':
            const phone = recipient.authentication?.phone || recipient.phoneNumber;
            if (phone && notificationContent.sms) {
              deliveryResult = await sendSMS(phone, notificationContent.sms);
            }
            break;
            
          case 'email':
            const email = recipient.authentication?.email || recipient.email;
            if (email && notificationContent.email) {
              deliveryResult = await sendEmail(
                email,
                notificationContent.email.subject,
                notificationContent.email.html
              );
            }
            break;
            
          case 'push_notification':
            const deviceToken = recipient.deviceInfo?.fcmToken || recipient.deviceToken;
            if (deviceToken && notificationContent.push) {
              deliveryResult = await sendPushNotification(
                deviceToken,
                notificationContent.push.title,
                notificationContent.push.body,
                notificationContent.push.data
              );
            }
            break;
            
          case 'whatsapp':
            const whatsappPhone = recipient.authentication?.phone || recipient.phoneNumber;
            if (whatsappPhone && notificationContent.whatsapp) {
              deliveryResult = await sendWhatsApp(whatsappPhone, notificationContent.whatsapp);
            }
            break;
            
          case 'voice_call':
            const voicePhone = recipient.authentication?.phone || recipient.phoneNumber;
            if (voicePhone && notificationContent.voice) {
              deliveryResult = await makeVoiceCall(voicePhone, notificationContent.voice);
            }
            break;
        }
        
        if (deliveryResult) {
          deliveryResult.recipientId = recipient.userId;
          deliveryResult.channel = channel;
          recipientResults.push(deliveryResult);
        }
      } catch (error) {
        recipientResults.push({
          success: false,
          error: error.message,
          recipientId: recipient.userId,
          channel: channel,
          timestamp: new Date()
        });
      }
    }
    
    results.push({
      recipientId: recipient.userId,
      results: recipientResults,
      totalChannels: recipient.channels?.length || 1,
      successfulDeliveries: recipientResults.filter(r => r.success).length
    });
  }
  
  return results;
};

// =============================================================================
// NOTIFICATION PREFERENCES MANAGEMENT
// =============================================================================

/**
 * Get user notification preferences
 * @param {String} userId - User ID
 * @returns {Promise<Object>} User notification preferences
 */
const getUserNotificationPreferences = async (userId) => {
  try {
    const User = mongoose.model('User');
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Default preferences if none set
    const defaultPreferences = {
      channels: ['sms', 'email'],
      doNotDisturb: {
        enabled: false,
        startTime: '22:00',
        endTime: '06:00'
      },
      alertTypes: {
        health_emergency: { channels: ['sms', 'voice_call'], immediate: true },
        disease_outbreak_notification: { channels: ['sms', 'email'], immediate: true },
        water_contamination_warning: { channels: ['sms', 'whatsapp'], immediate: true },
        vaccination_reminder: { channels: ['sms'], immediate: false },
        appointment_notification: { channels: ['sms', 'push_notification'], immediate: false },
        system_alert: { channels: ['email'], immediate: false },
        administrative_notification: { channels: ['email'], immediate: false }
      },
      language: user.preferredLanguage || 'en',
      timezone: user.timezone || 'Asia/Kolkata'
    };
    
    return user.preferences?.notifications || defaultPreferences;
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return null;
  }
};

/**
 * Validate notification preferences
 * @param {Object} preferences - Notification preferences to validate
 * @returns {Object} Validation result
 */
const validateNotificationPreferences = (preferences) => {
  const validChannels = ['sms', 'email', 'push_notification', 'whatsapp', 'voice_call'];
  const validAlertTypes = [
    'health_emergency', 'disease_outbreak_notification', 'water_contamination_warning',
    'vaccination_reminder', 'appointment_notification', 'system_alert', 'administrative_notification'
  ];
  
  const errors = [];
  
  // Validate channels
  if (preferences.channels) {
    const invalidChannels = preferences.channels.filter(ch => !validChannels.includes(ch));
    if (invalidChannels.length > 0) {
      errors.push(`Invalid channels: ${invalidChannels.join(', ')}`);
    }
  }
  
  // Validate alert type preferences
  if (preferences.alertTypes) {
    Object.keys(preferences.alertTypes).forEach(alertType => {
      if (!validAlertTypes.includes(alertType)) {
        errors.push(`Invalid alert type: ${alertType}`);
      }
    });
  }
  
  // Validate do not disturb times
  if (preferences.doNotDisturb) {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (preferences.doNotDisturb.startTime && !timeRegex.test(preferences.doNotDisturb.startTime)) {
      errors.push('Invalid do not disturb start time format');
    }
    if (preferences.doNotDisturb.endTime && !timeRegex.test(preferences.doNotDisturb.endTime)) {
      errors.push('Invalid do not disturb end time format');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

// =============================================================================
// DELIVERY SCHEDULING AND OPTIMIZATION
// =============================================================================

/**
 * Optimize delivery timing based on user preferences
 * @param {Array} recipients - Array of recipients
 * @param {Object} alertData - Alert data including priority
 * @returns {Array} Recipients with optimized delivery times
 */
const optimizeDeliveryTiming = (recipients, alertData) => {
  const now = new Date();
  
  return recipients.map(recipient => {
    const preferences = recipient.preferences?.notifications || {};
    const doNotDisturb = preferences.doNotDisturb || {};
    
    let deliveryTime = now;
    
    // For non-emergency alerts, respect do not disturb settings
    if (alertData.priority !== 'emergency' && doNotDisturb.enabled) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour * 60 + currentMinute;
      
      const [startHour, startMinute] = (doNotDisturb.startTime || '22:00').split(':').map(Number);
      const [endHour, endMinute] = (doNotDisturb.endTime || '06:00').split(':').map(Number);
      
      const startTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;
      
      // Check if current time is in do not disturb period
      const isInDoNotDisturb = (startTime > endTime) 
        ? (currentTime >= startTime || currentTime <= endTime)  // Spans midnight
        : (currentTime >= startTime && currentTime <= endTime); // Same day
      
      if (isInDoNotDisturb) {
        // Schedule for next allowed time
        deliveryTime = new Date(now);
        deliveryTime.setHours(endHour, endMinute, 0, 0);
        
        // If end time is tomorrow
        if (startTime > endTime && currentTime >= startTime) {
          deliveryTime.setDate(deliveryTime.getDate() + 1);
        }
      }
    }
    
  return {
    ...recipient,
    scheduledDeliveryTime: deliveryTime
  };
});
};

/**
 * Generic notification sender for simple alert data
 * @param {Object} alertData - Alert/notification data
 * @param {string} alertData.type - Type of alert
 * @param {string} alertData.priority - Priority level
 * @param {string} alertData.message - Message content
 * @param {Object} alertData.location - Location information
 * @returns {Promise<Object>} Notification result
 */
const sendNotification = async (alertData) => {
  try {
    // Log the notification for now (can be enhanced with actual delivery)
    console.log(`Notification: [${alertData.priority?.toUpperCase() || 'INFO'}] ${alertData.message}`);
    
    // Mock successful delivery
    return {
      success: true,
      notificationId: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'sent',
      timestamp: new Date(),
      alertData: alertData
    };
  } catch (error) {
    console.error('Error sending notification:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date(),
      alertData: alertData
    };
  }
};

// =============================================================================
// INTEGRATION HOOKS
// =============================================================================

/**
 * Handle automatic notification triggering from AlertSystem
 * @param {String} alertId - Alert system ID
 * @returns {Promise<Object>} Notification sending result
 */
const handleAlertSystemIntegration = async (alertId) => {
  try {
    const alert = await AlertSystem.findOne({ alertId: alertId })
      .populate('recipients.userId')
      .populate('source.sourceId');
    
    if (!alert) {
      throw new Error('Alert not found');
    }
    
    // Generate notification content
    const templateData = {
      alertId: alert.alertId,
      title: alert.title,
      message: alert.messageContent,
      severity: alert.alertLevel,
      location: 'Health surveillance area', // This should come from populated location data
      alertType: alert.alertType
    };
    
    const notificationContent = getNotificationTemplate(alert.alertType, templateData);
    
    // Prepare recipients
    const recipients = alert.recipients.map(recipient => ({
      userId: recipient.userId._id,
      phoneNumber: recipient.userId.authentication?.phone,
      email: recipient.userId.authentication?.email,
      deviceToken: recipient.userId.deviceInfo?.fcmToken,
      channels: recipient.deliveryChannels,
      notificationPreferences: recipient.userId.preferences?.notifications
    }));
    
    // Send notifications
    const deliveryResults = await sendBatchNotifications(recipients, notificationContent, {
      priority: alert.priority.level,
      rateLimitDelay: alert.alertLevel === 'emergency' ? 0 : 100
    });
    
    // Update alert with delivery statistics
    const totalRecipients = recipients.length;
    const successfulDeliveries = deliveryResults.reduce((sum, result) => sum + result.successfulDeliveries, 0);
    
    alert.delivery.deliveryStatus.totalRecipients = totalRecipients;
    alert.delivery.deliveryStatus.sent = successfulDeliveries;
    await alert.save();
    
    return {
      success: true,
      alertId: alertId,
      totalRecipients: totalRecipients,
      successfulDeliveries: successfulDeliveries,
      deliveryRate: totalRecipients > 0 ? (successfulDeliveries / totalRecipients * 100).toFixed(2) : 0
    };
  } catch (error) {
    console.error('Error in alert system integration:', error);
    return {
      success: false,
      error: error.message,
      alertId: alertId
    };
  }
};

// =============================================================================
// ANALYTICS AND REPORTING
// =============================================================================

/**
 * Get notification delivery analytics
 * @param {Object} filters - Analytics filters
 * @returns {Promise<Object>} Analytics data
 */
const getNotificationAnalytics = async (filters = {}) => {
  try {
    // This would typically query a notification logs database
    // For now, we'll return mock analytics data
    
    const mockAnalytics = {
      totalNotificationsSent: 1250,
      deliveryRate: 94.5,
      channelPerformance: {
        sms: { sent: 800, delivered: 760, rate: 95.0 },
        email: { sent: 300, delivered: 285, rate: 95.0 },
        push_notification: { sent: 200, delivered: 180, rate: 90.0 },
        whatsapp: { sent: 150, delivered: 142, rate: 94.7 },
        voice_call: { sent: 50, delivered: 45, rate: 90.0 }
      },
      alertTypePerformance: {
        health_emergency: { sent: 45, avgResponseTime: 2.3 }, // minutes
        disease_outbreak_notification: { sent: 12, avgResponseTime: 15.2 },
        water_contamination_warning: { sent: 8, avgResponseTime: 8.7 },
        vaccination_reminder: { sent: 450, avgResponseTime: 120.5 },
        appointment_notification: { sent: 380, avgResponseTime: 45.8 }
      },
      userEngagement: {
        readRate: 78.2,
        responseRate: 34.5,
        optOutRate: 1.8
      },
      costAnalysis: {
        totalCost: 125.50, // in currency units
        costPerNotification: 0.10,
        costByChannel: {
          sms: 40.00,
          email: 15.00,
          push_notification: 0.00,
          whatsapp: 22.50,
          voice_call: 48.00
        }
      },
      timeframe: filters.timeframe || '30 days',
      generatedAt: new Date()
    };
    
    return mockAnalytics;
  } catch (error) {
    console.error('Error generating notification analytics:', error);
    return null;
  }
};

// =============================================================================
// EXPORTS
// =============================================================================

export {
  // Channel Handlers
  sendSMS,
  sendEmail,
  sendPushNotification,
  sendWhatsApp,
  makeVoiceCall,
  
  // Template Management
  getNotificationTemplate,
  personalizeTemplate,
  
  // Delivery Management
  updateDeliveryStatus,
  trackDeliveryConfirmation,
  sendBatchNotifications,
  
  // Preferences Management
  getUserNotificationPreferences,
  validateNotificationPreferences,
  
  // Optimization and Scheduling
  optimizeDeliveryTiming,
  
  // Integration
  handleAlertSystemIntegration,
  sendNotification,
  
  // Analytics
  getNotificationAnalytics
};