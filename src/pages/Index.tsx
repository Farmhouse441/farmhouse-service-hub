import { Button } from '@/components/ui/button';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="text-center max-w-3xl">
        <h1 className="text-5xl font-bold mb-6">Farmhouse @ Bridgewater Service Provider Portal</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Submit work reports and invoices for services provided to the Farmhouse with ease
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            onClick={() => window.location.href = '/auth'}
            className="text-lg px-8 py-3"
          >
            Get Started
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => window.location.href = '/auth'}
            className="text-lg px-8 py-3"
          >
            Sign In
          </Button>
        </div>
        
        <div className="mt-16 grid md:grid-cols-3 gap-8 text-left">
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="text-lg font-semibold mb-2">Service Tickets</h3>
            <p className="text-muted-foreground">
              Create detailed work reports with line items, hours, and rates
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="text-lg font-semibold mb-2">Photo Documentation</h3>
            <p className="text-muted-foreground">
              Upload before and after photos to document your work
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="text-lg font-semibold mb-2">Invoice Management</h3>
            <p className="text-muted-foreground">
              Upload invoices and track approval status
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
