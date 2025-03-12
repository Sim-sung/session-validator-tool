import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/context/SessionContext';
import { Session } from '@/types/validation';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

const SessionsPage = () => {
  const navigate = useNavigate();
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
    downloadSession,
    deleteSession,
  } = useSession();

  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: searchParams.dateStart ? new Date(searchParams.dateStart) : undefined,
    to: searchParams.dateEnd ? new Date(searchParams.dateEnd) : undefined,
  });

  useEffect(() => {
    const allSelected = sessions.length > 0 && sessions.every(session => session.selected);
    setIsAllSelected(allSelected);
  }, [sessions]);

  const handlePageChange = (newPage: number) => {
    setSearchParams({ ...searchParams, page: newPage });
  };

  const handleSearch = (query: string) => {
    setSearchParams({ ...searchParams, searchQuery: query, page: 1 });
  };

  const handleDownload = async (sessionId: string) => {
    try {
      await downloadSession(sessionId);
      toast.success('Session downloaded successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to download session.');
    }
  };

  const handleDelete = async () => {
    try {
      for (const session of selectedSessions) {
        await deleteSession(session.id);
      }
      toast.success('Sessions deleted successfully!');
      setDeleteOpen(false);
      resetSearchParams();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete sessions.');
    }
  };

  const handleDateChange = (newDateRange: DateRange | undefined) => {
    setDateRange(newDateRange);
    setSearchParams({
      ...searchParams,
      dateStart: newDateRange?.from?.getTime(),
      dateEnd: newDateRange?.to?.getTime(),
      page: 1,
    });
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="glass">
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
          <CardDescription>
            View and manage your game sessions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="search">Search:</Label>
              <Input
                type="search"
                id="search"
                placeholder="Search sessions..."
                className="max-w-sm"
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[300px] justify-start text-left font-normal",
                      !dateRange?.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        `${format(dateRange.from, "LLL dd, y")} - ${format(
                          dateRange.to,
                          "LLL dd, y"
                        )}`
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
                    defaultMonth={dateRange?.from ? dateRange?.from : new Date()}
                    selected={dateRange}
                    onSelect={handleDateChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date('2023-01-01')
                    }
                    numberOfMonths={2}
                    pagedNavigation
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 relative overflow-x-auto">
        {isLoading ? (
          <p>Loading sessions...</p>
        ) : (
          <Table>
            <TableCaption>A list of your game sessions.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={isAllSelected}
                    aria-label="Select all"
                    onCheckedChange={(checked) => {
                      selectAllSessions(checked!);
                      setIsAllSelected(checked!);
                    }}
                  />
                </TableHead>
                <TableHead>App Name</TableHead>
                <TableHead>Device Model</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">
                    <Checkbox
                      checked={session.selected}
                      aria-label={`Select session ${session.id}`}
                      onCheckedChange={(checked) => selectSession(session.id, checked!)}
                    />
                  </TableCell>
                  <TableCell>{session.appName}</TableCell>
                  <TableCell>{session.deviceModel}</TableCell>
                  <TableCell>{session.manufacturer}</TableCell>
                  <TableCell>{new Date(session.startTime).toLocaleString()}</TableCell>
                  <TableCell>{session.duration}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/metrics/${session.uuid}`)}>
                      View Metrics
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDownload(session.id)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="flex items-center justify-between">
                    <p>Total sessions: {totalSessions}</p>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="destructive"
                        onClick={() => setDeleteOpen(true)}
                        disabled={selectedSessions.length === 0}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Selected
                      </Button>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="page">Page:</Label>
                        <Input
                          type="number"
                          id="page"
                          className="w-16"
                          value={currentPage}
                          onChange={(e) => handlePageChange(Number(e.target.value))}
                        />
                        <p>of {Math.ceil(totalSessions / (searchParams?.pageSize || 10))}</p>
                      </div>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </div>

      <AlertDialog open={isDeleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected sessions from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SessionsPage;
