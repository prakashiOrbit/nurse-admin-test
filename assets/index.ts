import SPO2Icon from './SVGIcons/SPO2Icon';
import RRIcon from './SVGIcons/RRIcon';
import HRIcon from './SVGIcons/HRIcon';
import TempIcon from './SVGIcons/TempIcon';
import NIBPIcon from './SVGIcons/NIBPIcon';
export const Icons = {
  spo2: SPO2Icon,
  rr: RRIcon,
  hr: HRIcon,
  temp: TempIcon,
  nibp: NIBPIcon,
  default: SPO2Icon, // Fallback icon
};

export const Icon = {
    edit: require('../assets/icons/edit.png'),
    live: require('../assets/icons/live.png'),
    instruction: require('../assets/icons/instruction.png'),
    search: require('../assets/icons/search.png'),
    mail:require('../assets/icons/mail.png'),
    arraowDropdown: require('../assets/icons/down_arrow.png'),
    loginLogo: require('../assets/icons/login_logo.png'),
};

export const Images = {
    nurse: require('../assets/images/nurse_img.png'),
    // doctor: require('../assets/images/doctor_img.png'),
    iorbitLogo: require('../assets/images/iOrbit_Final_Logo.jpg'),
    iorbitLogoPng: require('../assets/images/iOrbit_Logo.png'),
    nurseInWard: require('../assets/images/NurseInWard.png'),
}
