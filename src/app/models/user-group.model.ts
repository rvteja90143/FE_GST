export interface UserGroup {
  id?: number;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
}
