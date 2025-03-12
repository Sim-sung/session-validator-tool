
export type MetricCondition = 
  // Numeric conditions
  | '>' | '>=' | '<' | '<=' | '==' | '!=' | 'between'
  // String conditions
  | 'equals' | 'notEquals' | 'contains' | 'notContains' | 'startsWith' | 'endsWith' | 'isEmpty' | 'isNotEmpty' | 'matches'
  // Boolean conditions
  | 'isTrue' | 'isFalse'
  // Date conditions
  | 'before' | 'after' | 'on'
  // General conditions
  | 'exists' | 'notExists';

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

export interface ValidationRule {
  id: string;
  name: string;
  field: MetricField;
  operator: MetricOperator;
  condition: MetricCondition;
  value: number | string | boolean | [number, number] | [string, string]; // Support different value types
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
