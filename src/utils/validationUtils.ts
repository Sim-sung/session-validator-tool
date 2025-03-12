
import { ValidationRule, MetricCondition, MetricOperator } from '@/types/validation';
import { Session } from '@/context/SessionContext';

// Helper function to safely get a nested property from an object
const getNestedProperty = (obj: any, path: string): any => {
  if (!obj || !path) return null;
  
  const keys = path.split('.');
  let value = obj;
  
  for (const key of keys) {
    if (value === null || value === undefined) return null;
    value = value[key];
  }
  
  return value;
};

// Get any field from the session object using the field path
const getFieldValue = (session: Session, field: string): any => {
  // Handle special case fields that require transformations
  switch (field) {
    // Performance Metrics
    case 'fps.min':
      return session.fpsMin ?? null;
    case 'fps.max':
      return session.fpsMax ?? null;
    case 'fps.median':
      return session.fpsMedian ?? null;
    case 'fps.stability':
      return session.fpsStability ?? null;
    case 'fps.onePercentLow':
      return session.fpsOnePercentLow ?? null;
    
    // CPU Usage Metrics
    case 'cpu.min':
      return session.cpuUsageMin ?? null;
    case 'cpu.max':
      return session.cpuUsageMax ?? null;
    case 'cpu.median':
      return session.cpuUsageMedian ?? null;
    case 'cpu.avg':
      return session.cpuUsageAvg ?? null;
    case 'cpu.total':
      return session.totalCpuUsageAvg ?? null;
    
    // GPU Usage Metrics
    case 'gpu.min':
      return session.gpuUsageMin ?? null;
    case 'gpu.max':
      return session.gpuUsageMax ?? null;
    case 'gpu.median':
      return session.gpuUsageMedian ?? null;
    case 'gpu.avg':
      return session.gpuUsageAvg ?? null;
    
    // Memory Usage Metrics
    case 'memory.min':
      return session.memUsageMin ?? null;
    case 'memory.max':
      return session.memUsageMax ?? null;
    case 'memory.median':
      return session.memUsageMedian ?? null;
    case 'memory.avg':
      return session.memUsageAvg ?? null;
    
    // Android Memory Metrics
    case 'androidMemory.min':
      return session.androidMemUsageMin ?? null;
    case 'androidMemory.max':
      return session.androidMemUsageMax ?? null;
    case 'androidMemory.median':
      return session.androidMemUsageMedian ?? null;
    case 'androidMemory.avg':
      return session.androidMemUsageAvg ?? null;
    
    // Battery Metrics
    case 'battery.first':
      return session.firstBat ?? null;
    case 'battery.last':
      return session.lastBat ?? null;
    case 'battery.drain':
      return (session.firstBat && session.lastBat) ? (session.firstBat - session.lastBat) : null;
    
    // Power Metrics
    case 'power.usage':
      return session.powerUsage ?? null;
    case 'power.mWAvg':
      return session.mWAvg ?? null;
    case 'power.mAh':
      return session.mAh ?? null;
    case 'power.mAAvg':
      return session.mAAvg ?? null;
    
    // Jank Metrics
    case 'janks.big.count':
      return session.bigJanksCount ?? null;
    case 'janks.big.per10min':
      return session.bigJanks10Mins ?? null;
    case 'janks.small.count':
      return session.smallJanksCount ?? null;
    case 'janks.small.per10min':
      return session.smallJanks10Mins ?? null;
    case 'janks.total.count':
      return session.janksCount ?? null;
    case 'janks.total.per10min':
      return session.janks10Mins ?? null;
    
    // App Metrics
    case 'app.size':
      return session.appSize ?? null;
    case 'app.cache':
      return session.appCache ?? null;
    case 'app.data':
      return session.appData ?? null;
    case 'app.launchTime':
      return session.appLaunchTimeMs ?? null;
    case 'app.name':
      return session.app?.name ?? null;
    case 'app.packageName':
      return session.app?.packageName ?? null;
    case 'app.version':
      return session.app?.version ?? null;
    case 'app.versionCode':
      return session.app?.versionCode ?? null;
    
    // Device Metrics
    case 'device.model':
      return session.device?.model ?? null;
    case 'device.manufacturer':
      return session.device?.manufacturer ?? null;
    case 'device.memory.total':
      return session.totalDeviceMemory ?? null;
    case 'device.battery.capacity':
      return session.device?.batteryCapacity ?? null;
    case 'device.battery.voltage':
      return session.device?.batteryVoltage ?? null;
    case 'device.screen.width':
      return session.device?.screenWidth ?? null;
    case 'device.screen.height':
      return session.device?.screenHeight ?? null;
    case 'device.screen.refreshRate':
      return session.device?.refreshRate ?? null;
    case 'device.androidVersion':
      return session.device?.androidVersionRelease ? parseFloat(session.device.androidVersionRelease) : null;
    case 'device.androidSdk':
      return session.device?.androidSdkInt ?? null;
    case 'device.cpu.cores':
      return session.device?.cpu?.numCores ?? null;
    case 'device.cpu.maxFreq':
      return session.device?.cpu?.maxFreq ?? null;
    case 'device.cpu.minFreq':
      return session.device?.cpu?.minFreq ?? null;
    case 'device.baseband':
      return session.device?.baseband ?? null;
    case 'device.gpu.vendor':
      return session.device?.gpu?.vendor ?? null;
    case 'device.gpu.renderer':
      return session.device?.gpu?.renderer ?? null;
    
    // Network Metrics
    case 'network.received':
      return session.networkAppUsage?.appTotalDataReceived ?? null;
    case 'network.sent':
      return session.networkAppUsage?.appTotalDataSent ?? null;
    
    // Session Metrics
    case 'session.duration':
      return session.timePlayed ?? null;
    case 'session.timestamp':
      return session.sessionDate ?? null;
    case 'session.timePushed':
      return session.timePushed ?? null;
    case 'session.isActive':
      return session.isActive ? 1 : 0;
    case 'session.isCharging':
      return session.isCharging ? 1 : 0;
    case 'session.date':
      return session.sessionDate ?? null;
    case 'session.id':
      return session.id ?? null;
    case 'session.uuid':
      return session.uuid ?? null;
    case 'session.recordedBy':
      return session.user?.userPlayAccount ?? null;
    case 'session.dataSet':
      return session.user?.dataSet ?? null;
    
    // Tags
    case 'tags.githash':
      return session.tags?.githash ?? null;
    case 'tags.injected':
      return session.tags?.injected ?? null;
    
    // For any other field, try to get it from the session object directly
    default:
      return getNestedProperty(session, field);
  }
};

