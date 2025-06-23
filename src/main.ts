import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { ChatComponent } from './app/components/chat/chat.component';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <app-chat></app-chat>
    </div>
  `,
  styles: [`
    .app-container {
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
      font-family: 'Red Hat Display', sans-serif;
    }

    h1 {
      color: #333;
      margin-bottom: 1rem;
    }

    p {
      color: #666;
      line-height: 1.6;
      margin-bottom: 1rem;
    }
  `],
  imports: [ChatComponent]
})
export class App {
  name = 'Angular Chat App';
}

bootstrapApplication(App, {
  providers: [
    provideHttpClient()
  ]
});