import React, { useState, useEffect } from 'react';
import { useSession } from '@/context/SessionContext';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, ChevronRight, ChevronDown, Search, Filter } from 'lucide-react';
import { LogWindow } from '@/components/LogWindow';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// Define various field categories to organize the detailed session view
interface FieldCategory {
  name: string;
  fields: {
    key: string;
    label: string;
    format?: (value: any) => string | React.ReactNode;
  }[];
}

// Function to format file size in human-readable format
const formatFileSize = (bytes: number | null | undefined): string => {
  if (bytes === null || bytes === undefined || bytes === 0) return 'N/A';
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

// Function to format timestamp
const formatTimestamp = (timestamp: number | null | undefined): string => {
  if (timestamp === null || timestamp === undefined) return 'N/A';
  return new Date(timestamp).toLocaleString();
};

// Function to format boolean values
const formatBoolean = (value: boolean | null | undefined): React.ReactNode => {
  if (value === null || value === undefined) return <span>N/A</span>;
  return value ? 
    <Badge variant="success" className="bg-green-600">Yes</Badge> : 
    <Badge variant="destructive">No</Badge>;
};

const LogsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { sessions, fetchSessions, isLoading } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});

  // Define the field categories
  const fieldCategories: FieldCategory[] = [
    {
      name: 'Basic Info',
      fields: [
        { key: 'id', label: 'Session ID' },
        { key: 'uuid', label: 'UUID' },
        { key: 'timePushed', label: 'Time Pushed', format: formatTimestamp },
        { key: 'timePushedTimestamp', label: 'Time Pushed (ISO)' },
        { key: 'sessionDate', label: 'Session Date', format: formatTimestamp },
        { key: 'sessionDateTimestamp', label: 'Session Date (ISO)' },
        { key: 'timePlayed', label: 'Time Played (s)' },
        { key: 'isActive', label: 'Is Active', format: formatBoolean },
        { key: 'isCharging', label: 'Is Charging', format: formatBoolean },
        { key: 'imported', label: 'Imported', format: formatBoolean },
        { key: 'zipName', label: 'Zip Name' },
        { key: 'software', label: 'Software Version' },
        { key: 'softwareVersions', label: 'Detailed Software Version' },
      ]
    },
    {
      name: 'App',
      fields: [
        { key: 'app.name', label: 'App Name' },
        { key: 'app.version', label: 'App Version' },
        { key: 'app.packageName', label: 'Package Name' },
        { key: 'app.versionCode', label: 'Version Code' },
        { key: 'app.versionCodeStr', label: 'Version Code String' },
        { key: 'app.iconUrl', label: 'Icon URL' },
        { key: 'app.lastUpdated', label: 'Last Updated' },
        { key: 'app.developer', label: 'Developer' },
        { key: 'appVersionCode', label: 'App Version Code' },
        { key: 'appCache', label: 'App Cache', format: formatFileSize },
        { key: 'appData', label: 'App Data', format: formatFileSize },
        { key: 'appSize', label: 'App Size', format: formatFileSize },
        { key: 'appLaunchTimeMs', label: 'App Launch Time (ms)' },
      ]
    },
    {
      name: 'Device',
      fields: [
        { key: 'device.model', label: 'Model' },
        { key: 'device.name', label: 'Name' },
        { key: 'device.manufacturer', label: 'Manufacturer' },
        { key: 'device.brand', label: 'Brand' },
        { key: 'device.androidVersionRelease', label: 'Android Version' },
        { key: 'device.androidSdkInt', label: 'Android SDK' },
        { key: 'device.androidIncremental', label: 'Android Incremental' },
        { key: 'device.board', label: 'Board' },
        { key: 'device.industrialName', label: 'Industrial Name' },
        { key: 'device.serial', label: 'Serial Number' },
        { key: 'device.fingerPrint', label: 'Fingerprint' },
        { key: 'device.screenWidth', label: 'Screen Width' },
        { key: 'device.screenHeight', label: 'Screen Height' },
        { key: 'device.batteryVoltage', label: 'Battery Voltage' },
        { key: 'device.batteryTech', label: 'Battery Technology' },
        { key: 'device.hardware', label: 'Hardware' },
        { key: 'device.buildId', label: 'Build ID' },
        { key: 'device.buildHost', label: 'Build Host' },
        { key: 'device.refreshRate', label: 'Refresh Rate' },
        { key: 'device.batteryCapacity', label: 'Battery Capacity' },
        { key: 'device.baseband', label: 'Baseband' },
        { key: 'device.operatingSystem', label: 'Operating System' },
        { key: 'device.friendlyManufacturer', label: 'Friendly Manufacturer' },
        { key: 'device.friendlyModel', label: 'Friendly Model' },
      ]
    },
    {
      name: 'CPU & GPU',
      fields: [
        { key: 'device.cpu.name', label: 'CPU Name' },
        { key: 'device.cpu.arch', label: 'CPU Architecture' },
        { key: 'device.cpu.numCores', label: 'CPU Cores' },
        { key: 'device.cpu.maxFreq', label: 'CPU Max Frequency' },
        { key: 'device.cpu.minFreq', label: 'CPU Min Frequency' },
        { key: 'device.gpu.vendor', label: 'GPU Vendor' },
        { key: 'device.gpu.renderer', label: 'GPU Renderer' },
        { key: 'device.gpu.glVersion', label: 'OpenGL Version' },
      ]
    },
    {
      name: 'User & Owner',
      fields: [
        { key: 'user.userPlayAccount', label: 'User Email' },
        { key: 'user.dataSet', label: 'Data Set' },
        { key: 'user.deleted', label: 'User Deleted', format: formatBoolean },
        { key: 'originalUser.userPlayAccount', label: 'Original User Email' },
        { key: 'originalUser.dataSet', label: 'Original Data Set' },
        { key: 'owners.companyId', label: 'Company ID' },
      ]
    },
    {
      name: 'Performance: FPS',
      fields: [
        { key: 'fpsMin', label: 'FPS Min' },
        { key: 'fpsMax', label: 'FPS Max' },
        { key: 'fpsMedian', label: 'FPS Median' },
        { key: 'fpsStability', label: 'FPS Stability' },
        { key: 'stabIndex', label: 'Stability Index' },
        { key: 'fpsOnePercentLow', label: '1% Low FPS' },
        { key: 'frametimesMessageType', label: 'Frametimes Message Type' },
      ]
    },
    {
      name: 'Performance: CPU & GPU',
      fields: [
        { key: 'cpuUsageMin', label: 'CPU Usage Min (%)' },
        { key: 'cpuUsageMedian', label: 'CPU Usage Median (%)' },
        { key: 'cpuUsageAvg', label: 'CPU Usage Avg (%)' },
        { key: 'cpuUsageMax', label: 'CPU Usage Max (%)' },
        { key: 'totalCpuUsageAvg', label: 'Total CPU Usage Avg (%)' },
        { key: 'gpuUsageMin', label: 'GPU Usage Min (%)' },
        { key: 'gpuUsageMedian', label: 'GPU Usage Median (%)' },
        { key: 'gpuUsageAvg', label: 'GPU Usage Avg (%)' },
        { key: 'gpuUsageMax', label: 'GPU Usage Max (%)' },
        { key: 'hwcpipeStatus', label: 'HWCPipe Status' },
      ]
    },
    {
      name: 'Performance: Memory',
      fields: [
        { key: 'memUsageMin', label: 'Memory Usage Min' },
        { key: 'memUsageMedian', label: 'Memory Usage Median' },
        { key: 'memUsageAvg', label: 'Memory Usage Avg' },
        { key: 'memUsageMax', label: 'Memory Usage Max' },
        { key: 'androidMemUsageMin', label: 'Android Memory Min (MB)' },
        { key: 'androidMemUsageMedian', label: 'Android Memory Median (MB)' },
        { key: 'androidMemUsageAvg', label: 'Android Memory Avg (MB)' },
        { key: 'androidMemUsageMax', label: 'Android Memory Max (MB)' },
        { key: 'totalDeviceMemory', label: 'Total Device Memory', format: formatFileSize },
      ]
    },
    {
      name: 'Performance: Battery & Power',
      fields: [
        { key: 'firstBat', label: 'First Battery Level (%)' },
        { key: 'lastBat', label: 'Last Battery Level (%)' },
        { key: 'powerUsage', label: 'Power Usage' },
        { key: 'mWAvg', label: 'Average Power (mW)' },
        { key: 'mAh', label: 'Battery Drain (mAh)' },
        { key: 'mAAvg', label: 'Average Current (mA)' },
        { key: 'expectedBatteryLifeDuration', label: 'Expected Battery Life' },
      ]
    },
    {
      name: 'Performance: Janks',
      fields: [
        { key: 'bigJanksCount', label: 'Big Janks Count' },
        { key: 'bigJanks10Mins', label: 'Big Janks per 10 mins' },
        { key: 'smallJanksCount', label: 'Small Janks Count' },
        { key: 'smallJanks10Mins', label: 'Small Janks per 10 mins' },
        { key: 'janksCount', label: 'Total Janks Count' },
        { key: 'janks10Mins', label: 'Janks per 10 mins' },
      ]
    },
    {
      name: 'Network',
      fields: [
        { key: 'networkAppUsage.appTotalDataReceived', label: 'Total Data Received', format: formatFileSize },
        { key: 'networkAppUsage.appTotalDataSent', label: 'Total Data Sent', format: formatFileSize },
        { key: 'simOperator', label: 'SIM Operator' },
        { key: 'networkOperatorName', label: 'Network Operator' },
      ]
    },
    {
      name: 'Files & Artifacts',
      fields: [
        { key: 'zipBackupFile.type', label: 'Zip Backup Type' },
        { key: 'zipBackupFile.bucket', label: 'Zip Backup Bucket' },
        { key: 'zipBackupFile.path', label: 'Zip Backup Path' },
        { key: 'zipBackupFile.size', label: 'Zip Backup Size', format: formatFileSize },
        { key: 'zipBackupFile.md5Hash', label: 'Zip Backup MD5' },
        { key: 'logcatFile.type', label: 'Logcat File Type' },
        { key: 'logcatFile.bucket', label: 'Logcat Bucket' },
        { key: 'logcatFile.path', label: 'Logcat Path' },
        { key: 'logcatFile.size', label: 'Logcat Size', format: formatFileSize },
        { key: 'logcatFile.md5Hash', label: 'Logcat MD5' },
        { key: 'logFile.format', label: 'Log Format' },
        { key: 'logFile.filename', label: 'Log Filename' },
        { key: 'appIconFile.type', label: 'App Icon File Type' },
        { key: 'appIconFile.bucket', label: 'App Icon Bucket' },
        { key: 'appIconFile.path', label: 'App Icon Path' },
        { key: 'appIconFile.size', label: 'App Icon Size', format: formatFileSize },
        { key: 'appIconFile.md5Hash', label: 'App Icon MD5' },
        { key: 'minAbsTSCharts', label: 'Min Abs TS Charts' },
      ]
    },
    {
      name: 'Other Fields',
      fields: [
        { key: 'collectionId', label: 'Collection ID' },
        { key: 'metrics', label: 'Available Metrics', format: (metrics) => 
          metrics ? (
            <div className="flex flex-wrap gap-1">
              {Object.entries(metrics).map(([key, value]) => 
                value ? <Badge key={key} variant="outline" className="text-xs">{key}</Badge> : null
              )}
            </div>
          ) : <span>N/A</span>
        },
        { key: 'tags', label: 'Tags', format: (tags) => 
          tags ? (
            <div className="flex flex-wrap gap-1">
              {Object.entries(tags).map(([key, value]) => 
                <Badge key={key} variant="outline" className="text-xs">{key}: {value}</Badge>
              )}
            </div>
          ) : <span>N/A</span>
        },
        { key: 'strictMode', label: 'Strict Mode', format: formatBoolean },
        { key: 'internalUserId', label: 'Internal User ID' },
        { key: 'appTrialVersion', label: 'App Trial Version', format: formatBoolean },
        { key: 'appTrialExpired', label: 'App Trial Expired', format: formatBoolean },
        { key: 'robust', label: 'Robust', format: formatBoolean },
        { key: 'uploadUuid', label: 'Upload UUID' },
        { key: 'isIphone8Onwards', label: 'Is iPhone 8+', format: formatBoolean },
      ]
    },
    {
      name: 'Additional Files',
      fields: [
        { key: 'additionalFiles', label: 'Additional Files', format: (files) => 
          files && Array.isArray(files) && files.length > 0 ? (
            <div className="space-y-2">
              {files.map((file, index) => (
                <div key={index} className="border rounded p-2">
                  <div><strong>Filename:</strong> {file.filename}</div>
                  <div><strong>Type:</strong> {file.type || 'N/A'}</div>
                  <div><strong>Size:</strong> {formatFileSize(file.meta?.size)}</div>
                  <div><strong>MD5:</strong> {file.meta?.md5Hash || 'N/A'}</div>
                </div>
              ))}
            </div>
          ) : <span>None</span>
        }
      ]
    }
  ];

  // Generate a flat list of all fields for filtering
  const allFields = fieldCategories.flatMap(category => 
    category.fields.map(field => ({ 
      ...field, 
      category: category.name 
    }))
  );

  // Check authentication and redirect if needed
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Initialize visible fields - showing all by default
  useEffect(() => {
    const initial: Record<string, boolean> = {};
    allFields.forEach(field => {
      initial[field.key] = true;
    });
    setVisibleFields(initial);
  }, []);

  // Fetch sessions on component mount if authenticated
  useEffect(() => {
    if (isAuthenticated && sessions.length === 0) {
      fetchSessions();
    }
  }, [isAuthenticated, fetchSessions, sessions.length]);

  // Function to filter sessions based on the search term
  const filteredSessions = sessions.filter(session => {
    if (!searchTerm) return true;
    
    // Search across all session fields
    const searchLower = searchTerm.toLowerCase();
    
    // Search in session ID and app name
    if (session.id.toLowerCase().includes(searchLower)) return true;
    if (session.app?.name?.toLowerCase().includes(searchLower)) return true;
    if (session.app?.packageName?.toLowerCase().includes(searchLower)) return true;
    if (session.device?.model?.toLowerCase().includes(searchLower)) return true;
    if (session.device?.manufacturer?.toLowerCase().includes(searchLower)) return true;
    
    return false;
  });

  // Function to get a specific deeply nested value from the session object
  const getNestedValue = (session: any, key: string): any => {
    const parts = key.split('.');
    let value = session;
    
    for (const part of parts) {
      if (value === null || value === undefined) return null;
      value = value[part];
    }
    
    return value;
  };

  // Function to toggle a session's expanded state
  const toggleSession = (sessionId: string) => {
    if (expandedSessionId === sessionId) {
      setExpandedSessionId(null);
    } else {
      setExpandedSessionId(sessionId);
    }
  };

  // Function to toggle field visibility
  const toggleFieldVisibility = (key: string) => {
    setVisibleFields(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Function to toggle all fields in a category
  const toggleCategoryFields = (categoryName: string, value: boolean) => {
    const newVisibleFields = { ...visibleFields };
    
    // Find all fields in this category
    const fieldsInCategory = allFields.filter(field => field.category === categoryName);
    
    // Set visibility for all fields in this category
    fieldsInCategory.forEach(field => {
      newVisibleFields[field.key] = value;
    });
    
    setVisibleFields(newVisibleFields);
  };

  // Function to reset field visibility
  const resetFieldVisibility = () => {
    const initial: Record<string, boolean> = {};
    allFields.forEach(field => {
      initial[field.key] = true;
    });
    setVisibleFields(initial);
  };

  // Function to safely format unknown values for display
  const formatValue = (value: unknown): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">N/A</span>;
    }
    
    if (Array.isArray(value)) {
      return <span>{JSON.stringify(value)}</span>;
    }
    
    if (typeof value === 'object') {
      return <span>{JSON.stringify(value)}</span>;
    }
    
    if (typeof value === 'boolean') {
      return <span>{value ? 'Yes' : 'No'}</span>;
    }
    
    return <span>{String(value)}</span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Session Logs & Details</h1>
        <p className="text-muted-foreground">
          View detailed logs and raw data from your GameBench sessions
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>Session Data</CardTitle>
              <CardDescription>
                Raw session data from the GameBench API
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search sessions..."
                  className="pl-8 w-full sm:w-[200px] md:w-[260px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={() => fetchSessions()} disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Refresh Data'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">
                {isLoading ? 
                  'Loading sessions...' : 
                  'No sessions found. Go to the Sessions tab to fetch sessions.'}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-col md:flex-row gap-4 justify-between">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm font-medium">Field Category:</span>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {fieldCategories.map(category => (
                        <SelectItem key={category.name} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={resetFieldVisibility}
                    className="ml-2"
                  >
                    Reset Filters
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Showing {filteredSessions.length} of {sessions.length} sessions
                </div>
              </div>
              
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[30px]"></TableHead>
                      <TableHead>Session ID</TableHead>
                      <TableHead>App</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSessions.map(session => (
                      <React.Fragment key={session.id}>
                        <TableRow 
                          onClick={() => toggleSession(session.id)}
                          className="cursor-pointer hover:bg-muted/50"
                        >
                          <TableCell>
                            {expandedSessionId === session.id ? 
                              <ChevronDown className="h-4 w-4" /> : 
                              <ChevronRight className="h-4 w-4" />}
                          </TableCell>
                          <TableCell className="font-medium">
                            {session.id.substring(0, 8)}...
                          </TableCell>
                          <TableCell>
                            {session.app?.name || 'Unknown'}
                            <div className="text-xs text-muted-foreground">{session.app?.version}</div>
                          </TableCell>
                          <TableCell>
                            {session.device?.model || 'Unknown'}
                            <div className="text-xs text-muted-foreground">{session.device?.manufacturer}</div>
                          </TableCell>
                          <TableCell>
                            {session.sessionDate ? new Date(session.sessionDate).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {session.timePlayed ? Math.round(session.timePlayed / 60) : 'N/A'} min
                          </TableCell>
                        </TableRow>
                        
                        {expandedSessionId === session.id && (
                          <TableRow>
                            <TableCell colSpan={6} className="p-0">
                              <div className="p-4 bg-muted/20">
                                <div className="mb-4">
                                  <h3 className="text-lg font-semibold">Session Details</h3>
                                  <div className="text-sm text-muted-foreground">
                                    Full data for session ID: {session.id}
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 gap-4">
                                  {/* Field visibility controls */}
                                  <Card className="mb-4">
                                    <CardHeader className="py-2">
                                      <CardTitle className="text-base">Field Visibility Controls</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {fieldCategories.map(category => (
                                          <div key={category.name} className="border rounded p-2">
                                            <div className="flex items-center space-x-2 mb-1">
                                              <Checkbox 
                                                id={`category-${category.name}`}
                                                checked={category.fields.every(field => visibleFields[field.key])}
                                                onCheckedChange={(checked) => {
                                                  toggleCategoryFields(category.name, !!checked);
                                                }}
                                              />
                                              <label 
                                                htmlFor={`category-${category.name}`}
                                                className="text-sm font-medium"
                                              >
                                                {category.name}
                                              </label>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </CardContent>
                                  </Card>
                                  
                                  {/* Render field categories as accordion items */}
                                  <Accordion type="multiple" defaultValue={['Basic Info']}>
                                    {fieldCategories
                                      .filter(category => selectedCategory === 'all' || category.name === selectedCategory)
                                      .map(category => {
                                        // Get visible fields for this category
                                        const visibleCategoryFields = category.fields
                                          .filter(field => visibleFields[field.key]);
                                        
                                        if (visibleCategoryFields.length === 0) return null;
                                          
                                        return (
                                          <AccordionItem key={category.name} value={category.name}>
                                            <AccordionTrigger className="text-base font-medium">
                                              {category.name}
                                            </AccordionTrigger>
                                            <AccordionContent>
                                              <ScrollArea className="h-[400px] rounded-md border p-2">
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                                                  {visibleCategoryFields.map(field => {
                                                    const value = getNestedValue(session, field.key);
                                                    return (
                                                      <div key={field.key} className="py-1">
                                                        <div className="text-sm font-medium">{field.label}</div>
                                                        <div className="text-sm break-words">
                                                          {field.format ? field.format(value) : 
                                                            (value === null || value === undefined ? 
                                                              <span className="text-muted-foreground">N/A</span> : 
                                                              typeof value === 'object' ? 
                                                                JSON.stringify(value) : String(value)
                                                            )
                                                          }
                                                        </div>
                                                      </div>
                                                    );
                                                  })}
                                                </ScrollArea>
                                            </AccordionContent>
                                          </AccordionItem>
                                        );
                                      })}
                                  </Accordion>
                                </div>
                                
                                <div className="mt-4 flex justify-end">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setExpandedSessionId(null)}
                                  >
                                    Close Details
                                  </Button>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                    
                    {filteredSessions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No matching sessions found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      <LogWindow />
    </div>
  );
};

export default LogsPage;
