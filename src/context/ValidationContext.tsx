
import React, { createContext, useContext, useState } from 'react';
import { toast } from "sonner";
import { Session } from './SessionContext';

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  property: string;
  condition: 'greaterThan' | 'lessThan' | 'equals' | 'notEquals' | 'contains' | 'notContains';
  value: string | number;
  active: boolean;
}

export interface ValidationResult {
  sessionId: string;
  appName: string;
  deviceModel: string;
  passed: boolean;
  failures: {
    ruleId: string;
    ruleName: string;
    property: string;
    expected: string;
    actual: string | number;
  }[];
}

interface ValidationContextType {
  savedSessions: Session[];
  rules: ValidationRule[];
  validationResults: ValidationResult[];
  isValidating: boolean;
  saveSession: (session: Session) => void;
  removeSavedSession: (sessionId: string) => void;
  createRule: (rule: Omit<ValidationRule, 'id'>) => void;
  updateRule: (rule: ValidationRule) => void;
  deleteRule: (ruleId: string) => void;
  validateSessions: (sessionIds: string[]) => Promise<void>;
  clearResults: () => void;
}

const ValidationContext = createContext<ValidationContextType | undefined>(undefined);

export const useValidationContext = () => {
  const context = useContext(ValidationContext);
  if (!context) {
    throw new Error('useValidationContext must be used within a ValidationProvider');
  }
  return context;
};

// Default validation rules
const defaultRules: ValidationRule[] = [
  {
    id: 'rule-1',
    name: 'Positive FPS',
    description: 'FPS values should be greater than or equal to zero',
    property: 'metrics.fps.avg',
    condition: 'greaterThan',
    value: 0,
    active: true,
  },
  {
    id: 'rule-2',
    name: 'FPS Stability',
    description: 'FPS stability should be at least 80%',
    property: 'metrics.fps.stability',
    condition: 'greaterThan',
    value: 80,
    active: true,
  },
];

export const ValidationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [savedSessions, setSavedSessions] = useState<Session[]>([]);
  const [rules, setRules] = useState<ValidationRule[]>(defaultRules);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const saveSession = (session: Session) => {
    if (savedSessions.some(s => s.id === session.id)) {
      toast.info(`Session "${session.id}" already saved`);
      return;
    }
    
    setSavedSessions([...savedSessions, session]);
    toast.success(`Session "${session.id}" saved for validation`);
  };

  const removeSavedSession = (sessionId: string) => {
    setSavedSessions(savedSessions.filter(session => session.id !== sessionId));
    toast.info(`Session "${sessionId}" removed from saved sessions`);
  };

  const createRule = (rule: Omit<ValidationRule, 'id'>) => {
    const newRule: ValidationRule = {
      ...rule,
      id: `rule-${Date.now()}`,
    };
    
    setRules([...rules, newRule]);
    toast.success(`Rule "${rule.name}" created`);
  };

  const updateRule = (updatedRule: ValidationRule) => {
    setRules(rules.map(rule => 
      rule.id === updatedRule.id ? updatedRule : rule
    ));
    toast.success(`Rule "${updatedRule.name}" updated`);
  };

  const deleteRule = (ruleId: string) => {
    setRules(rules.filter(rule => rule.id !== ruleId));
    toast.info(`Rule deleted`);
  };

  // Helper function to get nested property value from an object
  const getNestedPropertyValue = (obj: any, path: string): any => {
    return path.split('.').reduce((prev, curr) => {
      return prev && prev[curr] !== undefined ? prev[curr] : undefined;
    }, obj);
  };

  // Validate sessions against rules
  const validateSessions = async (sessionIds: string[]) => {
    if (rules.filter(rule => rule.active).length === 0) {
      toast.error('No active validation rules found');
      return;
    }

    if (sessionIds.length === 0) {
      toast.error('No sessions selected for validation');
      return;
    }

    setIsValidating(true);
    
    try {
      const results: ValidationResult[] = [];
      
      // For each session that needs to be validated
      for (const sessionId of sessionIds) {
        const session = savedSessions.find(s => s.id === sessionId);
        
        if (!session) {
          console.error(`Session ${sessionId} not found in saved sessions`);
          continue;
        }
        
        const failures = [];
        
        // Check each active rule against the session
        for (const rule of rules.filter(r => r.active)) {
          const actualValue = getNestedPropertyValue(session, rule.property);
          
          let passed = true;
          
          if (actualValue !== undefined) {
            switch (rule.condition) {
              case 'greaterThan':
                passed = actualValue > rule.value;
                break;
              case 'lessThan':
                passed = actualValue < rule.value;
                break;
              case 'equals':
                passed = actualValue === rule.value;
                break;
              case 'notEquals':
                passed = actualValue !== rule.value;
                break;
              case 'contains':
                passed = String(actualValue).includes(String(rule.value));
                break;
              case 'notContains':
                passed = !String(actualValue).includes(String(rule.value));
                break;
            }
          } else {
            // If the property doesn't exist, the rule fails
            passed = false;
          }
          
          if (!passed) {
            failures.push({
              ruleId: rule.id,
              ruleName: rule.name,
              property: rule.property,
              expected: `${rule.condition} ${rule.value}`,
              actual: actualValue !== undefined ? actualValue : 'undefined',
            });
          }
        }
        
        results.push({
          sessionId: session.id,
          appName: session.app.name,
          deviceModel: session.device.model,
          passed: failures.length === 0,
          failures,
        });
      }
      
      setValidationResults(results);
      
      const passedCount = results.filter(result => result.passed).length;
      const failedCount = results.length - passedCount;
      
      toast.success(`Validation complete: ${passedCount} passed, ${failedCount} failed`);
    } catch (error) {
      console.error('Error during validation:', error);
      toast.error('Validation failed');
    } finally {
      setIsValidating(false);
    }
  };

  const clearResults = () => {
    setValidationResults([]);
    toast.info('Validation results cleared');
  };

  return (
    <ValidationContext.Provider
      value={{
        savedSessions,
        rules,
        validationResults,
        isValidating,
        saveSession,
        removeSavedSession,
        createRule,
        updateRule,
        deleteRule,
        validateSessions,
        clearResults,
      }}
    >
      {children}
    </ValidationContext.Provider>
  );
};
