
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  CardFooter 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { Shield, AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const { 
    apiToken, 
    companyId, 
    username,
    environment: savedEnvironment,
    isAuthenticated, 
    isValidating, 
    saveCredentials, 
    validateCredentials 
  } = useAuth();
  
  const [localApiToken, setLocalApiToken] = useState(apiToken);
  const [localCompanyId, setLocalCompanyId] = useState(companyId);
  const [localUsername, setLocalUsername] = useState(username);
  const [localEnvironment, setLocalEnvironment] = useState(savedEnvironment);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>(
    isAuthenticated ? 'success' : 'idle'
  );

  const handleConnect = async () => {
    if (!localApiToken) {
      toast.error('API Token is required');
      return;
    }

    if (!localEnvironment) {
      toast.error('Environment URL is required');
      return;
    }
    
    saveCredentials({
      apiToken: localApiToken,
      companyId: localCompanyId,
      username: localUsername,
      environment: localEnvironment
    });
    
    const validated = await validateCredentials();
    
    if (validated) {
      setConnectionStatus('success');
      // Short delay before navigating to show the success state
      setTimeout(() => {
        navigate('/sessions');
      }, 1000);
    } else {
      setConnectionStatus('error');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto space-y-6 p-4 min-h-screen bg-gray-900 text-white">
      <div className="text-center space-y-2 mb-6">
        <Shield className="h-12 w-12 mx-auto text-orange-500 mb-2" />
        <h1 className="text-3xl font-semibold">GameBench Session Validator</h1>
        <p className="text-gray-400">
          Connect to your GameBench account to manage and validate dashboard sessions.
        </p>
      </div>
      
      <Card className="w-full backdrop-blur-xl bg-gray-800/90 border border-gray-700 text-white">
        <CardHeader>
          <CardTitle className="text-white">API Configuration</CardTitle>
          <CardDescription className="text-gray-400">
            Enter your GameBench API credentials to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="environment" className="text-gray-300">Environment URL</Label>
            <Input
              id="environment"
              placeholder="Enter your environment URL"
              value={localEnvironment}
              onChange={(e) => setLocalEnvironment(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
            />
            <p className="text-xs text-gray-500">
              Example: https://gb-v2-30-0.qa.gbdev.tech or https://api.gamebench.net
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-token" className="text-gray-300">API Token (Required)</Label>
            <Input
              id="api-token"
              type="password"
              placeholder="Enter your API token"
              value={localApiToken}
              onChange={(e) => setLocalApiToken(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
              autoComplete="api-token"
            />
            <p className="text-xs text-gray-500">
              Your API token is used to authenticate with the GameBench API.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company-id" className="text-gray-300">Company ID (Optional)</Label>
            <Input
              id="company-id"
              placeholder="Enter your company ID"
              value={localCompanyId}
              onChange={(e) => setLocalCompanyId(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
              autoComplete="company-id"
            />
            <p className="text-xs text-gray-500">
              Required for accessing company-wide sessions.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="username-field" className="text-gray-300">Username (Optional)</Label>
            <Input
              id="username-field"
              placeholder="Enter your username"
              value={localUsername}
              onChange={(e) => setLocalUsername(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
              autoComplete="username"
            />
            <p className="text-xs text-gray-500">
              Optional identifier for session management.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            className="w-full bg-orange-500 hover:bg-orange-600 text-white transition-all duration-300"
            disabled={!localApiToken || isValidating}
            onClick={handleConnect}
          >
            {isValidating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : isAuthenticated ? 'Reconnect' : 'Connect'}
          </Button>
          
          {connectionStatus === 'success' && (
            <div className="flex items-center justify-center text-sm text-green-500 gap-1">
              <CheckCircle2 className="h-4 w-4" />
              <span>Connected successfully</span>
            </div>
          )}
          
          {connectionStatus === 'error' && (
            <div className="flex items-center justify-center text-sm text-red-500 gap-1">
              <XCircle className="h-4 w-4" />
              <span>Authentication failed</span>
            </div>
          )}
          
          <div className="text-xs text-gray-500 text-center">
            Your credentials are stored locally and never sent to any third-party servers.
          </div>
        </CardFooter>
      </Card>
      
      <Card className="w-full backdrop-blur-xl bg-gray-800/90 border border-gray-700 text-white">
        <CardHeader>
          <CardTitle className="text-base text-white">Tool Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <span className="text-gray-300">View and manage your GameBench sessions.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <span className="text-gray-300">Download session data in bulk.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <span className="text-gray-300">Create custom validation rules for your sessions.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <span className="text-gray-300">Track API calls and export validation reports.</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
