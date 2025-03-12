
import React, { createContext, useContext, useState } from 'react';
import { toast } from "@/components/ui/sonner";
import { SessionMetrics } from './SessionContext';

// Type definitions
export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  key: string; // The metric to check (fps, cpu, etc.)
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'neq'; // greater than, less than, etc.
  value: number; // The threshold value
  enabled: boolean;
}

export interface ValidationRuleSet {
  id: string;
  name: string;
  description: string;
  rules: ValidationRule[];
}

export interface ValidationResult {
  sessionId: string;
  ruleSetId: string;
  timestamp: string;
  overallStatus: 'pass' | 'fail';
  results: {
    ruleId: string;
    status: 'pass' | 'fail';
    details: string;
  }[];
}

interface ValidationContextType {
  ruleSets: ValidationRuleSet[];
  validationResults: ValidationResult[];
  isValidating: boolean;
  createRuleSet: (ruleSet: Omit<ValidationRuleSet, 'id'>) => void;
  updateRuleSet: (ruleSet: ValidationRuleSet) => void;
  deleteRuleSet: (ruleSetId: string) => void;
  validateSession: (sessionMetrics: SessionMetrics, ruleSetId: string) => Promise<ValidationResult>;
  validateMultipleSessions: (sessionsMetrics: SessionMetrics[], ruleSetId: string) => Promise<ValidationResult[]>;
  clearValidationResults: () => void;
}

const ValidationContext = createContext<ValidationContextType | undefined>(undefined);

export const useValidation = () => {
  const context = useContext(ValidationContext);
  if (!context) {
    throw new Error('useValidation must be used within a ValidationProvider');
  }
  return context;
};

// Helper function to evaluate a validation rule against a metric value
const evaluateRule = (rule: ValidationRule, value: number): boolean => {
  switch (rule.operator) {
    case 'gt':
      return value > rule.value;
    case 'lt':
      return value < rule.value;
    case 'gte':
      return value >= rule.value;
    case 'lte':
      return value <= rule.value;
    case 'eq':
      return value === rule.value;
    case 'neq':
      return value !== rule.value;
    default:
      return false;
  }
};

// Generate a default rule set
const defaultRuleSets: ValidationRuleSet[] = [
  {
    id: 'default-ruleset',
    name: 'Default Validation Rules',
    description: 'Basic validation rules for GameBench sessions',
    rules: [
      {
        id: 'fps-min',
        name: 'Minimum FPS',
        description: 'FPS should be greater than 0',
        key: 'fps',
        operator: 'gt',
        value: 0,
        enabled: true,
      },
      {
        id: 'cpu-max',
        name: 'Maximum CPU Usage',
        description: 'CPU usage should be less than 90%',
        key: 'cpu',
        operator: 'lt',
        value: 90,
        enabled: true,
      },
      {
        id: 'memory-max',
        name: 'Maximum Memory Usage',
        description: 'Memory usage should be less than 1000MB',
        key: 'memory',
        operator: 'lt',
        value: 1000,
        enabled: true,
      },
    ],
  },
];

