import { Component, inject, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "../../shared/services/auth/auth";

@Component({
	selector: "app-login",
	templateUrl: "./login.html"
})
export class Login implements OnInit {
	private readonly authService = inject(AuthService);
	private readonly router = inject(Router);

	async ngOnInit() {
		await this.authService.authReady;
		if (this.authService.user()) this.router.navigate(["/home"]);
	}

	async login() {
		await this.authService.signInWithGoogle();
		if (this.authService.user()) this.router.navigate(["/home"]);
	}
}
