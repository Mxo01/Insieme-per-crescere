import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
		loadComponent: () => import('./pages/home/home').then(m => m.Home)
	},
	{
		path: 'booking',
		loadComponent: () => import('./pages/booking/booking').then(m => m.Booking)
	},
	{
		path: '**',
		redirectTo: ''
	}
];
