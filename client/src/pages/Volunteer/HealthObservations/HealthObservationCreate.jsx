import React from 'react';
import HealthObservationForm from './HealthObservationForm';

/**
 * Wrapper component for creating new health observations
 * Provides a clean separation for the create mode
 */
const HealthObservationCreate = () => {
  return <HealthObservationForm />;
};

export default HealthObservationCreate;