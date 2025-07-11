import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PwaPromptComponent } from './components/pwa-prompt/pwa-prompt.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [RouterOutlet, PwaPromptComponent]
})
export class AppComponent {
  title = 'spinning-app';
  currentYear = new Date().getFullYear();
}
