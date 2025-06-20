const fs = require('fs');
const path = require('path');

// Path to the file
const filePath = path.join(__dirname, 'src/app/components/admin-dashboard/admin-dashboard.component.ts');

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Fix the syntax error "this: .selectAllSpinningMachines = checked," -> "this.selectAllSpinningMachines = checked;"
const fixedContent = content.replace(/this\s*:\s*\.selectAllSpinningMachines\s*=\s*checked\s*,?/g, 'this.selectAllSpinningMachines = checked;');

// Count occurrences to report how many fixes were made
const occurrences = (content.match(/this\s*:\s*\.selectAllSpinningMachines\s*=\s*checked\s*,?/g) || []).length;

// Check if any changes were made
if (content !== fixedContent) {
  // Write the fixed content back to the file
  fs.writeFileSync(filePath, fixedContent, 'utf8');
  console.log(`Fixed ${occurrences} occurrences of the syntax error.`);

  // Make a backup of the original file
  fs.writeFileSync(filePath + '.backup', content, 'utf8');
  console.log(`Backup of the original file saved to ${filePath}.backup`);
} else {
  console.log('No syntax errors found in the file.');
}

// Also scan for any other potential issues with colons after "this"
const potentialIssues = (content.match(/this\s*:\s*\./g) || []).length;
if (potentialIssues > 0) {
  console.log(`Warning: Found ${potentialIssues} other potential issues with "this: ."`);
}
