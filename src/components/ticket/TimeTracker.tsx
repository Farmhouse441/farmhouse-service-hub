import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, Pause, Clock } from 'lucide-react';

interface TimeTrackerProps {
  startTime: string;
  endTime: string;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  hoursSpent?: number;
  onHoursChange?: (hours: number) => void;
  allowManualHours?: boolean;
}

export function TimeTracker({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  hoursSpent,
  onHoursChange,
  allowManualHours = false
}: TimeTrackerProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [calculatedHours, setCalculatedHours] = useState(0);

  // Calculate hours when start/end times change
  useEffect(() => {
    if (startTime && endTime) {
      const start = new Date(`2024-01-01T${startTime}`);
      const end = new Date(`2024-01-01T${endTime}`);
      const diffMs = end.getTime() - start.getTime();
      const hours = Math.max(0, diffMs / (1000 * 60 * 60));
      setCalculatedHours(Math.round(hours * 100) / 100);
    }
  }, [startTime, endTime]);

  const handleStartTracking = () => {
    const now = new Date();
    const timeString = now.toTimeString().slice(0, 5);
    onStartTimeChange(timeString);
    setIsTracking(true);
  };

  const handleStopTracking = () => {
    const now = new Date();
    const timeString = now.toTimeString().slice(0, 5);
    onEndTimeChange(timeString);
    setIsTracking(false);
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Time Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick tracking buttons */}
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={handleStartTracking}
            disabled={isTracking}
            variant={isTracking ? "secondary" : "default"}
          >
            <Play className="h-4 w-4 mr-2" />
            {isTracking ? "Started" : "Start Now"}
          </Button>
          <Button
            type="button"
            onClick={handleStopTracking}
            disabled={!isTracking || !startTime}
            variant="outline"
          >
            <Pause className="h-4 w-4 mr-2" />
            Stop Now
          </Button>
        </div>

        {/* Manual time entry */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-time">
              Start Time <span className="text-destructive">*</span>
            </Label>
            <Input
              id="start-time"
              type="time"
              value={startTime}
              onChange={(e) => onStartTimeChange(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-time">
              End Time <span className="text-destructive">*</span>
            </Label>
            <Input
              id="end-time"
              type="time"
              value={endTime}
              onChange={(e) => onEndTimeChange(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Hours display/input */}
        <div className="space-y-2">
          <Label>Hours Worked</Label>
          {allowManualHours && onHoursChange ? (
            <div className="space-y-2">
              <Input
                type="number"
                step="0.25"
                min="0"
                value={hoursSpent || calculatedHours}
                onChange={(e) => onHoursChange(parseFloat(e.target.value) || 0)}
                placeholder="Enter hours manually"
              />
              <p className="text-xs text-muted-foreground">
                Calculated: {calculatedHours} hours (you can override this)
              </p>
            </div>
          ) : (
            <div className="p-3 bg-muted rounded-md">
              <span className="text-lg font-semibold">
                {calculatedHours} hours
              </span>
              {startTime && endTime && (
                <p className="text-sm text-muted-foreground mt-1">
                  From {startTime} to {endTime}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}