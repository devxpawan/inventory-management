import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/controllers/useAuth";
import { BarChart3, Eye, EyeOff, Package, Warehouse } from "lucide-react";
import { useState } from "react";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { mutate: login, isPending } = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ username, password });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar relative overflow-hidden items-center justify-center">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 -left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-0 -right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center text-sidebar-foreground px-12 text-center">
          {/* Logo */}
          <div className="mb-8 p-6 bg-sidebar-accent/50 backdrop-blur-sm rounded-2xl border border-sidebar-border shadow-xl">
            <div className="p-4">
              <img src="/logo.png" alt="Fardar Express Logo" className="w-32 h-32 object-contain" />
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-4 tracking-tight">
            Fardar Express
          </h1>
          <p className="text-xl text-sidebar-foreground/80 mb-12 max-w-md font-light">
            Domestic Inventory Management System
          </p>

          {/* Feature Grid */}
          <div className="grid grid-cols-3 gap-6 w-full max-w-lg">
            <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-sidebar-accent/30 border border-sidebar-border/50 backdrop-blur-sm">
              <Package className="w-6 h-6 text-blue-400" />
              <span className="text-xs font-medium opacity-80">Stock Tracking</span>
            </div>
            <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-sidebar-accent/30 border border-sidebar-border/50 backdrop-blur-sm">
              <Warehouse className="w-6 h-6 text-purple-400" />
              <span className="text-xs font-medium opacity-80">Warehouse</span>
            </div>
            <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-sidebar-accent/30 border border-sidebar-border/50 backdrop-blur-sm">
              <BarChart3 className="w-6 h-6 text-indigo-400" />
              <span className="text-xs font-medium opacity-80">Analytics</span>
            </div>
          </div>
        </div>
        
        {/* Footer Text */}
        <div className="absolute bottom-8 text-xs text-sidebar-foreground/40">
          © 2024 Fardar Express. All rights reserved.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-6">
              <div className="p-3 inline-block">
                <img src="/logo.png" alt="Fardar Express Logo" className="w-16 h-16 object-contain" />
              </div>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h2>
            <p className="mt-2 text-muted-foreground">
              Please enter your details to sign in
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  required
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <a
                href="#"
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-medium shadow-lg shadow-blue-500/20"
              disabled={isPending}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
