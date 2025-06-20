import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
// import { catchError, map } from 'rxjs/operators';
// import { forkJoin } from 'rxjs';
import { Test } from '../models/test.model';

@Injectable({
  providedIn: 'root'
})
export class TestService {
  private apiUrl = 'https://localhost:7133/api/Test'; // Replace with your actual API URL
  
  // Mock data for development until backend is ready
  private mockTests: Test[] = [
    { 
      id: 1, 
      testName: 'ETS_0001_Tensile', 
      description: 'Measures the maximum stress that a material can withstand', 
      spinningMachine: 'SM1',
      threadline: '66',
      expirationDate: '2026-01-01',
      isActive: true,
      // Backward compatibility fields
      parameters: 'Force', 
      threshold: 50, 
      unit: 'N/mm²'
    },
    { 
      id: 2, 
      testName: 'ETS_0002_Elongation', 
      description: 'Measures the ability of a material to stretch without breaking', 
      spinningMachine: 'SM2',
      threadline: '48',
      expirationDate: '2026-06-30',
      isActive: true,
      // Backward compatibility fields
      parameters: 'Length', 
      threshold: 15, 
      unit: '%'
    },
    { 
      id: 3, 
      testName: 'ETS_0003_Twist', 
      description: 'Measures the number of twists per unit length', 
      spinningMachine: 'SM1',
      threadline: '66',
      expirationDate: '2026-03-15',
      isActive: true,
      // Backward compatibility fields
      parameters: 'Twist', 
      threshold: 10, 
      unit: 'TPI'
    },
    { 
      id: 4, 
      testName: 'ETS_0004_Moisture', 
      description: 'Measures the amount of water in the material', 
      spinningMachine: 'SM3',
      threadline: '36',
      expirationDate: '2025-01-01',
      isActive: false,
      // Backward compatibility fields
      parameters: 'Moisture', 
      threshold: 8, 
      unit: '%'
    }
  ];

  constructor(private http: HttpClient) { }

  // Get all tests
  getTests(): Observable<Test[]> {
    // Use this when backend is ready
    // return this.http.get<Test[]>(this.apiUrl)
    //   .pipe(
    //     catchError(this.handleError<Test[]>('getTests', []))
    //   );
    
    // For now, return mock data
    return of(this.mockTests);
  }

  // Get test by id
  getTest(id: number): Observable<Test> {
    // Use this when backend is ready
    // const url = `${this.apiUrl}/${id}`;
    // return this.http.get<Test>(url)
    //   .pipe(
    //     catchError(this.handleError<Test>(`getTest id=${id}`))
    //   );
    
    // For now, return mock data
    const test = this.mockTests.find(t => t.id === id);
    return of(test as Test);
  }

  // Delete test by id (implementation below)
  
  // Bulk delete tests
  bulkDeleteTests(ids: number[]): Observable<{ success: boolean; count: number }> {
    // Use this when backend is ready
    // const deleteRequests = ids.map(id => {
    //   const url = `${this.apiUrl}/${id}`;
    //   return this.http.delete<any>(url);
    // });
    // return forkJoin(deleteRequests)
    //   .pipe(
    //     catchError(this.handleError<any[]>('bulkDeleteTests', []))
    //   );
    
    // For now, simulate bulk deleting from mock data
    this.mockTests = this.mockTests.filter(t => !ids.includes(t.id as number));
    return of({ success: true, count: ids.length });
  }

  // Add a new test
  addTest(test: Test): Observable<Test> {
    // Use this when backend is ready
    // return this.http.post<Test>(this.apiUrl, test)
    //   .pipe(
    //     catchError(this.handleError<Test>('addTest'))
    //   );
    
    // For now, simulate adding to mock data
    const newTest = { ...test, id: this.getNextId() };
    this.mockTests.push(newTest);
    return of(newTest);
  }

  // Update an existing test
  updateTest(test: Test): Observable<Test> {
    // Use this when backend is ready
    // const url = `${this.apiUrl}/${test.id}`;
    // return this.http.put<Test>(url, test)
    //   .pipe(
    //     catchError(this.handleError<Test>('updateTest'))
    //   );
    
    // For now, simulate updating mock data
    const index = this.mockTests.findIndex(t => t.id === test.id);
    if (index !== -1) {
      this.mockTests[index] = test;
      return of(test);
    }
    return of({} as Test);
  }

  // Delete a test
  deleteTest(id: number): Observable<{ success: boolean }> {
    // Use this when backend is ready
    // const url = `${this.apiUrl}/${id}`;
    // return this.http.delete<any>(url)
    //   .pipe(
    //     catchError(this.handleError<any>('deleteTest'))
    //   );
    
    // For now, simulate deleting from mock data
    this.mockTests = this.mockTests.filter(t => t.id !== id);
    return of({ success: true });
  }

  // Helper method to get next ID for mock data
  private getNextId(): number {
    return Math.max(...this.mockTests.map(t => t.id || 0)) + 1;
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
