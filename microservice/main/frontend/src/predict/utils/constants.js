// Constants and Sample Data for Water Quality Testing

// Water Quality Parameter Ranges (for reference)
export const PARAMETER_RANGES = {
  ph: { min: 0, max: 14, safe: [6.5, 8.5], unit: '' },
  hardness: { min: 0, max: 1000, safe: [60, 300], unit: 'mg/L' },
  solids: { min: 0, max: 100000, safe: [0, 500], unit: 'ppm' },
  chloramines: { min: 0, max: 20, safe: [0, 4], unit: 'ppm' },
  sulfate: { min: 0, max: 1000, safe: [0, 250], unit: 'mg/L' },
  conductivity: { min: 0, max: 2000, safe: [0, 800], unit: 'μS/cm' },
  organic_carbon: { min: 0, max: 50, safe: [0, 2], unit: 'ppm' },
  trihalomethanes: { min: 0, max: 200, safe: [0, 80], unit: 'μg/L' },
  turbidity: { min: 0, max: 20, safe: [0, 4], unit: 'NTU' }
};

// Water Parameters for Form Generation
export const WATER_PARAMETERS = [
  {
    name: 'ph',
    label: 'pH Level',
    unit: '',
    min: 0,
    max: 14,
    step: 0.1,
    placeholder: '6.5 - 8.5 (optimal)',
    description: 'Measure of how acidic or basic the water is'
  },
  {
    name: 'hardness',
    label: 'Water Hardness',
    unit: 'mg/L',
    min: 0,
    max: 1000,
    step: 1,
    placeholder: '60 - 300 (moderate)',
    description: 'Amount of dissolved calcium and magnesium'
  },
  {
    name: 'solids',
    label: 'Total Dissolved Solids',
    unit: 'ppm',
    min: 0,
    max: 100000,
    step: 1,
    placeholder: '0 - 500 (acceptable)',
    description: 'Total amount of minerals, salts, and metals dissolved'
  },
  {
    name: 'chloramines',
    label: 'Chloramines',
    unit: 'ppm',
    min: 0,
    max: 20,
    step: 0.1,
    placeholder: '0 - 4 (safe)',
    description: 'Disinfectant used in water treatment'
  },
  {
    name: 'sulfate',
    label: 'Sulfate',
    unit: 'mg/L',
    min: 0,
    max: 1000,
    step: 1,
    placeholder: '0 - 250 (acceptable)',
    description: 'Naturally occurring mineral in water'
  },
  {
    name: 'conductivity',
    label: 'Electrical Conductivity',
    unit: 'μS/cm',
    min: 0,
    max: 2000,
    step: 1,
    placeholder: '0 - 800 (normal)',
    description: 'Measure of water\'s ability to conduct electrical current'
  },
  {
    name: 'organic_carbon',
    label: 'Total Organic Carbon',
    unit: 'ppm',
    min: 0,
    max: 50,
    step: 0.1,
    placeholder: '0 - 2 (low)',
    description: 'Amount of carbon in organic compounds'
  },
  {
    name: 'trihalomethanes',
    label: 'Trihalomethanes',
    unit: 'μg/L',
    min: 0,
    max: 200,
    step: 0.1,
    placeholder: '0 - 80 (safe)',
    description: 'Chemical compounds formed during water chlorination'
  },
  {
    name: 'turbidity',
    label: 'Turbidity',
    unit: 'NTU',
    min: 0,
    max: 20,
    step: 0.1,
    placeholder: '0 - 4 (clear)',
    description: 'Cloudiness or haziness of water'
  }
];

