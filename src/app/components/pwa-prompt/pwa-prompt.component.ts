import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SwUpdate } from '@angular/service-worker';

@Component({
  selector: 'app-pwa-prompt',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pwa-prompt.component.html',
  styleUrls: ['./pwa-prompt.component.scss']
})
export class PwaPromptComponent implements OnInit {
  deferredPrompt: any;
  showInstallPrompt = false;
  showUpdatePrompt = false;

  constructor(private swUpdate: SwUpdate) {}

  ngOnInit() {
    // Check for service worker updates
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.subscribe(event => {
        if (event.type === 'VERSION_READY') {
          this.showUpdatePrompt = true;
        }
      });
    }
  }

  @HostListener('window:beforeinstallprompt', ['$event'])
  onBeforeInstallPrompt(e: any) {
    // Prevent Chrome 76+ from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    this.deferredPrompt = e;
    // Show the install prompt
    this.showInstallPrompt = true;
  }

  installApp() {
    if (!this.deferredPrompt) {
      return;
    }
    // Show the install prompt
    this.deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    this.deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      // Clear the deferredPrompt variable
      this.deferredPrompt = null;
      this.showInstallPrompt = false;
    });
  }

  dismissInstallPrompt() {
    this.showInstallPrompt = false;
  }

  updateApp() {
    this.swUpdate.activateUpdate().then(() => {
      window.location.reload();
    });
  }

  dismissUpdatePrompt() {
    this.showUpdatePrompt = false;
  }
}
