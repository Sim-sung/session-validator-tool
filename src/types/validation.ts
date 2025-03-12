
export type MetricCondition = '>' | '>=' | '<' | '<=' | '==' | '!=' | 'between' | 'exists' | 'not_null';

export type MetricField =
  // Performance Metrics
  | 'fps.min' | 'fps.max' | 'fps.median' | 'fps.stability' | 'fps.onePercentLow'
  | 'cpu.min' | 'cpu.max' | 'cpu.median' | 'cpu.avg' | 'cpu.total'
  | 'gpu.min' | 'gpu.max' | 'gpu.median' | 'gpu.avg'
  | 'memory.min' | 'memory.max' | 'memory.median' | 'memory.avg'
  | 'androidMemory.min' | 'androidMemory.max' | 'androidMemory.median' | 'androidMemory.avg'
  | 'battery.first' | 'battery.last' | 'battery.drain'
  | 'power.usage' | 'power.mWAvg' | 'power.mAh' | 'power.mAAvg'
  // Janks Metrics
  | 'janks.big.count' | 'janks.big.per10min'
  | 'janks.small.count' | 'janks.small.per10min'
  | 'janks.total.count' | 'janks.total.per10min'
  // App Metrics
  | 'app.size' | 'app.cache' | 'app.data'
  | 'app.launchTime'
  // Device Metrics
  | 'device.memory.total'
  | 'device.battery.capacity' | 'device.battery.voltage'
  | 'device.screen.width' | 'device.screen.height' | 'device.screen.refreshRate'
  // Network Metrics
  | 'network.received' | 'network.sent'
  // Session Info
  | 'session.duration'
  | 'session.timestamp';

export interface ValidationRule {
  id: string;
  name: string;
  field: MetricField;
  condition: MetricCondition;
  value: number | [number, number]; // [min, max] for 'between' condition
  enabled: boolean;
  description?: string;
}
