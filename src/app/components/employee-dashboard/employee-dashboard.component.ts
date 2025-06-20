import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';

interface DispositionRow {
  disposition: string;
  comment: string;
}

interface TableCell {
  disposition: string;
}

interface HistoryEntry {
  date: Date;
  machine: string;
  shift: string;
  remarks: string;
}

@Component({
  selector: 'app-employee-dashboard',
  templateUrl: './employee-dashboard.component.html',
  styleUrls: ['./employee-dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class EmployeeDashboardComponent implements OnInit {
  username = '';
  currentDate: Date = new Date();
  currentSection = 'spinning';
  currentView = 'standard';
  spinningForm!: FormGroup;
  submitting = false;
  historyEntries: HistoryEntry[] = [
    { date: new Date(), machine: 'Machine-01', shift: 'morning', remarks: 'Regular maintenance performed' },
    { date: new Date(Date.now() - 86400000), machine: 'Machine-02', shift: 'afternoon', remarks: 'Production target met' },
    { date: new Date(Date.now() - 172800000), machine: 'Machine-03', shift: 'night', remarks: 'Minor issues resolved' }
  ];
  
  // Form fields
  selectedShift = 'night';
  testPart = '';
  tlCount = '';
  revisionNo = '';
  isWaste = false;
  doffNo = '';
  doffTime = '';
  cartonNo = '';
  cartonNo2 = '1001';
  remarks = '';
  showExtendedTable = false;
  
  // Table data
  dispositionRows: DispositionRow[] = [];
  extendedTableCells: TableCell[] = [];
  
  constructor(
    private router: Router,
    private authService: AuthService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.username = user.username;
    } else {
      this.username = 'User';
    }

    this.initializeForm();
    this.initializeDispositionTable();
  }

  private initializeForm(): void {
    this.spinningForm = this.fb.group({
      machine: ['', Validators.required],
      shift: ['', Validators.required],
      remarks: ['']
    });
  }

  initializeDispositionTable(): void {
    // Create 4 rows for the standard view
    this.dispositionRows = [];
    for (let i = 0; i < 4; i++) {
      this.dispositionRows.push({
        disposition: 'packed',
        comment: ''
      });
    }

    // Create 16 cells for the extended view
    this.extendedTableCells = [];
    for (let i = 0; i < 16; i++) {
      this.extendedTableCells.push({
        disposition: 'packed'
      });
    }
  }

  toggleTableView(): void {
    this.showExtendedTable = !this.showExtendedTable;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
  
  setCurrentSection(section: string): void {
    this.currentSection = section;
  }
  
  setCurrentView(view: string): void {
    this.currentView = view;
  }
  
  onSpinningSubmit(): void {
    if (this.spinningForm.valid) {
      this.submitting = true;
      // Simulate API call
      setTimeout(() => {
        this.submitting = false;
        this.resetForm();
        // Add to history
        this.historyEntries.unshift({
          date: new Date(),
          machine: this.spinningForm.value.machine,
          shift: this.spinningForm.value.shift,
          remarks: this.spinningForm.value.remarks
        });
      }, 1000);
    }
  }
  
  resetForm(): void {
    this.spinningForm.reset();
  }
}
