import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { DollarSign, Upload, FileText } from 'lucide-react';

interface FinancialSectionProps {
  hourlyRate: number;
  onHourlyRateChange: (rate: number) => void;
  totalAmount: number;
  onTotalAmountChange: (amount: number) => void;
  invoiceNumber: string;
  onInvoiceNumberChange: (number: string) => void;
  invoiceFile: File | null;
  onInvoiceFileChange: (file: File | null) => void;
  calculatedHours: number;
  staff: number;
}

export function FinancialSection({
  hourlyRate,
  onHourlyRateChange,
  totalAmount,
  onTotalAmountChange,
  invoiceNumber,
  onInvoiceNumberChange,
  invoiceFile,
  onInvoiceFileChange,
  calculatedHours,
  staff
}: FinancialSectionProps) {
  const [useCalculatedAmount, setUseCalculatedAmount] = useState(true);
  
  const calculatedAmount = hourlyRate * calculatedHours;
  const displayAmount = useCalculatedAmount ? calculatedAmount : totalAmount;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onInvoiceFileChange(file);
  };

  const handleAmountModeChange = (useCalculated: boolean) => {
    setUseCalculatedAmount(useCalculated);
    if (useCalculated) {
      onTotalAmountChange(calculatedAmount);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Financial Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Hourly Rate */}
        <div className="space-y-2">
          <Label htmlFor="hourly-rate">
            Hourly Rate
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-sm">$</span>
            <Input
              id="hourly-rate"
              type="number"
              step="0.01"
              min="0"
              value={hourlyRate}
              onChange={(e) => onHourlyRateChange(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
            <span className="text-sm text-muted-foreground">per hour</span>
          </div>
        </div>

        {/* Labor Calculation Summary */}
        {calculatedHours > 0 && hourlyRate > 0 && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <h4 className="font-medium">Labor Calculation</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Staff Count:</span>
                <span>{staff}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Hours:</span>
                <span>{calculatedHours} hours</span>
              </div>
              <div className="flex justify-between">
                <span>Rate per Hour:</span>
                <span>${hourlyRate.toFixed(2)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-medium">
                <span>Calculated Labor Cost:</span>
                <span>${calculatedAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Amount Charged */}
        <div className="space-y-4">
          <Label>Total Amount Charged</Label>
          
          {calculatedAmount > 0 && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant={useCalculatedAmount ? "default" : "outline"}
                onClick={() => handleAmountModeChange(true)}
                className="flex-1"
              >
                Use Calculated (${calculatedAmount.toFixed(2)})
              </Button>
              <Button
                type="button"
                variant={!useCalculatedAmount ? "default" : "outline"}
                onClick={() => handleAmountModeChange(false)}
                className="flex-1"
              >
                Enter Manual Amount
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-sm">$</span>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={displayAmount}
              onChange={(e) => {
                setUseCalculatedAmount(false);
                onTotalAmountChange(parseFloat(e.target.value) || 0);
              }}
              placeholder="0.00"
              disabled={useCalculatedAmount && calculatedAmount > 0}
            />
          </div>
        </div>

        {/* Invoice Number */}
        <div className="space-y-2">
          <Label htmlFor="invoice-number">
            Invoice Number
          </Label>
          <Input
            id="invoice-number"
            value={invoiceNumber}
            onChange={(e) => onInvoiceNumberChange(e.target.value)}
            placeholder="INV-2024-001"
          />
          <p className="text-xs text-muted-foreground">
            Optional: Reference number for your invoice
          </p>
        </div>

        {/* Invoice File Upload */}
        <div className="space-y-2">
          <Label htmlFor="invoice-file">
            Invoice File (Optional)
          </Label>
          <div className="space-y-2">
            <Input
              id="invoice-file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileChange}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
            />
            {invoiceFile && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>{invoiceFile.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onInvoiceFileChange(null)}
                >
                  Remove
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Accepted formats: PDF, JPG, PNG, DOC, DOCX (max 10MB)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}