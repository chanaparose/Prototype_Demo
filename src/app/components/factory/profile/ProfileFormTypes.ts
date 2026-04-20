export interface ProfileFormValues {
  factory_name: string;
  tax_id: string;
  description: string;
  factory_type_id: number | null;
  category_ids: number[];
  sub_category_ids: number[];
}

export const PROFILE_FORM_DEFAULTS: ProfileFormValues = {
  factory_name: '',
  tax_id: '',
  description: '',
  factory_type_id: null,
  category_ids: [],
  sub_category_ids: [],
};
