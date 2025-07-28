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

export default function CustomTicket() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    hoursSpent: 0,
    staff: 1,
    notes: '',
    hasDamage: false,
    damageNotes: ''
  });

  const [beforePhotos, setBeforePhotos] = useState<File[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<File[]>([]);

  if (!user) {
    navigate('/auth');
    return null;
  }

  const validateForm = () => {
    // Check required fields
    if (!formData.title || !formData.description || !formData.startTime || !formData.endTime || !formData.notes) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return false;
    }

    // Check photos
    if (!beforePhotos.length || !afterPhotos.length) {
      toast({
        title: "Missing photos",
        description: "Please add both before and after photos.",
        variant: "destructive"
      });
      return false;
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
      description: "Your custom service ticket has been submitted successfully.",
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
            <h1 className="text-2xl font-bold">Create Custom Ticket</h1>
            <p className="text-muted-foreground">Define your own service requirements</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Service Definition */}
          <Card>
            <CardHeader>
              <CardTitle>Service Definition</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Work Item Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Gutter Cleaning, Painting, Repairs"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">
                  Description of Work <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of the work to be performed"
                  required
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
            hoursSpent={formData.hoursSpent}
            onHoursChange={(hours) => setFormData(prev => ({ ...prev, hoursSpent: hours }))}
            allowManualHours={true}
            staff={formData.staff}
            onStaffChange={(staff) => setFormData(prev => ({ ...prev, staff }))}
          />

          {/* Photo Documentation */}
          <Card>
            <CardHeader>
              <CardTitle>Work Documentation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <PhotoUpload
                label="Before Photos"
                required
                photos={beforePhotos}
                onPhotosChange={setBeforePhotos}
                maxPhotos={15}
              />
              <PhotoUpload
                label="After Photos"
                required
                photos={afterPhotos}
                onPhotosChange={setAfterPhotos}
                maxPhotos={15}
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
                  placeholder="Document work performed, materials used, any issues encountered, and completion status"
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
                    placeholder="Describe any damage found or caused during the work"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button type="submit" className="flex-1">
              Submit Service Report
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