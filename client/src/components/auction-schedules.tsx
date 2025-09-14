import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Auction, AuctionSchedule } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { CalendarDays, Clock } from "lucide-react";
import AuctionScheduleModal from "./modals/auction-schedule-modal";

interface AuctionSchedulesProps {
  auctionId: number;
}

export default function AuctionSchedules({ auctionId }: AuctionSchedulesProps) {
  const [isAddScheduleModalOpen, setIsAddScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<AuctionSchedule | undefined>(undefined);

  const { data: schedules, isLoading } = useQuery<AuctionSchedule[]>({
    queryKey: ["/api/auction-schedules", auctionId],
    queryFn: async () => {
      const response = await fetch(`/api/auction-schedules?auctionId=${auctionId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch auction schedules");
      }
      return response.json();
    },
  });

  const handleAddSchedule = () => {
    setEditingSchedule(undefined);
    setIsAddScheduleModalOpen(true);
  };

  const handleEditSchedule = (schedule: AuctionSchedule) => {
    setEditingSchedule(schedule);
    setIsAddScheduleModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddScheduleModalOpen(false);
    setEditingSchedule(undefined);
  };

  // Extract unique day types
  const dayTypes = schedules ? Array.from(new Set(schedules.map(s => s.day_type))) : [];

  return (
    <>
      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Auction Schedules</CardTitle>
            <CardDescription>Manage auction and inspection day schedules.</CardDescription>
          </div>
          <Button onClick={handleAddSchedule}>
            <CalendarDays className="w-4 h-4 mr-2" />
            Add Schedule
          </Button>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, idx) => (
                <div key={idx} className="flex flex-col space-y-2">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : schedules?.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No schedules configured</h3>
              <p className="mt-2 text-sm">Add auction and inspection day schedules to start planning.</p>
              <Button variant="outline" className="mt-4" onClick={handleAddSchedule}>
                Add Your First Schedule
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {dayTypes.map((dayType) => (
                <div key={dayType}>
                  <h3 className="text-lg font-medium capitalize mb-2">
                    {dayType === "auction" ? "Auction Days" : "Inspection Days"}
                  </h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Day</TableHead>
                          <TableHead>Hours</TableHead>
                          <TableHead>Slots Per Hour</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {schedules
                          ?.filter((schedule) => schedule.day_type === dayType)
                          .map((schedule) => (
                            <TableRow key={schedule.id}>
                              <TableCell>
                                <Badge variant={schedule.day_type === "auction" ? "default" : "secondary"}>
                                  {schedule.day_of_week}
                                </Badge>
                              </TableCell>
                              <TableCell className="flex items-center space-x-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{formatTimeString(schedule.start_time)} - {formatTimeString(schedule.end_time)}</span>
                              </TableCell>
                              <TableCell>{schedule.slots_per_hour}</TableCell>
                              <TableCell>
                                {formatDistanceToNow(new Date(schedule.created_at), { addSuffix: true })}
                              </TableCell>
                              <TableCell>
                                <Button variant="outline" size="sm" onClick={() => handleEditSchedule(schedule)}>
                                  Edit
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isAddScheduleModalOpen && (
        <AuctionScheduleModal
          auctionId={auctionId}
          isOpen={isAddScheduleModalOpen}
          onClose={handleCloseModal}
          existingSchedule={editingSchedule}
        />
      )}
    </>
  );
}

// Helper function to format time string from "HH:MM:SS" to "H:MM AM/PM"
function formatTimeString(timeString: string): string {
  const [hours, minutes] = timeString.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}