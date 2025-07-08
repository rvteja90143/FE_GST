import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
// Import operators when needed
// import { catchError, map } from 'rxjs/operators';
import { UserGroup } from '../models/user-group.model';

@Injectable({
  providedIn: 'root'
})
export class UserGroupService {
  private apiUrl = 'https://localhost:7133/api/UserGroup'; // Replace with your actual API URL
  
  // Mock data for development until backend is ready
  private mockUserGroups: UserGroup[] = [
    { id: 1, name: 'Operator', description: 'To access only the spin production screen', permissions: ['Koel','Ana'], isActive: true },
    { id: 2, name: 'Admin', description: 'Acess on the config screens', permissions: ['Lawrence'], isActive: true },
    { id: 3, name: 'Test Author', description: 'Full access with rights update record', permissions: ['Fran', 'Mich'], isActive: true }
    
  ];

  constructor(private http: HttpClient) { }

  // Get all user groups
  getUserGroups(): Observable<UserGroup[]> {
    // Use this when backend is ready
    // return this.http.get<UserGroup[]>(this.apiUrl)
    //   .pipe(
    //     catchError(this.handleError<UserGroup[]>('getUserGroups', []))
    //   );
    
    // For now, return mock data
    return of(this.mockUserGroups);
  }

  // Get user group by id
  getUserGroup(id: number): Observable<UserGroup> {
    // Use this when backend is ready
    // const url = `${this.apiUrl}/${id}`;
    // return this.http.get<UserGroup>(url)
    //   .pipe(
    //     catchError(this.handleError<UserGroup>(`getUserGroup id=${id}`))
    //   );
    
    // For now, return mock data
    const userGroup = this.mockUserGroups.find(g => g.id === id);
    return of(userGroup as UserGroup);
  }

  // Add a new user group
  addUserGroup(userGroup: UserGroup): Observable<UserGroup> {
    // Use this when backend is ready
    // return this.http.post<UserGroup>(this.apiUrl, userGroup)
    //   .pipe(
    //     catchError(this.handleError<UserGroup>('addUserGroup'))
    //   );
    
    // For now, simulate adding to mock data
    const newUserGroup = { ...userGroup, id: this.getNextId() };
    this.mockUserGroups.push(newUserGroup);
    return of(newUserGroup);
  }

  // Update an existing user group
  updateUserGroup(userGroup: UserGroup): Observable<UserGroup> {
    // Use this when backend is ready
    // const url = `${this.apiUrl}/${userGroup.id}`;
    // return this.http.put<UserGroup>(url, userGroup)
    //   .pipe(
    //     catchError(this.handleError<UserGroup>('updateUserGroup'))
    //   );
    
    // For now, simulate updating mock data
    const index = this.mockUserGroups.findIndex(g => g.id === userGroup.id);
    if (index !== -1) {
      this.mockUserGroups[index] = userGroup;
      return of(userGroup);
    }
    return of({} as UserGroup);
  }

  // Delete a user group
  deleteUserGroup(id: number): Observable<boolean> {
    // Use this when backend is ready
    // const url = `${this.apiUrl}/${id}`;
    // return this.http.delete<any>(url)
    //   .pipe(
    //     map(() => true),
    //     catchError(this.handleError<boolean>('deleteUserGroup', false))
    //   );
    
    // For now, simulate deleting from mock data
    const index = this.mockUserGroups.findIndex(g => g.id === id);
    if (index !== -1) {
      this.mockUserGroups.splice(index, 1);
      return of(true);
    }
    return of(false);
  }

  // Helper method to get next ID for mock data
  private getNextId(): number {
    return Math.max(...this.mockUserGroups.map(g => g.id || 0)) + 1;
  }

  // Error handling
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: Error): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      // Let the app keep running by returning an empty result
      return of(result as T);
    };
  }
}