export const ValidationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ruleSets, setRuleSets] = useState<ValidationRuleSet[]>(defaultRuleSets);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const createRuleSet = (ruleSet: Omit<ValidationRuleSet, 'id'>): void => {
    const newRuleSet: ValidationRuleSet = {
      ...ruleSet,
      id: `ruleset-${Date.now()}`,
    };
    
    setRuleSets(prevRuleSets => [...prevRuleSets, newRuleSet]);
    toast.success(`Rule set "${ruleSet.name}" created`);
  };

  const updateRuleSet = (ruleSet: ValidationRuleSet): void => {
    setRuleSets(prevRuleSets =>
      prevRuleSets.map(rs => (rs.id === ruleSet.id ? ruleSet : rs))
    );
    toast.success(`Rule set "${ruleSet.name}" updated`);
  };

  const deleteRuleSet = (ruleSetId: string): void => {
    setRuleSets(prevRuleSets => prevRuleSets.filter(rs => rs.id !== ruleSetId));
    toast.success('Rule set deleted');
  };

  const validateSession = async (sessionMetrics: SessionMetrics, ruleSetId: string): Promise<ValidationResult> => {
    setIsValidating(true);
    
    try {
      // Find the rule set
      const ruleSet = ruleSets.find(rs => rs.id === ruleSetId);
      if (!ruleSet) {
        throw new Error(`Rule set with ID ${ruleSetId} not found`);
      }
      
      // Apply rules to session metrics
      const results = ruleSet.rules
        .filter(rule => rule.enabled)
        .map(rule => {
          let status: 'pass' | 'fail' = 'fail';
          let details = '';
          
          // Get the appropriate metric value based on the rule key
          if (rule.key === 'fps' && sessionMetrics.fps) {
            // For array metrics like FPS, check if any value violates the rule
            const violatingValues = sessionMetrics.fps.filter(v => !evaluateRule(rule, v));
            status = violatingValues.length === 0 ? 'pass' : 'fail';
            if (status === 'fail') {
              details = `Found ${violatingValues.length} values that don't meet the criteria`;
            }
          } else if (rule.key === 'cpu' && sessionMetrics.cpu) {
            const violatingValues = sessionMetrics.cpu.filter(v => !evaluateRule(rule, v));
            status = violatingValues.length === 0 ? 'pass' : 'fail';
            if (status === 'fail') {
              details = `Found ${violatingValues.length} values that don't meet the criteria`;
            }
          } else if (rule.key === 'gpu' && sessionMetrics.gpu) {
            const violatingValues = sessionMetrics.gpu.filter(v => !evaluateRule(rule, v));
            status = violatingValues.length === 0 ? 'pass' : 'fail';
            if (status === 'fail') {
              details = `Found ${violatingValues.length} values that don't meet the criteria`;
            }
          } else if (rule.key === 'memory' && sessionMetrics.memory) {
            const violatingValues = sessionMetrics.memory.filter(v => !evaluateRule(rule, v));
            status = violatingValues.length === 0 ? 'pass' : 'fail';
            if (status === 'fail') {
              details = `Found ${violatingValues.length} values that don't meet the criteria`;
            }
          } else {
            status = 'fail';
            details = 'Metric not available for validation';
          }
          
          return {
            ruleId: rule.id,
            status,
            details,
          };
        });
      
      // Determine overall status
      const overallStatus = results.every(r => r.status === 'pass') ? 'pass' : 'fail';
      
      // Create validation result
      const validationResult: ValidationResult = {
        sessionId: sessionMetrics.sessionId,
        ruleSetId,
        timestamp: new Date().toISOString(),
        overallStatus,
        results,
      };
      
      // Add to results
      setValidationResults(prev => [...prev, validationResult]);
      
      return validationResult;
    } finally {
      setIsValidating(false);
    }
  };

  const validateMultipleSessions = async (sessionsMetrics: SessionMetrics[], ruleSetId: string): Promise<ValidationResult[]> => {
    setIsValidating(true);
    
    try {
      const results = await Promise.all(
        sessionsMetrics.map(metrics => validateSession(metrics, ruleSetId))
      );
      
      toast.success(`Validated ${results.length} sessions`);
      return results;
    } finally {
      setIsValidating(false);
    }
  };

  const clearValidationResults = (): void => {
    setValidationResults([]);
    toast.info('Validation results cleared');
  };

  return (
    <ValidationContext.Provider
      value={{
        ruleSets,
        validationResults,
        isValidating,
        createRuleSet,
        updateRuleSet,
        deleteRuleSet,
        validateSession,
        validateMultipleSessions,
        clearValidationResults,
      }}
    >
      {children}
    </ValidationContext.Provider>
  );
};
