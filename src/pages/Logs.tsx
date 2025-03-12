
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
  FileDown, 
  Search, 
  Trash2, 
  Clock, 
  AlertCircle, 
  Info, 
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { LogWindow } from '@/components/LogWindow';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'success';
  source: string;
  message: string;
  details?: string;
}

// Mock data for demonstration
const generateMockLogs = (): LogEntry[] => {
  const mockLogs: LogEntry[] = [];
  const now = new Date();
  
  // Generate random logs for the last 7 days
  for (let i = 0; i < 50; i++) {
    const timestamp = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    const levels = ['info', 'warning', 'error', 'success'] as const;
    const level = levels[Math.floor(Math.random() * levels.length)];
    
    let source = '';
    let message = '';
    
    switch (Math.floor(Math.random() * 4)) {
      case 0:
        source = 'API Request';
        message = level === 'error' 
          ? 'Failed to fetch sessions: 400 Bad Request' 
          : level === 'warning' 
            ? 'Slow API response (>2s): GET /sessions'
            : 'Successfully fetched sessions data';
        break;
      case 1:
        source = 'Authentication';
        message = level === 'error' 
          ? 'Invalid API credentials' 
          : level === 'warning' 
            ? 'Session token expired'
            : 'User authenticated successfully';
        break;
      case 2:
        source = 'Session Download';
        message = level === 'error' 
          ? 'Failed to download session data' 
          : level === 'warning' 
            ? 'Incomplete session data received'
            : 'Session data downloaded successfully';
        break;
      case 3:
        source = 'Validation';
        message = level === 'error' 
          ? 'Validation failed for session #12345' 
          : level === 'warning' 
            ? 'Missing data points in validation results'
            : 'Session validated successfully';
        break;
    }
    
    mockLogs.push({
      id: `log-${i}`,
      timestamp,
      level,
      source,
      message,
      details: level === 'error' ? 'Error stack trace or additional details would appear here' : undefined
    });
  }
  
  return mockLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

const Logs = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [allLogs, setAllLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  
  // Check if user is authenticated, if not redirect to landing page
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);
  
  // Initialize logs
  useEffect(() => {
    const logs = generateMockLogs();
    setAllLogs(logs);
    setFilteredLogs(logs);
  }, []);
  
  // Filter logs when search term or filter level changes
  useEffect(() => {
    let filtered = allLogs;
    
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.source.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterLevel !== 'all') {
      filtered = filtered.filter(log => log.level === filterLevel);
    }
    
    setFilteredLogs(filtered);
  }, [searchTerm, filterLevel, allLogs]);
  
  const clearLogs = () => {
    setAllLogs([]);
    setFilteredLogs([]);
    toast.success('Logs cleared successfully');
  };
  
  const exportLogs = () => {
    if (filteredLogs.length === 0) {
      toast.error('No logs to export');
      return;
    }
    
    // Format the logs as a CSV string
    const headers = "Timestamp,Level,Source,Message\n";
    const rows = filteredLogs.map(log => 
      `${log.timestamp.toISOString()},${log.level},${log.source},"${log.message.replace(/"/g, '""')}"`
    ).join('\n');
    
    const csv = headers + rows;
    
    // Create and download the CSV file
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'api_logs.csv';
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast.success('Logs exported successfully');
  };
  
  const toggleLogExpansion = (logId: string) => {
    setExpandedLogId(expandedLogId === logId ? null : logId);
  };
  
  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Logs & Reports</h1>
        <p className="text-muted-foreground">
          View and manage API call logs and error tracking
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>API Request Logs</CardTitle>
              <CardDescription>
                Tracking of all API calls, responses, and errors
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={exportLogs} disabled={filteredLogs.length === 0}>
                <FileDown className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="destructive" onClick={clearLogs} disabled={allLogs.length === 0}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search logs..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="filter-level" className="sr-only">Filter by Level</Label>
              <select
                id="filter-level"
                className="w-full p-2 border rounded"
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="success">Success</option>
              </select>
            </div>
          </div>
          
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">Level</TableHead>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead className="w-[150px]">Source</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <React.Fragment key={log.id}>
                      <TableRow 
                        className={`cursor-pointer hover:bg-muted/50 ${log.level === 'error' ? 'bg-red-500/10' : log.level === 'warning' ? 'bg-yellow-500/10' : ''}`}
                        onClick={() => toggleLogExpansion(log.id)}
                      >
                        <TableCell>{getLevelIcon(log.level)}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span>{log.timestamp.toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>{log.source}</TableCell>
                        <TableCell>{log.message}</TableCell>
                      </TableRow>
                      {expandedLogId === log.id && log.details && (
                        <TableRow className="bg-muted/20">
                          <TableCell colSpan={4} className="p-4">
                            <div className="p-2 bg-muted/40 rounded text-sm font-mono whitespace-pre-wrap">
                              {log.details}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Showing {filteredLogs.length} of {allLogs.length} logs
        </CardFooter>
      </Card>
      
      <LogWindow />
    </div>
  );
};

export default Logs;
