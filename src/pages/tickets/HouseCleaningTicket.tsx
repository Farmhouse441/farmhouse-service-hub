import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { PhotoUpload } from '@/components/ticket/PhotoUpload';
import { TimeTracker } from '@/components/ticket/TimeTracker';
import { ChecklistItem } from '@/components/ticket/ChecklistItem';
import { useToast } from '@/hooks/use-toast';

const rooms = [
  'Bedroom 1', 'Bedroom 2', 'Bedroom 3', 'Bedroom 4', 'Bedroom 5',
  'Bathroom 1', 'Bathroom 2', 'Bathroom 3',
  'Kitchen', 'Living Room', 'Dining Room', 'Hallways',
  'Basement/Bonus Room'
];

const mandatoryPhotos = [
  'Inside Fridge/Freezer - Before',
  'Inside Fridge/Freezer - After',
  'Kitchen Sink Area',
  'Trash Left Behind (if any)'
];

const checklistItems = [
  { id: 'linens', label: 'Replace linens/towels', required: true },
  { id: 'dishwasher', label: 'Run/empty dishwasher', required: true },
  { id: 'trash', label: 'Empty trash', required: true },
  { id: 'windows', label: 'Lock windows/doors', required: true },
  { id: 'thermostat', label: 'Thermostat reset', required: true }
];

export default function HouseCleaningTicket() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: 'House Turnover Cleaning',
    propertyAddress: '',
    description: '',
    startTime: '',
    endTime: '',
    notes: '',
    hasDamage: false,
    damageNotes: ''
  });

  const [roomPhotos, setRoomPhotos] = useState<{ [key: string]: { before: File[], after: File[], floors: File[] } }>({});
  const [mandatoryPhotoFiles, setMandatoryPhotoFiles] = useState<{ [key: string]: File[] }>({});
  const [wholeHousePhotos, setWholeHousePhotos] = useState<File[]>([]);
  const [checklist, setChecklist] = useState<{ [key: string]: boolean }>({});

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleRoomPhotoChange = (room: string, type: 'before' | 'after' | 'floors', photos: File[]) => {
    setRoomPhotos(prev => ({
      ...prev,
      [room]: {
        ...prev[room],
        [type]: photos
      }
    }));
  };

  const handleMandatoryPhotoChange = (category: string, photos: File[]) => {
    setMandatoryPhotoFiles(prev => ({
      ...prev,
      [category]: photos
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
    if (!formData.propertyAddress || !formData.startTime || !formData.endTime || !formData.notes) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return false;
    }

    // Check room photos
    for (const room of rooms) {
      const photos = roomPhotos[room];
      if (!photos?.before?.length || !photos?.after?.length || !photos?.floors?.length) {
        toast({
          title: "Missing room photos",
          description: `Please add before, after, and floor photos for ${room}.`,
          variant: "destructive"
        });
        return false;
      }
    }

    // Check mandatory photos
    for (const category of mandatoryPhotos) {
      if (!mandatoryPhotoFiles[category]?.length) {
        toast({
          title: "Missing mandatory photos",
          description: `Please add photos for: ${category}`,
          variant: "destructive"
        });
        return false;
      }
    }

    // Check whole house photos
    if (!wholeHousePhotos.length) {
      toast({
        title: "Missing final photos",
        description: "Please add final whole house photos.",
        variant: "destructive"
      });
      return false;
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

    // TODO: Submit to Supabase
    toast({
      title: "Ticket submitted",
      description: "Your house cleaning ticket has been submitted successfully.",
    });

    navigate('/dashboard');
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
            <h1 className="text-2xl font-bold">House Turnover Cleaning</h1>
            <p className="text-muted-foreground">Complete documentation required</p>
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
                <Label htmlFor="address">
                  Property Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="address"
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
                  placeholder="Any special instructions or notes"
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
          />

          {/* Room-by-Room Photos */}
          <Card>
            <CardHeader>
              <CardTitle>Room-by-Room Documentation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {rooms.map((room) => (
                <div key={room} className="border rounded-lg p-4 space-y-4">
                  <h3 className="text-lg font-semibold">{room}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <PhotoUpload
                      label="Before Photos"
                      required
                      photos={roomPhotos[room]?.before || []}
                      onPhotosChange={(photos) => handleRoomPhotoChange(room, 'before', photos)}
                      maxPhotos={5}
                    />
                    <PhotoUpload
                      label="After Photos"
                      required
                      photos={roomPhotos[room]?.after || []}
                      onPhotosChange={(photos) => handleRoomPhotoChange(room, 'after', photos)}
                      maxPhotos={5}
                    />
                    <PhotoUpload
                      label="Floor Photos"
                      required
                      photos={roomPhotos[room]?.floors || []}
                      onPhotosChange={(photos) => handleRoomPhotoChange(room, 'floors', photos)}
                      maxPhotos={3}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Mandatory Photos */}
          <Card>
            <CardHeader>
              <CardTitle>Mandatory Documentation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {mandatoryPhotos.map((category) => (
                <PhotoUpload
                  key={category}
                  label={category}
                  required
                  photos={mandatoryPhotoFiles[category] || []}
                  onPhotosChange={(photos) => handleMandatoryPhotoChange(category, photos)}
                  maxPhotos={3}
                />
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

          {/* Final Photos */}
          <Card>
            <CardHeader>
              <CardTitle>Final Whole House Gallery</CardTitle>
            </CardHeader>
            <CardContent>
              <PhotoUpload
                label="Whole House After Photos"
                required
                photos={wholeHousePhotos}
                onPhotosChange={setWholeHousePhotos}
                maxPhotos={20}
              />
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
                  placeholder="Document any issues, exceptions, or important notes about the service"
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
                    placeholder="Describe any damage found or caused"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button type="submit" className="flex-1">
              Submit House Cleaning Report
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