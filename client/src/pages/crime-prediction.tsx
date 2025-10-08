import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Shield, TrendingUp } from "lucide-react";

interface PredictionResult {
  city: string;
  state: string;
  crimeRate: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  violentCrime: number;
  propertyCrime: number;
}

interface CrimeDistribution {
  riskLevel: string;
  count: number;
  cities: string[];
}

interface Statistics {
  totalCities: number;
  avgCrimeRate: number;
  safestCity: { city: string; state: string; rate: number };
  mostDangerous: { city: string; state: string; rate: number };
}

export default function CrimePrediction() {
  const { data: topRiskCities, isLoading: loadingTopRisk } = useQuery<PredictionResult[]>({
    queryKey: ['/api/predict/top-risk'],
  });

  const { data: distribution, isLoading: loadingDistribution } = useQuery<CrimeDistribution[]>({
    queryKey: ['/api/predict/distribution'],
  });

  const { data: statistics, isLoading: loadingStats } = useQuery<Statistics>({
    queryKey: ['/api/predict/statistics'],
  });

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low': return 'bg-green-500 text-white';
      case 'Medium': return 'bg-yellow-500 text-white';
      case 'High': return 'bg-orange-500 text-white';
      case 'Critical': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const RISK_COLORS = {
    Low: '#22c55e',
    Medium: '#eab308',
    High: '#f97316',
    Critical: '#ef4444',
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="heading-crime-prediction">Crime Prediction Analysis</h1>
          <p className="text-muted-foreground mt-2">ML-powered crime risk analysis across US cities</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card data-testid="card-total-cities">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Cities Analyzed</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-3xl font-bold text-foreground" data-testid="text-total-cities">
                  {statistics?.totalCities}
                </p>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-avg-crime-rate">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Crime Rate</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-3xl font-bold text-foreground" data-testid="text-avg-crime-rate">
                  {statistics?.avgCrimeRate}
                </p>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-safest-city">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Shield className="w-4 h-4 mr-2 text-green-500" />
                Safest City
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div data-testid="text-safest-city">
                  <p className="text-lg font-bold text-foreground">{statistics?.safestCity.city}</p>
                  <p className="text-sm text-muted-foreground">{statistics?.safestCity.state} - Rate: {statistics?.safestCity.rate}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-most-dangerous">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-red-500" />
                Highest Risk
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div data-testid="text-most-dangerous">
                  <p className="text-lg font-bold text-foreground">{statistics?.mostDangerous.city}</p>
                  <p className="text-sm text-muted-foreground">{statistics?.mostDangerous.state} - Rate: {statistics?.mostDangerous.rate}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk Distribution Pie Chart */}
          <Card data-testid="card-risk-distribution">
            <CardHeader>
              <CardTitle>Risk Level Distribution</CardTitle>
              <CardDescription>Cities categorized by crime risk level</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingDistribution ? (
                <Skeleton className="h-[300px]" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={distribution}
                      dataKey="count"
                      nameKey="riskLevel"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.riskLevel}: ${entry.count}`}
                    >
                      {distribution?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.riskLevel as keyof typeof RISK_COLORS]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Top 10 High-Risk Cities Bar Chart */}
          <Card data-testid="card-top-risk-cities">
            <CardHeader>
              <CardTitle>Top 10 High-Risk Cities</CardTitle>
              <CardDescription>Cities with highest predicted crime rates</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTopRisk ? (
                <Skeleton className="h-[300px]" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topRiskCities?.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="city" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="crimeRate" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Risk Cities Table */}
        <Card data-testid="card-risk-cities-table">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Crime Hotspots - High-Risk Cities
            </CardTitle>
            <CardDescription>Detailed analysis of cities with elevated crime risk</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTopRisk ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="table-risk-cities">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Rank</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">City</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">State</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Crime Rate</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Risk Level</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Violent Crime</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Property Crime</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topRiskCities?.slice(0, 15).map((city, index) => (
                      <tr key={`${city.city}-${city.state}`} className="border-b border-border hover:bg-muted/50" data-testid={`row-city-${index}`}>
                        <td className="py-3 px-4 text-sm text-foreground">{index + 1}</td>
                        <td className="py-3 px-4 text-sm font-medium text-foreground">{city.city}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{city.state}</td>
                        <td className="py-3 px-4 text-sm text-foreground font-mono">{city.crimeRate.toFixed(1)}</td>
                        <td className="py-3 px-4">
                          <Badge className={getRiskColor(city.riskLevel)} data-testid={`badge-risk-${city.riskLevel.toLowerCase()}`}>
                            {city.riskLevel}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground">{city.violentCrime}</td>
                        <td className="py-3 px-4 text-sm text-foreground">{city.propertyCrime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Alert */}
        <Alert data-testid="alert-ml-info">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This analysis uses machine learning algorithms (Random Forest Classifier) trained on US crime statistics from major cities.
            The predictions are based on historical data and should be used as a reference for crime trends and risk assessment.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