export const validateRule = (session: Session, rule: ValidationRule): boolean => {
  const value = getFieldValue(session, rule.field);
  
  // Handle text-based operators first
  if (rule.operator === 'string') {
    // String operations require string values
    const stringValue = String(value);
    const targetValue = String(rule.value);
    
    switch (rule.condition) {
      case 'equals':
        return stringValue === targetValue;
      case 'notEquals':
        return stringValue !== targetValue;
      case 'contains':
        return stringValue.includes(targetValue);
      case 'notContains':
        return !stringValue.includes(targetValue);
      case 'startsWith':
        return stringValue.startsWith(targetValue);
      case 'endsWith':
        return stringValue.endsWith(targetValue);
      case 'isEmpty':
        return stringValue === '';
      case 'isNotEmpty':
        return stringValue !== '';
      case 'matches':
        try {
          const regex = new RegExp(targetValue);
          return regex.test(stringValue);
        } catch (e) {
          return false;
        }
      default:
        return false;
    }
  }
  
  // Existence checks
  if (rule.condition === 'exists') {
    return value !== undefined && value !== null;
  }
  
  if (rule.condition === 'notExists') {
    return value === undefined || value === null;
  }
  
  // If value is null/undefined and we're past the existence checks, then rule fails
  if (value === null || value === undefined) {
    return false;
  }
  
  // Numeric comparisons
  if (rule.operator === 'number') {
    const numValue = Number(value);
    const targetValue = Number(rule.value);
    
    if (isNaN(numValue) || isNaN(targetValue)) {
      return false;
    }
    
    switch (rule.condition) {
      case '>':
        return numValue > targetValue;
      case '>=':
        return numValue >= targetValue;
      case '<':
        return numValue < targetValue;
      case '<=':
        return numValue <= targetValue;
      case '==':
        return numValue === targetValue;
      case '!=':
        return numValue !== targetValue;
      case 'between':
        const [min, max] = rule.value as [number, number];
        return numValue >= min && numValue <= max;
      default:
        return false;
    }
  }
  
  // Boolean checks
  if (rule.operator === 'boolean') {
    const boolValue = Boolean(value);
    const targetValue = Boolean(rule.value);
    
    switch (rule.condition) {
      case 'isTrue':
        return boolValue === true;
      case 'isFalse':
        return boolValue === false;
      case 'equals':
        return boolValue === targetValue;
      default:
        return false;
    }
  }
  
  // Date comparisons
  if (rule.operator === 'date') {
    try {
      const dateValue = new Date(value).getTime();
      const targetDate = new Date(rule.value as string).getTime();
      
      if (isNaN(dateValue) || isNaN(targetDate)) {
        return false;
      }
      
      switch (rule.condition) {
        case 'before':
          return dateValue < targetDate;
        case 'after':
          return dateValue > targetDate;
        case 'on':
          // Compare just the date part (year, month, day)
          const valueDate = new Date(dateValue);
          const targetValueDate = new Date(targetDate);
          return (
            valueDate.getFullYear() === targetValueDate.getFullYear() &&
            valueDate.getMonth() === targetValueDate.getMonth() &&
            valueDate.getDate() === targetValueDate.getDate()
          );
        case 'between':
          const [startDate, endDate] = rule.value as [string, string];
          const start = new Date(startDate).getTime();
          const end = new Date(endDate).getTime();
          return dateValue >= start && dateValue <= end;
        default:
          return false;
      }
    } catch (e) {
      return false;
    }
  }
  
  // If we get here, the rule is invalid
  return false;
};

