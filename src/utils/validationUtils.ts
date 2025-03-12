import { ValidationRule, MetricCondition } from '@/types/validation';
import { Session } from '@/context/SessionContext';

const getFieldValue = (session: Session, field: string): number | null => {
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
    case 'gpu.min':
      return session.gpuUsageMin ?? null;
    case 'gpu.max':
      return session.gpuUsageMax ?? null;
    case 'gpu.median':
      return session.gpuUsageMedian ?? null;
    case 'gpu.avg':
      return session.gpuUsageAvg ?? null;
    case 'memory.min':
      return session.memUsageMin ?? null;
    case 'memory.max':
      return session.memUsageMax ?? null;
    case 'memory.median':
      return session.memUsageMedian ?? null;
    case 'memory.avg':
      return session.memUsageAvg ?? null;
    case 'androidMemory.min':
      return session.androidMemUsageMin ?? null;
    case 'androidMemory.max':
      return session.androidMemUsageMax ?? null;
    case 'androidMemory.median':
      return session.androidMemUsageMedian ?? null;
    case 'androidMemory.avg':
      return session.androidMemUsageAvg ?? null;
    case 'battery.first':
      return session.firstBat ?? null;
    case 'battery.last':
      return session.lastBat ?? null;
    case 'battery.drain':
      return (session.firstBat && session.lastBat) ? (session.firstBat - session.lastBat) : null;
    case 'power.usage':
      return session.powerUsage ?? null;
    case 'power.mWAvg':
      return session.mWAvg ?? null;
    case 'power.mAh':
      return session.mAh ?? null;
    case 'power.mAAvg':
      return session.mAAvg ?? null;
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
    case 'app.size':
      return session.appSize ?? null;
    case 'app.cache':
      return session.appCache ?? null;
    case 'app.data':
      return session.appData ?? null;
    case 'app.launchTime':
      return session.appLaunchTimeMs ?? null;
    case 'app.versionCode':
      return session.app?.versionCode ?? null;
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
    case 'network.received':
      return session.networkAppUsage?.appTotalDataReceived ?? null;
    case 'network.sent':
      return session.networkAppUsage?.appTotalDataSent ?? null;
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
    case 'session.sessionDate':
      return session.sessionDate ?? null;
    default:
      return null;
  }
};

export const validateRule = (session: Session, rule: ValidationRule): boolean => {
  const value = getFieldValue(session, rule.field);
  if (value === null) return false;

  switch (rule.condition) {
    case '>':
      return value > (rule.value as number);
    case '>=':
      return value >= (rule.value as number);
    case '<':
      return value < (rule.value as number);
    case '<=':
      return value <= (rule.value as number);
    case '==':
      return value === (rule.value as number);
    case '!=':
      return value !== (rule.value as number);
    case 'between':
      const [min, max] = rule.value as [number, number];
      return value >= min && value <= max;
    case 'exists':
      return value !== undefined && value !== null;
    case 'not_null':
      return value !== null;
    default:
      return false;
  }
};

export const getDefaultRules = (): ValidationRule[] => [
  {
    id: '1',
    name: 'Minimum FPS Check',
    field: 'fps.min',
    condition: '>=',
    value: 0,
    enabled: true,
    description: 'FPS should never be negative'
  },
  {
    id: '2',
    name: 'FPS Stability Check',
    field: 'fps.stability',
    condition: 'between',
    value: [0, 100],
    enabled: true,
    description: 'FPS stability should be between 0% and 100%'
  },
  {
    id: '3',
    name: 'CPU Usage Range',
    field: 'cpu.avg',
    condition: 'between',
    value: [0, 100],
    enabled: true,
    description: 'Average CPU usage should be between 0% and 100%'
  },
  {
    id: '4',
    name: 'Battery Level Range',
    field: 'battery.first',
    condition: 'between',
    value: [0, 100],
    enabled: true,
    description: 'Battery level should be between 0% and 100%'
  },
  {
    id: '5',
    name: 'Session Duration Check',
    field: 'session.duration',
    condition: '>',
    value: 0,
    enabled: true,
    description: 'Session duration should be positive'
  },
  {
    id: '6',
    name: 'Memory Usage Range',
    field: 'androidMemory.avg',
    condition: '>=',
    value: 0,
    enabled: true,
    description: 'Memory usage should not be negative'
  },
  {
    id: '7',
    name: 'Launch Time Check',
    field: 'app.launchTime',
    condition: '>=',
    value: 0,
    enabled: true,
    description: 'App launch time should not be negative'
  },
  {
    id: '8',
    name: 'Device Android SDK Check',
    field: 'device.androidSdk',
    condition: '>',
    value: 0,
    enabled: true,
    description: 'Android SDK version should be positive'
  },
  {
    id: '9',
    name: 'Network Data Check',
    field: 'network.received',
    condition: '>=',
    value: 0,
    enabled: true,
    description: 'Network data received should not be negative'
  },
  {
    id: '10',
    name: 'Timestamp Check',
    field: 'session.timestamp',
    condition: '>',
    value: 1577836800000, // Jan 1, 2020 timestamp
    enabled: true,
    description: 'Session timestamp should be after Jan 1, 2020'
  }
];
