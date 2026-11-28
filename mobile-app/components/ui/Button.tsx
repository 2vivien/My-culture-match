import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps } from 'react-native';
import tw from '@/lib/tailwind';

type ButtonProps = TouchableOpacityProps & {
  title?: string;
  variant?: 'primary' | 'outline' | 'ghost' | 'secondary';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  children?: React.ReactNode;
};

export const Button = ({ 
  title, 
  variant = 'primary', 
  size = 'md', 
  children, 
  style,
  ...props 
}: ButtonProps) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'outline':
        return 'bg-white border border-gray-200';
      case 'ghost':
        return 'bg-transparent';
      case 'secondary':
        return 'bg-gray-100';
      default:
        return 'bg-primary shadow-lg';
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5';
      case 'lg':
        return 'px-8 py-4';
      case 'icon':
        return 'w-10 h-10 items-center justify-center rounded-full';
      default:
        return 'px-6 py-3';
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
      case 'ghost':
      case 'secondary':
        return 'text-textMain';
      default:
        return 'text-white';
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[
        tw`${getVariantStyle()} ${getSizeStyle()} rounded-full flex-row items-center justify-center`,
        style
      ]}
      {...props}
    >
      {children ? children : (
        <Text style={tw`${getTextStyle()} font-bold text-[15px]`}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};
