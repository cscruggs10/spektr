import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Package, Clock, MapPin, CheckCircle, LogOut } from "lucide-react";
import { format } from "date-fns";

export default function InspectorPortalNew() {
  const [inspectorId, setInspectorId] = useState<string>("");
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);

  // Get inspectors for login selection
  const { data: inspectors = [], isLoading: loadingInspectors } = useQuery({
    queryKey: ["/api/inspectors"],
  });

  // Get packages for selected inspector
  const { data: packages = [], isLoading: loadingPackages } = useQuery({
    queryKey: [`/api/packages/inspector/${inspectorId}`],
    enabled: !!inspectorId,
  });

  const handleLogout = () => {
    setInspectorId("");
    setSelectedPackage(null);
  };

  const handleBackToPackages = () => {
    setSelectedPackage(null);
  };

  // If no inspector is selected, show login screen
  if (!inspectorId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Inspector Portal</CardTitle>
            <CardDescription>Select your name to access your inspection packages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select value={inspectorId} onValueChange={setInspectorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select inspector" />
                </SelectTrigger>
                <SelectContent>
                  {inspectors.map((inspector: any) => (
                    <SelectItem key={inspector.id} value={inspector.id.toString()}>
                      {inspector.user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentInspector = inspectors.find((i: any) => i.id === parseInt(inspectorId));

  // If inspector is selected but no package, show package list
  if (!selectedPackage) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Inspection Packages</h1>
              <p className="text-gray-600 mt-1">Welcome back, {currentInspector?.user.name}</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>

          {/* Package Grid */}
          {loadingPackages ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading packages...</p>
            </div>
          ) : packages.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-600">No inspection packages assigned</p>
                <p className="text-gray-500 mt-2">Check back later for new assignments</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {packages.map((pkg: any) => {
                const progress = pkg.inspectionCount > 0
                  ? Math.round((pkg.completedCount / pkg.inspectionCount) * 100)
                  : 0;

                return (
                  <Card
                    key={pkg.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setSelectedPackage(pkg)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{pkg.package_name || pkg.filename}</CardTitle>
                          <CardDescription className="mt-1">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {pkg.auction?.name || "Unknown Auction"}
                            </div>
                          </CardDescription>
                        </div>
                        <Badge variant={pkg.package_status === 'completed' ? 'default' : 'secondary'}>
                          {pkg.package_status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Progress Bar */}
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-medium">{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex justify-between text-sm">
                          <div>
                            <p className="text-gray-600">Total Inspections</p>
                            <p className="font-semibold">{pkg.inspectionCount}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Completed</p>
                            <p className="font-semibold text-green-600">{pkg.completedCount}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Remaining</p>
                            <p className="font-semibold text-blue-600">
                              {pkg.inspectionCount - pkg.completedCount}
                            </p>
                          </div>
                        </div>

                        {/* Date */}
                        <div className="flex items-center gap-2 text-sm text-gray-600 pt-2 border-t">
                          <Clock className="h-4 w-4" />
                          {format(new Date(pkg.upload_date), "MMM d, yyyy")}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // TODO: If package is selected, show inspection list (will use existing inspection logic)
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Button variant="outline" onClick={handleBackToPackages} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Packages
        </Button>

        {/* Package Header */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{selectedPackage.package_name || selectedPackage.filename}</CardTitle>
            <CardDescription>{selectedPackage.auction?.name}</CardDescription>
          </CardHeader>
        </Card>

        {/* TODO: Load and display inspections for this package */}
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">Inspection list will be displayed here</p>
            <p className="text-sm text-gray-500 mt-2">
              Package ID: {selectedPackage.id} - Coming soon
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
