import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, AlertTriangle, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { PhotoUpload } from '@/components/ticket/PhotoUpload';
import { TimeTracker } from '@/components/ticket/TimeTracker';
import { ChecklistItem } from '@/components/ticket/ChecklistItem';
import { useToast } from '@/hooks/use-toast';
import { useTickets } from '@/hooks/useTickets';

const clearingAreas = [
  'Driveway',
  'Walkways',
  'Steps/Porches'
];

const checklistItems = [
  { id: 'ice-melt', label: 'Ice melt/salt applied', required: true }
];

export default function SnowRemovalTicket() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { createTicket, loading: creatingTicket } = useTickets();

  const [formData, setFormData] = useState({
    title: 'Snow Removal',
    description: '',
    serviceDate: undefined as Date | undefined,
    propertyAddress: '',
    startTime: '',
    endTime: '',
    staff: 1,
    notes: '',
    hasDamage: false,
    damageNotes: ''
  });

  const [areaPhotos, setAreaPhotos] = useState<{ [key: string]: { before: File[], after: File[] } }>({});
  const [checklist, setChecklist] = useState<{ [key: string]: boolean }>({});

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleAreaPhotoChange = (area: string, type: 'before' | 'after', photos: File[]) => {
    setAreaPhotos(prev => ({
      ...prev,
      [area]: {
        ...prev[area],
        [type]: photos
      }
    }));
  };

  const handleChecklistChange = (id: string, checked: boolean) => {
    setChecklist(prev => ({
      ...prev,
      [id]: checked
    }));
  };

  const validateForm = () => {
    // Check required fields
    if (!formData.serviceDate || !formData.propertyAddress || !formData.startTime || !formData.endTime || !formData.notes) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return false;
    }

    // Check area photos
    for (const area of clearingAreas) {
      const photos = areaPhotos[area];
      if (!photos?.before?.length || !photos?.after?.length) {
        toast({
          title: "Missing area photos",
          description: `Please add before and after photos for ${area}.`,
          variant: "destructive"
        });
        return false;
      }
    }

    // Check checklist
    for (const item of checklistItems) {
      if (item.required && !checklist[item.id]) {
        toast({
          title: "Incomplete checklist",
          description: `Please complete: ${item.label}`,
          variant: "destructive"
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Collect all photos
    const allBeforePhotos: File[] = [];
    const allAfterPhotos: File[] = [];

    Object.entries(areaPhotos).forEach(([area, photos]) => {
      if (photos.before) allBeforePhotos.push(...photos.before);
      if (photos.after) allAfterPhotos.push(...photos.after);
    });

    const serviceDate = formData.serviceDate ? format(formData.serviceDate, 'yyyy-MM-dd') : '';

    const ticketData = {
      title: `Snow Removal Service - ${serviceDate}`,
      description: formData.description,
      property_address: formData.propertyAddress,
      work_start_date: `${serviceDate}T${formData.startTime}:00`,
      work_end_date: `${serviceDate}T${formData.endTime}:00`,
      before_photos: allBeforePhotos,
      after_photos: allAfterPhotos,
      status: 'submitted' as const
    };

    const result = await createTicket(ticketData);
    
    if (result) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate('/new-ticket')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Snow Removal</h1>
            <p className="text-muted-foreground">Document snow clearing work</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Service Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="service-date">
                  Service Date <span className="text-destructive">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.serviceDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.serviceDate ? format(formData.serviceDate, "PPP") : <span>Select service date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.serviceDate}
                      onSelect={(date) => setFormData(prev => ({ ...prev, serviceDate: date }))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="property-address">
                  Property Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="property-address"
                  value={formData.propertyAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, propertyAddress: e.target.value }))}
                  placeholder="Enter property address"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Additional Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Snow depth, conditions, special instructions"
                />
              </div>
            </CardContent>
          </Card>

          {/* Time Tracking */}
          <TimeTracker
            startTime={formData.startTime}
            endTime={formData.endTime}
            onStartTimeChange={(time) => setFormData(prev => ({ ...prev, startTime: time }))}
            onEndTimeChange={(time) => setFormData(prev => ({ ...prev, endTime: time }))}
            staff={formData.staff}
            onStaffChange={(staff) => setFormData(prev => ({ ...prev, staff }))}
          />

          {/* Area Photos */}
          <Card>
            <CardHeader>
              <CardTitle>Snow Clearing Documentation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {clearingAreas.map((area) => (
                <div key={area} className="border rounded-lg p-4 space-y-4">
                  <h3 className="text-lg font-semibold">{area}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <PhotoUpload
                      label="Before Photos"
                      required
                      photos={areaPhotos[area]?.before || []}
                      onPhotosChange={(photos) => handleAreaPhotoChange(area, 'before', photos)}
                      maxPhotos={5}
                    />
                    <PhotoUpload
                      label="After Photos"
                      required
                      photos={areaPhotos[area]?.after || []}
                      onPhotosChange={(photos) => handleAreaPhotoChange(area, 'after', photos)}
                      maxPhotos={5}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Completion Checklist */}
          <Card>
            <CardHeader>
              <CardTitle>Completion Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {checklistItems.map((item) => (
                <ChecklistItem
                  key={item.id}
                  id={item.id}
                  label={item.label}
                  checked={checklist[item.id] || false}
                  onCheckedChange={(checked) => handleChecklistChange(item.id, checked)}
                  required={item.required}
                />
              ))}
            </CardContent>
          </Card>

          {/* Notes and Damage */}
          <Card>
            <CardHeader>
              <CardTitle>Notes & Damage Reporting</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">
                  Service Notes <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Document snow conditions, equipment used, any issues encountered"
                  required
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="damage"
                  checked={formData.hasDamage}
                  onChange={(e) => setFormData(prev => ({ ...prev, hasDamage: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="damage" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Flag damage for owner review
                </Label>
              </div>

              {formData.hasDamage && (
                <div className="space-y-2">
                  <Label htmlFor="damage-notes">Damage Details</Label>
                  <Textarea
                    id="damage-notes"
                    value={formData.damageNotes}
                    onChange={(e) => setFormData(prev => ({ ...prev, damageNotes: e.target.value }))}
                    placeholder="Describe any damage (mailbox damage, scratches, broken items, etc.)"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button type="submit" className="flex-1" disabled={creatingTicket}>
              {creatingTicket ? "Creating Ticket..." : "Submit Snow Removal Report"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/new-ticket')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}