import { Routes } from "@angular/router";
import { adminGuard } from "./shared/guards/admin.guard";

export const routes: Routes = [
	{
		path: "",
		redirectTo: "home",
		pathMatch: "full"
	},
	{
		path: "login",
		loadComponent: () => import("./pages/login/login").then(m => m.Login)
	},
	{
		path: "home",
		canActivate: [adminGuard],
		loadComponent: () => import("./pages/home/home").then(m => m.Home)
	},
	{
		path: "availability-management",
		canActivate: [adminGuard],
		loadComponent: () =>
			import("./pages/availability-management/availability-management").then(
				m => m.AvailabilityManagement
			)
	},
	{
		path: "**",
		redirectTo: ""
	}
];
