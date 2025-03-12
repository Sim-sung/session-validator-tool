import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
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
import { useAuth } from '@/context/AuthContext';
import { useSession, Session } from '@/context/SessionContext';
import { format } from 'date-fns';
import { 
  Calendar as CalendarIcon, 
  Search, 
  RefreshCw, 
  Download, 
  Trash2, 
  ChevronDown, 
  Info, 
  Clock 
} from 'lucide-react';
import { LogWindow } from '@/components/LogWindow';
import { toast } from 'sonner';

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 1) {
    return `${remainingSeconds}s`;
  } else {
    return `${minutes}m ${remainingSeconds}s`;
  }
};

const SessionsPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { 
    sessions, 
    isLoading, 
    totalSessions, 
    currentPage, 
    selectedSessions, 
    searchParams, 
    fetchSessions, 
    selectSession, 
    selectAllSessions, 
    setSearchParams, 
    resetSearchParams,
    setSessions,
    downloadSession
  } = useSession();
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: undefined,
    to: undefined,
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  
  // Check if user is authenticated, if not redirect to landing page
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Fetch sessions only once on mount if authenticated
  useEffect(() => {
    if (isAuthenticated && !initialFetchDone) {
      console.log("Initial sessions fetch");
      fetchSessions();
      setInitialFetchDone(true);
    }
  }, [isAuthenticated, initialFetchDone, fetchSessions]);

  // Update isAllSelected when sessions or selectedSessions change
  useEffect(() => {
    setIsAllSelected(sessions.length > 0 && selectedSessions.length === sessions.length);
  }, [sessions, selectedSessions]);

  const handleToggleAll = () => {
    selectAllSessions(!isAllSelected);
    setIsAllSelected(!isAllSelected);
  };

  const handleViewSessionDetails = (sessionId: string) => {
    navigate(`/metrics/${sessionId}`);
  };

  const deleteSelectedSessions = () => {
    const sessionIdsToDelete = selectedSessions.map((session) => session.id);
    setSessions(sessions.filter((session) => !sessionIdsToDelete.includes(session.id)));
  };

  const downloadSelectedSessions = () => {
    if (selectedSessions.length === 0) {
      toast.error('No sessions selected');
      return;
    }
    
    // If only one session is selected, download it directly
    if (selectedSessions.length === 1) {
      downloadSession(selectedSessions[0].id);
      return;
    }
    
    // For multiple sessions, we would need to download them one by one
    // This could be improved with a batch download API if available
    toast.info(`Downloading ${selectedSessions.length} sessions...`);
    selectedSessions.forEach((session, index) => {
      // Add a small delay to prevent overwhelming the browser with downloads
      setTimeout(() => {
        downloadSession(session.id);
      }, index * 1000);
    });
  };

  const handleDownloadSession = (sessionId: string) => {
    downloadSession(sessionId);
  };

  const toggleSession = (sessionId: string, checked: boolean) => {
    selectSession(sessionId, checked);
  };

  const handleApplyFilters = () => {
    const params = { ...searchParams };
    
    if (dateRange.from) {
      params.dateStart = dateRange.from.getTime();
    }
    
    if (dateRange.to) {
      params.dateEnd = dateRange.to.getTime();
    }
    
    // Add search query logic if needed
    // if (searchQuery) {
    //   // Handle search query
    // }
    
    fetchSessions(params);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sessions</h1>
          <p className="text-muted-foreground">
            View and manage your GameBench sessions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => fetchSessions()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filter sidebar */}
        <Card className="md:col-span-1 glass h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
            <CardDescription>
              Filter sessions by date, keywords, and more.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <div className="grid gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={{
                        from: dateRange.from,
                        to: dateRange.to,
                      }}
                      onSelect={(range) => {
                        if (range?.from && range?.to) {
                          setDateRange({ from: range.from, to: range.to });
                        }
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const now = new Date();
                      const yesterday = new Date(now);
                      yesterday.setDate(yesterday.getDate() - 1);
                      setDateRange({ from: yesterday, to: now });
                    }}
                  >
                    Last 24h
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const now = new Date();
                      const weekAgo = new Date(now);
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      setDateRange({ from: weekAgo, to: now });
                    }}
                  >
                    Last 7 days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const now = new Date();
                      const monthAgo = new Date(now);
                      monthAgo.setMonth(monthAgo.getMonth() - 1);
                      setDateRange({ from: monthAgo, to: now });
                    }}
                  >
                    Last 30 days
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="App, device, user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button size="icon" variant="secondary">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={handleApplyFilters}
              disabled={isLoading}
            >
              Apply Filters
            </Button>
          </CardFooter>
        </Card>
        
        {/* Sessions table */}
        <Card className="md:col-span-3 glass">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">Session List</CardTitle>
                <CardDescription>
                  {isLoading 
                    ? 'Loading sessions...' 
                    : sessions.length === 0 
                      ? 'No sessions found' 
                      : `Showing ${sessions.length} sessions`}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                {selectedSessions.length > 0 && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={downloadSelectedSessions}
                      disabled={isLoading}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download {selectedSessions.length}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setShowDeleteDialog(true)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete {selectedSessions.length}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-12 px-4 text-left align-middle font-medium">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            checked={isAllSelected} 
                            onCheckedChange={handleToggleAll}
                            id="select-all"
                          />
                          <label 
                            htmlFor="select-all"
                            className="text-xs font-medium text-muted-foreground"
                          >
                            SELECT ALL
                          </label>
                        </div>
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium">App</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Device</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Recorded By</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Date</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Duration</th>
                      <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="h-24 text-center">
                          {isLoading ? (
                            <div className="flex justify-center items-center h-full">
                              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full">
                              <Info className="h-10 w-10 text-muted-foreground mb-2" />
                              <p className="text-muted-foreground">No sessions found</p>
                              <Button 
                                variant="link" 
                                onClick={() => fetchSessions()}
                                className="mt-2"
                              >
                                Refresh
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ) : (
                      sessions.map((session: Session) => (
                        <tr 
                          key={session.id} 
                          className="border-b hover:bg-muted/50 transition-colors"
                        >
                          <td className="p-4 align-middle">
                            <Checkbox 
                              checked={session.selected} 
                              onCheckedChange={(checked) => toggleSession(session.id, !!checked)}
                            />
                          </td>
                          <td className="p-4 align-middle">
                            <div className="font-medium">{session.appName}</div>
                            <div className="text-xs text-muted-foreground">v{session.appVersion}</div>
                          </td>
                          <td className="p-4 align-middle">
                            <div className="font-medium">{session.deviceModel}</div>
                            <div className="text-xs text-muted-foreground">{session.manufacturer}</div>
                          </td>
                          <td className="p-4 align-middle">{session.recordedBy}</td>
                          <td className="p-4 align-middle">
                            {format(new Date(session.startTime), "MMM dd, yyyy")}
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(session.startTime), "hh:mm a")}
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span>{formatDuration(session.duration)}</span>
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            <div className="flex items-center space-x-2">
                              <Button 
                                size="sm" 
                                variant="secondary"
                                onClick={() => handleViewSessionDetails(session.id)}
                              >
                                Details
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDownloadSession(session.id)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will delete {selectedSessions.length} selected sessions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                deleteSelectedSessions();
                setShowDeleteDialog(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Add LogWindow at the bottom */}
      <LogWindow />
    </div>
  );
};

export default SessionsPage;