// Sample Data Sets for Testing
export const SAMPLE_DATA = {
  // Good Water Quality Samples
  goodWater: [
    {
      name: "💧 Excellent Drinking Water",
      description: "High-quality drinking water with optimal parameters",
      data: {
        ph: 7.2,
        hardness: 180.0,
        solids: 15000.0,
        chloramines: 3.5,
        sulfate: 200.0,
        conductivity: 350.0,
        organic_carbon: 1.8,
        trihalomethanes: 45.0,
        turbidity: 2.1
      },
      expectedResult: "Safe to drink",
      confidence: "High"
    },
    {
      name: "🌊 Clean Spring Water",
      description: "Natural spring water with balanced minerals",
      data: {
        ph: 7.5,
        hardness: 220.0,
        solids: 18000.0,
        chloramines: 4.0,
        sulfate: 180.0,
        conductivity: 400.0,
        organic_carbon: 1.2,
        trihalomethanes: 35.0,
        turbidity: 1.8
      },
      expectedResult: "Safe to drink",
      confidence: "High"
    },
    {
      name: "💎 Premium Filtered Water",
      description: "Well-filtered water with low contaminants",
      data: {
        ph: 6.8,
        hardness: 150.0,
        solids: 12000.0,
        chloramines: 2.8,
        sulfate: 150.0,
        conductivity: 280.0,
        organic_carbon: 0.9,
        trihalomethanes: 25.0,
        turbidity: 1.2
      },
      expectedResult: "Safe to drink",
      confidence: "Very High"
    },
    {
      name: "🏔️ Mountain Water",
      description: "Pure mountain water with minimal processing",
      data: {
        ph: 7.8,
        hardness: 90.0,
        solids: 8000.0,
        chloramines: 1.5,
        sulfate: 80.0,
        conductivity: 200.0,
        organic_carbon: 0.5,
        trihalomethanes: 15.0,
        turbidity: 0.8
      },
      expectedResult: "Safe to drink",
      confidence: "Very High"
    }
  ],

  // Bad Water Quality Samples
  badWater: [
    {
      name: "⚠️ Contaminated Water",
      description: "High contamination with multiple parameter violations",
      data: {
        ph: 4.2,
        hardness: 450.0,
        solids: 45000.0,
        chloramines: 12.8,
        sulfate: 650.0,
        conductivity: 1200.0,
        organic_carbon: 18.5,
        trihalomethanes: 145.0,
        turbidity: 8.7
      },
      expectedResult: "Not safe to drink",
      confidence: "High"
    },
    {
      name: "🏭 Industrial Runoff",
      description: "Water contaminated with industrial pollutants",
      data: {
        ph: 9.8,
        hardness: 380.0,
        solids: 38000.0,
        chloramines: 15.2,
        sulfate: 580.0,
        conductivity: 950.0,
        organic_carbon: 22.1,
        trihalomethanes: 125.0,
        turbidity: 7.3
      },
      expectedResult: "Not safe to drink",
      confidence: "High"
    },
    {
      name: "🌫️ Highly Turbid Water",
      description: "Water with excessive turbidity and organic content",
      data: {
        ph: 8.9,
        hardness: 320.0,
        solids: 32000.0,
        chloramines: 9.5,
        sulfate: 420.0,
        conductivity: 780.0,
        organic_carbon: 15.8,
        trihalomethanes: 98.0,
        turbidity: 12.5
      },
      expectedResult: "Not safe to drink",
      confidence: "Medium"
    },
    {
      name: "💀 Severely Polluted Water",
      description: "Extremely contaminated water with toxic levels",
      data: {
        ph: 3.5,
        hardness: 520.0,
        solids: 55000.0,
        chloramines: 18.7,
        sulfate: 750.0,
        conductivity: 1450.0,
        organic_carbon: 28.9,
        trihalomethanes: 175.0,
        turbidity: 15.2
      },
      expectedResult: "Not safe to drink",
      confidence: "Very High"
    }
  ],

  // Borderline Cases
  borderlineCases: [
    {
      name: "🤔 Marginal Quality Water",
      description: "Water quality on the edge - could go either way",
      data: {
        ph: 6.2,
        hardness: 280.0,
        solids: 25000.0,
        chloramines: 6.8,
        sulfate: 320.0,
        conductivity: 520.0,
        organic_carbon: 8.2,
        trihalomethanes: 78.0,
        turbidity: 4.8
      },
      expectedResult: "Uncertain",
      confidence: "Low to Medium"
    },
    {
      name: "⚖️ Questionable Water",
      description: "Some parameters acceptable, others concerning",
      data: {
        ph: 8.7,
        hardness: 195.0,
        solids: 28000.0,
        chloramines: 7.2,
        sulfate: 380.0,
        conductivity: 620.0,
        organic_carbon: 6.5,
        trihalomethanes: 85.0,
        turbidity: 5.1
      },
      expectedResult: "Uncertain",
      confidence: "Medium"
    }
  ]
};

