export interface User {
  username: string;
  role: 'admin' | 'employee' | 'supervisor';
  token?: string;
}
