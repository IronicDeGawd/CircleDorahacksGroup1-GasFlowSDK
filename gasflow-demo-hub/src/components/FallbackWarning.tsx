import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FallbackWarningProps {
  type: 'gas_estimation' | 'fast_transfer' | 'bridge_fee' | 'general';
  message?: string;
}

const FallbackWarning = ({ type, message }: FallbackWarningProps) => {
  const getWarningContent = () => {
    switch (type) {
      case 'gas_estimation':
        return {
          title: 'Using Gas Estimation Fallback',
          description: message || 'Unable to get real-time gas prices. Using fallback estimates.',
        };
      case 'fast_transfer':
        return {
          title: 'Fast Transfer Availability Unknown',
          description: message || 'Cannot verify Circle Fast Transfer allowance. Using threshold-based check.',
        };
      case 'bridge_fee':
        return {
          title: 'Using Bridge Fee Estimation',
          description: message || 'Circle API unavailable. Using estimated bridge fees.',
        };
      case 'general':
        return {
          title: 'Service Degraded',
          description: message || 'Some services are using fallback implementations.',
        };
      default:
        return {
          title: 'Fallback Mode Active',
          description: message || 'Some features are running in fallback mode.',
        };
    }
  };

  const { title, description } = getWarningContent();

  return (
    <Alert className="border-orange-200 bg-orange-50 text-orange-800 mb-4">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="ml-2">
        <span className="font-medium">{title}:</span> {description}
      </AlertDescription>
    </Alert>
  );
};

export default FallbackWarning;