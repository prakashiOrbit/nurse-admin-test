export interface AlarmDetailDTO {
  alarmDetailId: string;
  alarmId: string;
  bedCode: string;
  wardName: string;
  detailedDescription: string;
  windowStartTime: number;
  windowEndTime: number;
  patientCode: string;
  patientId: string,
  violatedParameter: string;
  wardCode: string;
  raisedTime: number;
  dataTimeStamp: string;
}

export interface BedPatientInfo {
  bedCode: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  gender?: string;
  patientCode?: string;
  auditMe?: { createdtime?: string };
  patientId: string;
  mrNumber: string;
  admissionDate: string;
  bedId: string;
  wardName: string;
}

export interface AlarmDetailFullDTO extends AlarmDetailDTO , AlarmSummary{
  icon?: React.FC<{ width?: number; height?: number; fill?: string }>;
  iconColor?: string;
}

export interface VitalDataPoint {
  time: string;
  value: number;
}

export interface AlarmSummary {
  alarmSummaryId: string;
  alarmId: string;
  patientId: string;
  patientName: string;
  summaryDescription: string;
  alarmStatus: string;
  priority: number;
  gender?: string;
  dob?: number;
  violatedParameter: string[];
  raisedTime: number;
  bedCode: string;
  deviceId: string;
  patientCode: string;
  // dataTimeStamp: string;
}
