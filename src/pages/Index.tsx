
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
import { Shield, AlertCircle, CheckCircle2 } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { apiToken, companyId, username, isAuthenticated, isValidating, saveCredentials, validateCredentials } = useAuth();
  
  const [localApiToken, setLocalApiToken] = useState(apiToken);
  const [localCompanyId, setLocalCompanyId] = useState(companyId);
  const [localUsername, setLocalUsername] = useState(username);

  const handleConnect = async () => {
    saveCredentials({
      apiToken: localApiToken,
      companyId: localCompanyId,
      username: localUsername
    });
    
    const validated = await validateCredentials();
    if (validated) {
      navigate('/sessions');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2 mb-6">
        <Shield className="h-12 w-12 mx-auto text-primary mb-2" />
        <h1 className="text-3xl font-semibold">GameBench Session Validator</h1>
        <p className="text-muted-foreground">
          Connect to your GameBench account to manage and validate dashboard sessions.
        </p>
      </div>
      
      <Card className="w-full glass animate-in scale-in">
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>
            Enter your GameBench API credentials to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-token">API Token (Required)</Label>
            <Input
              id="api-token"
              type="password"
              placeholder="Enter your API token"
              value={localApiToken}
              onChange={(e) => setLocalApiToken(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Your API token is used to authenticate with the GameBench API.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company-id">Company ID (Optional)</Label>
            <Input
              id="company-id"
              placeholder="Enter your company ID"
              value={localCompanyId}
              onChange={(e) => setLocalCompanyId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Required for accessing company-wide sessions.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="username">Username (Optional)</Label>
            <Input
              id="username"
              placeholder="Enter your username"
              value={localUsername}
              onChange={(e) => setLocalUsername(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Optional identifier for session management.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            className="w-full" 
            disabled={!localApiToken || isValidating}
            onClick={handleConnect}
          >
            {isValidating ? 'Validating...' : isAuthenticated ? 'Reconnect' : 'Connect'}
          </Button>
          
          {isAuthenticated && (
            <div className="flex items-center justify-center text-sm text-green-600 gap-1">
              <CheckCircle2 className="h-4 w-4" />
              <span>Connected successfully</span>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground text-center">
            Your credentials are stored locally and never sent to any third-party servers.
          </div>
        </CardFooter>
      </Card>
      
      <Card className="w-full glass animate-in scale-in delay-100">
        <CardHeader>
          <CardTitle className="text-base">Tool Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <span>View and manage your GameBench sessions.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <span>Download session data in bulk.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <span>Create custom validation rules for your sessions.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <span>Track API calls and export validation reports.</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
