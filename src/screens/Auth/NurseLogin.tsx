// nurse-app/screens/NurseLoginScreen.tsx
import SharedLoginScreen from '../../components/shared/ui/SharedLoginScreen';
import { mobileNumberLoginAPI } from '../../services/authService';
import { useTranslation } from 'react-i18next';

const NurseLogin = () => {
  const { t } = useTranslation();
  return (
        // <SharedLoginScreen1
        // title="iTouch Nurse"
        // description="This app is built to streamline ICU tasks for nurses. View real time patient vitals, receive instructions from doctors and manage shift handovers smoothly. Easily access patient details, get critical alerts and stay connected for faster, safer care delivery."
        // imageSource={require('../../../assets/images/nurse_img.png')}
        // logoSource={require('../../../assets/images/iOrbit_Final_Logo.jpg')}
        // onLogin={(username, password) => loginNurse({ userName: username, password })}
        // />
        <SharedLoginScreen
        title={t('auth.app_title')}
        description={t('auth.app_description')}
        imageSource={require('../../../assets/images/nurse_img.png')}
        onLogin={async (mobileNumber, countryCode) => {
        const fullNumber = countryCode + mobileNumber;

        console.log('Initiating login for:', fullNumber);
        return await mobileNumberLoginAPI({
          phone: fullNumber,
        });
      }}
        />
  );
};

export default NurseLogin;
