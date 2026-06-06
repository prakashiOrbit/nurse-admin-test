import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { scale } from '../../../../utils/scaling';

type SharedLogoutProps = {
  LockIMG: any;
  LogoutBTN: any;
  onLogoutPress: () => void;
  onChangePasswordPress: () => void;
};

const ICON_SIZE = scale(20);

const SharedLogout: React.FC<SharedLogoutProps> = ({
  LockIMG,
  LogoutBTN,
  onLogoutPress,
  onChangePasswordPress,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.row} onPress={onChangePasswordPress}>
        <Image source={LockIMG} style={styles.icon} />
        <Text style={styles.text}>Change Password</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity style={styles.row} onPress={onLogoutPress}>
        <Image source={LogoutBTN} style={styles.icon} />
        <Text style={styles.text}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SharedLogout;
const styles = StyleSheet.create({
  container: {
    width: 'auto',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: scale(6),
    paddingHorizontal: scale(14),
    elevation: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(8),
  },
  icon: {
    width: scale(18),
    height: scale(18),
    resizeMode: 'contain',
    marginRight: scale(10),
  },
  text: {
    fontSize: scale(14),
    color: '#333',
  },
  divider: {
  height: StyleSheet.hairlineWidth, 
  backgroundColor: '#E0E0E0',
  marginVertical: scale(4),
},
});
