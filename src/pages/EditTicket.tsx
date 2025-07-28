import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Camera, Save, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { PhotoUpload } from '@/components/ticket/PhotoUpload';

interface TicketFormData {
  title: string;
  description: string;
  work_start_date: string;
  work_end_date: string;
  before_photos: File[];
  after_photos: File[];
  existing_before_photos: string[];
  existing_after_photos: string[];
}

const EditTicket = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<string>('user');
  const [formData, setFormData] = useState<TicketFormData>({
    title: '',
    description: '',
    work_start_date: '',
    work_end_date: '',
    before_photos: [],
    after_photos: [],
    existing_before_photos: [],
    existing_after_photos: []
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (!id) {
      navigate('/dashboard');
      return;
    }

    fetchUserRole();
    fetchTicket();
  }, [user, id, navigate]);

  const fetchUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user role:', error);
        return;
      }
      
      setUserRole(data?.role || 'user');
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchTicket = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('service_tickets')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching ticket:', error);
        toast({
          title: "Error",
          description: "Failed to load ticket details",
          variant: "destructive",
        });
        navigate('/dashboard');
        return;
      }

      // Check permissions
      const isAdmin = userRole === 'admin';
      const canEdit = isAdmin || (data.user_id === user?.id && data.status === 'draft');
      
      if (!canEdit) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to edit this ticket",
          variant: "destructive",
        });
        navigate('/dashboard');
        return;
      }

      setFormData({
        title: data.title || '',
        description: data.description || '',
        work_start_date: data.work_start_date ? format(new Date(data.work_start_date), 'yyyy-MM-dd') : '',
        work_end_date: data.work_end_date ? format(new Date(data.work_end_date), 'yyyy-MM-dd') : '',
        before_photos: [],
        after_photos: [],
        existing_before_photos: data.before_photos || [],
        existing_after_photos: data.after_photos || []
      });
    } catch (error) {
      console.error('Error fetching ticket:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const uploadPhotos = async (photos: File[], folder: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (const photo of photos) {
      const fileExt = photo.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('ticket-photos')
        .upload(filePath, photo);

      if (uploadError) {
        console.error('Error uploading photo:', uploadError);
        throw new Error(`Failed to upload photo: ${photo.name}`);
      }

      uploadedUrls.push(filePath);
    }

    return uploadedUrls;
  };

  const handleSave = async (shouldSubmit = false) => {
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Title is required",
        variant: "destructive"
      });
      return;
    }

    if (!formData.work_start_date || !formData.work_end_date) {
      toast({
        title: "Validation Error", 
        description: "Work start and end dates are required",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);

      // Upload new photos if any
      let newBeforePhotoUrls: string[] = [];
      let newAfterPhotoUrls: string[] = [];

      if (formData.before_photos.length > 0) {
        newBeforePhotoUrls = await uploadPhotos(formData.before_photos, 'before');
      }

      if (formData.after_photos.length > 0) {
        newAfterPhotoUrls = await uploadPhotos(formData.after_photos, 'after');
      }

      // Combine existing and new photos
      const allBeforePhotos = [...formData.existing_before_photos, ...newBeforePhotoUrls];
      const allAfterPhotos = [...formData.existing_after_photos, ...newAfterPhotoUrls];

      const updateData = {
        title: formData.title,
        description: formData.description,
        work_start_date: formData.work_start_date,
        work_end_date: formData.work_end_date,
        before_photos: allBeforePhotos,
        after_photos: allAfterPhotos,
        status: (shouldSubmit ? 'submitted' : 'draft') as 'draft' | 'submitted' | 'additional_info_requested' | 'approved_not_paid' | 'approved_paid' | 'declined'
      };

      const { error } = await supabase
        .from('service_tickets')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating ticket:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: shouldSubmit ? "Ticket submitted successfully" : "Ticket saved successfully",
      });

      navigate(`/view-ticket/${id}`);
    } catch (error) {
      console.error('Error saving ticket:', error);
      toast({
        title: "Error",
        description: "Failed to save ticket. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof TicketFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const removeExistingPhoto = (photoUrl: string, type: 'before' | 'after') => {
    if (type === 'before') {
      setFormData(prev => ({
        ...prev,
        existing_before_photos: prev.existing_before_photos.filter(url => url !== photoUrl)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        existing_after_photos: prev.existing_after_photos.filter(url => url !== photoUrl)
      }));
    }
  };

  const getImageUrl = (path: string) => {
    const { data } = supabase.storage
      .from('ticket-photos')
      .getPublicUrl(path);
    return data.publicUrl;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">Loading ticket details...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Edit Service Ticket</h1>
              <p className="text-muted-foreground">Update ticket details and photos</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Edit Ticket Information</CardTitle>
            <CardDescription>
              Update your service ticket details. You can save as draft or submit when ready.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="grid gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter ticket title"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the work performed"
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="work_start_date">Work Start Date *</Label>
                  <Input
                    id="work_start_date"
                    type="date"
                    value={formData.work_start_date}
                    onChange={(e) => handleInputChange('work_start_date', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="work_end_date">Work End Date *</Label>
                  <Input
                    id="work_end_date"
                    type="date"
                    value={formData.work_end_date}
                    onChange={(e) => handleInputChange('work_end_date', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Existing Photos */}
            {(formData.existing_before_photos.length > 0 || formData.existing_after_photos.length > 0) && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Current Photos</h3>
                
                {formData.existing_before_photos.length > 0 && (
                  <div>
                    <Label>Before Photos</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                      {formData.existing_before_photos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={getImageUrl(photo)}
                            alt={`Before photo ${index + 1}`}
                            className="rounded-lg object-cover aspect-square border"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeExistingPhoto(photo, 'before')}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {formData.existing_after_photos.length > 0 && (
                  <div>
                    <Label>After Photos</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                      {formData.existing_after_photos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={getImageUrl(photo)}
                            alt={`After photo ${index + 1}`}
                            className="rounded-lg object-cover aspect-square border"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeExistingPhoto(photo, 'after')}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Photo Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Add New Photos
              </h3>
              
              <div>
                <Label>Before Photos</Label>
                <PhotoUpload
                  photos={formData.before_photos}
                  onPhotosChange={(photos) => setFormData(prev => ({ ...prev, before_photos: photos }))}
                  label="Upload before photos"
                />
              </div>

              <div>
                <Label>After Photos</Label>
                <PhotoUpload
                  photos={formData.after_photos}
                  onPhotosChange={(photos) => setFormData(prev => ({ ...prev, after_photos: photos }))}
                  label="Upload after photos"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <Button
                variant="outline"
                onClick={() => handleSave(false)}
                disabled={saving}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Draft'}
              </Button>
              
              <Button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                {saving ? 'Submitting...' : 'Submit Ticket'}
              </Button>

              <Button
                variant="ghost"
                onClick={() => navigate(`/view-ticket/${id}`)}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default EditTicket;