export const getDefaultRules = (): ValidationRule[] => [
  {
    id: '1',
    name: 'Minimum FPS Check',
    field: 'fps.min',
    operator: 'number',
    condition: '>=',
    value: 0,
    enabled: true,
    description: 'FPS should never be negative'
  },
  {
    id: '2',
    name: 'FPS Stability Check',
    field: 'fps.stability',
    operator: 'number',
    condition: 'between',
    value: [0, 100],
    enabled: true,
    description: 'FPS stability should be between 0% and 100%'
  },
  {
    id: '3',
    name: 'CPU Usage Range',
    field: 'cpu.avg',
    operator: 'number',
    condition: 'between',
    value: [0, 100],
    enabled: true,
    description: 'Average CPU usage should be between 0% and 100%'
  },
  {
    id: '4',
    name: 'Battery Level Range',
    field: 'battery.first',
    operator: 'number',
    condition: 'between',
    value: [0, 100],
    enabled: true,
    description: 'Battery level should be between 0% and 100%'
  },
  {
    id: '5',
    name: 'Session Duration Check',
    field: 'session.duration',
    operator: 'number',
    condition: '>',
    value: 0,
    enabled: true,
    description: 'Session duration should be positive'
  },
  {
    id: '6',
    name: 'Memory Usage Range',
    field: 'androidMemory.avg',
    operator: 'number',
    condition: '>=',
    value: 0,
    enabled: true,
    description: 'Memory usage should not be negative'
  },
  {
    id: '7',
    name: 'Device Model Validation',
    field: 'device.model',
    operator: 'string',
    condition: 'exists',
    value: '',
    enabled: true,
    description: 'Device model must be present'
  },
  {
    id: '8',
    name: 'Package Name Check',
    field: 'app.packageName',
    operator: 'string',
    condition: 'contains',
    value: '.',
    enabled: true,
    description: 'Package name should contain a dot'
  },
  {
    id: '9',
    name: 'Session ID Format',
    field: 'session.id',
    operator: 'string',
    condition: 'matches',
    value: '^[a-zA-Z0-9-]+$',
    enabled: true,
    description: 'Session ID should only contain alphanumeric characters and hyphens'
  },
  {
    id: '10',
    name: 'Network Data Check',
    field: 'network.received',
    operator: 'number',
    condition: 'exists',
    value: 0,
    enabled: true,
    description: 'Network data received should be available'
  }
];

