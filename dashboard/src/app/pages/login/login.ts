import { Component, inject } from "@angular/core";
import { Router } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { AuthService } from "../../shared/services/auth/auth";

@Component({
	selector: "app-login",
	imports: [ButtonModule],
	template: `
		<div class="h-screen flex items-center justify-center bg-violet-50">
			<div
				class="bg-white p-12 rounded-3xl shadow-xl border border-stone-100 flex flex-col items-center gap-8 max-w-md w-full mx-4"
			>
				<div class="text-center">
					<h1 class="text-3xl font-bold text-gray-900 mb-2">Area Riservata</h1>
					<p class="text-gray-500">Accedi per gestire le prenotazioni di Insieme per Crescere.</p>
				</div>
				<p-button
					label="Accedi con Google"
					icon="pi pi-google"
					[rounded]="true"
					size="large"
					(onClick)="login()"
				/>
			</div>
		</div>
	`,
	styles: ``
})
export class Login {
	private readonly authService = inject(AuthService);
	private readonly router = inject(Router);

	async login() {
		await this.authService.signInWithGoogle();
		
		if (this.authService.user()) {
			this.router.navigate(["/home"]);
		}
	}
}
