// View Component - Sidebar Navigation
import { NavLink } from "@/components/NavLink";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import { useLogout } from "@/controllers/useAuth";
import { useInventoryController } from "@/controllers/useInventoryController";
import {
    Activity,
    ArrowRightLeft,
    ClipboardList,
    Clock,

    FolderOpen,
    LayoutDashboard,
    LogOut,
    Package,
    User,
    UserPlus
} from "lucide-react";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Inventory", url: "/inventory", icon: Package },
  {
    title: "Transferred Items",
    url: "/transferred-items",
    icon: ArrowRightLeft,
  },
  {
    title: "Pending Replacements",
    url: "/pending-replacements",
    icon: Clock,
  },
  {
    title: "Confirmed Replacements",
    url: "/confirmed-replacements",
    icon: ClipboardList,
  },
  { title: "Categories", url: "/categories", icon: FolderOpen },

];

export function InventorySidebar() {
  const { open } = useSidebar();
  const { categories } = useInventoryController();
  const logout = useLogout();

  // Get user info from localStorage to check role
  const userInfoString = localStorage.getItem("userInfo");
  const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
  const userRole = userInfo?.role;

  // Get initials for avatar
  const getInitials = (username: string) => {
    return username
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarContent className="flex flex-col h-full">
        {/* Logo/Brand Section */}
        <div className={`relative border-b border-sidebar-border/50 bg-gradient-to-br from-sidebar-accent/30 to-transparent transition-all duration-300 ${!open ? "px-3 py-4" : "px-4 py-6"}`}>
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 hover:opacity-100 transition-opacity duration-500" />
          
          <div className={`relative flex items-center gap-3 group ${!open ? "justify-center" : ""}`}>
            {/* Logo Container with subtle enhancements */}
            <div className={`
              flex items-center justify-center rounded-xl
              bg-sidebar-accent/40
              shadow-md
              ${open ? "w-12 h-12" : "w-11 h-11"}
              transition-all duration-300
              group-hover:shadow-lg
              group-hover:scale-105
              relative overflow-hidden
            `}>
              
              <img 
                src="/logo.png" 
                alt="Fardar Express Logo" 
                className={`object-contain relative z-10 ${open ? "h-10 w-10" : "h-9 w-9"} transition-all duration-300`} 
              />
            </div>
            
            {/* Brand Text */}
            {open && (
              <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
                <h2 className="font-bold text-lg text-sidebar-foreground leading-tight tracking-tight bg-gradient-to-r from-sidebar-foreground to-sidebar-foreground/80 bg-clip-text ">
                  Fardar Express
                </h2>
                <span className=" text-center">Domestic</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Section */}
        <SidebarGroup className="flex-1 py-4">
          <SidebarGroupLabel className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-2">
            <SidebarMenu className="space-y-1 px-2">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 group"
                      activeClassName="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20 font-medium"
                    >
                      <item.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                      <span className="text-sm">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {userRole === "superadmin" && (
                <>
                  <div className="my-3 mx-2 border-t border-sidebar-border" />
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/audit-logs"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 group"
                        activeClassName="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20 font-medium"
                      >
                        <Activity className="h-5 w-5 transition-transform group-hover:scale-110" />
                        <span className="text-sm">Audit Logs</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/add-subadmin"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 group"
                        activeClassName="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20 font-medium"
                      >
                        <UserPlus className="h-5 w-5 transition-transform group-hover:scale-110" />
                        <span className="text-sm">Add Sub-Admin</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Info + Logout Section */}
        <SidebarGroup className="mt-auto border-t border-sidebar-border bg-sidebar/50">
          <SidebarGroupContent className="p-2">
            <SidebarMenu>
              {/* User Profile */}
              <SidebarMenuItem>
                <div className={`flex items-center gap-3 p-2 rounded-lg transition-all ${!open ? "justify-center" : ""}`}>
                  <div className={`
                    flex items-center justify-center rounded-full 
                    bg-gradient-to-br from-blue-600 to-indigo-600 
                    text-white font-bold shadow-sm 
                    ${open ? "w-9 h-9" : "w-8 h-8"} 
                    ring-2 ring-background
                  `}>
                    {open ? (
                      <span className="text-xs">{getInitials(userInfo?.username)}</span>
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  {open && (
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-bold text-sidebar-foreground truncate">
                        {userInfo?.username}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium capitalize">
                        {userInfo?.role}
                      </span>
                    </div>
                  )}
                </div>
              </SidebarMenuItem>

              <div className="my-1 border-t border-sidebar-border/50" />

              {/* Logout Button */}
              <SidebarMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <SidebarMenuButton 
                      className={`
                        w-full flex items-center gap-2 
                        text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 
                        transition-all duration-200 group
                        ${!open ? "justify-center p-2" : "px-3 py-2"}
                      `}
                      tooltip={!open ? "Log Out" : undefined}
                    >
                      <LogOut className="h-4 w-4 transition-transform group-hover:scale-110" />
                      {open && <span className="text-sm font-medium">Log Out</span>}
                    </SidebarMenuButton>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to log out? You'll need to sign in again to access your account.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={logout}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Logout
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
