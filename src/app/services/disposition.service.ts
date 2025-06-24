import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
// import { catchError, map } from 'rxjs/operators';
import { Disposition } from '../models/disposition.model';

@Injectable({
  providedIn: 'root'
})
export class DispositionService {
  private apiUrl = 'https://localhost:7133/api/Disposition'; // Replace with your actual API URL
  
  // Mock data for development until backend is ready
  private mockDispositions: Disposition[] = [
    { id: 1, disposition: 'Waste', description: 'Description 1', abbreviation: 'W', isActive: true },
    { id: 2, disposition: 'Sampled', description: 'Description 2', abbreviation: 'S', isActive: true },
    { id: 3, disposition: 'Cell Break', description: 'Description 3', abbreviation: 'X', isActive: true },
    { id: 4, disposition: 'Packed', description: 'Description 4', abbreviation: 'P', isActive: true }
  ];

  constructor(private http: HttpClient) { }

  // Get all dispositions
  getDispositions(): Observable<Disposition[]> {
    // Use this when backend is ready
    // return this.http.get<Disposition[]>(this.apiUrl)
    //   .pipe(
    //     catchError(this.handleError<Disposition[]>('getDispositions', []))
    //   );
    
    // For now, return mock data
    return of(this.mockDispositions);
  }

  // Get disposition by id
  getDisposition(id: number): Observable<Disposition> {
    // Use this when backend is ready
    // const url = `${this.apiUrl}/${id}`;
    // return this.http.get<Disposition>(url)
    //   .pipe(
    //     catchError(this.handleError<Disposition>(`getDisposition id=${id}`))
    //   );
    
    // For now, return mock data
    const disposition = this.mockDispositions.find(d => d.id === id);
    return of(disposition as Disposition);
  }

  // Add a new disposition
  addDisposition(disposition: Disposition): Observable<Disposition> {
    // Use this when backend is ready
    // return this.http.post<Disposition>(this.apiUrl, disposition)
    //   .pipe(
    //     catchError(this.handleError<Disposition>('addDisposition'))
    //   );
    
    // For now, simulate adding to mock data
    const newDisposition = { ...disposition, id: this.getNextId() };
    this.mockDispositions.push(newDisposition);
    return of(newDisposition);
  }

  // Update an existing disposition
  updateDisposition(disposition: Disposition): Observable<Disposition> {
    // Use this when backend is ready
    // const url = `${this.apiUrl}/${disposition.id}`;
    // return this.http.put<Disposition>(url, disposition)
    //   .pipe(
    //     catchError(this.handleError<Disposition>('updateDisposition'))
    //   );
    
    // For now, simulate updating mock data
    const index = this.mockDispositions.findIndex(d => d.id === disposition.id);
    if (index !== -1) {
      this.mockDispositions[index] = disposition;
      return of(disposition);
    }
    return of({} as Disposition);
  }

  // Delete a disposition
  deleteDisposition(id: number): Observable<boolean> {
    // Use this when backend is ready
    // const url = `${this.apiUrl}/${id}`;
    // return this.http.delete<any>(url)
    //   .pipe(
    //     map(() => true),
    //     catchError(this.handleError<boolean>('deleteDisposition', false))
    //   );
    
    // For now, simulate deleting from mock data
    const index = this.mockDispositions.findIndex(d => d.id === id);
    if (index !== -1) {
      this.mockDispositions.splice(index, 1);
      return of(true);
    }
    return of(false);
  }

  // Delete multiple dispositions by ID
  deleteMultipleDispositions(ids: number[]): Observable<boolean> {
    // Use this when backend is ready
    // const url = `${this.apiUrl}/bulk`;
    // return this.http.post<any>(url, { ids })
    //   .pipe(
    //     map(() => true),
    //     catchError(this.handleError<boolean>('deleteMultipleDispositions', false))
    //   );
    
    // For now, simulate deleting multiple items from mock data
    let success = true;
    
    ids.forEach(id => {
      const index = this.mockDispositions.findIndex(d => d.id === id);
      if (index !== -1) {
        this.mockDispositions.splice(index, 1);
      } else {
        success = false;
      }
    });
    
    return of(success);
  }

  // Helper method to get next ID for mock data
  private getNextId(): number {
    return Math.max(...this.mockDispositions.map(d => d.id || 0)) + 1;
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
