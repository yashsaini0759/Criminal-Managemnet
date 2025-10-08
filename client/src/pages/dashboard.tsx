import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, CheckCircle, Clock, TrendingUp, TrendingDown, AlertTriangle, MapPin } from "lucide-react";
import { CrimeTypesChart } from "@/components/charts/crime-types-chart";
import { CaseStatusChart } from "@/components/charts/case-status-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface CrimeHotspot {
  city: string;
  state: string;
  crimeRate: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<{
    totalCriminals: number;
    activeFirs: number;
    solvedCases: number;
    pendingCases: number;
    crimeTypeDistribution: { type: string; count: number }[];
    caseStatusDistribution: { status: string; count: number }[];
  }>({
    queryKey: ["/api/statistics"],
  });

  const { data: topRiskCity } = useQuery<CrimeHotspot>({
    queryKey: ['/api/predict/top-risk'],
    select: (data: any) => data?.[0],
  });

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg border border-border p-6 h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Criminals",
      value: stats?.totalCriminals || 0,
      icon: Users,
      trend: "+12%",
      trendUp: true,
      color: "text-primary",
    },
    {
      title: "Active FIRs",
      value: stats?.activeFirs || 0,
      icon: FileText,
      trend: "-3%",
      trendUp: false,
      color: "text-amber-600",
    },
    {
      title: "Solved Cases",
      value: stats?.solvedCases || 0,
      icon: CheckCircle,
      trend: "+8%",
      trendUp: true,
      color: "text-green-600",
    },
    {
      title: "Pending Cases",
      value: stats?.pendingCases || 0,
      icon: Clock,
      trend: "0%",
      trendUp: null,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} data-testid={`card-stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold text-card-foreground" data-testid={`text-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      {stat.value.toLocaleString()}
                    </p>
                  </div>
                  <div className={`w-12 h-12 ${stat.color}/10 rounded-full flex items-center justify-center`}>
                    <Icon className={`${stat.color} text-xl`} />
                  </div>
                </div>
                <div className="flex items-center mt-4 text-sm">
                  {stat.trendUp === true && (
                    <TrendingUp className="text-green-600 w-4 h-4 mr-1" />
                  )}
                  {stat.trendUp === false && (
                    <TrendingDown className="text-red-600 w-4 h-4 mr-1" />
                  )}
                  <span className={stat.trendUp === true ? "text-green-600" : stat.trendUp === false ? "text-red-600" : "text-orange-600"}>
                    {stat.trend}
                  </span>
                  <span className="text-muted-foreground ml-2">vs last month</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Crime Hotspot Alert */}
      {topRiskCity && (
        <Card className="border-red-500/20 bg-red-50 dark:bg-red-950/20" data-testid="card-crime-hotspot">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="text-white text-xl" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    Crime Hotspot Alert
                    <Badge variant="destructive" data-testid="badge-hotspot-risk">Critical Risk</Badge>
                  </h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span data-testid="text-hotspot-city">
                        <strong className="text-foreground">{topRiskCity.city}, {topRiskCity.state}</strong> has the highest predicted crime rate
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Crime Rate: <strong className="text-red-600 dark:text-red-400" data-testid="text-hotspot-rate">{topRiskCity.crimeRate.toFixed(1)}</strong> per 100,000 population
                    </p>
                  </div>
                </div>
              </div>
              <Link href="/crime-prediction">
                <Button variant="outline" size="sm" className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950" data-testid="button-view-predictions">
                  View Predictions
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Crime Types Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.crimeTypeDistribution && (
              <CrimeTypesChart data={stats.crimeTypeDistribution} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Case Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.caseStatusDistribution && (
              <CaseStatusChart data={stats.caseStatusDistribution} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4" data-testid="recent-activities">
            <div className="flex items-start space-x-4 py-4 border-b border-border last:border-b-0">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="text-primary text-sm" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-card-foreground">System initialized with sample data</p>
                <p className="text-xs text-muted-foreground">Just now</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
