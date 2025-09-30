import React from 'react';
import WaterTestForm from './WaterTestForm';

/**
 * Create page wrapper for Water Test Form
 * This ensures clean separation between create and edit modes
 */
const WaterTestCreate = () => {
  return <WaterTestForm />;
};

export default WaterTestCreate;