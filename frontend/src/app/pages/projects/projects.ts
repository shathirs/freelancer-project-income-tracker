import { Component } from '@angular/core';
import { Navbar } from '../../layout/navbar/navbar';
import { Sidebar } from '../../layout/sidebar/sidebar';

@Component({
  selector: 'app-projects',
  imports: [Sidebar, Navbar],
  templateUrl: './projects.html',
  styleUrl: './projects.css',
})
export class Projects {}
