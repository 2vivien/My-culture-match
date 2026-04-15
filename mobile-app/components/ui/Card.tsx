import React from 'react';
import { View, ViewProps } from 'react-native';
import tw from '@/lib/tailwind';

type CardProps = ViewProps & {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outline';
};

export const Card = ({ children, variant = 'default', style, ...props }: CardProps) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'elevated':
        return 'bg-white shadow-xl';
      case 'outline':
        return 'bg-white border border-gray-100';
      default:
        return 'bg-white';
    }
  };

  return (
    <View 
      style={[
        tw`${getVariantStyle()} rounded-[32px] overflow-hidden`,
        style
      ]} 
      {...props}
    >
      {children}
    </View>
  );
};
