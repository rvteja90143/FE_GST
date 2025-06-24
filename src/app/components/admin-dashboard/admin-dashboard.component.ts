import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ConfirmationDialogComponent } from '../shared/confirmation-dialog/confirmation-dialog.component';
import { ConfirmDialogResult } from '../../services/confirmation-dialog.service';
import { Observable, forkJoin } from 'rxjs';

// Models
import { Disposition } from '../../models/disposition.model';
import { SpinningMachine } from '../../models/spinning-machine.model';
import { Shift } from '../../models/shift.model';
import { Test } from '../../models/test.model';
import { UserGroup } from '../../models/user-group.model';

// Services
import { DispositionService } from '../../services/disposition.service';
import { SpinningMachineService } from '../../services/spinning-machine.service';
import { ShiftService } from '../../services/shift.service';
import { TestService } from '../../services/test.service';
import { UserGroupService } from '../../services/user-group.service';
import { ConfirmationDialogService } from '../../services/confirmation-dialog.service';

// Form interfaces for edit/add operations
interface DispositionForm {
  id?: number;
  disposition: string;
  description: string;
  abbreviation: string;
  isActive: boolean;
}

// Interface for Remarks History entry
interface RemarksHistory {
  date: string;
  shift: string;
  operatorName: string;
  remarks: string;
}

// Interface for Spinning Production form
interface SpinningForm {
  shift: string;
  testPart: string;
  spinningMachine: string;
  threadlineCount: string;
  merge: number;
  revisionNo: string;
  isWaste: boolean;
  doffNo: string;
  doffTime: string;
  cartons: {id?: number, value: string}[];
  threadLines: {lineNumber: number, disposition: string|number, comment: string}[];
  remarks: string;
}

interface HistoryForm {
  fromDate: string;
  toDate: string;
  shift: string;
  merge: number;
  testPart: string;
  revNo: string;
  doffNo: string;
  cartonNo: string;
}

interface RemarksHistoryForm {
  fromDate: string;
  toDate: string;
}

interface HistoryItem {
  date: string;
  shift: string;
  cartonNo: string;
  testPart: string;
  revNo: string;
  doffNo: string;
  doffTime: string;
  threadline1: string;
  threadline2: string;
  threadline3: string;
  threadline4: string;
  remarks: string;
}

interface RemarksHistory {
  date: string;
  shift: string;
  operatorName: string;
  remarks: string;
}

interface SpinningMachineForm {
  id?: number;
  machineName: string;
  description: string;
  merge: number;
  max: number;
  isActive: boolean;
}

interface ShiftForm {
  id?: number;
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface TestForm {
  id?: number;
  testName: string;
  description: string;
  spinningMachine: string;
  threadline: string;
  expirationDate: string;
  isActive: boolean;
}

interface UserGroupForm {
  id?: number;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ConfirmationDialogComponent]
})
export class AdminDashboardComponent implements OnInit {
  // Pagination
  currentPage = 1;
  // Max character limits
  readonly MAX_DISPOSITION_LENGTH: number = 30;
  
  username = 'ADMIN';
  currentDate = new Date();
  showRemarksHistoryModal = false;
  remarksHistory: RemarksHistory[] = [];
  currentShift = 'Night Shift';
  currentSection = 'spinning';
  currentSubSection = 'spinning';
  
  // History form properties
  historyForm: HistoryForm = {
    fromDate: '',
    toDate: '',
    shift: 'Night Shift',
    merge: 60000,
    testPart: 'ET5_0000_MDLR1',
    revNo: '0',
    doffNo: '',
    cartonNo: '333222'
  };
  
  // Sample history data
  historyItems: HistoryItem[] = [];
  
  // Historical Remarks form and data
  remarksHistoryForm: RemarksHistoryForm = {
    fromDate: '',
    toDate: ''
  };
  remarksHistoryItems: RemarksHistory[] = [];
  
  // Data for all configuration tabs
  
  dispositions: Disposition[] = [];
  filteredDispositions: Disposition[] = [];
  spinningMachines: SpinningMachine[] = [];
  filteredSpinningMachines: SpinningMachine[] = [];
  shifts: Shift[] = [];
  tests: Test[] = [];
  filteredTests: Test[] = [];
  userGroups: UserGroup[] = [];
  // Remark history filter properties
  remarkFilterFrom = '';
  remarkFilterTo = '';
  remarkHistoryItems: RemarksHistory[] = [];
  showSampleRemarkData = true;
  
  // Test state variables
  testSearchTerm = '';
  testSortField = 'testName';
  testSortDirection: 'asc' | 'desc' = 'asc';
  testFormVisible = false; // Controls the test form popup visibility - initialized to false
  isAddingTest = true;
  selectAllTests = false;
  selectedTests: Set<number> = new Set<number>();
  availableThreadlines: number[] = [];
  selectedThreadlines: Set<number> = new Set<number>();
  showThreadlineDropdown = false;
  
  // Shift state variables
  shiftSearchText = '';
  
  // Spinning Production Form Methods
  onWasteChange(): void {
    if (this.spinningForm.isWaste) {
      // Find the Waste disposition ID
      const wasteDisposition = this.dispositions.find(d => d.disposition.toLowerCase() === 'waste');
      
      if (wasteDisposition && wasteDisposition.id) {
        // Set all threadLine dispositions to Waste
        for (const threadLine of this.spinningForm.threadLines) {
          threadLine.disposition = wasteDisposition.id;
        }
      }
    } else {
      // When unchecked, find the Packed disposition as default
      const packedDisposition = this.dispositions.find(d => d.disposition.toLowerCase() === 'packed');
      
      if (packedDisposition && packedDisposition.id) {
        // Reset all threadLine dispositions to Packed
        for (const threadLine of this.spinningForm.threadLines) {
          threadLine.disposition = packedDisposition.id;
        }
      }
    }
  }
  
  onTestPartChange(): void {
    // Debug point was here
    const selectedTest = this.spinningForm.testPart;
    const mappingInfo = this.testPartMappings[selectedTest];
    
    if (mappingInfo) {
      // Auto-populate fields based on the selected test part
      this.spinningForm.spinningMachine = mappingInfo.spinningMachine;
      this.spinningForm.threadlineCount = mappingInfo.threadlines.join(', ');
      this.spinningForm.merge = mappingInfo.merge;
      
      // Generate thread lines based on the mapping
      this.spinningForm.threadLines = [];
      for (let i = 1; i <= Math.max(...mappingInfo.threadlines); i++) {
        // Only add thread lines that are in the mapping's threadlines array
        if (mappingInfo.threadlines.includes(i)) {
          // Find a default disposition (e.g., 'packed')
          const packedDisposition = this.dispositions.find(d => d.disposition.toLowerCase() === 'packed');
          this.spinningForm.threadLines.push({
            lineNumber: i,
            disposition: packedDisposition && packedDisposition.id ? packedDisposition.id : 'packed',
            comment: ''
          });
        }
      }
    } else {
      // Reset fields if no mapping is found
      this.spinningForm.spinningMachine = '';
      this.spinningForm.threadlineCount = '';
      this.spinningForm.merge = 0;
      this.spinningForm.threadLines = [];
    }
  }
  
