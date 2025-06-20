import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
// import { catchError, map } from 'rxjs/operators';
import { Shift } from '../models/shift.model';

@Injectable({
  providedIn: 'root'
})
export class ShiftService {
  private apiUrl = 'https://localhost:7133/api/Shift'; // Replace with your actual API URL
  
  // Mock data for development until backend is ready
  private mockShifts: Shift[] = [
    { id: 1, name: 'Morning Shift', startTime: '06:00', endTime: '14:00', isActive: true },
    { id: 2, name: 'Afternoon Shift', startTime: '14:00', endTime: '22:00', isActive: true },
    { id: 3, name: 'Night Shift', startTime: '22:00', endTime: '06:00', isActive: true }
  ];

  constructor(private http: HttpClient) { }

  // Get all shifts
  getShifts(): Observable<Shift[]> {
    // Use this when backend is ready
    // return this.http.get<Shift[]>(this.apiUrl)
    //   .pipe(
    //     catchError(this.handleError<Shift[]>('getShifts', []))
    //   );
    
    // For now, return mock data
    return of(this.mockShifts);
  }

  // Get shift by id
  getShift(id: number): Observable<Shift> {
    // Use this when backend is ready
    // const url = `${this.apiUrl}/${id}`;
    // return this.http.get<Shift>(url)
    //   .pipe(
    //     catchError(this.handleError<Shift>(`getShift id=${id}`))
    //   );
    
    // For now, return mock data
    const shift = this.mockShifts.find(s => s.id === id);
    return of(shift as Shift);
  }

  // Add a new shift
  addShift(shift: Shift): Observable<Shift> {
    // Use this when backend is ready
    // return this.http.post<Shift>(this.apiUrl, shift)
    //   .pipe(
    //     catchError(this.handleError<Shift>('addShift'))
    //   );
    
    // For now, simulate adding to mock data
    const newShift = { ...shift, id: this.getNextId() };
    this.mockShifts.push(newShift);
    return of(newShift);
  }

  // Update an existing shift
  updateShift(shift: Shift): Observable<Shift> {
    // Use this when backend is ready
    // const url = `${this.apiUrl}/${shift.id}`;
    // return this.http.put<Shift>(url, shift)
    //   .pipe(
    //     catchError(this.handleError<Shift>('updateShift'))
    //   );
    
    // For now, simulate updating mock data
    const index = this.mockShifts.findIndex(s => s.id === shift.id);
    if (index !== -1) {
      this.mockShifts[index] = shift;
      return of(shift);
    }
    return of({} as Shift);
  }

  // Delete a shift
  deleteShift(id: number): Observable<boolean> {
    // Use this when backend is ready
    // const url = `${this.apiUrl}/${id}`;
    // return this.http.delete<any>(url)
    //   .pipe(
    //     map(() => true),
    //     catchError(this.handleError<boolean>('deleteShift', false))
    //   );
    
    // For now, simulate deleting from mock data
    const index = this.mockShifts.findIndex(s => s.id === id);
    if (index !== -1) {
      this.mockShifts.splice(index, 1);
      return of(true);
    }
    return of(false);
  }

  // Helper method to get next ID for mock data
  private getNextId(): number {
    return Math.max(...this.mockShifts.map(s => s.id || 0)) + 1;
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
