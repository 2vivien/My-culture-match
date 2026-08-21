export interface SelectOption {
  value: string;
  label: string;
  flag?: string;
  meta?: string;
  native?: string;
}

export interface SearchableSelectProps {
  options: SelectOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  multiple?: boolean;
  max?: number;
  showFlag?: boolean;
  showMeta?: boolean;
  loading?: boolean;
  emptyLabel?: string;
  containerClassName?: string;
  inputClassName?: string;
  disabled?: boolean;
}