  // Method to show/hide test form
  showTestForm(isAdding: boolean): void {
    this.isAddingTest = isAdding;
    this.testFormVisible = true;
    this.showThreadlineDropdown = false;
    this.selectedThreadlines.clear();
    
    if (isAdding) {
      // Initialize form for adding a new test
      this.testForm = {
        testName: 'ETS_' + this.getNextTestNumber() + '_',
        description: '',
        spinningMachine: '',
        threadline: '',
        expirationDate: this.getDefaultExpirationDate(),
        isActive: true
      };
      this.availableThreadlines = [];
    }
  }
  
  // Selection tracking is defined below
  
  // Map of test parts to their corresponding spinning machines, threadline counts and merge values
  testPartMappings: Record<string, {spinningMachine: string, threadlines: number[], merge: number}> = {
    'ETS_0001_Tensile': { spinningMachine: 'SM-90', threadlines: [8, 24, 25, 45], merge: 66090 },
    'ETS_0002_Elongation': { spinningMachine: 'SM-91', threadlines: [1, 3, 6, 10], merge: 64565 },
    'ETS_0003_Twist': { spinningMachine: 'SM-92', threadlines: [2, 4, 8, 12], merge: 64566 },
    'ETS_0004_Moisture': { spinningMachine: 'SM-93', threadlines: [1, 5, 10, 15, 20], merge: 64567 }
  };
  
  // Disposition state variables
  dispositionSearchText = '';
  sortField = 'disposition';
  sortDirection: 'asc' | 'desc' = 'asc';
  showDispositionForm = false;
  showSpinningMachineForm = false;
  isAdding = true;
  
  // Using the selectedDispositions and selectAllDispositions declared below at line ~176
  isEditing = false;
  dispositionForm: DispositionForm = {
    disposition: '',
    description: '',
    abbreviation: '',
    isActive: true
  };
  
  // Form data for edit/add operations
  spinningMachineForm: SpinningMachineForm = { machineName: '', description: '', merge: 0, max: 0, isActive: true };
  shiftForm: ShiftForm = { name: '', startTime: '', endTime: '', isActive: true };
  testForm: TestForm = { testName: '', description: '', spinningMachine: '', threadline: '', expirationDate: '', isActive: true };
  userGroupForm: UserGroupForm = { name: '', description: '', permissions: [], isActive: true };
  
  // UI state
  selectedItemId: number | null = null;
  availablePermissions: string[] = ['read', 'write', 'delete', 'admin'];
  
  // Disposition selection for multi-delete
  selectedDispositions = new Set<number>();
  selectAllDispositions = false;
  
  // Spinning Machine selection for multi-delete
  selectedSpinningMachines = new Set<number>();
  selectAllSpinningMachines = false;
  spinningMachineSearchText = '';
  
  // Spinning Production form data
  spinningForm: SpinningForm = {
    shift: '',
    testPart: '',
    spinningMachine: '',
    threadlineCount: '',
    merge: 0,
    revisionNo: '',
    isWaste: false,
    doffNo: '',
    doffTime: '',
    cartons: [{id: 1, value: ''}],
    threadLines: [],
    remarks: ''
  };

  // Validation config has been moved to class property declarations
  
  constructor(
    private router: Router,
    private authService: AuthService,
    private dispositionService: DispositionService,
    private spinningMachineService: SpinningMachineService,
    private shiftService: ShiftService,
    private testService: TestService,
    private userGroupService: UserGroupService,
    private toastr: ToastrService,
    private confirmationDialogService: ConfirmationDialogService
  ) { }

  // History functionality methods
  searchHistory(): void {
    // In a real application, this would call an API to fetch the history data
    // For now, we'll generate sample data based on the form
    this.generateSampleHistoryData();
    
    this.toastr.success('History data loaded successfully', 'Success');
  }

  resetHistorySearch(): void {
    this.historyForm = {
      fromDate: '',
      toDate: '',
      shift: 'Night Shift',
      merge: 60000,
      testPart: 'ET5_0000_MDLR1',
      revNo: '0',
      doffNo: '',
      cartonNo: '333222'
    };
    
    this.historyItems = [];
  }

  
  
  generateSampleHistoryData(): void {
    // Create sample data based on the screenshot
    this.historyItems = [
      {
        date: '21-01-2023',
        shift: 'Morning Shift',
        cartonNo: '333222/Page1',
        testPart: 'ET5_0000_MDLR1',
        revNo: '0',
        doffNo: '291',
        doffTime: '15:00',
        threadline1: 'S',
        threadline2: 'S',
        threadline3: 'S',
        threadline4: 'S',
        remarks: 'Remark 1'
      },
      {
        date: '21-01-2023',
        shift: 'Morning Shift',
        cartonNo: '333222/Page2',
        testPart: 'ET5_0000_MDLR1',
        revNo: '0',
        doffNo: '292',
        doffTime: '16:00',
        threadline1: 'S',
        threadline2: 'W',
        threadline3: 'S',
        threadline4: 'S',
        remarks: 'Remark 2'
      },
      {
        date: '21-01-2023',
        shift: 'Night Shift',
        cartonNo: '333222/Page3',
        testPart: 'ET5_0000_MDLR1',
        revNo: '0',
        doffNo: '293',
        doffTime: '21:00',
        threadline1: 'S',
        threadline2: 'S',
        threadline3: 'W',
        threadline4: 'S',
        remarks: 'Remark 3'
      },
      {
        date: '21-01-2023',
        shift: 'Night Shift',
        cartonNo: '333222/Page4',
        testPart: 'ET5_0000_MDLR1',
        revNo: '0',
        doffNo: '294',
        doffTime: '22:00',
        threadline1: 'S',
        threadline2: 'S',
        threadline3: 'S',
        threadline4: 'W',
        remarks: 'Remark 4'
      },
      {
        date: '21-01-2023',
        shift: 'Night Shift',
        cartonNo: '333222/Page5',
        testPart: 'ET5_0000_MDLR1',
        revNo: '0',
        doffNo: '295',
        doffTime: '23:00',
        threadline1: 'W',
        threadline2: 'S',
        threadline3: 'S',
        threadline4: 'S',
        remarks: 'Remark 5'
      },
    ];
  }
  
  // Historical Remarks Methods
  searchRemarksHistory(): void {
    if (!this.remarkFilterFrom || !this.remarkFilterTo) {
      this.toastr.warning('Please select both From Date and To Date', 'Warning');
      return;
    }
    
    // In a real application, we would make an API call here using the filter values
    // For now, generate sample data
    this.generateSampleRemarksHistoryData();
    this.showSampleRemarkData = true;
    
    this.toastr.success('Remarks history data loaded successfully', 'Success');
  }
  
  resetRemarksHistorySearch(): void {
    this.remarkFilterFrom = '';
    this.remarkFilterTo = '';
    
    this.remarkHistoryItems = [];
    this.showSampleRemarkData = false;
  }
  
