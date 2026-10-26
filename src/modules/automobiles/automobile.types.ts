export type Automobile = Readonly<{
  id: string;
  plate: string;
  color: string;
  brand: string;
}>;

export type CreateAutomobileInput = Readonly<{
  plate: string;
  color: string;
  brand: string;
}>;

export type UpdateAutomobileInput = CreateAutomobileInput;

export type AutomobileFilters = Readonly<{
  brand?: string;
  color?: string;
}>;
