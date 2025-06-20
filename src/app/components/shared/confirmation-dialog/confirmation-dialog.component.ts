import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ConfirmationDialogService, ConfirmDialogData } from '../../../services/confirmation-dialog.service';

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ConfirmationDialogComponent implements OnInit, OnDestroy {
  dialogData: ConfirmDialogData | null = null;
  private subscription: Subscription | null = null;
  isVisible = false;

  constructor(private confirmationDialogService: ConfirmationDialogService) { }

  ngOnInit(): void {
    this.subscription = this.confirmationDialogService.getDialog().subscribe(data => {
      this.dialogData = data;
      this.isVisible = !!data;
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  onConfirm(): void {
    this.confirmationDialogService.closeDialog({ confirmed: true });
  }

  onCancel(): void {
    this.confirmationDialogService.closeDialog({ confirmed: false });
  }

  getDialogClass(): string {
    if (!this.dialogData || !this.dialogData.dialogType) {
      return 'warning';
    }
    return this.dialogData.dialogType;
  }
}
