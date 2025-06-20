export interface Test {
  id?: number;
  testName: string;
  description: string;
  spinningMachine: string;
  threadline: string;
  expirationDate: string;
  isActive: boolean;
  // Keep these for backward compatibility
  parameters?: string;
  threshold?: number;
  unit?: string;
}
