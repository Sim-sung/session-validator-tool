
import React, { useState } from 'react';
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
  FileDown
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSession } from '@/context/SessionContext';
import { LogWindow } from '@/components/LogWindow';
import { ValidationRule, MetricField, MetricCondition } from '@/types/validation';
import { validateRule, getDefaultRules } from '@/utils/validationUtils';

interface ValidationResult {
  sessionId: string;
  appName: string;
  deviceModel: string;
  rules: {
    ruleId: string;
    ruleName: string;
    passed: boolean;
    field: string;
    expectedCondition: string;
    expectedValue: number | [number, number];
    description?: string;
  }[];
  overallResult: 'pass' | 'fail';
}

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
    condition: '>=',
    value: 0,
    enabled: true,
    description: ''
  });
  
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const addRule = () => {
    if (!newRule.name) {
      toast.error('Rule name is required');
      return;
    }
    
    setRules([
      ...rules,
      {
        ...newRule,
        id: Date.now().toString()
      }
    ]);
    
    // Reset form
    setNewRule({
      name: '',
      field: 'fps.min',
      condition: '>=',
      value: 0,
      enabled: true,
      description: ''
    });
    
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
          
          return {
            ruleId: rule.id,
            ruleName: rule.name,
            passed,
            field: rule.field,
            expectedCondition: rule.condition,
            expectedValue: rule.value,
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
    const headers = "Session ID,App Name,Device Model,Overall Result\n";
    const rows = validationResults.map(result => 
      `${result.sessionId},${result.appName},${result.deviceModel},${result.overallResult.toUpperCase()}`
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
                  <Label htmlFor="metric">Metric</Label>
                  <select 
                    id="metric"
                    className="w-full p-2 border rounded"
                    value={newRule.field}
                    onChange={(e) => setNewRule({...newRule, field: e.target.value as MetricField})}
                  >
                    <option value="fps.min">FPS (Minimum)</option>
                    <option value="fps.max">FPS (Maximum)</option>
                    <option value="fps.median">FPS (Median)</option>
                    <option value="fps.stability">FPS Stability</option>
                    <option value="cpu.min">CPU Usage (Minimum)</option>
                    <option value="cpu.max">CPU Usage (Maximum)</option>
                    <option value="cpu.avg">CPU Usage (Average)</option>
                    <option value="androidMemory.avg">Memory Usage (Average)</option>
                    <option value="androidMemory.max">Memory Usage (Maximum)</option>
                    <option value="battery.drain">Battery Drain</option>
                    <option value="power.usage">Power Usage</option>
                    <option value="app.launchTime">Launch Time</option>
                    <option value="app.size">App Size</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <select 
                    id="condition"
                    className="w-full p-2 border rounded"
                    value={newRule.condition}
                    onChange={(e) => setNewRule({...newRule, condition: e.target.value as MetricCondition})}
                  >
                    <option value=">">Greater Than (&gt;)</option>
                    <option value=">=">Greater Than or Equal (&gt;=)</option>
                    <option value="<">Less Than (&lt;)</option>
                    <option value="<=">Less Than or Equal (&lt;=)</option>
                    <option value="==">Equal To (==)</option>
                    <option value="!=">Not Equal To (!=)</option>
                    <option value="between">Between</option>
                    <option value="exists">Exists</option>
                    <option value="not_null">Not Null</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="value">Value</Label>
                  <Input 
                    id="value" 
                    type="number"
                    value={newRule.value as number}
                    onChange={(e) => setNewRule({...newRule, value: parseFloat(e.target.value)})}
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
                      <TableCell>{rule.name}</TableCell>
                      <TableCell>{rule.field}</TableCell>
                      <TableCell>{rule.condition}</TableCell>
                      <TableCell>{rule.value}</TableCell>
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
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
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
                              <TableCell>
                                {rule.ruleName.toLowerCase().includes('fps') ? 'FPS' : 
                                rule.ruleName.toLowerCase().includes('cpu') ? 'CPU' :
                                rule.ruleName.toLowerCase().includes('memory') ? 'Memory' :
                                rule.ruleName.toLowerCase().includes('battery') ? 'Battery' : 'Other'}
                              </TableCell>
                              <TableCell>
                                {rule.expectedCondition} {rule.expectedValue}
                              </TableCell>
                              <TableCell>{rule.field}</TableCell>
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
      
      <LogWindow />
    </div>
  );
};

export default Validation;
