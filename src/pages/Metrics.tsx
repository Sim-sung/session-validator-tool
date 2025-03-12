import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSession } from '@/context/SessionContext';
import { SessionMetrics } from '@/types/validation';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Using Record<string, string> to satisfy the constraint
interface Params extends Record<string, string> {
  sessionId: string;
}

const MetricsPage = () => {
  const { sessionId } = useParams<Params>();
  const { fetchSessionMetrics } = useSession();
  const [metrics, setMetrics] = useState<SessionMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      setIsLoading(true);
      try {
        if (sessionId) {
          const fetchedMetrics = await fetchSessionMetrics(sessionId);
          setMetrics(fetchedMetrics);
        }
      } catch (error) {
        console.error("Failed to load metrics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMetrics();
  }, [sessionId, fetchSessionMetrics]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-4">Metrics</h1>
        <Card className="glass">
          <CardHeader>
            <CardTitle>Loading Metrics</CardTitle>
            <CardDescription>Fetching metrics data...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[220px]" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-4">Metrics</h1>
        <Card className="glass">
          <CardHeader>
            <CardTitle>No Metrics Available</CardTitle>
            <CardDescription>No metrics data found for this session.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Please ensure a valid session ID is provided.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const data = metrics.fps.map((value, index) => ({
    time: index,
    fps: value,
    cpu: metrics.cpu[index] || 0,
    gpu: metrics.gpu[index] || 0,
    battery: metrics.battery[index] || 0,
  }));

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Metrics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* App Details Card */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>App Details</CardTitle>
            <CardDescription>Information about the application.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              <Badge variant="secondary">Name</Badge> {metrics.appDetails.name}
            </p>
            <p>
              <Badge variant="secondary">Version</Badge> {metrics.appDetails.version}
            </p>
            <p>
              <Badge variant="secondary">Package</Badge> {metrics.appDetails.package}
            </p>
          </CardContent>
        </Card>

        {/* Device Details Card */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Device Details</CardTitle>
            <CardDescription>Information about the device.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              <Badge variant="secondary">Model</Badge> {metrics.deviceDetails.model}
            </p>
            <p>
              <Badge variant="secondary">Manufacturer</Badge> {metrics.deviceDetails.manufacturer}
            </p>
            <p>
              <Badge variant="secondary">GPU</Badge> {metrics.deviceDetails.gpuType}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Details Card */}
      <Card className="glass mt-4">
        <CardHeader>
          <CardTitle>User Details</CardTitle>
          <CardDescription>Information about the user.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>
            <Badge variant="secondary">Email</Badge> {metrics.userDetails.email}
          </p>
          <p>
            <Badge variant="secondary">Username</Badge> {metrics.userDetails.username}
          </p>
        </CardContent>
      </Card>

      {/* Performance Metrics Chart */}
      <Card className="glass mt-4">
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>FPS, CPU, GPU, and Battery over time.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="fps" stroke="#8884d8" fill="#8884d8" name="FPS" />
              <Area type="monotone" dataKey="cpu" stroke="#82ca9d" fill="#82ca9d" name="CPU" />
              <Area type="monotone" dataKey="gpu" stroke="#ffc658" fill="#ffc658" name="GPU" />
              <Area type="monotone" dataKey="battery" stroke="#a45de2" fill="#a45de2" name="Battery" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Raw Data Table */}
      <Card className="glass mt-4">
        <CardHeader>
          <CardTitle>Raw Data</CardTitle>
          <CardDescription>Detailed metrics data in tabular format.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Time</TableHead>
                <TableHead>FPS</TableHead>
                <TableHead>CPU</TableHead>
                <TableHead>GPU</TableHead>
                <TableHead>Battery</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.time}>
                  <TableCell className="font-medium">{row.time}</TableCell>
                  <TableCell>{row.fps}</TableCell>
                  <TableCell>{row.cpu}</TableCell>
                  <TableCell>{row.gpu}</TableCell>
                  <TableCell>{row.battery}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default MetricsPage;
