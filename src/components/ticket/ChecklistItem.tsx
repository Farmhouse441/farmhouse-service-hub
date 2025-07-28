import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface ChecklistItemProps {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  required?: boolean;
}

export function ChecklistItem({ 
  id, 
  label, 
  checked, 
  onCheckedChange, 
  required = false 
}: ChecklistItemProps) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
      <Label
        htmlFor={id}
        className="text-sm font-normal cursor-pointer"
      >
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
    </div>
  );
}