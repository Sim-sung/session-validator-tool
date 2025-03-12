
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Terminal, ChevronDown, ChevronUp, Copy, CopyCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface LogEntry {
  type: 'request' | 'response' | 'error';
  timestamp: string;
  data: any;
}

export const LogWindow = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [copied, setCopied] = useState(false);

  // Subscribe to console logs when component mounts
  React.useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;

    console.log = (...args) => {
      originalConsoleLog.apply(console, args);
      setLogs(prev => [...prev, {
        type: 'request',
        timestamp: new Date().toISOString(),
        data: args
      }]);
    };

    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      setLogs(prev => [...prev, {
        type: 'error',
        timestamp: new Date().toISOString(),
        data: args
      }]);
    };

    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    };
  }, []);

  const copyLogs = () => {
    navigator.clipboard.writeText(JSON.stringify(logs, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50"
        onClick={() => setIsOpen(true)}
      >
        <Terminal className="mr-2 h-4 w-4" />
        Show Logs
        <ChevronUp className="ml-2 h-4 w-4" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-0 right-0 w-full max-h-[40vh] z-50 bg-black/90 backdrop-blur rounded-none border-t border-gray-800">
      <div className="flex items-center justify-between p-2 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4" />
          <span className="text-sm font-medium">Debug Logs</span>
          <span className="text-xs text-gray-500">({logs.length} entries)</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={copyLogs}
          >
            {copied ? <CopyCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="overflow-auto p-4 space-y-2 max-h-[calc(40vh-40px)]">
        {logs.map((log, index) => (
          <div
            key={index}
            className={`font-mono text-xs ${
              log.type === 'error' ? 'text-red-400' : 'text-green-400'
            }`}
          >
            <span className="text-gray-500">{log.timestamp}</span>
            <pre className="mt-1 whitespace-pre-wrap">
              {JSON.stringify(log.data, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </Card>
  );
};
