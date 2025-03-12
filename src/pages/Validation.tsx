import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { useSession } from '@/context/SessionContext';
import {
  ValidationRule,
  ValidationResult,
  MetricOperator,
  MetricCondition,
  Session
} from '@/types/validation';
import { validateRule, getDefaultRules, getMetricFields, getConditionsForOperator, getOperatorForField } from '@/utils/validationUtils';
import { Check, Copy, Plus, RefreshCw, Trash2, AlertTriangle } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from "lucide-react";

const ValidationPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { sessions } = useSession();

  const [rules, setRules] = useState<ValidationRule[]>([]);
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [selectedRule, setSelectedRule] = useState<ValidationRule | null>(null);
  const [isRuleFormOpen, setIsRuleFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  } as DateRange);
  const [isAllRulesEnabled, setIsAllRulesEnabled] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const initialRules = getDefaultRules();
    setRules(initialRules);
  }, []);

  useEffect(() => {
    const allEnabled = rules.every(rule => rule.enabled);
    setIsAllRulesEnabled(allEnabled);
  }, [rules]);

  const handleRuleClick = (rule: ValidationRule) => {
    setSelectedRule(rule);
    setIsRuleFormOpen(true);
  };

  const handleEnableAllRules = () => {
    const updatedRules = rules.map(rule => ({ ...rule, enabled: !isAllRulesEnabled }));
    setRules(updatedRules);
    setIsAllRulesEnabled(!isAllRulesEnabled);
  };

  const handleAddRule = () => {
    setSelectedRule(null);
    setIsRuleFormOpen(true);
  };

  const handleSaveRule = (newRule: ValidationRule) => {
    if (newRule.id) {
      // Update existing rule
      const updatedRules = rules.map(rule => rule.id === newRule.id ? newRule : rule);
      setRules(updatedRules);
    } else {
      // Add new rule
      const newId = Math.random().toString(36).substring(7);
      const completeNewRule = { ...newRule, id: newId };
      setRules([...rules, completeNewRule]);
    }
    setIsRuleFormOpen(false);
    setSelectedRule(null);
    toast.success('Rule saved successfully!');
  };

  const handleDeleteRule = () => {
    if (selectedRule) {
      const updatedRules = rules.filter(rule => rule.id !== selectedRule.id);
      setRules(updatedRules);
      setIsRuleFormOpen(false);
      setIsDeleteDialogOpen(false);
      setSelectedRule(null);
      toast.success('Rule deleted successfully!');
    }
  };

  const handleToggleRule = (ruleId: string) => {
    const updatedRules = rules.map(rule =>
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    );
    setRules(updatedRules);
  };

  const handleRunValidation = () => {
    if (!sessions || sessions.length === 0) {
      toast.error('No sessions available to validate.');
      return;
    }

    const filteredSessions = sessions.filter(session => {
      if (!dateRange?.from || !dateRange?.to) {
        return true;
      }
      const sessionDate = new Date(session.startTime);
      return sessionDate >= dateRange.from && sessionDate <= dateRange.to;
    });

    if (filteredSessions.length === 0) {
      toast.error('No sessions match the selected date range.');
      return;
    }

    const validationResults: ValidationResult[] = filteredSessions.map(session => {
      const ruleResults = rules.map(rule => {
        const passed = rule.enabled ? validateRule(session, rule) : true;
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          passed: passed,
          field: rule.field,
          operator: rule.operator,
          expectedCondition: rule.condition,
          expectedValue: rule.value,
          actualValue: session[rule.field as keyof Session],
          description: rule.description,
        };
      });

      const overallResult = ruleResults.every(result => result.passed) ? 'pass' : 'fail';

      return {
        sessionId: session.id,
        appName: session.appName,
        deviceModel: session.deviceModel,
        rules: ruleResults,
        overallResult: overallResult,
      };
    });

    setResults(validationResults);
    toast.success('Validation completed!');
  };

  const handleCopyRule = (rule: ValidationRule) => {
    navigator.clipboard.writeText(JSON.stringify(rule, null, 2))
      .then(() => {
        toast.success('Rule copied to clipboard!');
      })
      .catch(() => {
        toast.error('Failed to copy rule to clipboard.');
      });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Validation Rules</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Validation Rules List */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Rules</CardTitle>
            <CardDescription>Manage your validation rules here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={handleEnableAllRules}>
                {isAllRulesEnabled ? 'Disable All' : 'Enable All'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleAddRule}>
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </div>
            <Separator />
            <div className="overflow-auto h-[400px]">
              {rules.map(rule => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-secondary cursor-pointer"
                  onClick={() => handleRuleClick(rule)}
                >
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`rule-${rule.id}`}
                      checked={rule.enabled}
                      onCheckedChange={() => handleToggleRule(rule.id)}
                    />
                    <Label htmlFor={`rule-${rule.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {rule.name}
                    </Label>
                  </div>
                  <Button variant="ghost" size="icon" onClick={(e) => {
                    e.stopPropagation();
                    handleCopyRule(rule);
                  }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Validation Rule Form */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>{selectedRule ? 'Edit Rule' : 'Add Rule'}</CardTitle>
            <CardDescription>Define the rule for validating sessions.</CardDescription>
          </CardHeader>
          <CardContent>
            {isRuleFormOpen && (
              <ValidationRuleForm
                rule={selectedRule}
                onSave={handleSaveRule}
                onCancel={() => {
                  setIsRuleFormOpen(false);
                  setSelectedRule(null);
                }}
                onDelete={() => setIsDeleteDialogOpen(true)}
              />
            )}
            {!isRuleFormOpen && (
              <div className="text-muted-foreground">
                {rules.length === 0 ? 'No rules defined. Add a rule to get started.' : 'Select a rule to edit or add a new rule.'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Validation Results */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Validation Results</h2>
          <div className="flex items-center space-x-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={
                    "w-[300px] justify-start text-left font-normal" +
                    (dateRange?.from ? "pl-3.5" : "")
                  }
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      format(dateRange.from, "LLL dd, y") + " - " + format(dateRange.to, "LLL dd, y")
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <Button onClick={handleRunValidation}>
              <Check className="h-4 w-4 mr-2" />
              Run Validation
            </Button>
          </div>
        </div>
        {results.length > 0 ? (
          <ValidationResultsTable results={results} />
        ) : (
          <Card className="glass">
            <CardContent className="flex flex-col items-center justify-center p-4">
              <AlertTriangle className="h-10 w-10 text-yellow-500 mb-2" />
              <p className="text-muted-foreground">No validation results yet. Run validation to see results.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the rule.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRule} className="bg-red-500 text-white hover:bg-red-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

interface ValidationRuleFormProps {
  rule: ValidationRule | null;
  onSave: (rule: ValidationRule) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const ValidationRuleForm: React.FC<ValidationRuleFormProps> = ({ rule, onSave, onCancel, onDelete }) => {
  const [name, setName] = useState(rule?.name || '');
  const [field, setField] = useState(rule?.field || 'fps.min');
  const [operator, setOperator] = useState<MetricOperator>(rule?.operator || 'number');
  const [condition, setCondition] = useState<MetricCondition>(rule?.condition || '>=');
  const [value, setValue] = useState<string | number | boolean | [number, number] | [string, string]>(
    rule?.value !== undefined ? rule.value : 0
  );
  const [enabled, setEnabled] = useState(rule?.enabled !== undefined ? rule.enabled : true);
  const [description, setDescription] = useState(rule?.description || '');

  const metricFields = getMetricFields();
  const conditions = getConditionsForOperator(operator);

  useEffect(() => {
    if (rule) {
      setName(rule.name);
      setField(rule.field);
      setOperator(rule.operator);
      setCondition(rule.condition);
      setValue(rule.value !== undefined ? rule.value : 0);
      setEnabled(rule.enabled !== undefined ? rule.enabled : true);
      setDescription(rule.description || '');
    } else {
      // Reset form fields when adding a new rule
      setName('');
      setField('fps.min');
      setOperator('number');
      setCondition('>=');
      setValue(0);
      setEnabled(true);
      setDescription('');
    }
  }, [rule]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let parsedValue: any = value;

    // Parse value based on operator type
    if (operator === 'number') {
      if (condition === 'between') {
        if (Array.isArray(value)) {
          parsedValue = value.map(Number);
        } else {
          // Handle case where value is not an array when it should be
          toast.error('Invalid value for "between" condition. Please provide an array.');
          return;
        }
      } else {
        parsedValue = Number(value);
      }
    } else if (operator === 'boolean') {
      parsedValue = Boolean(value);
    }

    const newRule: ValidationRule = {
      id: rule?.id || '',
      name,
      field,
      operator,
      condition,
      value: parsedValue,
      enabled,
      description,
    };

    onSave(newRule);
  };

  const handleFieldChange = (newField: string) => {
    setField(newField);
    const newOperator = getOperatorForField(newField);
    setOperator(newOperator);
    setCondition(getConditionsForOperator(newOperator)[0].value as MetricCondition);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="field">Field</Label>
        <Select value={field} onValueChange={handleFieldChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a field" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(metricFields).map(([category, fields]) => (
              <React.Fragment key={category}>
                <SelectItem disabled className="font-bold text-gray-500">
                  {category}
                </SelectItem>
                {fields.map(f => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </React.Fragment>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="operator">Operator</Label>
        <Select value={operator} onValueChange={(value) => {
          setOperator(value as MetricOperator);
          setCondition(getConditionsForOperator(value as MetricOperator)[0].value as MetricCondition);
        }}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an operator" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="string">String</SelectItem>
            <SelectItem value="boolean">Boolean</SelectItem>
            <SelectItem value="date">Date</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="condition">Condition</Label>
        <Select value={condition} onValueChange={(value) => setCondition(value as MetricCondition)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a condition" />
          </SelectTrigger>
          <SelectContent>
            {conditions.map(c => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="value">Value</Label>
        {operator === 'number' && condition === 'between' ? (
          <div className="flex space-x-2">
            <Input
              type="number"
              placeholder="Min"
              value={Array.isArray(value) ? value[0] : 0}
              onChange={(e) => {
                const newValue = Number(e.target.value);
                setValue(Array.isArray(value) ? [newValue, Number(value[1])] : [newValue, 0]);
              }}
            />
            <Input
              type="number"
              placeholder="Max"
              value={Array.isArray(value) ? value[1] : 0}
              onChange={(e) => {
                const newValue = Number(e.target.value);
                setValue(Array.isArray(value) ? [Number(value[0]), newValue] : [0, newValue]);
              }}
            />
          </div>
        ) : (
          <Input
            type={operator === 'number' ? 'number' : 'text'}
            id="value"
            value={value !== null ? value : ''}
            onChange={(e) => setValue(operator === 'number' ? Number(e.target.value) : e.target.value)}
          />
        )}
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Label htmlFor="enabled">Enabled</Label>
        <Switch
          id="enabled"
          checked={enabled}
          onCheckedChange={(checked) => setEnabled(checked)}
        />
      </div>
      <div className="flex justify-between">
        <div>
          {onDelete && rule?.id && (
            <Button
              type="button"
              variant="destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
        <div className="flex space-x-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </div>
    </form>
  );
};

interface ValidationResultsTableProps {
  results: ValidationResult[];
}

const ValidationResultsTable: React.FC<ValidationResultsTableProps> = ({ results }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Session</TableHead>
          <TableHead>App</TableHead>
          <TableHead>Device</TableHead>
          <TableHead>Rule</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Expected</TableHead>
          <TableHead>Actual</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map(result => (
          result.rules.map(rule => (
            <TableRow key={`${result.sessionId}-${rule.ruleId}`}>
              <TableCell>{result.sessionId}</TableCell>
              <TableCell>{result.appName}</TableCell>
              <TableCell>{result.deviceModel}</TableCell>
              <TableCell>{rule.ruleName}</TableCell>
              <TableCell>
                {rule.passed ? (
                  <div className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-1" />
                    Passed
                  </div>
                ) : (
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                    Failed
                  </div>
                )}
              </TableCell>
              <TableCell>
                {rule.expectedCondition} {JSON.stringify(rule.expectedValue)}
              </TableCell>
              <TableCell>{JSON.stringify(rule.actualValue)}</TableCell>
            </TableRow>
          ))
        ))}
      </TableBody>
    </Table>
  );
};

export default ValidationPage;
