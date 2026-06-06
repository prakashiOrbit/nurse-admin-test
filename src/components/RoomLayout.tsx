// --- Component: RoomLayout.tsx ---
import React, { useRef, useState } from 'react';
import { View, Animated, TouchableOpacity, Alert, useWindowDimensions } from 'react-native';
import Svg, { Rect, Circle, G, Text as SvgText } from 'react-native-svg';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import WheelColorPicker from 'react-native-wheel-color-picker';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const RoomLayout = () => {
  const [selectedColor, setSelectedColor] = useState<string>('#002afa');
  const [bedColors, setBedColors] = useState<{ [key: string]: string }>({});
  const [nurseColors, setNurseColors] = useState<{ [key: string]: string }>({});
  const [blinkingBed, setBlinkingBed] = useState<string | null>(null);
  const blinkAnim = useRef(new Animated.Value(1)).current;

  const startBlinking = (bedName: string) => {
    setBlinkingBed(bedName);
    blinkAnim.setValue(1);
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0, duration: 400, useNativeDriver: false }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
      ])
    ).start();
  };

  const stopBlinking = () => {
    blinkAnim.stopAnimation();
    setBlinkingBed(null);
  };

  const handleBedPress = (bed: string) => {
    setBedColors(prev => ({ ...prev, [bed]: selectedColor }));
    startBlinking(bed);
    setTimeout(stopBlinking, 3000);
  };

  const handleNursePress = (nurse: string) => {
    setNurseColors(prev => ({ ...prev, [nurse]: selectedColor }));
  };

  const handleDoorPress = (door: string) => {
    Alert.alert(`${door} pressed`);
  };

  const { width, height } = useWindowDimensions();
  const isHorizontal = width > height;
  const colorPickerSize = isHorizontal ? width * 0.3 : width * 0.9;
  const svgWidth = isHorizontal ? width - colorPickerSize : width;
  const svgHeight = isHorizontal ? height : height - colorPickerSize;
  const svgViewBoxWidth = 1000;
  const svgViewBoxHeight = 600;

  const beds = [
    { name: 'Bed 1', x: 150, y: 30 },
    { name: 'Bed 2', x: 270, y: 30 },
    { name: 'Bed 3', x: 390, y: 30 },
    { name: 'Bed 4', x: 550, y: 30 },
    { name: 'Bed 5', x: 670, y: 30 },
    { name: 'Bed 6', x: 920, y: 30, vertical: true },
    { name: 'Bed 7', x: 920, y: 140, vertical: true },
    { name: 'Bed 8', x: 920, y: 250, vertical: true },
    { name: 'Bed 9', x: 920, y: 360, vertical: true },
    { name: 'Bed 10', x: 920, y: 480, vertical: true },
    { name: 'Bed 11', x: 150, y: 520 },
    { name: 'Bed 12', x: 270, y: 520 },
    { name: 'Bed 13', x: 390, y: 520 },
    { name: 'Bed 14', x: 550, y: 520 },
    { name: 'Bed 15', x: 670, y: 520 },
  ];

  const nurses = [
    { name: 'Nurse 1', cx: 430, cy: 270 },
    { name: 'Nurse 2', cx: 500, cy: 270 },
    { name: 'Nurse 3', cx: 570, cy: 270 },
    { name: 'Nurse 4', cx: 465, cy: 320 },
    { name: 'Nurse 5', cx: 535, cy: 320 },
  ];

  return (
    <View style={{ flex: 1, flexDirection: isHorizontal ? 'row' : 'column' }}>
      <View
        style={{
          width: isHorizontal ? colorPickerSize : '100%',
          height: isHorizontal ? '100%' : colorPickerSize,
          justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5',
        }}>
        <WheelColorPicker
          color={selectedColor}
          onColorChange={setSelectedColor}
        />
      </View>

      <View style={{ width: svgWidth, height: svgHeight }}>
        <ReactNativeZoomableView
          maxZoom={20}
          contentWidth={svgViewBoxWidth}
          contentHeight={svgViewBoxHeight}
          style={{ flex: 1 }}
          bindToBorders={false}
        >
          <View style={{ width: svgWidth, height: svgHeight }}>
            <Svg
              width={svgWidth}
              height={svgHeight}
              viewBox={`0 0 ${svgViewBoxWidth} ${svgViewBoxHeight}`}
            >
              <Rect x="10" y="10" width="980" height="580" fill="#f9f9f9" stroke="black" strokeWidth="2" />
              <Rect x="10" y="270" width="20" height="60" fill="#8B4513" />
              <SvgText x="12" y="305" fontSize="12" fill="white" transform="rotate(-90 12,305)">Door</SvgText>

              <G>
                <Rect x="350" y="150" width="300" height="300" fill="#cce5ff" stroke="black" />
                <SvgText x="400" y="180" fontSize="24" fill="black">Nursing Station</SvgText>
              </G>

              {nurses.map(nurse => (
                <React.Fragment key={nurse.name}>
                  <Circle
                    cx={nurse.cx}
                    cy={nurse.cy}
                    r={28}
                    fill={nurseColors[nurse.name] || '#ccc'}
                  />
                  <SvgText x={nurse.cx - 18} y={nurse.cy + 5} fontSize="12" fill="black">
                    {nurse.name}
                  </SvgText>
                </React.Fragment>
              ))}

              {beds.map(bed => {
                const color = bedColors[bed.name] || '#b3e5fc';
                const isBlinking = blinkingBed === bed.name;
                const w = bed.vertical ? 50 : 100;
                const h = bed.vertical ? 100 : 50;
                const x = bed.x;
                const y = bed.y;

                const opacity = isBlinking
                  ? blinkAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] })
                  : 1;

                const mattressProps = {
                  x: x + (bed.vertical ? 0 : 10),
                  y: y + (bed.vertical ? 10 : 0),
                  width: bed.vertical ? w : w - 20,
                  height: bed.vertical ? h - 20 : h,
                  rx: 6,
                  fill: '#fff',
                  stroke: color,
                  strokeWidth: 3,
                  opacity,
                };

                return (
                  <React.Fragment key={bed.name}>
                    {bed.vertical ? (
                      <>
                        <Rect x={x} y={y} width={w} height={10} rx={3} fill={color} opacity={0.7} />
                        <Rect x={x} y={y + h - 10} width={w} height={10} rx={3} fill={color} opacity={0.7} />
                      </>
                    ) : (
                      <>
                        <Rect x={x} y={y} width={10} height={h} rx={3} fill={color} opacity={0.7} />
                        <Rect x={x + w - 10} y={y} width={10} height={h} rx={3} fill={color} opacity={0.7} />
                      </>
                    )}

                    {isBlinking ? <AnimatedRect {...mattressProps} /> : <Rect {...{ ...mattressProps, opacity: 1 }} />}

                    <Circle cx={x + 8} cy={y + h - 4} r={4} fill={color} opacity={0.5} />
                    <Circle cx={x + w - 8} cy={y + h - 4} r={4} fill={color} opacity={0.5} />

                    <SvgText x={x + 10} y={y + (bed.vertical ? h / 2 : h + 18)} fontSize="14" fill="black">
                      {bed.name}
                    </SvgText>
                  </React.Fragment>
                );
              })}
            </Svg>

            {beds.map(b => (
              <TouchableOpacity
                key={b.name}
                onPress={() => handleBedPress(b.name)}
                style={{
                  position: 'absolute',
                  top: (b.y / svgViewBoxHeight) * svgHeight,
                  left: (b.x / svgViewBoxWidth) * svgWidth,
                  width: ((b.vertical ? 50 : 100) / svgViewBoxWidth) * svgWidth,
                  height: ((b.vertical ? 100 : 50) / svgViewBoxHeight) * svgHeight,
                }}
              />
            ))}

            {nurses.map(n => (
              <TouchableOpacity
                key={n.name}
                onPress={() => handleNursePress(n.name)}
                style={{
                  position: 'absolute',
                  top: ((n.cy - 28) / svgViewBoxHeight) * svgHeight,
                  left: ((n.cx - 28) / svgViewBoxWidth) * svgWidth,
                  width: (56 / svgViewBoxWidth) * svgWidth,
                  height: (56 / svgViewBoxHeight) * svgHeight,
                }}
              />
            ))}

            <TouchableOpacity
              onPress={() => handleDoorPress('Door')}
              style={{
                position: 'absolute',
                top: (270 / svgViewBoxHeight) * svgHeight,
                left: (10 / svgViewBoxWidth) * svgWidth,
                width: (20 / svgViewBoxWidth) * svgWidth,
                height: (60 / svgViewBoxHeight) * svgHeight,
              }}
            />
          </View>
        </ReactNativeZoomableView>
      </View>
    </View>
  );
};

export default RoomLayout;
