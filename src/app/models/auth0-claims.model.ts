export interface Auth0Claims {
  email?: string;
  name?: string;
  nickname?: string;
  sub?: string;
  roles?: string[];
  'https://myapp.com/roles'?: string[];
  [key: string]: unknown;  // Allow for additional properties with unknown type
}
