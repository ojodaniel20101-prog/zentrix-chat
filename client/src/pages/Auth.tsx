// Obsidian Flow Design — Auth Page
// Design: Deep obsidian background, gradient accents, Space Grotesk + DM Sans
// Glassmorphism card, animated entrance, Google OAuth + Email/Password

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, MessageSquare, Loader2 } from "lucide-react";

type Mode = "login" | "register";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

export default function Auth() {
  const { signInEmail, signUpEmail, signInGoogle } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        await signInEmail(email, password);
        toast.success("Welcome back!");
      } else {
        if (!username.trim() || username.length < 3) {
          toast.error("Username must be at least 3 characters");
          return;
        }
        if (!displayName.trim()) {
          toast.error("Display name is required");
          return;
        }
        await signUpEmail(email, password, username.toLowerCase().replace(/[^a-z0-9_]/g, ""), displayName);
        toast.success("Account created! Welcome to Zentrix Chat.");
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      const msg =
        error.code === "auth/user-not-found" || error.code === "auth/wrong-password"
          ? "Invalid email or password"
          : error.code === "auth/email-already-in-use"
          ? "Email already in use. Try logging in."
          : error.code === "auth/weak-password"
          ? "Password must be at least 6 characters"
          : error.code === "auth/invalid-email"
          ? "Invalid email address"
          : error.message || "An error occurred";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signInGoogle();
      toast.success("Signed in with Google!");
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.code !== "auth/popup-closed-by-user") {
        toast.error(error.message || "Google sign-in failed");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#0a0c10] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-md relative z-10 max-h-[90vh] overflow-y-auto"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-4 shadow-lg shadow-blue-500/25">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Zentrix Chat
          </h1>
          <p className="text-slate-400 mt-1 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {mode === "login" ? "Welcome back" : "Create your account"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#12151e]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Tab switcher */}
          <div className="flex bg-[#0a0c10] rounded-xl p-1 mb-6">
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  mode === m
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Google Sign-In */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm font-medium transition-all duration-200 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed mb-4 active:scale-[0.98]"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {googleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-slate-500 text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === "register" && (
                <motion.div
                  key="register-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div>
                    <Label className="text-slate-300 text-sm mb-1.5 block" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      Display Name
                    </Label>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your full name"
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20 rounded-xl"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-sm mb-1.5 block" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      Username
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-mono">@</span>
                      <Input
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                        placeholder="your_username"
                        required
                        minLength={3}
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20 rounded-xl pl-7 font-mono"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Email
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20 rounded-xl"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              />
            </div>

            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Password
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20 rounded-xl pr-10"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-xs mt-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  );
}
