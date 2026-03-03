export type CreateRfqForm = {
  categoryId: string;
  projectName: string;
  description: string;
  quantity: string;
  budget: string;
  material: string;
  deadline: string;
};

export const INITIAL_FORM: CreateRfqForm = {
  categoryId: '',
  projectName: '',
  description: '',
  quantity: '',
  budget: '',
  material: '',
  deadline: '',
};

export const STEPS = [
  'รายละเอียดโปรเจกต์',
  'ความต้องการและงบประมาณ',
  'สรุปและส่งคำขอ',
] as const;
