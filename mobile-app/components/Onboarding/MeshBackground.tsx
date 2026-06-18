import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, RadialGradient as SvgRadialGradient, Stop, Rect, LinearGradient as SvgLinearGradient } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type MeshBackgroundProps = {
  variant?: 1 | 2;
};

export const MeshBackground: React.FC<MeshBackgroundProps> = ({ variant = 1 }) => {
  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg height="100%" width="100%" viewBox={`0 0 ${SCREEN_WIDTH} ${SCREEN_HEIGHT}`}>
        <Defs>
          {variant === 1 ? (
            <>
              {/* Mesh 1: Peach, Light Blue, Terracotta, Yellow - Concentrated at the top/middle */}
              <SvgRadialGradient id="mesh1_peach" cx="10%" cy="10%" rx="100%" ry="60%" fx="10%" fy="10%">
                <Stop offset="0" stopColor="#FFE4D6" stopOpacity="0.8" />
                <Stop offset="1" stopColor="#FFE4D6" stopOpacity="0" />
              </SvgRadialGradient>
              <SvgRadialGradient id="mesh1_blue" cx="100%" cy="20%" rx="100%" ry="70%" fx="100%" fy="20%">
                <Stop offset="0" stopColor="#E0F2FE" stopOpacity="0.7" />
                <Stop offset="1" stopColor="#E0F2FE" stopOpacity="0" />
              </SvgRadialGradient>
              <SvgRadialGradient id="mesh1_pink" cx="0%" cy="70%" rx="90%" ry="60%" fx="0%" fy="70%">
                <Stop offset="0" stopColor="#FFEBE0" stopOpacity="0.8" />
                <Stop offset="1" stopColor="#FFEBE0" stopOpacity="0" />
              </SvgRadialGradient>
              <SvgRadialGradient id="mesh1_yellow" cx="70%" cy="40%" rx="80%" ry="70%" fx="70%" fy="40%">
                <Stop offset="0" stopColor="#FEF08A" stopOpacity="0.4" />
                <Stop offset="1" stopColor="#FEF08A" stopOpacity="0" />
              </SvgRadialGradient>
            </>
          ) : (
            <>
              {/* Mesh 2: Warm - Orange pale, Terracotta, Yellow, Blue */}
              <SvgRadialGradient id="mesh2_orange1" cx="30%" cy="5%" rx="100%" ry="60%" fx="30%" fy="5%">
                <Stop offset="0" stopColor="#FFEDD5" stopOpacity="0.9" />
                <Stop offset="1" stopColor="#FFEDD5" stopOpacity="0" />
              </SvgRadialGradient>
              <SvgRadialGradient id="mesh2_pink" cx="95%" cy="30%" rx="100%" ry="70%" fx="95%" fy="30%">
                <Stop offset="0" stopColor="#FFEBE0" stopOpacity="1" />
                <Stop offset="1" stopColor="#FFEBE0" stopOpacity="0" />
              </SvgRadialGradient>
              <SvgRadialGradient id="mesh2_yellow" cx="20%" cy="40%" rx="90%" ry="70%" fx="20%" fy="40%">
                <Stop offset="0" stopColor="#FEF08A" stopOpacity="0.6" />
                <Stop offset="1" stopColor="#FEF08A" stopOpacity="0" />
              </SvgRadialGradient>
              <SvgRadialGradient id="mesh2_blue" cx="100%" cy="60%" rx="80%" ry="60%" fx="100%" fy="60%">
                <Stop offset="0" stopColor="#E0F2FE" stopOpacity="0.5" />
                <Stop offset="1" stopColor="#E0F2FE" stopOpacity="0" />
              </SvgRadialGradient>
            </>
          )}

          {/* Soft linear gradient fade to white towards the bottom */}
          <SvgLinearGradient id="white_fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="white" stopOpacity="0" />
            <Stop offset="0.55" stopColor="white" stopOpacity="0" />
            <Stop offset="0.85" stopColor="white" stopOpacity="1" />
            <Stop offset="1" stopColor="white" stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>

        <Rect x="0" y="0" width="100%" height="100%" fill="#FFFFFF" />
        
        {variant === 1 ? (
          <>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#mesh1_peach)" />
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#mesh1_blue)" />
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#mesh1_pink)" />
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#mesh1_yellow)" />
          </>
        ) : (
          <>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#mesh2_orange1)" />
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#mesh2_pink)" />
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#mesh2_yellow)" />
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#mesh2_blue)" />
          </>
        )}

        {/* Apply the soft fade to white at the bottom */}
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#white_fade)" />
      </Svg>
    </View>
  );
};
