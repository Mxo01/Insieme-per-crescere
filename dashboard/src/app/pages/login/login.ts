import { Component, inject } from "@angular/core";
import { Router } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { AuthService } from "../../shared/services/auth/auth";

@Component({
	selector: "app-login",
	imports: [ButtonModule],
	templateUrl: "./login.html"
})
export class Login {
	private readonly authService = inject(AuthService);
	private readonly router = inject(Router);

	ngOnInit() {
		if (this.authService.user()) this.router.navigate(["/home"]);
	}

	async login() {
		await this.authService.signInWithGoogle();
		if (this.authService.user()) this.router.navigate(["/home"]);
	}
}
