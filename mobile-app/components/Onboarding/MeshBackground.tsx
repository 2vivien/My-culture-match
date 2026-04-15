import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, RadialGradient as SvgRadialGradient, Stop, Rect, G, Circle } from 'react-native-svg';

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
              {/* Mesh 1: Peach, Light Blue, Pink, Yellow */}
              <SvgRadialGradient id="mesh1_peach" cx="0" cy="0" rx="60%" ry="40%" fx="0" fy="0">
                <Stop offset="0" stopColor="#FFE4D6" stopOpacity="0.8" />
                <Stop offset="1" stopColor="#FFE4D6" stopOpacity="0" />
              </SvgRadialGradient>
              <SvgRadialGradient id="mesh1_blue" cx="100%" cy="20%" rx="70%" ry="50%" fx="100%" fy="20%">
                <Stop offset="0" stopColor="#E0F2FE" stopOpacity="0.6" />
                <Stop offset="1" stopColor="#E0F2FE" stopOpacity="0" />
              </SvgRadialGradient>
              <SvgRadialGradient id="mesh1_pink" cx="0" cy="80%" rx="60%" ry="40%" fx="0" fy="80%">
                <Stop offset="0" stopColor="#FCE7F3" stopOpacity="0.8" />
                <Stop offset="1" stopColor="#FCE7F3" stopOpacity="0" />
              </SvgRadialGradient>
              <SvgRadialGradient id="mesh1_yellow" cx="40%" cy="40%" rx="50%" ry="40%" fx="40%" fy="40%">
                <Stop offset="0" stopColor="#FEF08A" stopOpacity="0.4" />
                <Stop offset="1" stopColor="#FEF08A" stopOpacity="0" />
              </SvgRadialGradient>
            </>
          ) : (
            <>
              {/* Mesh 2: Warm - Orange pale, Pink, Orange pale, Blue */}
              <SvgRadialGradient id="mesh2_orange1" cx="20%" cy="0" rx="60%" ry="40%" fx="20%" fy="0">
                <Stop offset="0" stopColor="#FFEDD5" stopOpacity="0.8" />
                <Stop offset="1" stopColor="#FFEDD5" stopOpacity="0" />
              </SvgRadialGradient>
              <SvgRadialGradient id="mesh2_pink" cx="90%" cy="30%" rx="60%" ry="50%" fx="90%" fy="30%">
                <Stop offset="0" stopColor="#FCE7F3" stopOpacity="1" />
                <Stop offset="1" stopColor="#FCE7F3" stopOpacity="0" />
              </SvgRadialGradient>
              <SvgRadialGradient id="mesh2_orange2" cx="0" cy="70%" rx="70%" ry="50%" fx="0" fy="70%">
                <Stop offset="0" stopColor="#FFEDD5" stopOpacity="0.6" />
                <Stop offset="1" stopColor="#FFEDD5" stopOpacity="0" />
              </SvgRadialGradient>
              <SvgRadialGradient id="mesh2_blue" cx="100%" cy="100%" rx="50%" ry="40%" fx="100%" fy="100%">
                <Stop offset="0" stopColor="#E0F2FE" stopOpacity="0.5" />
                <Stop offset="1" stopColor="#E0F2FE" stopOpacity="0" />
              </SvgRadialGradient>
            </>
          )}
        </Defs>

        <Rect x="0" y="0" width="100%" height="100%" fill="#FFFDF9" />
        
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
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#mesh2_orange2)" />
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#mesh2_blue)" />
          </>
        )}
      </Svg>
    </View>
  );
};
