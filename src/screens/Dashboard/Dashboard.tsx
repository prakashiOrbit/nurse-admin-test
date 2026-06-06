import React from 'react';
import { View } from 'react-native';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
// import SvgWardSvg4 from './src/svg/WardSvg4';
import HomeScreen from './HomeScreen';
import { MenuProvider } from 'react-native-popup-menu';

import { SafeAreaView } from 'react-native-safe-area-context';
export default function Dashboard() {
    return (
    //    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
    //     <MenuProvider>
    //      <HomeScreen/>
    //     </MenuProvider>
    //    </SafeAreaView>
    <View style={{ flex: 1, backgroundColor: '#000'}}>
         <MenuProvider>
         <HomeScreen/>
        </MenuProvider>
    </View>
    );
}