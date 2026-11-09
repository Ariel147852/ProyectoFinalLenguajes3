import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar';
import { FooterComponent } from './shared/components/footer/footer';
import { ChatWidgetComponent } from './shared/components/chat-widget/chat-widget';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, ChatWidgetComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {}
