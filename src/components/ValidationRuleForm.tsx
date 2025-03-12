
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MetricField, MetricCondition, ValidationRule } from '@/types/validation';

interface ValidationRuleFormProps {
  rule: Omit<ValidationRule, 'id'>;
  onRuleChange: (rule: Omit<ValidationRule, 'id'>) => void;
  onSubmit: () => void;
}

export const ValidationRuleForm = ({ rule, onRuleChange, onSubmit }: ValidationRuleFormProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="rule-name">Rule Name</Label>
        <Input 
          id="rule-name" 
          value={rule.name}
          onChange={(e) => onRuleChange({ ...rule, name: e.target.value })}
          placeholder="e.g., Minimum FPS Check"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="field">Metric Field</Label>
        <select 
          id="field"
          className="w-full p-2 border rounded"
          value={rule.field}
          onChange={(e) => onRuleChange({ ...rule, field: e.target.value as MetricField })}
        >
          <optgroup label="Performance">
            <option value="fps.min">FPS (Minimum)</option>
            <option value="fps.max">FPS (Maximum)</option>
            <option value="fps.median">FPS (Median)</option>
            <option value="fps.stability">FPS Stability</option>
          </optgroup>
          <optgroup label="CPU">
            <option value="cpu.min">CPU Usage (Minimum)</option>
            <option value="cpu.max">CPU Usage (Maximum)</option>
            <option value="cpu.avg">CPU Usage (Average)</option>
          </optgroup>
          <optgroup label="Memory">
            <option value="androidMemory.avg">Memory Usage (Average)</option>
            <option value="androidMemory.max">Memory Usage (Maximum)</option>
          </optgroup>
          <optgroup label="Battery">
            <option value="battery.drain">Battery Drain</option>
            <option value="power.usage">Power Usage</option>
          </optgroup>
          <optgroup label="App">
            <option value="app.launchTime">Launch Time</option>
            <option value="app.size">App Size</option>
          </optgroup>
        </select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="condition">Condition</Label>
        <select 
          id="condition"
          className="w-full p-2 border rounded"
          value={rule.condition}
          onChange={(e) => onRuleChange({ ...rule, condition: e.target.value as MetricCondition })}
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
        {rule.condition === 'between' ? (
          <div className="flex space-x-2">
            <div>
              <Label htmlFor="value-min">Minimum</Label>
              <Input 
                id="value-min"
                type="number"
                value={(rule.value as [number, number])[0]}
                onChange={(e) => onRuleChange({
                  ...rule,
                  value: [parseFloat(e.target.value), (rule.value as [number, number])[1]]
                })}
              />
            </div>
            <div>
              <Label htmlFor="value-max">Maximum</Label>
              <Input 
                id="value-max"
                type="number"
                value={(rule.value as [number, number])[1]}
                onChange={(e) => onRuleChange({
                  ...rule,
                  value: [(rule.value as [number, number])[0], parseFloat(e.target.value)]
                })}
              />
            </div>
          </div>
        ) : (
          <>
            <Label htmlFor="value">Value</Label>
            <Input 
              id="value"
              type="number"
              value={rule.value as number}
              onChange={(e) => onRuleChange({ ...rule, value: parseFloat(e.target.value) })}
              disabled={rule.condition === 'exists' || rule.condition === 'not_null'}
            />
          </>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input 
          id="description"
          value={rule.description}
          onChange={(e) => onRuleChange({ ...rule, description: e.target.value })}
          placeholder="Describe the purpose of this rule"
        />
      </div>
    </div>
  );
};
