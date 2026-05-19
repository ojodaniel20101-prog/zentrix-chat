// Obsidian Flow Design — Zentrix Chat App Root
// Routes: /auth (login/register), / (main chat)
// Contexts: ThemeProvider → AuthProvider → ChatProvider

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ChatProvider } from "./contexts/ChatContext";
import Auth from "./pages/Auth";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";

// Protected route wrapper
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user } = useAuth();
  if (!user) return <Redirect to="/auth" />;
  return (
    <ChatProvider>
      <Component />
    </ChatProvider>
  );
}

// Public route (redirect to / if already logged in)
function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  const { user } = useAuth();
  if (user) return <Redirect to="/" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth">
        <PublicRoute component={Auth} />
      </Route>
      <Route path="/">
        <ProtectedRoute component={Chat} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <AuthProvider>
            <Router />
          </AuthProvider>
          <Toaster
            theme="dark"
            position="top-right"
            toastOptions={{
              style: {
                background: "#1a1f2e",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#e2e8f0",
                fontFamily: "'DM Sans', sans-serif",
              },
            }}
          />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