  generateSampleRemarksHistoryData(): void {
  // Create sample data based on the screenshot
  this.remarkHistoryItems = [
      {
        date: '3/21/24 8:00 AM',
        shift: 'Morning Shift',
        operatorName: 'John Doe',
        remarks: 'Remark 1'
      },
      {
        date: '3/21/24 10:00 AM',
        shift: 'Morning Shift',
        operatorName: 'John Doe',
        remarks: 'Remark 2'
      },
      {
        date: '3/20/24 10:00 AM',
        shift: 'Morning Shift',
        operatorName: 'Lawrence',
        remarks: 'Remark 3'
      },
      {
        date: '3/20/24 8:00 PM',
        shift: 'Night Shift',
        operatorName: 'Joey',
        remarks: 'Remark 4'
      },
      {
        date: '3/19/24 10:00 AM',
        shift: 'Morning Shift',
        operatorName: 'John Doe',
        remarks: 'Remark 5'
      },
      {
        date: '3/19/24 8:00 PM',
        shift: 'Night Shift',
        operatorName: 'Joey',
        remarks: 'Remark 6'
      },
      {
        date: '3/18/24 8:00 AM',
        shift: 'Morning Shift',
        operatorName: 'John Doe',
        remarks: 'Remark 5'
      },
      {
        date: '3/18/24 10:00 PM',
        shift: 'Night Shift',
        operatorName: 'Joey',
        remarks: 'Remark 6'
      }
    ];
  }
  
  ngOnInit(): void {
    // User validation is handled globally through the auth service
    // No need to get the current user here since it's not being used
    
    // Load initial data
    this.loadDispositions();
    this.loadSpinningMachines();
    this.loadShifts();
    this.loadTests();
    this.loadUserGroups();
    
    // Initialize spinning form with default values
    this.resetSpinningForm();
  }

  
  addCarton(): void {
    // Generate new ID for the carton (simple increment for this example)
    const newId = this.spinningForm.cartons.length > 0 ? 
      Math.max(...this.spinningForm.cartons.map(c => c.id || 0)) + 1 : 1;
    
    this.spinningForm.cartons.push({id: newId, value: ''});
  }
  
  removeCarton(index: number): void {
    if (index > 0 && index < this.spinningForm.cartons.length) {
      this.spinningForm.cartons.splice(index, 1);
    }
  }
  
  viewRemarksHistory(): void {
    // Generate mock remarks history data
    this.remarksHistory = [
      { date: '3/21/24 8:00 AM', shift: 'Morning Shift', operatorName: 'John Doe', remarks: 'Remarks 1' },
      { date: '3/21/24 10:30 AM', shift: 'Morning Shift', operatorName: 'John Doe', remarks: 'Remarks 2' },
      { date: '3/20/24 10:00 AM', shift: 'Morning Shift', operatorName: 'Lawrence', remarks: 'Remarks 3' },
      { date: '3/20/24 1:30 PM', shift: 'Night Shift', operatorName: 'Rob', remarks: 'Remarks 4' },
      { date: '3/19/24 10:00 AM', shift: 'Morning Shift', operatorName: 'John Doe', remarks: 'Remarks 5' },
      { date: '3/19/24 4:00 PM', shift: 'Night Shift', operatorName: 'Rob', remarks: 'Remarks 6' }
    ];
    
    // Show the modal
    this.showRemarksHistoryModal = true;
  }
  
  closeRemarksHistoryModal(): void {
    this.showRemarksHistoryModal = false;
  }
  
  submitSpinningForm(): void {
  // Validation for required fields
  const missingFields = [];
  
  // Check if Test Part is selected
  if (!this.spinningForm.testPart) {
    missingFields.push('Test Part');
  }
  
  // Check other required fields
  if (!this.spinningForm.shift) {
    missingFields.push('Shift');
  }
  
  if (!this.spinningForm.spinningMachine) {
    missingFields.push('Spinning Machine');
  }
  
  if (!this.spinningForm.doffTime) {
    missingFields.push('Doff Time');
  }

  // Check additional mandatory fields
  if (!this.spinningForm.revisionNo) {
    missingFields.push('Revision No');
  }

  if (!this.spinningForm.doffNo) {
    missingFields.push('Doff No');
  }

  // Check for cartons - must have at least one carton with a value
  let hasValidCarton = false;
  if (this.spinningForm.cartons && this.spinningForm.cartons.length > 0) {
    for (const carton of this.spinningForm.cartons) {
      if (carton.value && carton.value.trim() !== '') {
        hasValidCarton = true;
        break;
      }
    }
  }
  if (!hasValidCarton) {
    missingFields.push('Carton No');
  }

  if (!this.spinningForm.remarks) {
    missingFields.push('Remarks');
  }
  
  // Show error if any required fields are missing
  if (missingFields.length > 0) {
    this.toastr.error(`Please fill in the required fields: ${missingFields.join(', ')}`, 'Validation Error');
    return;
  }
  
  console.log('Submitting spinning form:', this.spinningForm);
  
  // Here you would typically call a service to save the data
  this.toastr.success('Spinning production data submitted successfully');
  this.resetSpinningForm();
} 
  
  resetSpinningForm(): void {
    // Reset form to initial state
    this.spinningForm = {
      shift: this.shifts.length > 0 ? this.shifts[0].name : '',
      testPart: '',
      spinningMachine: '',
      threadlineCount: '',
      merge: 0,
      revisionNo: '',
      isWaste: false,
      doffNo: '',
      doffTime: '',
      cartons: [{id: 1, value: ''}],
      threadLines: [],
      remarks: ''
    };
  }
  
  // Load data methods
  loadDispositions(): void {
    this.dispositionService.getDispositions().subscribe({
      next: (dispositions) => {
        // If no dispositions are returned, add mock data for testing/demo purposes
        if (!dispositions || dispositions.length === 0) {
          this.dispositions = [
            { 
              id: 1, 
              disposition: 'Waste', 
              description: 'Description 1', 
              abbreviation: 'W', 
              isActive: true 
            },
            { 
              id: 2, 
              disposition: 'Sampled', 
              description: 'Description 2', 
              abbreviation: 'S', 
              isActive: true 
            },
            { 
              id: 3, 
              disposition: 'Cell Break', 
              description: 'Description 3', 
              abbreviation: 'X', 
              isActive: true 
            },
            { 
              id: 4, 
              disposition: 'Packed', 
              description: 'Description 4', 
              abbreviation: '/', 
              isActive: true 
            }
          ];
        } else {
          this.dispositions = dispositions;
        }
        
        // Apply initial filtering
        this.filteredDispositions = [...this.dispositions];
        // this.filterAndSortDispositions();
      },
      error: (error: Error) => {
        this.toastr.error('Error loading dispositions');
        console.error('Error:', error);
        
        // Add mock data even on error for testing purposes
        this.dispositions = [
          { 
            id: 1, 
            disposition: 'Waste', 
            description: 'Description 1', 
            abbreviation: 'W', 
            isActive: true 
          },
          { 
            
            id: 2, 
            disposition: 'Sampled', 
            description: 'Description 2', 
            abbreviation: 'S', 
            isActive: true 
          },
          { 
            id: 3, 
            disposition: 'Cell Break', 
            description: 'Description 3', 
            abbreviation: 'X', 
            isActive: true 
          },
          { 
            id: 4, 
            disposition: 'Packed', 
            description: 'Description 4', 
            abbreviation: '/', 
            isActive: true 
          }
        ];
        this.filteredDispositions = [...this.dispositions];
      }
    });
  }

