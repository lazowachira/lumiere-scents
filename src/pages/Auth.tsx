import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";

const Auth = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const redirectTo = new URLSearchParams(location.search).get("redirect") || "/";

  useEffect(() => {
    if (location.hash.includes("type=recovery")) {
      navigate(`/reset-password${location.hash}`, { replace: true });
    }
  }, [location.hash, navigate]);

  if (loading) return null;
  if (user) return <Navigate to={redirectTo} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setSubmitting(false);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Check your email", description: "We sent you a password reset link." });
      }
      return;
    }

    const { error } = mode === "login"
      ? await signIn(email, password)
      : await signUp(email, password, displayName);
    setSubmitting(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (mode === "signup") {
      toast({ title: "Account created!", description: "Please check your email to verify your account." });
    } else {
      navigate(redirectTo, { replace: true });
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="font-heading text-4xl text-gradient-gold mb-2">
            {mode === "login" ? "Welcome Back" : mode === "signup" ? "Create Account" : "Reset Password"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "login"
              ? "Sign in to your Lumière account"
              : mode === "signup"
              ? "Join Lumière for an exclusive experience"
              : "Enter your email to receive a reset link"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <Input
              placeholder="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-surface border-gold/10 focus:border-primary"
            />
          )}
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-surface border-gold/10 focus:border-primary"
          />
          {mode !== "forgot" && (
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-surface border-gold/10 focus:border-primary pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          )}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-gold text-primary-foreground font-semibold hover:opacity-90"
          >
            {submitting
              ? "Please wait..."
              : mode === "login"
              ? "Sign In"
              : mode === "signup"
              ? "Create Account"
              : "Send Reset Link"}
          </Button>
        </form>

        {mode === "login" && (
          <p className="text-center text-sm text-muted-foreground mt-3">
            <button onClick={() => setMode("forgot")} className="text-primary hover:underline">
              Forgot your password?
            </button>
          </p>
        )}

        <p className="text-center text-sm text-muted-foreground mt-4">
          {mode === "forgot" ? (
            <button onClick={() => setMode("login")} className="text-primary hover:underline">
              Back to Sign In
            </button>
          ) : mode === "login" ? (
            <>Don't have an account?{" "}
              <button onClick={() => setMode("signup")} className="text-primary hover:underline">Sign Up</button>
            </>
          ) : (
            <>Already have an account?{" "}
              <button onClick={() => setMode("login")} className="text-primary hover:underline">Sign In</button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default Auth;
