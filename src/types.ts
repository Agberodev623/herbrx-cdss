export interface Patient {
  id: string;
  name: string;
  email: string;
  age: number;
  gender: string;
  createdAt: any;
}

export interface Remedy {
  id: string;
  sicknessName: string;
  remedyName: string;
  preparation: string;
  dosage: string;
  duration: string;
  precautions: string;
  sideEffects: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  sickness: string;
  remedyId: string;
  generatedAt: any;
  details: Remedy;
}

export type UserRole = 'patient' | 'admin' | null;
