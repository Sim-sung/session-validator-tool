
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Terminal, ChevronDown, ChevronUp, Copy, CopyCheck, Trash } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LogEntry {
  type: 'info' | 'error' | 'network';
  timestamp: string;
  data: any;
  method?: string;
  url?: string;
  status?: number;
  requestHeaders?: Record<string, string>;
  requestBody?: any;
  responseBody?: any;
}

export const LogWindow = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Intercept fetch to log network requests
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      // Extract URL string properly based on input type
      const urlString = typeof input === 'string' 
        ? input 
        : input instanceof URL 
          ? input.toString() 
          : input.url;
          
      const method = init?.method || 'GET';
      const requestHeaders = init?.headers as Record<string, string>;
      const requestBody = init?.body ? JSON.parse(init.body as string) : undefined;
      
      console.log(`Sending ${method} request to ${urlString}`, {
        headers: requestHeaders,
        body: requestBody
      });
      
      try {
        const response = await originalFetch(input, init);
        const responseClone = response.clone();
        
        try {
          const responseBody = await responseClone.json();
          const timestamp = new Date().toISOString();
          
          setLogs(prev => [...prev, {
            type: 'network',
            timestamp,
            data: `${method} ${urlString} - Status: ${response.status}`,
            method,
            url: urlString,
            status: response.status,
            requestHeaders,
            requestBody,
            responseBody
          }]);
          
          console.log(`Response from ${method} ${urlString}:`, {
            status: response.status,
            body: responseBody
          });
        } catch (e) {
          // Response body is not JSON or already consumed
        }
        
        return response;
      } catch (error) {
        const timestamp = new Date().toISOString();
        setLogs(prev => [...prev, {
          type: 'error',
          timestamp,
          data: `Failed ${method} request to ${urlString}: ${error}`,
          method,
          url: urlString,
          requestHeaders,
          requestBody
        }]);
        throw error;
      }
    };
    
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Subscribe to console logs
  useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;

    console.log = (...args) => {
      originalConsoleLog.apply(console, args);
      setLogs(prev => [...prev, {
        type: 'info',
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

  const filteredLogs = activeTab === 'all' 
    ? logs 
    : logs.filter(log => log.type === activeTab);

  const copyLogs = () => {
    navigator.clipboard.writeText(JSON.stringify(filteredLogs, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const renderNetworkLog = (log: LogEntry) => {
    if (log.type !== 'network') return null;
    
    return (
      <div className="border border-gray-800 rounded-md p-2 mb-2">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <Badge variant={log.status && log.status < 400 ? "default" : "destructive"}>
              {log.method}
            </Badge>
            <span className="text-sm truncate max-w-[300px]">{log.url}</span>
          </div>
          <Badge variant={log.status && log.status < 400 ? "outline" : "destructive"}>
            {log.status || 'Failed'}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>
            <h4 className="text-xs font-semibold mb-1">Request</h4>
            <div className="text-xs bg-gray-900 p-2 rounded max-h-[150px] overflow-auto">
              <div className="mb-2">
                <span className="text-gray-400 font-semibold">Headers:</span>
                <pre className="mt-1 whitespace-pre-wrap">
                  {JSON.stringify(log.requestHeaders, null, 2)}
                </pre>
              </div>
              {log.requestBody && (
                <div>
                  <span className="text-gray-400 font-semibold">Body:</span>
                  <pre className="mt-1 whitespace-pre-wrap">
                    {JSON.stringify(log.requestBody, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-xs font-semibold mb-1">Response</h4>
            <div className="text-xs bg-gray-900 p-2 rounded max-h-[150px] overflow-auto">
              {log.responseBody ? (
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(log.responseBody, null, 2)}
                </pre>
              ) : (
                <span className="text-gray-400">No response body</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
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
    <Card className="fixed bottom-0 right-0 w-full max-h-[50vh] z-50 bg-black/90 backdrop-blur rounded-none border-t border-gray-800">
      <div className="flex items-center justify-between p-2 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4" />
          <span className="text-sm font-medium">Debug Logs</span>
          <span className="text-xs text-gray-500">({filteredLogs.length} entries)</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearLogs}
          >
            <Trash className="h-4 w-4" />
          </Button>
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
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="border-b border-gray-800">
          <TabsList className="p-0 h-9 w-full justify-start bg-transparent border-b border-gray-800 rounded-none">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-background/10 rounded-none border-r border-gray-800"
            >
              All
            </TabsTrigger>
            <TabsTrigger 
              value="network" 
              className="data-[state=active]:bg-background/10 rounded-none border-r border-gray-800"
            >
              Network
            </TabsTrigger>
            <TabsTrigger 
              value="info" 
              className="data-[state=active]:bg-background/10 rounded-none border-r border-gray-800"
            >
              Info
            </TabsTrigger>
            <TabsTrigger 
              value="error" 
              className="data-[state=active]:bg-background/10 rounded-none"
            >
              Errors
            </TabsTrigger>
          </TabsList>
        </div>
        
        <ScrollArea className="h-[calc(50vh-80px)] p-4">
          <TabsContent value="all" className="m-0 p-0">
            {filteredLogs.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No logs available</div>
            ) : (
              filteredLogs.map((log, index) => (
                <div key={index} className="mb-4">
                  {log.type === 'network' ? (
                    renderNetworkLog(log)
                  ) : (
                    <div className={`font-mono text-xs ${log.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                      <span className="text-gray-500">{log.timestamp}</span>
                      <pre className="mt-1 whitespace-pre-wrap">
                        {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="network" className="m-0 p-0">
            {filteredLogs.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No network logs available</div>
            ) : (
              filteredLogs.map((log, index) => (
                <div key={index} className="mb-4">
                  {renderNetworkLog(log)}
                </div>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="info" className="m-0 p-0">
            {filteredLogs.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No info logs available</div>
            ) : (
              filteredLogs.map((log, index) => (
                <div key={index} className="mb-4 font-mono text-xs text-green-400">
                  <span className="text-gray-500">{log.timestamp}</span>
                  <pre className="mt-1 whitespace-pre-wrap">
                    {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="error" className="m-0 p-0">
            {filteredLogs.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No error logs available</div>
            ) : (
              filteredLogs.map((log, index) => (
                <div key={index} className="mb-4 font-mono text-xs text-red-400">
                  <span className="text-gray-500">{log.timestamp}</span>
                  <pre className="mt-1 whitespace-pre-wrap">
                    {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </Card>
  );
};
