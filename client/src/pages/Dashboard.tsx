// View - Dashboard Page
import { StatsCard } from "@/components/inventory/StatsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useInventoryController } from "@/controllers/useInventoryController";
import { Activity, AlertCircle, ArrowUpRight, FolderOpen, Package, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { stats, allItems } = useInventoryController();
  const [subAdminCount, setSubAdminCount] = useState<number>(0);
  const navigate = useNavigate();

  // Get user info from localStorage to check role
  const userInfoString = localStorage.getItem("userInfo");
  const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
  const userRole = userInfo?.role;

  // Fetch sub-admin count for superadmin
  useEffect(() => {
    const fetchSubAdminCount = async () => {
      if (userRole === "superadmin") {
        try {
          const token = userInfo?.token;
          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/users/subadmin-count`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.status === 401) {
            localStorage.removeItem('userInfo');
            window.location.href = '/login';
            return;
          }

          if (response.ok) {
            const data = await response.json();
            setSubAdminCount(data.count);
          }
        } catch (error) {
          console.error("Error fetching sub-admin count:", error);
        }
      }
    };
    fetchSubAdminCount();
  }, [userRole, userInfo?.token]);

  const lowStockItems = allItems
    .filter(
      (item) => item.status === "low-stock" || item.status === "out-of-stock"
    )
    .slice(0, 5);





  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your inventory system performance and alerts
          </p>
        </div>
        <div className="flex gap-2">
           <Button onClick={() => navigate('/inventory')} variant="outline">
             View Inventory
           </Button>
           <Button onClick={() => navigate('/add-item')}>
             Add New Item
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Items"
          value={stats.totalItems.toLocaleString()}
          icon={Package}
          variant="info"
          trend={{ value: 12, isPositive: true }}
          className="bg-blue-50/50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900"
        />
        <StatsCard
          title="Low Stock Alerts"
          value={stats.lowStockItems}
          icon={TrendingDown}
          variant="warning"
          className="bg-orange-50/50 border-orange-100 dark:bg-orange-950/20 dark:border-orange-900"
        />
        <StatsCard
          title="Categories"
          value={stats.categories}
          icon={FolderOpen}
          variant="default"
          className="bg-purple-50/50 border-purple-100 dark:bg-purple-950/20 dark:border-purple-900"
        />

        
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-orange-500" />
                        Critical Stock Alerts
                    </CardTitle>
                    <CardDescription>Items and categories running low on stock</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Category Alerts */}
              {Object.entries(allItems.reduce((acc, item) => {
                const cat = item.category || 'Uncategorized';
                acc[cat] = (acc[cat] || 0) + item.quantity;
                return acc;
              }, {} as Record<string, number>))
              .filter(([_, total]) => total <= 3)
              .map(([category, total]) => (
                <div
                  key={`cat-${category}`}
                  className="flex items-center justify-between p-4 rounded-lg bg-red-50 border border-red-100 dark:bg-red-950/20 dark:border-red-900"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-full">
                        <FolderOpen className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <p className="font-semibold text-red-900 dark:text-red-200">{category}</p>
                        <p className="text-sm text-red-700/80 dark:text-red-400/80">Critical category stock level</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-700 dark:text-red-400">{total}</p>
                    <p className="text-xs font-medium text-red-600/80 dark:text-red-400/80">TOTAL UNITS</p>
                  </div>
                </div>
              ))}

              {/* Item Alerts */}
              {lowStockItems.length === 0 && Object.entries(allItems.reduce((acc, item) => {
                  const cat = item.category || 'Uncategorized';
                  acc[cat] = (acc[cat] || 0) + item.quantity;
                  return acc;
                }, {} as Record<string, number>)).filter(([_, total]) => total <= 3).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full mb-3">
                        <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="font-medium text-lg">All items are well stocked!</h3>
                    <p className="text-muted-foreground text-sm max-w-xs mt-1">
                        No items or categories are currently below the low stock threshold.
                    </p>
                </div>
              ) : (
                <div className="grid gap-3">
                    {lowStockItems.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-12 rounded-full ${item.status === 'out-of-stock' ? 'bg-red-500' : 'bg-orange-500'}`} />
                            <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-xs text-muted-foreground">Category: {item.category}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-bold">{item.quantity}</p>
                            <p className="text-xs text-muted-foreground">units</p>
                        </div>
                        <Badge
                            variant={
                            item.status === "out-of-stock"
                                ? "destructive"
                                : "outline"
                            }
                            className={item.status === 'low-stock' ? 'border-orange-500 text-orange-500' : ''}
                        >
                            {item.status === "out-of-stock" ? "Out of Stock" : "Low Stock"}
                        </Badge>
                        </div>
                    </div>
                    ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Recent Activity
            </CardTitle>
            <CardDescription>Latest inventory updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allItems.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0"
                >
                  <div className="mt-1 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <ArrowUpRight className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{item.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{item.category}</span>
                        <span>•</span>
                        <span>
                            Updated {item.lastUpdated
                                ? new Date(item.lastUpdated).toLocaleDateString()
                                : "N/A"}
                        </span>
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={() => navigate('/inventory')}>
                  View All Activity
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
