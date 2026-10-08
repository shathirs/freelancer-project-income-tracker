import { Component } from '@angular/core';
import { Navbar } from '../../layout/navbar/navbar';
import { Sidebar } from '../../layout/sidebar/sidebar';

@Component({
  selector: 'app-income',
  imports: [Sidebar, Navbar],
  templateUrl: './income.html',
  styleUrl: './income.css',
})
export class Income {}
