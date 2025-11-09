/**
 * Quick Status Update Component
 * Allows rapid status changes for listings without opening full edit modal
 */

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Loader2 } from 'lucide-react';

interface QuickStatusUpdateProps {
  listingId: string;
  currentStatus: string;
  onStatusChange?: (newStatus: string) => void;
}

export function QuickStatusUpdate({
  listingId,
  currentStatus,
  onStatusChange,
}: QuickStatusUpdateProps) {
  const [status, setStatus] = useState(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();

  const statusOptions = [
    { value: 'active', label: 'Active', color: 'text-green-600' },
    { value: 'pending', label: 'Pending', color: 'text-yellow-600' },
    { value: 'sold', label: 'Sold', color: 'text-blue-600' },
    { value: 'under_contract', label: 'Under Contract', color: 'text-purple-600' },
    { value: 'off_market', label: 'Off Market', color: 'text-gray-600' },
  ];

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    setStatus(newStatus);

    try {
      const { error } = await supabase
        .from('listings')
        .update({ status: newStatus })
        .eq('id', listingId);

      if (error) throw error;

      // Show success indicator
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);

      // Show toast notification
      const statusLabel = statusOptions.find((s) => s.value === newStatus)?.label || newStatus;
      toast({
        title: 'Status Updated',
        description: `Listing marked as ${statusLabel}`,
      });

      // Call callback if provided
      onStatusChange?.(newStatus);
    } catch (error) {
      console.error('Failed to update status:', error);
      // Revert status on error
      setStatus(currentStatus);
      toast({
        title: 'Update Failed',
        description: 'Failed to update listing status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const currentOption = statusOptions.find((s) => s.value === status);

  return (
    <div className="relative inline-block">
      <Select value={status} onValueChange={handleStatusChange} disabled={isUpdating}>
        <SelectTrigger
          className={`w-[140px] h-8 text-xs ${currentOption?.color || ''} ${
            isUpdating ? 'opacity-50' : ''
          }`}
        >
          <div className="flex items-center gap-2">
            {isUpdating && <Loader2 className="h-3 w-3 animate-spin" />}
            {showSuccess && !isUpdating && <CheckCircle className="h-3 w-3 text-green-600" />}
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className={option.color}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