// Gets all available metrics fields grouped by category
export const getMetricFields = () => {
  return {
    'Performance': [
      { value: 'fps.min', label: 'FPS (Minimum)' },
      { value: 'fps.max', label: 'FPS (Maximum)' },
      { value: 'fps.median', label: 'FPS (Median)' },
      { value: 'fps.stability', label: 'FPS Stability' },
      { value: 'fps.onePercentLow', label: 'FPS (1% Low)' },
    ],
    'CPU': [
      { value: 'cpu.min', label: 'CPU Usage (Minimum)' },
      { value: 'cpu.max', label: 'CPU Usage (Maximum)' },
      { value: 'cpu.median', label: 'CPU Usage (Median)' },
      { value: 'cpu.avg', label: 'CPU Usage (Average)' },
      { value: 'cpu.total', label: 'Total CPU Usage (Average)' },
    ],
    'GPU': [
      { value: 'gpu.min', label: 'GPU Usage (Minimum)' },
      { value: 'gpu.max', label: 'GPU Usage (Maximum)' },
      { value: 'gpu.median', label: 'GPU Usage (Median)' },
      { value: 'gpu.avg', label: 'GPU Usage (Average)' },
    ],
    'Memory': [
      { value: 'memory.min', label: 'Memory Usage (Minimum)' },
      { value: 'memory.max', label: 'Memory Usage (Maximum)' },
      { value: 'memory.median', label: 'Memory Usage (Median)' },
      { value: 'memory.avg', label: 'Memory Usage (Average)' },
      { value: 'androidMemory.min', label: 'Android Memory (Minimum)' },
      { value: 'androidMemory.max', label: 'Android Memory (Maximum)' },
      { value: 'androidMemory.median', label: 'Android Memory (Median)' },
      { value: 'androidMemory.avg', label: 'Android Memory (Average)' },
    ],
    'Battery & Power': [
      { value: 'battery.first', label: 'Battery Level (First)' },
      { value: 'battery.last', label: 'Battery Level (Last)' },
      { value: 'battery.drain', label: 'Battery Drain' },
      { value: 'power.usage', label: 'Power Usage' },
      { value: 'power.mWAvg', label: 'Power Usage (mW Average)' },
      { value: 'power.mAh', label: 'Power Usage (mAh)' },
      { value: 'power.mAAvg', label: 'Power Usage (mA Average)' },
    ],
    'Janks': [
      { value: 'janks.big.count', label: 'Big Janks (Count)' },
      { value: 'janks.big.per10min', label: 'Big Janks (per 10min)' },
      { value: 'janks.small.count', label: 'Small Janks (Count)' },
      { value: 'janks.small.per10min', label: 'Small Janks (per 10min)' },
      { value: 'janks.total.count', label: 'Total Janks (Count)' },
      { value: 'janks.total.per10min', label: 'Total Janks (per 10min)' },
    ],
    'App': [
      { value: 'app.name', label: 'App Name' },
      { value: 'app.packageName', label: 'Package Name' },
      { value: 'app.version', label: 'App Version' },
      { value: 'app.versionCode', label: 'Version Code' },
      { value: 'app.size', label: 'App Size' },
      { value: 'app.cache', label: 'App Cache' },
      { value: 'app.data', label: 'App Data' },
      { value: 'app.launchTime', label: 'Launch Time (ms)' },
    ],
    'Device': [
      { value: 'device.model', label: 'Model' },
      { value: 'device.manufacturer', label: 'Manufacturer' },
      { value: 'device.androidVersion', label: 'Android Version' },
      { value: 'device.androidSdk', label: 'Android SDK' },
      { value: 'device.memory.total', label: 'Total Memory' },
      { value: 'device.cpu.cores', label: 'CPU Cores' },
      { value: 'device.cpu.maxFreq', label: 'CPU Max Frequency' },
      { value: 'device.cpu.minFreq', label: 'CPU Min Frequency' },
      { value: 'device.gpu.vendor', label: 'GPU Vendor' },
      { value: 'device.gpu.renderer', label: 'GPU Renderer' },
      { value: 'device.screen.width', label: 'Screen Width' },
      { value: 'device.screen.height', label: 'Screen Height' },
      { value: 'device.screen.refreshRate', label: 'Screen Refresh Rate' },
      { value: 'device.battery.capacity', label: 'Battery Capacity' },
      { value: 'device.battery.voltage', label: 'Battery Voltage' },
    ],
    'Network': [
      { value: 'network.received', label: 'Data Received' },
      { value: 'network.sent', label: 'Data Sent' },
    ],
    'Session': [
      { value: 'session.id', label: 'Session ID' },
      { value: 'session.uuid', label: 'Session UUID' },
      { value: 'session.duration', label: 'Duration' },
      { value: 'session.date', label: 'Date' },
      { value: 'session.timestamp', label: 'Timestamp' },
      { value: 'session.timePushed', label: 'Time Pushed' },
      { value: 'session.isActive', label: 'Is Active' },
      { value: 'session.isCharging', label: 'Is Charging' },
      { value: 'session.recordedBy', label: 'Recorded By' },
    ],
    'Tags': [
      { value: 'tags.githash', label: 'Git Hash' },
      { value: 'tags.injected', label: 'Injected' },
    ],
  };
};

