import { Component } from '@angular/core';
import { Navbar } from '../../layout/navbar/navbar';
import { Sidebar } from '../../layout/sidebar/sidebar';

@Component({
  selector: 'app-reports',
  imports: [Sidebar, Navbar],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class Reports {}
