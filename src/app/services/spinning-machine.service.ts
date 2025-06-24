import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { /* catchError, */ tap, delay } from 'rxjs/operators';
import { SpinningMachine } from '../models/spinning-machine.model';

@Injectable({
  providedIn: 'root'
})
export class SpinningMachineService {
  private apiUrl = 'https://localhost:7133/api/SpinningMachine'; // Replace with your actual API URL
  
  // Mock data for development until backend is ready
  private mockMachines: SpinningMachine[] = [
    { id: 1, machineName: 'SM-90', description: 'Spinning machine 1', merge: 66090, max: 24, isActive: true },
    { id: 2, machineName: 'SM-91', description: 'Spinning machine 2', merge: 66091, max: 16, isActive: true },
    { id: 3, machineName: 'SM-92', description: 'Spinning machine 3', merge: 66092, max: 4, isActive: false },
    { id: 4, machineName: 'SM-93', description: 'Spinning machine 4', merge: 66093, max: 8, isActive: true },
    { id: 5, machineName: 'SM-95', description: 'Spinning machine 5', merge: 66095, max: 12, isActive: true }
  ];

  constructor(private http: HttpClient) { }

  // Get all spinning machines
  getSpinningMachines(): Observable<SpinningMachine[]> {
    // Use this when backend is ready
    // return this.http.get<SpinningMachine[]>(this.apiUrl)
    //   .pipe(
    //     catchError(this.handleError<SpinningMachine[]>('getSpinningMachines', []))
    //   );
    
    // For now, return mock data
    return of(this.mockMachines);
  }

  // Get spinning machine by id
  getSpinningMachine(id: number): Observable<SpinningMachine> {
    // Use this when backend is ready
    // const url = `${this.apiUrl}/${id}`;
    // return this.http.get<SpinningMachine>(url)
    //   .pipe(
    //     catchError(this.handleError<SpinningMachine>(`getSpinningMachine id=${id}`))
    //   );
    
    // For now, return mock data
    const machine = this.mockMachines.find(m => m.id === id);
    return of(machine as SpinningMachine);
  }

  // Add a new spinning machine
  addSpinningMachine(machine: SpinningMachine): Observable<SpinningMachine> {
    // Use this when backend is ready
    // return this.http.post<SpinningMachine>(this.apiUrl, machine)
    //   .pipe(
    //     catchError(this.handleError<SpinningMachine>('addSpinningMachine'))
    //   );
    
    // For now, simulate adding to mock data
    const newMachine = { ...machine, id: this.getNextId() };
    this.mockMachines.push(newMachine);
    return of(newMachine);
  }

  // Update an existing spinning machine
  updateSpinningMachine(machine: SpinningMachine): Observable<SpinningMachine> {
    // Use this when backend is ready
    // const url = `${this.apiUrl}/${machine.id}`;
    // return this.http.put<SpinningMachine>(url, machine)
    //   .pipe(
    //     catchError(this.handleError<SpinningMachine>('updateSpinningMachine'))
    //   );
    
    // For now, simulate updating mock data
    const index = this.mockMachines.findIndex(m => m.id === machine.id);
    if (index !== -1) {
      this.mockMachines[index] = machine;
      return of(machine);
    }
    return of({} as SpinningMachine);
  }

  // Delete a spinning machine
  deleteSpinningMachine(id: number): Observable<boolean> {
    // In a real implementation, this would call a backend API
    return of(true).pipe(
      delay(500),
      tap(() => {
        this.mockMachines = this.mockMachines.filter(machine => machine.id !== id);
      })
    );
  }
  
  // Bulk delete spinning machines
  bulkDeleteSpinningMachines(ids: number[]): Observable<boolean> {
    // In a real implementation, this would call a backend API
    return of(true).pipe(
      delay(500),
      tap(() => {
        this.mockMachines = this.mockMachines.filter(machine => !ids.includes(machine.id || 0));
      })
    );
  }

  // Helper method to get next ID for mock data
  private getNextId(): number {
    return Math.max(...this.mockMachines.map(m => m.id || 0)) + 1;
  }

  // Error handling
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: Error | unknown): Observable<T> => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`${operation} failed: ${errorMessage}`);
      // Let the app keep running by returning an empty result
      return of(result as T);
    };
  }
}
