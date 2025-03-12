
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  PlusCircle, 
  Trash, 
  Save, 
  Play, 
  Check, 
  X, 
  FileDown,
  RefreshCw,
  CalendarIcon
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSession } from '@/context/SessionContext';
import { 
  ValidationRule, 
  MetricField, 
  MetricCondition, 
  MetricOperator,
  ValidationResult
} from '@/types/validation';
import { 
  validateRule, 
  getDefaultRules, 
  getMetricFields, 
  getConditionsForOperator,
  getOperatorForField
} from '@/utils/validationUtils';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

const Validation = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { sessions } = useSession();
  
  const [rules, setRules] = useState<ValidationRule[]>(getDefaultRules());
  const [selectedRuleSet, setSelectedRuleSet] = useState<string>('Default Rules');
  const [ruleSets] = useState<string[]>(['Default Rules', 'Performance Rules', 'Battery Rules']);
  
  const [newRule, setNewRule] = useState<Omit<ValidationRule, 'id'>>({
    name: '',
    field: 'fps.min',
    operator: 'number',
    condition: '>=',
    value: 0,
    enabled: true,
    description: ''
  });
  
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [metricFields] = useState(getMetricFields());
  const [selectedDateRange, setSelectedDateRange] = useState<{ from?: Date; to?: Date }>({});

  // Create state for between value range
  const [betweenValues, setBetweenValues] = useState<{ min: number | string; max: number | string }>({
    min: 0,
    max: 100
  });

  // Get conditions based on the selected operator
  const [conditions, setConditions] = useState<{value: string; label: string}[]>(
    getConditionsForOperator(newRule.operator)
  );

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Update conditions when operator changes
  useEffect(() => {
    setConditions(getConditionsForOperator(newRule.operator));
    
    // Reset condition when operator changes
    setNewRule(prev => {
      const newConditions = getConditionsForOperator(newRule.operator);
      return {
        ...prev,
        condition: newConditions.length > 0 ? newConditions[0].value as MetricCondition : '>' as MetricCondition
      };
    });
  }, [newRule.operator]);

  // Update operator when field changes
  const handleFieldChange = (fieldValue: string) => {
    const operator = getOperatorForField(fieldValue);
    setNewRule(prev => ({
      ...prev,
      field: fieldValue as MetricField,
      operator
    }));
  };

  const addRule = () => {
    if (!newRule.name) {
      toast.error('Rule name is required');
      return;
    }
    
    let ruleValue = newRule.value;
    
    // Handle 'between' condition
    if (newRule.condition === 'between') {
      if (newRule.operator === 'number') {
        ruleValue = [Number(betweenValues.min), Number(betweenValues.max)];
      } else if (newRule.operator === 'date') {
        if (!selectedDateRange.from || !selectedDateRange.to) {
          toast.error('Please select both start and end dates for the between condition');
          return;
        }
        ruleValue = [
          selectedDateRange.from.toISOString(),
          selectedDateRange.to.toISOString()
        ];
      }
    }
    
    setRules([
      ...rules,
      {
        ...newRule,
        id: Date.now().toString(),
        value: ruleValue
      }
    ]);
    
    // Reset form
    setNewRule({
      name: '',
      field: 'fps.min',
      operator: 'number',
      condition: '>=',
      value: 0,
      enabled: true,
      description: ''
    });
    setBetweenValues({ min: 0, max: 100 });
    setSelectedDateRange({});
    
    toast.success('Rule added successfully');
  };
  
  const deleteRule = (id: string) => {
    setRules(rules.filter(rule => rule.id !== id));
    toast.success('Rule deleted');
  };
  
  const toggleRuleStatus = (id: string, enabled: boolean) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, enabled } : rule
    ));
  };
  
  const saveRuleSet = () => {
    toast.success(`Rule set "${selectedRuleSet}" saved successfully`);
  };
  
  const toggleSessionSelection = (sessionId: string) => {
    setSelectedSessions(prev => 
      prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const validateSessions = () => {
    if (selectedSessions.length === 0) {
      toast.error('Please select at least one session to validate');
      return;
    }
    
    if (rules.filter(r => r.enabled).length === 0) {
      toast.error('Please create and enable at least one rule');
      return;
    }
    
    setIsValidating(true);
    
    const results = selectedSessions.map(sessionId => {
      const session = sessions.find(s => s.id === sessionId);
      
      if (!session) {
        return {
          sessionId,
          appName: 'Unknown',
          deviceModel: 'Unknown',
          rules: [],
          overallResult: 'fail' as const
        };
      }

      const ruleResults = rules
        .filter(rule => rule.enabled)
        .map(rule => {
          const passed = validateRule(session, rule);
          const fieldValue = session[rule.field as keyof typeof session] || 
                            getNestedProperty(session, rule.field as string);
          
          return {
            ruleId: rule.id,
            ruleName: rule.name,
            passed,
            field: rule.field,
            operator: rule.operator,
            expectedCondition: rule.condition,
            expectedValue: rule.value,
            actualValue: fieldValue,
            description: rule.description
          };
        });
      
      return {
        sessionId,
        appName: session.app?.name || 'Unknown',
        deviceModel: session.device?.model || 'Unknown',
        rules: ruleResults,
        overallResult: ruleResults.every(r => r.passed) ? 'pass' as const : 'fail' as const
      };
    });
    
    setValidationResults(results);
    setIsValidating(false);
    
    const passedCount = results.filter(r => r.overallResult === 'pass').length;
    const failedCount = results.length - passedCount;
    
    toast.success(`Validation complete: ${passedCount} passed, ${failedCount} failed`);
  };
  
  const exportResults = () => {
    if (validationResults.length === 0) {
      toast.error('No validation results to export');
      return;
    }
    
    // Format the results as a CSV string
    const headers = "Session ID,App Name,Device Model,Rule Name,Rule Field,Rule Condition,Expected Value,Actual Value,Result\n";
    const rows = validationResults.flatMap(result => 
      result.rules.map(rule => 
        `"${result.sessionId}","${result.appName}","${result.deviceModel}","${rule.ruleName}","${rule.field}","${rule.expectedCondition}","${formatValue(rule.expectedValue)}","${formatValue(rule.actualValue)}","${rule.passed ? 'PASS' : 'FAIL'}"`
      )
    ).join('\n');
    
    const csv = headers + rows;
    
    // Create and download the CSV file
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'validation_results.csv';
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast.success('Validation results exported successfully');
  };

  // Helper function to format values for display/export
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    
    if (Array.isArray(value)) {
      return value.join(' - ');
    }
    
    return String(value);
  };

  // Helper function to get a nested property from an object using dot notation
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
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Validation Rules</h1>
        <p className="text-muted-foreground">
          Create and manage validation rules for your GameBench session data
        </p>
      </div>
      
      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">Rule Management</TabsTrigger>
          <TabsTrigger value="validate">Validate Sessions</TabsTrigger>
          <TabsTrigger value="results">Validation Results</TabsTrigger>
        </TabsList>
        
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rule Sets</CardTitle>
              <CardDescription>
                Manage your saved validation rule sets or create new ones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="ruleset">Select Rule Set:</Label>
                <select 
                  id="ruleset"
                  className="p-2 border rounded"
                  value={selectedRuleSet}
                  onChange={(e) => setSelectedRuleSet(e.target.value)}
                >
                  {ruleSets.map(set => (
                    <option key={set} value={set}>{set}</option>
                  ))}
                </select>
                <Button variant="outline" size="sm" onClick={saveRuleSet}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Create New Rule</CardTitle>
              <CardDescription>
                Define a new validation rule for your sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rule-name">Rule Name</Label>
                  <Input 
                    id="rule-name" 
                    value={newRule.name}
                    onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                    placeholder="e.g., Minimum FPS"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="metric">Metric Field</Label>
                  <Select 
                    value={newRule.field}
                    onValueChange={handleFieldChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a metric" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(metricFields).map(([category, fields]) => (
                        <SelectGroup key={category}>
                          <SelectLabel>{category}</SelectLabel>
                          {fields.map(field => (
                            <SelectItem key={field.value} value={field.value}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Select
                    value={newRule.condition}
                    onValueChange={(value) => setNewRule({...newRule, condition: value as MetricCondition})}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {conditions.map(condition => (
                        <SelectItem key={condition.value} value={condition.value}>
                          {condition.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  {newRule.condition === 'between' ? (
                    <div className="space-y-2">
                      <Label>Range Values</Label>
                      {newRule.operator === 'date' ? (
                        <div className="flex flex-col space-y-2">
                          <Label>Date Range</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="justify-start text-left font-normal"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDateRange.from ? (
                                  selectedDateRange.to ? (
                                    <>
                                      {format(selectedDateRange.from, "LLL dd, y")} -{" "}
                                      {format(selectedDateRange.to, "LLL dd, y")}
                                    </>
                                  ) : (
                                    format(selectedDateRange.from, "LLL dd, y")
                                  )
                                ) : (
                                  <span>Pick a date range</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={selectedDateRange.from}
                                selected={selectedDateRange}
                                onSelect={setSelectedDateRange}
                                numberOfMonths={2}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <div className="flex-1">
                            <Label htmlFor="min-value">Min</Label>
                            <Input 
                              id="min-value" 
                              type={newRule.operator === 'number' ? 'number' : 'text'}
                              value={betweenValues.min}
                              onChange={(e) => setBetweenValues({...betweenValues, min: e.target.value})}
                            />
                          </div>
                          <div className="flex-1">
                            <Label htmlFor="max-value">Max</Label>
                            <Input 
                              id="max-value" 
                              type={newRule.operator === 'number' ? 'number' : 'text'}
                              value={betweenValues.max}
                              onChange={(e) => setBetweenValues({...betweenValues, max: e.target.value})}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    newRule.condition === 'exists' || 
                    newRule.condition === 'notExists' || 
                    newRule.condition === 'isEmpty' || 
                    newRule.condition === 'isNotEmpty' ||
                    newRule.condition === 'isTrue' ||
                    newRule.condition === 'isFalse' ? (
                      <div className="pt-6">
                        <p className="text-sm text-muted-foreground">No value needed for this condition</p>
                      </div>
                    ) : (
                      <>
                        <Label htmlFor="value">Value</Label>
                        {newRule.operator === 'boolean' ? (
                          <Select
                            value={String(newRule.value)}
                            onValueChange={(value) => setNewRule({...newRule, value: value === 'true'})}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a value" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">True</SelectItem>
                              <SelectItem value="false">False</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : newRule.operator === 'date' ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {newRule.value instanceof Date ? (
                                  format(newRule.value as Date, "PP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={new Date(newRule.value as string)}
                                onSelect={(date) => date && setNewRule({...newRule, value: date.toISOString()})}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <Input 
                            id="value" 
                            type={newRule.operator === 'number' ? 'number' : 'text'}
                            value={newRule.value as string | number}
                            onChange={(e) => {
                              const value = newRule.operator === 'number' 
                                ? parseFloat(e.target.value) 
                                : e.target.value;
                              setNewRule({...newRule, value});
                            }}
                          />
                        )}
                      </>
                    )
                  )}
                </div>
                
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input 
                    id="description" 
                    value={newRule.description || ''}
                    onChange={(e) => setNewRule({...newRule, description: e.target.value})}
                    placeholder="Add a description for this rule"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={addRule}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Current Rules</CardTitle>
              <CardDescription>
                View and manage your validation rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Enabled</TableHead>
                    <TableHead>Rule Name</TableHead>
                    <TableHead>Metric</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map(rule => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <Switch 
                          checked={rule.enabled}
                          onCheckedChange={(checked) => toggleRuleStatus(rule.id, checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{rule.name}</div>
                        {rule.description && (
                          <div className="text-xs text-muted-foreground">{rule.description}</div>
                        )}
                      </TableCell>
                      <TableCell>{rule.field}</TableCell>
                      <TableCell>{rule.condition}</TableCell>
                      <TableCell>{formatValue(rule.value)}</TableCell>
                      <TableCell>
                        <Button variant="destructive" size="sm" onClick={() => deleteRule(rule.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {rules.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        No rules defined. Create a new rule to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="validate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Sessions to Validate</CardTitle>
              <CardDescription>
                Choose the sessions you want to validate against your rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Select</TableHead>
                    <TableHead>App</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Recorded By</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No sessions found. Go to the Sessions page to fetch sessions.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedSessions.includes(session.id)}
                            onCheckedChange={() => toggleSessionSelection(session.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{session.appName}</div>
                          <div className="text-xs text-muted-foreground">v{session.appVersion}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{session.deviceModel}</div>
                          <div className="text-xs text-muted-foreground">{session.manufacturer}</div>
                        </TableCell>
                        <TableCell>{session.recordedBy}</TableCell>
                        <TableCell>{Math.round(session.duration / 60)} min</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                {selectedSessions.length} sessions selected
              </div>
              <Button 
                onClick={validateSessions} 
                disabled={selectedSessions.length === 0 || isValidating}
              >
                {isValidating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Validation
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Validation Results</CardTitle>
                  <CardDescription>
                    Results of your validation rules against selected sessions
                  </CardDescription>
                </div>
                <Button onClick={exportResults} disabled={validationResults.length === 0}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Export Results
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {validationResults.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No validation results yet. Run validation to see results here.</p>
                </div>
              ) : (
                <>
                  {validationResults.map((result, index) => (
                    <div key={result.sessionId} className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">
                            {result.appName} on {result.deviceModel}
                          </h3>
                          <p className="text-sm text-muted-foreground">Session ID: {result.sessionId}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm ${
                          result.overallResult === 'pass' 
                            ? 'bg-green-500/20 text-green-500' 
                            : 'bg-red-500/20 text-red-500'
                        }`}>
                          {result.overallResult === 'pass' ? 'PASSED' : 'FAILED'}
                        </div>
                      </div>
                      
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Rule</TableHead>
                            <TableHead>Metric</TableHead>
                            <TableHead>Expected</TableHead>
                            <TableHead>Actual</TableHead>
                            <TableHead>Result</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.rules.map((rule) => (
                            <TableRow key={rule.ruleId}>
                              <TableCell>{rule.ruleName}</TableCell>
                              <TableCell>{rule.field}</TableCell>
                              <TableCell>
                                {rule.expectedCondition} {formatValue(rule.expectedValue)}
                              </TableCell>
                              <TableCell>{formatValue(rule.actualValue)}</TableCell>
                              <TableCell>
                                {rule.passed ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <X className="h-4 w-4 text-red-500" />
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      
                      {index < validationResults.length - 1 && <Separator className="my-4" />}
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Validation;