  loadSpinningMachines(): void {
    this.spinningMachineService.getSpinningMachines().subscribe({
      next: (machines) => {
        this.spinningMachines = machines;
        this.filteredSpinningMachines = [...this.spinningMachines];
        this.selectAllSpinningMachines = false;
        this.selectedSpinningMachines.clear();
        if (this.sortField) {
          this.sortSpinningMachines(this.sortField, false);
        }
      },
      error: (error) => {
        this.toastr.error('Error loading spinning machines');
        console.error('Error:', error);
      }
    });
  }
  
  // Add new spinning machine
  addSpinningMachine() {
    this.isAdding = true;
    this.isEditing = false;
    this.spinningMachineForm = {
      machineName: '',
      description: '',
      merge: 0,
      max: 0,
      isActive: true
    };
    this.showSpinningMachineForm = true;
  }

  // Edit spinning machine
  editSpinningMachine(machine: SpinningMachine) {
    this.isAdding = false;
    this.isEditing = true;
    this.spinningMachineForm = { ...machine };
    this.showSpinningMachineForm = true;
  }

  // Cancel spinning machine edit
  cancelSpinningMachineEdit() {
    this.showSpinningMachineForm = false;
    this.isAdding = false;
    this.isEditing = false;
    this.spinningMachineForm = {
      machineName: '',
      description: '',
      merge: 0,
      max: 0,
      isActive: true
    };
  }

  // Save spinning machine
  saveSpinningMachine() {
    // Validate machine name pattern (SM-99 to SM-999)
    const machineNamePattern = /^SM-[1-9][0-9]{1,2}$/;
    if (!machineNamePattern.test(this.spinningMachineForm.machineName)) {
      this.toastr.error('Spinning Machine name must be in format SM-99 to SM-999');
      return;
    }
    
    // Validate Merge field is not empty or zero
    if (!this.spinningMachineForm.merge || this.spinningMachineForm.merge === 0) {
      this.toastr.error('Merge field is mandatory');
      return;
    }
    
    // Validate Max threadLine is not empty or zero
    if (!this.spinningMachineForm.max || this.spinningMachineForm.max === 0) {
      this.toastr.error('Max threadLine field is mandatory');
      return;
    }
    
    // Validate max threadLine (max 64)
    if (this.spinningMachineForm.max > 64) {
      this.toastr.error('Max threadLine cannot exceed 64');
      return;
    }
    
    if (this.isAdding) {
      this.spinningMachineService.addSpinningMachine(this.spinningMachineForm).subscribe({
        next: (newMachine) => {
          this.spinningMachines.push(newMachine);
          this.filterAndSortSpinningMachines();
          this.showSpinningMachineForm = false;
          this.toastr.success('Spinning machine added successfully');
        },
        error: (err) => {
          console.error('Error adding spinning machine:', err);
          this.toastr.error(`Error adding spinning machine: ${err.message || 'Unknown error'}`);
        }
      });
    } else if (this.isEditing) {
      this.spinningMachineService.updateSpinningMachine(this.spinningMachineForm).subscribe({
        next: (updatedMachine) => {
          const index = this.spinningMachines.findIndex(m => m.id === updatedMachine.id);
          if (index !== -1) {
            this.spinningMachines[index] = updatedMachine;
          }
          this.filterAndSortSpinningMachines();
          this.showSpinningMachineForm = false;
          this.toastr.success('Spinning machine updated successfully');
        },
        error: (err) => {
          console.error('Error updating spinning machine:', err);
          this.toastr.error(`Error updating spinning machine: ${err.message || 'Unknown error'}`);
        }
      });
    }
  }

  // Delete spinning machine
  deleteSpinningMachine(id: number) {
    this.confirmationDialogService.confirm({
      title: 'Delete Spinning Machine',
      message: 'Are you sure you want to delete this spinning machine?',
      dialogType: 'danger'
    }).subscribe((result: ConfirmDialogResult) => {
      if (result && result.confirmed) {
        this.spinningMachineService.deleteSpinningMachine(id).subscribe({
          next: () => {
            this.spinningMachines = this.spinningMachines.filter(machine => machine.id !== id);
            this.filterAndSortSpinningMachines();
            this.toastr.success('Spinning machine deleted successfully');
          },
          error: (err) => {
            console.error('Error deleting spinning machine:', err);
            this.toastr.error(`Error deleting spinning machine: ${err.message || 'Unknown error'}`);
          }
        });
      }
    });
  }
  


  loadShifts(): void {
    this.shiftService.getShifts().subscribe(data => {
      this.shifts = data;
    });
  }

  // loadTests() is now implemented in the enhanced version below
  // Keeping this comment as a reference for where the original method was

  loadUserGroups(): void {
    this.userGroupService.getUserGroups().subscribe(data => {
      this.userGroups = data;
    });
  }

  setCurrentSection(section: string): void {
    this.currentSection = section;
    
    // Reset sub-section when changing main section
    if (section === 'spinning') {
      this.currentSubSection = 'spinning';
      this.showRemarksHistoryModal = false;
      this.remarksHistory = [];
      this.currentDate = new Date();
      this.currentShift = 'Night Shift';
    } else if (section === 'spinning' || 
              section === 'history' || 
              section === 'remarks' || 
              section === 'users' || 
              section === 'reports') {
      this.currentSubSection = '';
    }
    
    this.resetForms();
  }

  setCurrentSubSection(subSection: string): void {
    this.currentSubSection = subSection;
    this.resetForms();
    
    // If switching to test tab, load tests
    if (subSection === 'test') {
      this.loadTests();
    }
  }
  
  // Reset all forms and editing state
  resetForms(): void {
    this.isEditing = false;
    this.isAdding = false;
    this.selectedItemId = null;
    this.testFormVisible = false; // Explicitly hide the test form popup
    
    this.dispositionForm = { disposition: '', description: '', abbreviation: '', isActive: true };
    this.spinningMachineForm = { machineName: '', description: '', merge: 0, max: 0, isActive: true };
    this.shiftForm = { name: '', startTime: '', endTime: '', isActive: true };
    this.testForm = { testName: '', description: '', spinningMachine: '', threadline: '', expirationDate: '', isActive: true };
    this.userGroupForm = { name: '', description: '', permissions: [], isActive: true };
  }

   
  // Sort dispositions by field
  sortDispositions(field: string, toggleDirection = true) {
    if (toggleDirection && field === this.sortField) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    }
    this.sortField = field;

