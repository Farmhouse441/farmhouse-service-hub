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
import { useToast } from '@/hooks/use-toast';

const yardAreas = [
  'Front Yard',
  'Back Yard',
  'Side Yard (Left)',
  'Side Yard (Right)'
];

export default function LawnCareTicket() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: 'Lawn Mowing & Weed Whacking',
    description: '',
    startTime: '',
    endTime: '',
    staff: 1,
    grassHeightBefore: '',
    notes: '',
    hasDamage: false,
    damageNotes: ''
  });

  const [yardPhotos, setYardPhotos] = useState<{ [key: string]: { before: File[], after: File[] } }>({});
  const [hazardPhotos, setHazardPhotos] = useState<File[]>([]);

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleYardPhotoChange = (area: string, type: 'before' | 'after', photos: File[]) => {
    setYardPhotos(prev => ({
      ...prev,
      [area]: {
        ...prev[area],
        [type]: photos
      }
    }));
  };

  const validateForm = () => {
    // Check required fields
    if (!formData.startTime || !formData.endTime || !formData.grassHeightBefore || !formData.notes) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return false;
    }

    // Check yard photos
    for (const area of yardAreas) {
      const photos = yardPhotos[area];
      if (!photos?.before?.length || !photos?.after?.length) {
        toast({
          title: "Missing yard photos",
          description: `Please add before and after photos for ${area}.`,
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
      description: "Your lawn care ticket has been submitted successfully.",
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
            <h1 className="text-2xl font-bold">Lawn Mowing & Weed Whacking</h1>
            <p className="text-muted-foreground">Document yard maintenance work</p>
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
                <Label htmlFor="grass-height">
                  Grass Height Before (inches) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="grass-height"
                  value={formData.grassHeightBefore}
                  onChange={(e) => setFormData(prev => ({ ...prev, grassHeightBefore: e.target.value }))}
                  placeholder="e.g., 4-6 inches"
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
            staff={formData.staff}
            onStaffChange={(staff) => setFormData(prev => ({ ...prev, staff }))}
          />

          {/* Yard Area Photos */}
          <Card>
            <CardHeader>
              <CardTitle>Yard Documentation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {yardAreas.map((area) => (
                <div key={area} className="border rounded-lg p-4 space-y-4">
                  <h3 className="text-lg font-semibold">{area}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <PhotoUpload
                      label="Before Photos"
                      required
                      photos={yardPhotos[area]?.before || []}
                      onPhotosChange={(photos) => handleYardPhotoChange(area, 'before', photos)}
                      maxPhotos={5}
                    />
                    <PhotoUpload
                      label="After Photos"
                      required
                      photos={yardPhotos[area]?.after || []}
                      onPhotosChange={(photos) => handleYardPhotoChange(area, 'after', photos)}
                      maxPhotos={5}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Hazardous Conditions */}
          <Card>
            <CardHeader>
              <CardTitle>Hazardous Conditions (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <PhotoUpload
                label="Hazardous Conditions Photos"
                photos={hazardPhotos}
                onPhotosChange={setHazardPhotos}
                maxPhotos={10}
              />
              <p className="text-sm text-muted-foreground mt-2">
                Document any dangerous conditions encountered (broken glass, holes, equipment left out, etc.)
              </p>
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
                  placeholder="Document any issues, equipment left out, fences damaged, or other important notes"
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
                  <Label htmlFor="damage-notes">Property Damage Details</Label>
                  <Textarea
                    id="damage-notes"
                    value={formData.damageNotes}
                    onChange={(e) => setFormData(prev => ({ ...prev, damageNotes: e.target.value }))}
                    placeholder="Describe any damage to fences, equipment left out, or other property issues"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button type="submit" className="flex-1">
              Submit Lawn Care Report
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