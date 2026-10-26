export type Driver = Readonly<{
  id: string;
  name: string;
}>;

export type CreateDriverInput = Readonly<{
  name: string;
}>;

export type UpdateDriverInput = CreateDriverInput;

export type DriverFilters = Readonly<{
  name?: string;
}>;
