import React, { useState } from 'react';
import { View, Button, Text, Alert, ScrollView } from 'react-native';
import { pick } from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import Svg, { SvgXml } from 'react-native-svg';

export default function SvgUploader() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [svgXml, setSvgXml] = useState<string | null>(null);

  const handlePickSvg = async () => {
    try {
      const results = await pick({
        type: ['image/svg+xml'],
        copyTo: 'cachesDirectory',
      });

      const res = results[0];

      if (!res.name || !res.name.endsWith('.svg')) {
        Alert.alert('Please select an SVG file.');
        return;
      }

      const fileUri = res.uri;
      const svgData = await RNFS.readFile(fileUri, 'utf8');

      // Save SVG to app's document directory
      const folderPath = `${RNFS.DocumentDirectoryPath}/svg`;
      await RNFS.mkdir(folderPath);

      const destPath = `${folderPath}/${res.name}`;
      await RNFS.writeFile(destPath, svgData, 'utf8');
      setFileName(res.name);
      setSvgXml(svgData);

      Alert.alert(
        'SVG uploaded!',
        `Saved as ${res.name}.\n\nYou can now preview it below.`
      );
    } catch (err: any) {
      if (err.code !== 'DOCUMENT_PICKER_CANCELED') {
        Alert.alert('Error', String(err));
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Button title="Upload SVG" onPress={handlePickSvg} />
      {fileName && (
        <Text style={{ marginTop: 10 }}>
          Uploaded: {fileName}
        </Text>
      )}
      {svgXml && (
        <View style={{ marginTop: 20, alignItems: 'center' }}>
          <SvgXml xml={svgXml} width={300} height={300} />
        </View>
      )}
    </ScrollView>
  );
}