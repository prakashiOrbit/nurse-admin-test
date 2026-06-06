import { useWindowDimensions, PixelRatio } from 'react-native';

export const useResponsive = () => {
  const { width, height } = useWindowDimensions();
  const shortest = Math.min(width, height);

  const wp = (percent: number) =>
    PixelRatio.roundToNearestPixel((width * percent) / 100);

  const hp = (percent: number) =>
    PixelRatio.roundToNearestPixel((height * percent) / 100);

  const isTablet = shortest >= 600;

  return {
    wp,
    hp,
    isTablet,
    width,
    height,
  };
};
