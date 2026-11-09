import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent {
  categories = [
    { id: 'electricas', title: 'Herramientas Eléctricas', icon: '⚡', desc: 'Taladros, sierras, lijadoras y amoladoras' },
    { id: 'jardineria', title: 'Jardinería', icon: '🌱', desc: 'Cortacéspedes, podadoras, palas y mangueras' },
    { id: 'manuales', title: 'Manuales', icon: '🔨', desc: 'Martillos, cajas de llaves, destornilladores' },
    { id: 'construccion', title: 'Construcción', icon: '🧱', desc: 'Escaleras, niveles, carretillas y espátulas' },
    { id: 'fontaneria', title: 'Fontanería', icon: '🔧', desc: 'Llaves de tubo, sopletes y desatascadores' },
    { id: 'pintura', title: 'Pintura', icon: '🎨', desc: 'Pistolas de pintar, rodillos, bandejas y plásticos' }
  ];
}