// Get available condition types based on the operator
export const getConditionsForOperator = (operator: MetricOperator) => {
  switch (operator) {
    case 'number':
      return [
        { value: '>', label: 'Greater Than (>)' },
        { value: '>=', label: 'Greater Than or Equal (>=)' },
        { value: '<', label: 'Less Than (<)' },
        { value: '<=', label: 'Less Than or Equal (<=)' },
        { value: '==', label: 'Equal (==)' },
        { value: '!=', label: 'Not Equal (!=)' },
        { value: 'between', label: 'Between' },
        { value: 'exists', label: 'Exists' },
        { value: 'notExists', label: 'Not Exists' },
      ];
    case 'string':
      return [
        { value: 'equals', label: 'Equals' },
        { value: 'notEquals', label: 'Not Equals' },
        { value: 'contains', label: 'Contains' },
        { value: 'notContains', label: 'Not Contains' },
        { value: 'startsWith', label: 'Starts With' },
        { value: 'endsWith', label: 'Ends With' },
        { value: 'matches', label: 'Matches (Regex)' },
        { value: 'isEmpty', label: 'Is Empty' },
        { value: 'isNotEmpty', label: 'Is Not Empty' },
        { value: 'exists', label: 'Exists' },
        { value: 'notExists', label: 'Not Exists' },
      ];
    case 'boolean':
      return [
        { value: 'isTrue', label: 'Is True' },
        { value: 'isFalse', label: 'Is False' },
        { value: 'equals', label: 'Equals' },
        { value: 'exists', label: 'Exists' },
        { value: 'notExists', label: 'Not Exists' },
      ];
    case 'date':
      return [
        { value: 'before', label: 'Before' },
        { value: 'after', label: 'After' },
        { value: 'on', label: 'On Date' },
        { value: 'between', label: 'Between' },
        { value: 'exists', label: 'Exists' },
        { value: 'notExists', label: 'Not Exists' },
      ];
    default:
      return [];
  }
};

// Determine the operator type based on field name
export const getOperatorForField = (field: string): MetricOperator => {
  // Date fields
  if (field.includes('date') || field.includes('timestamp') || field.includes('timePushed')) {
    return 'date';
  }
  
  // Boolean fields
  if (field.includes('isActive') || field.includes('isCharging') || field.includes('isShared')) {
    return 'boolean';
  }
  
  // String fields
  if (
    field.includes('name') || 
    field.includes('model') || 
    field.includes('manufacturer') ||
    field.includes('id') ||
    field.includes('uuid') ||
    field.includes('package') ||
    field.includes('recordedBy') ||
    field.includes('version') ||
    field.includes('vendor') ||
    field.includes('renderer') ||
    field.includes('tag')
  ) {
    return 'string';
  }
  
  // Default to number for everything else
  return 'number';
};
