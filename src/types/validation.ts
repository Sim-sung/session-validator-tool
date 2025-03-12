
export type MetricCondition = 
  // Numeric conditions
  | '>' | '>=' | '<' | '<=' | '==' | '!=' | 'between'
  // String conditions
  | 'equals' | 'notEquals' | 'contains' | 'notContains' | 'startsWith' 
  | 'endsWith' | 'isEmpty' | 'isNotEmpty' | 'matches' | 'exists' | 'notExists'
  // Boolean conditions
  | 'isTrue' | 'isFalse'
  // Date conditions
  | 'before' | 'after' | 'on'
  // Null conditions
  | 'not_null';

export type MetricOperator = 'number' | 'string' | 'boolean' | 'date';

export type MetricField =
  // Performance Metrics
  | 'fps.min' | 'fps.max' | 'fps.median' | 'fps.stability' | 'fps.onePercentLow'
  // CPU Usage Metrics
  | 'cpu.min' | 'cpu.max' | 'cpu.median' | 'cpu.avg' | 'cpu.total'
  // GPU Usage Metrics
  | 'gpu.min' | 'gpu.max' | 'gpu.median' | 'gpu.avg'
  // Memory Usage Metrics
  | 'memory.min' | 'memory.max' | 'memory.median' | 'memory.avg'
  | 'androidMemory.min' | 'androidMemory.max' | 'androidMemory.median' | 'androidMemory.avg'
  // Battery Metrics
  | 'battery.first' | 'battery.last' | 'battery.drain'
  // Power Metrics
  | 'power.usage' | 'power.mWAvg' | 'power.mAh' | 'power.mAAvg'
  // Janks Metrics
  | 'janks.big.count' | 'janks.big.per10min'
  | 'janks.small.count' | 'janks.small.per10min'
  | 'janks.total.count' | 'janks.total.per10min'
  // App Metrics
  | 'app.name' | 'app.packageName' | 'app.version' | 'app.versionCode'
  | 'app.size' | 'app.cache' | 'app.data' | 'app.launchTime'
  // Device Metrics
  | 'device.model' | 'device.manufacturer'
  | 'device.memory.total'
  | 'device.battery.capacity' | 'device.battery.voltage'
  | 'device.screen.width' | 'device.screen.height' | 'device.screen.refreshRate'
  | 'device.androidVersion' | 'device.androidSdk'
  | 'device.cpu.cores' | 'device.cpu.maxFreq' | 'device.cpu.minFreq'
  | 'device.gpu.vendor' | 'device.gpu.renderer'
  | 'device.baseband'
  // Network Metrics
  | 'network.received' | 'network.sent'
  // Session Info
  | 'session.id' | 'session.uuid'
  | 'session.duration'
  | 'session.date' | 'session.timestamp' | 'session.timePushed'
  | 'session.isActive' | 'session.isCharging'
  | 'session.recordedBy' | 'session.dataSet'
  // Tags
  | 'tags.githash' | 'tags.injected'
  // Allow any string as a field (for dynamic field access)
  | string;

// Complete Session interface with all properties used throughout the application
export interface Session {
  id: string;
  uuid: string;
  app?: {
    name: string;
    packageName: string;
    version: string;
    versionCode: number;
  };
  device?: {
    model: string;
    manufacturer: string;
    batteryCapacity?: number;
    batteryVoltage?: number;
    screen?: {
      width: number;
      height: number;
      refreshRate: number;
    };
    gpu?: {
      vendor: string;
      renderer: string;
    };
    cpu?: {
      numCores: number;
      maxFreq: number;
      minFreq: number;
    };
    androidVersion?: string;
    androidSdk?: number;
    baseband?: string;
  };
  user?: {
    userPlayAccount: string;
    dataSet: string;
  };
  tags?: {
    githash: string;
    injected: string;
  };
  isActive?: boolean;
  isCharging?: boolean;
  selected: boolean;
  startTime: number;
  duration: number;
  manufacturer: string;
  appVersion: string;
  appName: string;
  deviceModel: string;
  recordedBy: string;
  
  // Additional properties referenced in validationUtils
  fpsMin?: number;
  fpsMax?: number;
  fpsMedian?: number;
  fpsStability?: number;
  fpsOnePercentLow?: number;
  
  cpuUsageMin?: number;
  cpuUsageMax?: number;
  cpuUsageMedian?: number;
  cpuUsageAvg?: number;
  totalCpuUsageAvg?: number;
  
  gpuUsageMin?: number;
  gpuUsageMax?: number;
  gpuUsageMedian?: number;
  gpuUsageAvg?: number;
  
  memUsageMin?: number;
  memUsageMax?: number;
  memUsageMedian?: number;
  memUsageAvg?: number;
  
  androidMemUsageMin?: number;
  androidMemUsageMax?: number;
  androidMemUsageMedian?: number;
  androidMemUsageAvg?: number;
  
  firstBat?: number;
  lastBat?: number;
  
  powerUsage?: number;
  mWAvg?: number;
  mAh?: number;
  mAAvg?: number;
  
  bigJanksCount?: number;
  bigJanks10Mins?: number;
  smallJanksCount?: number;
  smallJanks10Mins?: number;
  janksCount?: number;
  janks10Mins?: number;
  
  appSize?: number;
  appCache?: number;
  appData?: number;
  appLaunchTimeMs?: number;
  
  totalDeviceMemory?: number;
  
  timePlayed?: number;
  sessionDate?: number;
  timePushed?: number;
  
  networkAppUsage?: {
    appTotalDataReceived: number;
    appTotalDataSent: number;
  };
}

export interface ValidationRule {
  id: string;
  name: string;
  field: MetricField;
  operator: MetricOperator;
  condition: MetricCondition;
  value: number | string | boolean | [number, number] | [string, string];
  enabled: boolean;
  description?: string;
}

export interface ValidationResult {
  sessionId: string;
  appName: string;
  deviceModel: string;
  rules: {
    ruleId: string;
    ruleName: string;
    passed: boolean;
    field: string;
    operator: string;
    expectedCondition: string;
    expectedValue: any;
    actualValue?: any;
    description?: string;
  }[];
  overallResult: 'pass' | 'fail';
}

// SessionMetrics interface for use in the Metrics component
export interface SessionMetrics {
  fps: number[];
  cpu: number[];
  gpu: number[];
  battery: number[];
  appDetails: {
    name: string;
    version: string;
    package: string;
  };
  deviceDetails: {
    model: string;
    manufacturer: string;
    gpuType: string;
  };
  userDetails: {
    email: string;
    username: string;
  };
}
