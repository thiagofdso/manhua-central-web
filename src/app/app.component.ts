import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ActiveDownloadsDrawerComponent } from './features/downloads/active-downloads-drawer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ActiveDownloadsDrawerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'web-client';
}
