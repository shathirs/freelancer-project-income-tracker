import { Component } from '@angular/core';
import { Navbar } from '../../layout/navbar/navbar';
import { Sidebar } from '../../layout/sidebar/sidebar';

@Component({
  selector: 'app-clients',
  imports: [Sidebar, Navbar],
  templateUrl: './clients.html',
  styleUrl: './clients.css',
})
export class Clients {}
