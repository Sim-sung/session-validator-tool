
import { ValidationRule, MetricCondition } from '@/types/validation';
import { Session } from '@/context/SessionContext';

const getFieldValue = (session: Session, field: string): number | null => {
  const parts = field.split('.');
  let value: any = session;

  for (const part of parts) {
    if (value === null || value === undefined) return null;
    value = value[part];
  }

  return typeof value === 'number' ? value : null;
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
  }
];
