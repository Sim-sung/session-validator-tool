
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LayoutGrid, LineChart, Settings, Shield, FileText, LogOut } from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(location.pathname);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Updated navItems to match the 5 tabs in the spec
  const navItems = [
    {
      value: '/',
      label: 'Setup',
      icon: <Settings className="h-4 w-4 mr-2" />,
      showAlways: true,
    },
    {
      value: '/sessions',
      label: 'Sessions',
      icon: <LayoutGrid className="h-4 w-4 mr-2" />,
      showWhenAuth: true,
    },
    {
      value: '/metrics',
      label: 'Metrics',
      icon: <LineChart className="h-4 w-4 mr-2" />,
      showWhenAuth: true,
      hideFromNav: true, // Hide from nav as it requires a sessionId
    },
    {
      value: '/validation',
      label: 'Validation',
      icon: <Shield className="h-4 w-4 mr-2" />,
      showWhenAuth: true,
    },
    {
      value: '/logs',
      label: 'Logs',
      icon: <FileText className="h-4 w-4 mr-2" />,
      showWhenAuth: true,
    },
  ];

  const filteredNavItems = navItems.filter(
    item => (item.showAlways || (item.showWhenAuth && isAuthenticated)) && !item.hideFromNav
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="font-medium text-xl">GameBench Session Validator</div>
          </div>
          
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto flex items-center gap-1"
              onClick={logout}
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          )}
        </div>
        
        <div className="container flex justify-center pb-2">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full max-w-3xl"
          >
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${filteredNavItems.length}, 1fr)` }}>
              {filteredNavItems.map((item) => (
                <Link to={item.value} key={item.value}>
                  <TabsTrigger
                    value={item.value}
                    className={cn(
                      "flex items-center justify-center transition-all",
                      location.pathname === item.value
                        ? "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        : ""
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </TabsTrigger>
                </Link>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </header>
      
      <main className="flex-1 container py-6 md:py-8 lg:py-10">
        <div className="animate-in fade-in slide-in duration-300">{children}</div>
      </main>
      
      <footer className="border-t py-4 bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between text-sm text-muted-foreground">
          <p>© 2023 GameBench Session Validator</p>
          <p>Version 1.0.0</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
