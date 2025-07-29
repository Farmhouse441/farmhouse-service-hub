import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, Scissors, Snowflake, Plus } from 'lucide-react';

const templates = [
  {
    id: 'house-cleaning',
    title: 'House Turnover Cleaning',
    description: 'Complete house cleaning with room-by-room documentation',
    icon: Home,
    color: 'bg-blue-500'
  },
  {
    id: 'lawn-care',
    title: 'Lawn Mowing & Weed Whacking',
    description: 'Yard maintenance with before/after documentation',
    icon: Scissors,
    color: 'bg-green-500'
  },
  {
    id: 'snow-removal',
    title: 'Snow Removal',
    description: 'Snow clearing for driveways, walkways, and steps',
    icon: Snowflake,
    color: 'bg-cyan-500'
  },
  {
    id: 'custom',
    title: 'Create From Scratch',
    description: 'Custom service ticket for any type of work',
    icon: Plus,
    color: 'bg-purple-500'
  }
];

export default function NewTicket() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">New Service Ticket</h1>
            <p className="text-muted-foreground">Choose a template to get started</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map((template) => {
            const Icon = template.icon;
            return (
              <Card 
                key={template.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/ticket/${template.id}`)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${template.color} text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{template.title}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    Select Template
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}