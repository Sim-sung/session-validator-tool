
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { useSession, SessionMetrics } from '@/context/SessionContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Download, 
  Save, 
  RefreshCw, 
  LineChart as LineChartIcon, 
  Cpu, 
  Smartphone, 
  Battery, 
  WifiIcon
} from 'lucide-react';

// Helper function to format the data for charts
const formatDataForChart = (data: number[] | undefined, type: string) => {
  if (!data) return [];
  
  return data.map((value, index) => ({
    timestamp: index,
    [type]: value
  }));
};

const MetricsPage = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { isAuthenticated } = useAuth();
  const { fetchSessionMetrics, saveSessionMetricsForValidation, downloadSession } = useSession();
  
  const [isLoading, setIsLoading] = useState(false);
  const [sessionMetrics, setSessionMetrics] = useState<SessionMetrics | null>(null);
  const [activeTab, setActiveTab] = useState('summary');
  
  // Check if user is authenticated, if not redirect to landing page
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Fetch session metrics when sessionId changes
  useEffect(() => {
    if (sessionId) {
      loadSessionMetrics(sessionId);
    }
  }, [sessionId]);

  const loadSessionMetrics = async (id: string) => {
    setIsLoading(true);
    try {
      const metrics = await fetchSessionMetrics(id);
      if (metrics) {
        setSessionMetrics(metrics);
      }
    } catch (error) {
      console.error('Error loading session metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveForValidation = () => {
    if (sessionMetrics) {
      saveSessionMetricsForValidation(sessionMetrics);
    }
  };

  const handleDownloadSession = () => {
    if (sessionId) {
      downloadSession(sessionId);
    } else {
      toast.error('No session ID available');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/sessions')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sessions
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Session Metrics</h1>
            <p className="text-muted-foreground">
              {sessionMetrics ? `${sessionMetrics.appDetails.name} on ${sessionMetrics.deviceDetails.model}` : 'Loading...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => sessionId && loadSessionMetrics(sessionId)}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadSession}
            disabled={!sessionMetrics || isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button
            size="sm"
            onClick={handleSaveForValidation}
            disabled={!sessionMetrics || isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            Save for Validation
          </Button>
        </div>
      </div>
      
      {isLoading && !sessionMetrics ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading session metrics...</p>
          </div>
        </div>
      ) : !sessionMetrics ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <LineChartIcon className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <p className="text-lg font-medium">No session selected</p>
              <p className="text-muted-foreground">Select a session from the sessions page to view metrics.</p>
              <Button className="mt-4" onClick={() => navigate('/sessions')}>
                Go to Sessions
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Session info sidebar */}
          <Card className="md:col-span-1 glass h-fit">
            <CardHeader>
              <CardTitle className="text-lg">Session Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">App Details</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span>{sessionMetrics.appDetails.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Version:</span>
                    <span>{sessionMetrics.appDetails.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Package:</span>
                    <span className="truncate max-w-[150px]" title={sessionMetrics.appDetails.package}>
                      {sessionMetrics.appDetails.package}
                    </span>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium mb-2">Device Details</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Model:</span>
                    <span>{sessionMetrics.deviceDetails.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Manufacturer:</span>
                    <span>{sessionMetrics.deviceDetails.manufacturer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GPU:</span>
                    <span>{sessionMetrics.deviceDetails.gpuType}</span>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium mb-2">User Details</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="truncate max-w-[150px]" title={sessionMetrics.userDetails.email}>
                      {sessionMetrics.userDetails.email}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Username:</span>
                    <span>{sessionMetrics.userDetails.username}</span>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium mb-2">Session Details</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span>{format(new Date(sessionMetrics.timestamp), "MMM dd, yyyy")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time:</span>
                    <span>{format(new Date(sessionMetrics.timestamp), "hh:mm a")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span>{Math.floor(sessionMetrics.duration / 60)}m {sessionMetrics.duration % 60}s</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleSaveForValidation}
              >
                <Save className="h-4 w-4 mr-2" />
                Save for Validation
              </Button>
            </CardFooter>
          </Card>
          
          {/* Metrics content */}
          <Card className="md:col-span-3 glass">
            <CardHeader>
              <CardTitle className="text-lg">Performance Metrics</CardTitle>
              <CardDescription>
                Visualize performance data for this session
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="fps" className="flex items-center">
                    <LineChartIcon className="h-4 w-4 mr-2" />
                    FPS
                  </TabsTrigger>
                  <TabsTrigger value="cpu" className="flex items-center">
                    <Cpu className="h-4 w-4 mr-2" />
                    CPU
                  </TabsTrigger>
                  <TabsTrigger value="gpu" className="flex items-center">
                    <Smartphone className="h-4 w-4 mr-2" />
                    GPU
                  </TabsTrigger>
                  <TabsTrigger value="battery" className="flex items-center">
                    <Battery className="h-4 w-4 mr-2" />
                    Battery
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="fps" className="space-y-4">
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={formatDataForChart(sessionMetrics.fps, 'fps')}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="timestamp" label={{ value: 'Time (s)', position: 'insideBottomRight', offset: -10 }} />
                        <YAxis label={{ value: 'FPS', angle: -90, position: 'insideLeft' }} />
                        <Tooltip 
                          formatter={(value) => [`${value} FPS`, 'Frame Rate']}
                          labelFormatter={(label) => `Time: ${label}s`}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="fps" stroke="#3b82f6" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="p-4 bg-muted/30 rounded-md">
                    <h3 className="text-sm font-medium mb-2">FPS Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white dark:bg-slate-800 p-3 rounded-md shadow-subtle">
                        <div className="text-sm text-muted-foreground">Average FPS</div>
                        <div className="text-2xl font-semibold">
                          {sessionMetrics.fps ? Math.round(sessionMetrics.fps.reduce((sum, fps) => sum + fps, 0) / sessionMetrics.fps.length) : 'N/A'}
                        </div>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-3 rounded-md shadow-subtle">
                        <div className="text-sm text-muted-foreground">Min FPS</div>
                        <div className="text-2xl font-semibold">
                          {sessionMetrics.fps ? Math.min(...sessionMetrics.fps) : 'N/A'}
                        </div>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-3 rounded-md shadow-subtle">
                        <div className="text-sm text-muted-foreground">Max FPS</div>
                        <div className="text-2xl font-semibold">
                          {sessionMetrics.fps ? Math.max(...sessionMetrics.fps) : 'N/A'}
                        </div>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-3 rounded-md shadow-subtle">
                        <div className="text-sm text-muted-foreground">Stability</div>
                        <div className="text-2xl font-semibold">
                          {sessionMetrics.fps ? `${Math.round((1 - (Math.max(...sessionMetrics.fps) - Math.min(...sessionMetrics.fps)) / Math.max(...sessionMetrics.fps)) * 100)}%` : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="cpu" className="space-y-4">
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={formatDataForChart(sessionMetrics.cpu, 'cpu')}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="timestamp" label={{ value: 'Time (s)', position: 'insideBottomRight', offset: -10 }} />
                        <YAxis label={{ value: 'CPU (%)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip 
                          formatter={(value) => [`${value}%`, 'CPU Usage']}
                          labelFormatter={(label) => `Time: ${label}s`}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="cpu" stroke="#ef4444" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="p-4 bg-muted/30 rounded-md">
                    <h3 className="text-sm font-medium mb-2">CPU Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-white dark:bg-slate-800 p-3 rounded-md shadow-subtle">
                        <div className="text-sm text-muted-foreground">Average CPU</div>
                        <div className="text-2xl font-semibold">
                          {sessionMetrics.cpu ? `${Math.round(sessionMetrics.cpu.reduce((sum, cpu) => sum + cpu, 0) / sessionMetrics.cpu.length)}%` : 'N/A'}
                        </div>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-3 rounded-md shadow-subtle">
                        <div className="text-sm text-muted-foreground">Peak CPU</div>
                        <div className="text-2xl font-semibold">
                          {sessionMetrics.cpu ? `${Math.max(...sessionMetrics.cpu)}%` : 'N/A'}
                        </div>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-3 rounded-md shadow-subtle">
                        <div className="text-sm text-muted-foreground">Min CPU</div>
                        <div className="text-2xl font-semibold">
                          {sessionMetrics.cpu ? `${Math.min(...sessionMetrics.cpu)}%` : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="gpu" className="space-y-4">
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={formatDataForChart(sessionMetrics.gpu, 'gpu')}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="timestamp" label={{ value: 'Time (s)', position: 'insideBottomRight', offset: -10 }} />
                        <YAxis label={{ value: 'GPU (%)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip 
                          formatter={(value) => [`${value}%`, 'GPU Usage']}
                          labelFormatter={(label) => `Time: ${label}s`}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="gpu" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="p-4 bg-muted/30 rounded-md">
                    <h3 className="text-sm font-medium mb-2">GPU Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-white dark:bg-slate-800 p-3 rounded-md shadow-subtle">
                        <div className="text-sm text-muted-foreground">Average GPU</div>
                        <div className="text-2xl font-semibold">
                          {sessionMetrics.gpu ? `${Math.round(sessionMetrics.gpu.reduce((sum, gpu) => sum + gpu, 0) / sessionMetrics.gpu.length)}%` : 'N/A'}
                        </div>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-3 rounded-md shadow-subtle">
                        <div className="text-sm text-muted-foreground">Peak GPU</div>
                        <div className="text-2xl font-semibold">
                          {sessionMetrics.gpu ? `${Math.max(...sessionMetrics.gpu)}%` : 'N/A'}
                        </div>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-3 rounded-md shadow-subtle">
                        <div className="text-sm text-muted-foreground">GPU Type</div>
                        <div className="text-lg font-semibold">
                          {sessionMetrics.deviceDetails.gpuType}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="battery" className="space-y-4">
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={formatDataForChart(sessionMetrics.battery, 'battery')}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="timestamp" label={{ value: 'Time (s)', position: 'insideBottomRight', offset: -10 }} />
                        <YAxis label={{ value: 'Battery (%)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip 
                          formatter={(value) => [`${value}%`, 'Battery Level']}
                          labelFormatter={(label) => `Time: ${label}s`}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="battery" stroke="#10b981" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="p-4 bg-muted/30 rounded-md">
                    <h3 className="text-sm font-medium mb-2">Battery Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-white dark:bg-slate-800 p-3 rounded-md shadow-subtle">
                        <div className="text-sm text-muted-foreground">Start Level</div>
                        <div className="text-2xl font-semibold">
                          {sessionMetrics.battery ? `${sessionMetrics.battery[0]}%` : 'N/A'}
                        </div>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-3 rounded-md shadow-subtle">
                        <div className="text-sm text-muted-foreground">End Level</div>
                        <div className="text-2xl font-semibold">
                          {sessionMetrics.battery ? `${sessionMetrics.battery[sessionMetrics.battery.length - 1]}%` : 'N/A'}
                        </div>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-3 rounded-md shadow-subtle">
                        <div className="text-sm text-muted-foreground">Drain Rate</div>
                        <div className="text-2xl font-semibold">
                          {sessionMetrics.battery ? 
                            `${((sessionMetrics.battery[0] - sessionMetrics.battery[sessionMetrics.battery.length - 1]) / (sessionMetrics.duration / 3600)).toFixed(1)}%/h` 
                            : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MetricsPage;