// Quick Access Sample Data (for buttons)
export const QUICK_SAMPLES = {
  excellent: SAMPLE_DATA.goodWater[0],
  good: SAMPLE_DATA.goodWater[1],
  contaminated: SAMPLE_DATA.badWater[0],
  polluted: SAMPLE_DATA.badWater[1],
  borderline: SAMPLE_DATA.borderlineCases[0]
};

// Parameter Information for Tooltips
export const PARAMETER_INFO = {
  ph: {
    name: "pH Level",
    description: "Measure of how acidic or basic the water is",
    safeRange: "6.5 - 8.5",
    effects: {
      low: "Acidic water can corrode pipes and leach metals",
      high: "Basic water can have a bitter taste and cause scaling"
    }
  },
  hardness: {
    name: "Water Hardness",
    description: "Amount of dissolved calcium and magnesium",
    safeRange: "60 - 300 mg/L",
    effects: {
      low: "Very soft water may lack essential minerals",
      high: "Hard water causes scaling and soap scum"
    }
  },
  solids: {
    name: "Total Dissolved Solids",
    description: "Total amount of minerals, salts, and metals dissolved in water",
    safeRange: "0 - 500 ppm",
    effects: {
      low: "Very pure water may lack minerals",
      high: "High TDS can affect taste and may indicate contamination"
    }
  },
  chloramines: {
    name: "Chloramines",
    description: "Disinfectant used in water treatment",
    safeRange: "0 - 4 ppm",
    effects: {
      low: "May not provide adequate disinfection",
      high: "Can cause taste/odor issues and health concerns"
    }
  },
  sulfate: {
    name: "Sulfate",
    description: "Naturally occurring mineral in water",
    safeRange: "0 - 250 mg/L",
    effects: {
      low: "Generally not a concern",
      high: "Can cause digestive issues and laxative effects"
    }
  },
  conductivity: {
    name: "Electrical Conductivity",
    description: "Measure of water's ability to conduct electrical current",
    safeRange: "0 - 800 μS/cm",
    effects: {
      low: "May indicate very pure water",
      high: "Indicates high dissolved solids content"
    }
  },
  organic_carbon: {
    name: "Total Organic Carbon",
    description: "Amount of carbon in organic compounds",
    safeRange: "0 - 2 ppm",
    effects: {
      low: "Good - minimal organic contamination",
      high: "May indicate pollution or microbial contamination"
    }
  },
  trihalomethanes: {
    name: "Trihalomethanes",
    description: "Chemical compounds formed during water chlorination",
    safeRange: "0 - 80 μg/L",
    effects: {
      low: "Minimal health risk",
      high: "Potential carcinogen with long-term exposure"
    }
  },
  turbidity: {
    name: "Turbidity",
    description: "Cloudiness or haziness of water",
    safeRange: "0 - 4 NTU",
    effects: {
      low: "Clear water with good filtration",
      high: "May harbor pathogens and affect disinfection"
    }
  }
};

// Test Scenarios for Comprehensive Testing
export const TEST_SCENARIOS = [
  {
    name: "🧪 Complete Test Suite",
    description: "Run all sample data through the model",
    samples: [
      ...SAMPLE_DATA.goodWater,
      ...SAMPLE_DATA.badWater,
      ...SAMPLE_DATA.borderlineCases
    ]
  },
  {
    name: "✅ Safe Water Tests",
    description: "Test various safe water samples",
    samples: SAMPLE_DATA.goodWater
  },
  {
    name: "⚠️ Unsafe Water Tests",
    description: "Test contaminated water samples",
    samples: SAMPLE_DATA.badWater
  },
  {
    name: "🤔 Edge Cases",
    description: "Test borderline water quality samples",
    samples: SAMPLE_DATA.borderlineCases
  }
];

// Default/Starting Values
export const DEFAULT_VALUES = {
  ph: 7.0,
  hardness: 200.0,
  solids: 20000.0,
  chloramines: 7.0,
  sulfate: 300.0,
  conductivity: 400.0,
  organic_carbon: 15.0,
  trihalomethanes: 70.0,
  turbidity: 4.0
};

// Export everything as default for easy importing
export default {
  PARAMETER_RANGES,
  SAMPLE_DATA,
  QUICK_SAMPLES,
  PARAMETER_INFO,
  TEST_SCENARIOS,
  DEFAULT_VALUES
};