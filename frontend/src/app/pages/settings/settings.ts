import { Component } from '@angular/core';
import { Navbar } from '../../layout/navbar/navbar';
import { Sidebar } from '../../layout/sidebar/sidebar';

@Component({
  selector: 'app-settings',
  imports: [Sidebar, Navbar],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {}
