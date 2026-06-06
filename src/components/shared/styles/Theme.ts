import { Theme, Font } from "./types";

export const doctorTheme: Theme = {
  colors: {
    primary: '#007AFF', // Blue for Doctor
    secondary: '#5856D6',
    background: '#F5F5F5',
  },
};

export const nurseTheme: Theme & Font= {
  colors: {
    primary: '#34C759', // Green for Nurse
    secondary: '#FF9500',
    background: '#F5F5F5',
  },

  fontSize:{
    appHeader: 24,
    header: 16,
    largeText: 14,
    mediumText: 12,
    smallText: 10
  }
};