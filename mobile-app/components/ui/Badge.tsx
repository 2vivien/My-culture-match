import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import tw from '@/lib/tailwind';

type BadgeProps = ViewProps & {
  label: string;
  variant?: 'primary' | 'white' | 'glass';
};

export const Badge = ({ label, variant = 'primary', style, ...props }: BadgeProps) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'white':
        return 'bg-white';
      case 'glass':
        return 'bg-white/90';
      default:
        return 'bg-primary';
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'white':
      case 'glass':
        return 'text-textMain';
      default:
        return 'text-white';
    }
  };

  return (
    <View 
      style={[
        tw`${getVariantStyle()} px-3 py-1.5 rounded-full shadow-sm`,
        style
      ]} 
      {...props}
    >
      <Text style={tw`${getTextStyle()} text-[10px] font-bold`}>
        {label}
      </Text>
    </View>
  );
};