    this.filteredDispositions.sort((a: Disposition, b: Disposition) => {
      let comparison = 0;
      
      // Type-safe comparison based on field name
      switch (field) {
        case 'id':
          comparison = (a.id || 0) > (b.id || 0) ? 1 : (a.id || 0) < (b.id || 0) ? -1 : 0;
          break;
        case 'disposition':
          comparison = (a.disposition || '').localeCompare(b.disposition || '');
          break;
        case 'description':
          comparison = (a.description || '').localeCompare(b.description || '');
          break;
        case 'abbreviation':
          comparison = (a.abbreviation || '').localeCompare(b.abbreviation || '');
          break;
        case 'isActive':
          comparison = (a.isActive === b.isActive) ? 0 : a.isActive ? 1 : -1;
          break;
        default:
          comparison = 0;
      }
      
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  // Add new disposition
  addDisposition() {
    this.isAdding = true;
    this.isEditing = false;
    this.dispositionForm = {
      disposition: '',
      description: '',
      abbreviation: '',
      isActive: true
    };
    this.showDispositionForm = true;
  }

  // Edit disposition
  editDisposition(item: Disposition) {
    this.isAdding = false;
    this.isEditing = true;
    this.dispositionForm = { ...item };
    this.showDispositionForm = true;
  }

  // Cancel disposition edit
  cancelDispositionEdit() {
    this.showDispositionForm = false;
    this.isAdding = false;
    this.isEditing = false;
  }

  // Save disposition with validation
  saveDisposition() {
    console.log('saveDisposition called', this.dispositionForm); // Debug log
    
    const { disposition, abbreviation } = this.dispositionForm;
    
    // Required fields - trim values to handle spaces-only input
    if (!disposition?.trim() || !abbreviation?.trim()) {
      this.toastr.error('Disposition and Abbreviation are required.');
      return;
    }
    
    // Max length
    if (disposition.length > this.MAX_DISPOSITION_LENGTH) {
      this.toastr.error(`Disposition cannot exceed ${this.MAX_DISPOSITION_LENGTH} characters.`);
      return;
    }
    
    // Abbreviation must be 1 to 10 chars
    if (abbreviation.length < 1 || abbreviation.length > 10) {
      this.toastr.error('Abbreviation must be between 1 and 10 characters.');
      return;
    }
    
    // Uniqueness check for new dispositions
    if (this.isAdding) {
      const duplicateDisposition = this.dispositions.some(
        d => d.disposition.toLowerCase() === disposition.toLowerCase()
      );
      
      const duplicateAbbreviation = this.dispositions.some(
        d => d.abbreviation.toLowerCase() === abbreviation.toLowerCase()
      );
      
      if (duplicateDisposition && duplicateAbbreviation) {
        this.toastr.error('Both disposition name and abbreviation already exist. Please use different values.');
        return;
      } else if (duplicateDisposition) {
        this.toastr.error('This disposition name already exists. Please use a different name.');
        return;
      } else if (duplicateAbbreviation) {
        this.toastr.error('This abbreviation already exists. Please use a different abbreviation.');
        return;
      }
    } else if (this.isEditing) {
      // When editing, check for uniqueness excluding the current item
      const duplicateDisposition = this.dispositions.some(
        d => d.id !== this.dispositionForm.id && 
             d.disposition.toLowerCase() === disposition.toLowerCase()
      );
      
      const duplicateAbbreviation = this.dispositions.some(
        d => d.id !== this.dispositionForm.id && 
             d.abbreviation.toLowerCase() === abbreviation.toLowerCase()
      );
      
      if (duplicateDisposition && duplicateAbbreviation) {
        this.toastr.error('Both disposition name and abbreviation already exist. Please use different values.');
        return;
      } else if (duplicateDisposition) {
        this.toastr.error('This disposition name already exists. Please use a different name.');
        return;
      } else if (duplicateAbbreviation) {
        this.toastr.error('This abbreviation already exists. Please use a different abbreviation.');
        return;
      }
    }
    
    // Save or update
    const op = this.isAdding
      ? this.dispositionService.addDisposition(this.dispositionForm)
      : this.dispositionService.updateDisposition(this.dispositionForm);
      
    op.subscribe({
      next: () => {
        this.toastr.success(`Disposition ${this.isAdding ? 'created' : 'updated'} successfully`);
        this.showDispositionForm = false;
        this.resetForms(); // Reset all forms
        this.loadDispositions(); // Reload dispositions list
      },
      error: (err) => {
        console.error('Error saving disposition:', err);
        this.toastr.error('Error saving disposition: ' + (err.message || 'Unknown error'));
      }
    });
  }

  onSelectAllDispositions(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectAllDispositions = checked;
    this.selectedDispositions.clear();
    if (checked) {
      this.filteredDispositions.forEach(d => this.selectedDispositions.add(d.id!));
    }
  }
  updateSelectAllState() {
    this.selectAllDispositions = this.filteredDispositions.length > 0 && 
      this.filteredDispositions.every(d => this.isDispositionSelected(d.id));
  }

  // Helper method to safely check if an ID is in the selectedDispositions Set
  isDispositionSelected(id: number | undefined): boolean {
    if (id === undefined) return false;
    return this.selectedDispositions.has(id);
  }
  
  // Spinning Machine selection methods
  isSpinningMachineSelected(id: number | undefined): boolean {
    if (id === undefined) return false;
    return this.selectedSpinningMachines.has(id);
  }
  
  onSelectSpinningMachine(id: number | undefined, event: Event): void {
    // Skip if id is undefined
    if (id === undefined) {
      return;
    }
    
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedSpinningMachines.add(id);
    } else {
      this.selectedSpinningMachines.delete(id);
    }
    this.updateSelectAllSpinningMachinesState();
  }
  
  onSelectAllSpinningMachines(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectAllSpinningMachines = checked;
    
    if (checked) {
      // Select all spinning machines that have an ID
      this.filteredSpinningMachines.forEach(machine => {
        if (machine.id !== undefined) {
          this.selectedSpinningMachines.add(machine.id);
        }
      });
    } else {
      // Clear all selections
      this.selectedSpinningMachines.clear();
    }
  }
  
  updateSelectAllSpinningMachinesState(): void {
    // Check if all visible spinning machines are selected
    const allSelected = this.filteredSpinningMachines.every(machine => 
      machine.id === undefined || this.selectedSpinningMachines.has(machine.id)
    );
    
    // Check if any machines are selected
    const anySelected = this.filteredSpinningMachines.some(machine => 
      machine.id !== undefined && this.selectedSpinningMachines.has(machine.id)
    );
    
    // Update selectAll state
    this.selectAllSpinningMachines = allSelected && anySelected;
  }
  
  // Bulk delete selected spinning machines
  bulkDeleteSpinningMachines(): void {
    if (this.selectedSpinningMachines.size === 0) {
      this.toastr.warning('No spinning machines selected for deletion');
      return;
    }

    // Confirm deletion
    this.confirmationDialogService.confirm({
      title: 'Delete Spinning Machines',
      message: `Are you sure you want to delete ${this.selectedSpinningMachines.size} selected spinning machine(s)?`,
      dialogType: 'danger'
    }).subscribe((result: ConfirmDialogResult) => {
      if (result && result.confirmed) {
        // Convert Set to Array
        const idsToDelete = Array.from(this.selectedSpinningMachines);
        
        // Call service to delete spinning machines
        this.spinningMachineService.bulkDeleteSpinningMachines(idsToDelete).subscribe({
          next: () => {
            // Remove deleted machines from the list
            this.spinningMachines = this.spinningMachines.filter(machine => 
              machine.id === undefined || !this.selectedSpinningMachines.has(machine.id)
            );
            
            // Refresh the filtered list
            this.filterAndSortSpinningMachines();
            
            // Clear selection
            this.selectedSpinningMachines.clear();
            this.selectAllSpinningMachines = false;
            
            // Show success message
            this.toastr.success(`${idsToDelete.length} spinning machine(s) deleted successfully`);
          },
          error: (err) => {
            console.error('Error deleting spinning machines:', err);
            this.toastr.error(`Error deleting spinning machines: ${err.message || 'Unknown error'}`);
          }
        });
      }
    });
  }
  // Filter and sort spinning machines based on search text
  filterAndSortSpinningMachines(): void {
    const searchText = this.spinningMachineSearchText?.toLowerCase() || '';
    
    if (!searchText) {
      this.filteredSpinningMachines = [...this.spinningMachines];
    } else {
      this.filteredSpinningMachines = this.spinningMachines.filter(machine => 
        machine.machineName.toLowerCase().includes(searchText) ||
        machine.description.toLowerCase().includes(searchText) ||
        machine.merge.toString().includes(searchText) ||
        machine.max.toString().includes(searchText)
      );
    }
    
    this.sortSpinningMachines(this.sortField, false);
  }
  
  // Sort spinning machines by field
  sortSpinningMachines(field: string, toggleDirection = true): void {
    if (toggleDirection && field === this.sortField) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else if (field !== this.sortField) {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    
    this.filteredSpinningMachines.sort((a: SpinningMachine, b: SpinningMachine) => {
      let comparison = 0;
      
      // Type-safe comparison based on field name
      switch (field) {
        case 'id':
          comparison = (a.id || 0) > (b.id || 0) ? 1 : (a.id || 0) < (b.id || 0) ? -1 : 0;
          break;
        case 'machineName':
          comparison = (a.machineName || '').localeCompare(b.machineName || '');
          break;
        case 'description':
          comparison = (a.description || '').localeCompare(b.description || '');
          break;
        case 'merge':
          comparison = (a.merge || 0) > (b.merge || 0) ? 1 : (a.merge || 0) < (b.merge || 0) ? -1 : 0;
          break;
        case 'max':
          comparison = (a.max || 0) > (b.max || 0) ? 1 : (a.max || 0) < (b.max || 0) ? -1 : 0;
          break;
        case 'isActive':
          comparison = (a.isActive === b.isActive) ? 0 : a.isActive ? 1 : -1;
          break;
        default:
          comparison = 0;
      }
      
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  // Method moved above
  // Bulk delete spinning machines - DUPLICATE, REMOVED
  // Removed duplicate bulkDeleteSpinningMachines implementation

  // Helper method for pagination
  setPage(page: number): void {
    // Set the current page for pagination
    this.currentPage = page;
    
    // Update display based on page
    this.updateDisplayData();
  }
  
  // Method to update display data based on pagination
  updateDisplayData(): void {
    // Implement pagination logic here if needed
    // For example:
    // const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    // const endIndex = startIndex + this.itemsPerPage;
    // this.displayedItems = this.filteredItems.slice(startIndex, endIndex);
  }
  
  // Multi-select logic
  onSelectDisposition(id: number | undefined, event: Event): void {
    // Skip if id is undefined
    if (id === undefined) {
      return;
    }
        
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedDispositions.add(id);
    } else {
      this.selectedDispositions.delete(id);
    }
    this.updateSelectAllState();
  }

  // Unsaved changes guard
  hasUnsavedDispositionChanges(): boolean {
    // Simple check: form is open and dirty
    return this.showDispositionForm && (
      Boolean(this.dispositionForm.disposition) ||
      Boolean(this.dispositionForm.abbreviation) ||
      Boolean(this.dispositionForm.description)
    );
  }
  
  

  // Helper methods
  togglePermission(permission: string): void {
    const index = this.userGroupForm.permissions.indexOf(permission);
    if (index === -1) {
      this.userGroupForm.permissions.push(permission);
    } else {
      this.userGroupForm.permissions.splice(index, 1);
    }
  }
  
  hasPermission(permission: string): boolean {
    return this.userGroupForm.permissions.includes(permission);
  }
  
  // Edit user group
  editUserGroup(userGroup: UserGroup) {
    this.isAdding = false;
    this.isEditing = true;
    this.userGroupForm = { ...userGroup };
    this.selectedItemId = userGroup.id || null;
  }

  // Save user group
  saveUserGroup() {
    // Add validation if needed
    if (!this.userGroupForm.name) {
      this.toastr.error('Group name is required');
      return;
    }

    const op = this.isAdding
      ? this.userGroupService.addUserGroup(this.userGroupForm)
      : this.userGroupService.updateUserGroup(this.userGroupForm);
    
    op.subscribe({
      next: () => {
        this.toastr.success(`User group ${this.isAdding ? 'created' : 'updated'} successfully`);
        this.resetForms();
        this.loadUserGroups();
      },
      error: () => {
        this.toastr.error(`Error ${this.isAdding ? 'creating' : 'updating'} user group`);
      }
    });
  }

  // Add new user group
  addUserGroup() {
    this.isAdding = true;
    this.isEditing = false;
    this.userGroupForm = {
      name: '',
      description: '',
      permissions: [],
      isActive: true
    };
    this.selectedItemId = null;
  }
  
  // Delete user group with confirmation
  deleteUserGroup(id: number) {
    this.confirmationDialogService.confirm({
      title: 'Delete User Group',
      message: 'Are you sure you want to delete this user group?',
      dialogType: 'danger'
    }).subscribe((result) => {
      if (result.confirmed) {
        this.userGroupService.deleteUserGroup(id).subscribe({
          next: (success) => {
            if (success) {
              this.toastr.success('User group deleted successfully');
              this.loadUserGroups(); // Refresh the list
            } else {
              this.toastr.error('Failed to delete user group');
            }
          },
          error: () => {
            this.toastr.error('Error deleting user group');
          }
        });
      }
    });
  }

  // This loadTests implementation was removed as it was a duplicate
  // The other implementation is kept at line ~1300

  // Filter and sort tests
  filterAndSortTests(): void {
    // Filter tests based on search term
    this.filteredTests = this.tests.filter((test: Test) => {
      return (
        test.testName.toLowerCase().includes(this.testSearchTerm.toLowerCase()) ||
        test.description.toLowerCase().includes(this.testSearchTerm.toLowerCase()) ||
        (test.spinningMachine && test.spinningMachine.toLowerCase().includes(this.testSearchTerm.toLowerCase()))
      );
    });
    
    // Apply current sort
    if (this.testSortField) {
      this.sortTests(this.testSortField, false);
    }
  }
  
  // Sort tests
  sortTests(field: string, toggleDirection = true): void {
    if (toggleDirection) {
      if (this.testSortField === field) {
        this.testSortDirection = this.testSortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.testSortField = field;
        this.testSortDirection = 'asc';
      }
    }
    
    this.filteredTests.sort((a: Test, b: Test) => {
      let comparison = 0;
      
      // Type-safe comparison based on field name
      switch (field) {
        case 'id':
          comparison = (a.id || 0) > (b.id || 0) ? 1 : (a.id || 0) < (b.id || 0) ? -1 : 0;
          break;
        case 'testName':
          comparison = (a.testName || '').localeCompare(b.testName || '');
          break;
        case 'description':
          comparison = (a.description || '').localeCompare(b.description || '');
          break;
        case 'spinningMachine':
          comparison = (a.spinningMachine || '').localeCompare(b.spinningMachine || '');
          break;
        case 'threadline':
          comparison = (a.threadline || '').localeCompare(b.threadline || '');
          break;
        case 'expirationDate':
          comparison = (a.expirationDate || '').localeCompare(b.expirationDate || '');
          break;
        case 'isActive':
          comparison = (a.isActive === b.isActive) ? 0 : a.isActive ? 1 : -1;
          break;
        default:
          comparison = 0;
      }
      
      return this.testSortDirection === 'asc' ? comparison : -comparison;
    });
  }
  
  // Test selection methods
  isTestSelected(id: number | undefined): boolean {
    if (id === undefined) return false;
    return this.selectedTests.has(id);
  }
  
  onSelectTest(id: number | undefined, event: Event): void {
    // Skip if id is undefined
    if (id === undefined) {
      return;
    }
    
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedTests.add(id);
    } else {
      this.selectedTests.delete(id);
    }
    this.updateSelectAllTestsState();
  }
  
  onSelectAllTests(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectAllTests = checked;
    
    if (checked) {
      this.filteredTests.forEach(test => {
        if (test.id) this.selectedTests.add(test.id);
      });
    } else {
      this.selectedTests.clear();
    }
  }
  
  updateSelectAllTestsState(): void {
    if (this.filteredTests.length === 0) {
      this.selectAllTests = false;
      return;
    }
    
    const allSelected = this.filteredTests.every(test => {
      return test.id !== undefined && this.selectedTests.has(test.id);
    });
    
    this.selectAllTests = allSelected;
  }
  
  // Bulk delete tests
  bulkDeleteTests(): void {
    if (this.selectedTests.size === 0) return;
    
    this.confirmationDialogService.confirm({
      title: 'Delete Tests',
      message: `Are you sure you want to delete ${this.selectedTests.size} selected test(s)?`,
      dialogType: 'danger'
    }).subscribe((result: ConfirmDialogResult) => {
      if (result && result.confirmed) {
        const ids = Array.from(this.selectedTests);
        this.testService.bulkDeleteTests(ids).subscribe({
          next: () => {
            this.toastr.success(`${ids.length} test(s) deleted successfully`);
            this.selectedTests.clear();
            this.selectAllTests = false;
            this.loadTests();
          },
          error: (error: Error) => {
            this.toastr.error('Error deleting tests');
            console.error('Error deleting tests:', error);
          }
        });
      }
    });
  }
  
  // Edit test
  editTest(test: Test): void {
    this.isAddingTest = false;
    this.testFormVisible = true;
    
    // Use the current date for expiration if it doesn't exist
    const expirationDate = test.expirationDate || new Date().toISOString().split('T')[0];
    
    this.testForm = {
      id: test.id,
      testName: test.testName,
      description: test.description,
      spinningMachine: test.spinningMachine || '',
      threadline: test.threadline || '',
      expirationDate: expirationDate,
      isActive: test.isActive
    };
    
    // Parse the threadline string to set selected threadlines
    this.selectedThreadlines.clear();
    if (test.threadline) {
      const threadlines = test.threadline.split(',').map(t => parseInt(t.trim(), 10));
      threadlines.forEach(t => {
        if (!isNaN(t)) {
          this.selectedThreadlines.add(t);
        }
      });
    }
    
    // Load available threadlines based on the spinning machine
    const selectedMachine = this.spinningMachines.find(m => m.machineName === test.spinningMachine);
    if (selectedMachine && selectedMachine.max > 0) {
      this.availableThreadlines = Array.from({length: selectedMachine.max}, (_, i) => i + 1);
    } else {
      this.availableThreadlines = [];
    }
  }
  
  // Show test form for adding
  openTestForm(isAdding: boolean): void {
    this.isAddingTest = isAdding;
    this.testFormVisible = true;
    
    if (isAdding) {
      // Set the default expiration date to 1 year from today
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      
      this.testForm = {
        testName: 'ETS_0000_',
        description: '',
        spinningMachine: '',
        threadline: '',
        expirationDate: oneYearFromNow.toISOString().split('T')[0],
        isActive: true
      };
    }
  }
  
  // Cancel test edit
  cancelTestEdit(): void {
    this.testFormVisible = false;
    this.showThreadlineDropdown = false;
    this.selectedThreadlines.clear();
  }
  
  // Auto-populate threadline dropdown options based on selected spinning machine
  onSpinningMachineChange(): void {
    const selectedMachine = this.spinningMachines.find(m => m.machineName === this.testForm.spinningMachine);
    if (selectedMachine && selectedMachine.max > 0) {
      // Generate available threadlines from 1 to max
      this.availableThreadlines = Array.from({length: selectedMachine.max}, (_, i) => i + 1);
      // Clear previous selections
      this.selectedThreadlines.clear();
      this.testForm.threadline = '';
    } else {
      this.availableThreadlines = [];
      this.selectedThreadlines.clear();
      this.testForm.threadline = '';
    }
  }

  // Toggle threadline dropdown visibility
  toggleThreadlineDropdown(): void {
    this.showThreadlineDropdown = !this.showThreadlineDropdown;
  }

  // Check if a specific threadline is selected
  isThreadlineSelected(line: number): boolean {
    return this.selectedThreadlines.has(line);
  }

  // Check if all threadlines are selected
  areAllThreadlinesSelected(): boolean {
    return this.availableThreadlines.length > 0 && 
           this.selectedThreadlines.size === this.availableThreadlines.length;
  }

  // Select or deselect a specific threadline
  toggleThreadlineSelection(line: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    
    if (checked) {
      this.selectedThreadlines.add(line);
    } else {
      this.selectedThreadlines.delete(line);
    }
    
    // Update the threadline field in the form with comma-separated values
    this.updateThreadlineField();
  }

  // Select or deselect all threadlines
  selectAllThreadlines(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    
    if (checked) {
      // Add all available threadlines to the selected set
      this.availableThreadlines.forEach(line => this.selectedThreadlines.add(line));
    } else {
      // Clear all selections
      this.selectedThreadlines.clear();
    }
    
    // Update the threadline field in the form with comma-separated values
    this.updateThreadlineField();
  }

  // Update the threadline field in the form with comma-separated values
  updateThreadlineField(): void {
    if (this.selectedThreadlines.size === 0) {
      this.testForm.threadline = '';
    } else {
      // Convert selected threadlines set to a sorted array and join with commas
      const sortedThreadlines = Array.from(this.selectedThreadlines).sort((a, b) => a - b);
      this.testForm.threadline = sortedThreadlines.join(', ');
    }
  }

  // Save test
  saveTest() {
    // Validate required fields
    if (!this.testForm.testName) {
      this.toastr.error('Test name is required');
      return;
    }
    
    if (!this.testForm.description) {
      this.toastr.error('Description is required');
      return;
    }
    
    if (!this.testForm.spinningMachine) {
      this.toastr.error('Spinning Machine is required');
      return;
    }
    
    if (!this.testForm.expirationDate) {
      this.toastr.error('Expiration date is required');
      return;
    }
    
    // Check for proper test nomenclature format (ETS_XXXX_Text)
    if (!this.testForm.testName.match(/^ETS_\d{4}_[a-zA-Z0-9]+/)) {
      this.toastr.error('Test name must follow the format ETS_0000_Text');
      return;
    }
    
    // Ensure isActive is calculated based on expiration date
    const today = new Date();
    const expirationDate = new Date(this.testForm.expirationDate);
    this.testForm.isActive = expirationDate > today;
    
    // Convert the form to a Test object that matches the updated model
    const testData: Test = {
      ...this.testForm,
      // Add any other fields the Test model needs
    };
    
    const op = this.isAddingTest
      ? this.testService.addTest(testData)
      : this.testService.updateTest(testData);
    
    op.subscribe({
      next: () => {
        this.toastr.success(`Test ${this.isAddingTest ? 'created' : 'updated'} successfully`);
        this.testFormVisible = false;
        this.loadTests();
      },
      error: (error) => {
        this.toastr.error(`Error ${this.isAddingTest ? 'creating' : 'updating'} test`);
        console.error(`Error ${this.isAddingTest ? 'creating' : 'updating'} test:`, error);
      }
    });
  }

  // Add new shift
  addShift() {
    this.isAdding = true;
    this.isEditing = false;
    this.shiftForm = {
      name: '',
      startTime: '',
      endTime: '',
      isActive: true
    };
    this.selectedItemId = null;
  }

  // Edit shift
  editShift(shift: Shift) {
    this.isAdding = false;
    this.isEditing = true;
    this.shiftForm = {
      id: shift.id,
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      isActive: shift.isActive
    };
    this.selectedItemId = shift.id || null;
  }
  
  // Handle user logout
  logout(): void {
    // Call the auth service logout method
    this.authService.logout();
    // Navigate to login page
    this.router.navigate(['/login']);
  }

  // Save shift
  saveShift() {
    // Validate required fields
    if (!this.shiftForm.name) {
      this.toastr.error('Shift name is required');
      return;
    }
    
    if (!this.shiftForm.startTime) {
      this.toastr.error('Start time is required');
      return;
    }
    
    if (!this.shiftForm.endTime) {
      this.toastr.error('End time is required');
      return;
    }
    
    const op = this.isAdding
      ? this.shiftService.addShift(this.shiftForm)
      : this.shiftService.updateShift(this.shiftForm);
    
    op.subscribe({
      next: () => {
        this.toastr.success(`Shift ${this.isAdding ? 'created' : 'updated'} successfully`);
        this.resetForms();
        this.loadShifts();
      },
      error: () => {
        this.toastr.error(`Error ${this.isAdding ? 'creating' : 'updating'} shift`);
      }
    });
  }

  // Delete shift
  deleteShift(id: number) {
    this.confirmationDialogService.confirm({
      title: 'Delete Shift',
      message: 'Are you sure you want to delete this shift?',
      dialogType: 'danger'
    }).subscribe((result: ConfirmDialogResult) => {
      if (result && result.confirmed) {
        this.shiftService.deleteShift(id).subscribe({
          next: () => {
            this.toastr.success('Shift deleted successfully');
            this.loadShifts();
          },
          error: () => {
            this.toastr.error('Error deleting shift');
          }
        });
      }
    });
  }

  // Deleted duplicate showTestForm method - using the one defined at the top of the file

  // Filter dispositions based on search text
  filterDispositions(): void {
    this.filteredDispositions = this.dispositions.filter(disposition => {
      if (!this.dispositionSearchText) return true;
      
      const searchLower = this.dispositionSearchText.toLowerCase();
      return disposition.disposition.toLowerCase().includes(searchLower) ||
        disposition.description.toLowerCase().includes(searchLower) ||
        disposition.abbreviation.toLowerCase().includes(searchLower);
    });
  }
  
  // Filter shifts based on search text
  filterShifts(): void {
    // Check if shifts array exists, if not, return
    if (!this.shifts) return;
    
    // If search text is empty, show all shifts
    if (!this.shiftSearchText) {
      this.shifts = [...this.shifts];
      return;
    }
    
    // Filter shifts based on search text
    const searchLower = this.shiftSearchText.toLowerCase();
    this.shifts = this.shifts.filter((shift: Shift) => {
      return shift.name.toLowerCase().includes(searchLower) ||
        shift.startTime.toLowerCase().includes(searchLower) ||
        shift.endTime.toLowerCase().includes(searchLower);
    });
  }
  
  // Bulk delete selected dispositions
  bulkDeleteDispositions(): void {
    if (this.selectedDispositions.size === 0) {
      this.toastr.info('No dispositions selected');
      return;
    }
    
    this.confirmationDialogService.confirm({
      title: 'Delete Dispositions',
      message: `Are you sure you want to delete ${this.selectedDispositions.size} selected disposition(s)?`,
      dialogType: 'danger'
    }).subscribe((result: ConfirmDialogResult) => {
      if (result && result.confirmed) {
        const selectedIds = Array.from(this.selectedDispositions);
        
        // Create array of delete requests - one for each disposition
        const deleteRequests: Observable<boolean>[] = [];
        
        // Create delete requests
        selectedIds.forEach(id => {
          deleteRequests.push(this.dispositionService.deleteDisposition(id));
        });
        
        // Execute all delete requests and wait for all to complete
        forkJoin(deleteRequests).subscribe({
          next: () => {
            // Remove deleted dispositions from the local arrays
            this.dispositions = this.dispositions.filter(disposition => {
              return disposition.id !== undefined && !this.selectedDispositions.has(disposition.id);
            });
            
            // Update filtered list
            this.filteredDispositions = this.filteredDispositions.filter(disposition => {
              return disposition.id !== undefined && !this.selectedDispositions.has(disposition.id);
            });
            
            this.toastr.success(`${this.selectedDispositions.size} disposition(s) deleted successfully`);
            
            // Clear selection
            this.selectedDispositions.clear();
            this.selectAllDispositions = false;
          },
          error: (error: unknown) => {
            console.error('Error deleting dispositions:', error);
            this.toastr.error('Error deleting dispositions');
          }
        });
      }
    });
  }
  
  // Load tests from API
  loadTests(): void {
    this.testService.getTests().subscribe({
      next: (tests: Test[]) => {
        this.tests = tests;
        this.filteredTests = [...this.tests];
        this.selectAllTests = false;
        this.selectedTests.clear();
      },
      error: (error: Error) => {
        console.error('Error fetching tests:', error);
        this.toastr.error('Error loading tests');
      }
    });
  }

  // Get next available test number (formatted as 0001, 0002, etc)
  private getNextTestNumber(): string {
    if (!this.tests || this.tests.length === 0) return '0001';
    
    // Find max existing number
    const testNumbers = this.tests
      .map((test: Test) => {
        const match = test.testName.match(/ETS_(\d{4})_/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((num: number) => !isNaN(num));

    if (testNumbers.length === 0) return '0001';

    const maxNumber = Math.max(...testNumbers);
    
    // Format as 4-digit string with leading zeros
    return (maxNumber + 1).toString().padStart(4, '0');
  }

  // Get default expiration date (2 years from today)
  private getDefaultExpirationDate(): string {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 2);
    
    // Format as YYYY-MM-DD (ISO format for date inputs)
    return date.toISOString().split('T')[0];
  }


  // Delete test
  deleteTest(id: number) {
    this.confirmationDialogService.confirm({
      title: 'Delete Test',
      message: 'Are you sure you want to delete this test?',
      dialogType: 'danger'
    }).subscribe((result: ConfirmDialogResult) => {
      if (result && result.confirmed) {
        this.testService.deleteTest(id).subscribe({
          next: () => {
            this.toastr.success('Test deleted successfully');
            this.loadTests();
          },
          error: () => {
            this.toastr.error('Error deleting test');
          }
        });
      }
    });
  }
}