import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

// Mock console methods to avoid noise in tests
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

describe('Service Ticket Creation', () => {
  it('should create a ticket without photos successfully', async () => {
    // Test basic ticket creation without photos
    const ticketData = {
      title: 'Test House Cleaning',
      description: 'Test cleaning service',
      property_address: '123 Test St, Test City',
      work_start_date: '2024-01-15T09:00:00',
      work_end_date: '2024-01-15T12:00:00',
      status: 'submitted' as const
    };

    const { data, error } = await supabase
      .from('service_tickets')
      .insert({
        user_id: '40b6d72c-bc40-4a2e-b2c6-fdb4fe1eeac4', // From logs
        ...ticketData
      })
      .select()
      .single();

    console.log('Ticket creation result:', { data, error });
    
    if (error) {
      console.error('Ticket creation failed:', error);
    } else {
      console.log('Ticket created successfully:', data);
    }

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('should test photo upload to storage bucket', async () => {
    // Create a test file
    const testFile = new File(['test content'], 'test.png', { type: 'image/png' });
    const fileName = `test-${Date.now()}.png`;
    const filePath = `before/${fileName}`;

    console.log('Attempting to upload file to:', filePath);

    const { data, error } = await supabase.storage
      .from('ticket-photos')
      .upload(filePath, testFile);

    console.log('Upload result:', { data, error });

    if (error) {
      console.error('Upload failed:', error);
      console.error('Error details:', {
        message: error.message,
        details: error
      });
    } else {
      console.log('Upload successful:', data);
    }

    // This should now work with the storage policies in place
    if (error) {
      console.error('Upload failed:', error);
      expect(error).toBeNull(); // Should pass now
    } else {
      console.log('Upload successful:', data);
      expect(data).toBeDefined();
    }
  });

  it('should test storage bucket permissions', async () => {
    // Test listing files in the bucket
    const { data: files, error: listError } = await supabase.storage
      .from('ticket-photos')
      .list('before', {
        limit: 1
      });

    console.log('List files result:', { files, listError });

    if (listError) {
      console.error('List files failed:', listError);
    }
  });

  it('should test current user authentication', async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    console.log('Current user:', { user, error });
    
    expect(user).toBeDefined();
    expect(user?.id).toBe('40b6d72c-bc40-4a2e-b2c6-fdb4fe1eeac4');
  });
});