import { Dimensions, PixelRatio, Platform } from 'react-native';

// Get screen dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Base design size
const baseWidth = 375;//375
const baseHeight = 812;
// const baseWidth = 350;
// const baseHeight = 680;


// Use smaller dimension as reference for scaling in landscape
const referenceWidth: number = Math.min(screenWidth, screenHeight);
const referenceHeight: number = Math.max(screenWidth, screenHeight);

// Scale based on width (or height in landscape)
const scale = (size: number): number => (referenceWidth / baseWidth) * size;

// Scale based on height
const verticalScale = (size: number): number => (referenceHeight / baseHeight) * size;

// Moderate scale for fonts/images
const moderateScale = (size: number, factor: number = 0.5): number =>
  size + (scale(size) - size) * factor;

// Font scaling with PixelRatio
const fontScale = (size: number): number => {
  const ratio: number = PixelRatio.getFontScale();
  return moderateScale(size) * (Platform.OS === 'android' ? ratio : 1);
};

export { scale, verticalScale, moderateScale, fontScale, screenWidth, screenHeight };



