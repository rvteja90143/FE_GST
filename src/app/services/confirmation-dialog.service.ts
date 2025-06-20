import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  dialogType?: 'warning' | 'info' | 'danger' | 'success';
}

export interface ConfirmDialogResult {
  confirmed: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationDialogService {
  private dialogSubject = new Subject<ConfirmDialogData | null>();
  private resultSubject = new Subject<ConfirmDialogResult>();

  // Open a confirmation dialog
  confirm(data: ConfirmDialogData): Observable<ConfirmDialogResult> {
    this.dialogSubject.next({
      title: data.title,
      message: data.message,
      confirmText: data.confirmText || 'Confirm',
      cancelText: data.cancelText || 'Cancel',
      dialogType: data.dialogType || 'warning'
    });
    
    return this.resultSubject.asObservable();
  }

  // Get the dialog data observable
  getDialog(): Observable<ConfirmDialogData | null> {
    return this.dialogSubject.asObservable();
  }

  // Close the dialog with result
  closeDialog(result: ConfirmDialogResult): void {
    this.resultSubject.next(result);
    this.dialogSubject.next(null);
  }
}
