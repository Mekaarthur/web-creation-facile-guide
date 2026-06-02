import React from 'react';

interface PaymentLogosProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PaymentLogos: React.FC<PaymentLogosProps> = ({ 
  className = '', 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'h-6 px-2 py-1 text-xs',
    md: 'h-8 px-3 py-1 text-sm',
    lg: 'h-10 px-4 py-2 text-base'
  };

  const logoSize = sizeClasses[size];

  return (
    <div className={`flex gap-2 items-center ${className}`}>
      <div className={`bg-blue-600 text-white rounded font-bold ${logoSize}`}>
        VISA
      </div>
      <div className={`bg-red-500 text-white rounded font-bold ${logoSize}`}>
        MASTERCARD
      </div>
      <div className={`bg-blue-800 text-white rounded font-bold ${logoSize}`}>
        MAESTRO
      </div>
      <div className={`bg-gray-800 text-white rounded font-bold ${logoSize}`}>
        AMEX
      </div>
    </div>
  );
};

interface SecurityBadgesProps {
  className?: string;
}

export const SecurityBadges: React.FC<SecurityBadgesProps> = ({ className = '' }) => {
  return (
    <div className={`flex gap-2 items-center text-xs ${className}`}>
      <div className="bg-green-100 text-green-800 px-2 py-1 rounded font-medium">
        SSL 256-bit
      </div>
      <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
        3D Secure
      </div>
      <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded font-medium">
        PCI DSS
      </div>
    </div>
  );
};

export default PaymentLogos;