import { Component, inject, signal, computed } from "@angular/core";
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from "@angular/router";
import { DrawerModule } from "primeng/drawer";
import { ButtonModule } from "primeng/button";
import { AvatarModule } from "primeng/avatar";
import { AuthService } from "./shared/services/auth/auth";
import { CommonModule } from "@angular/common";
import { environment } from "src/environments/environment.development";
import { ConfirmDialog } from "primeng/confirmdialog";
import { MessageService, ConfirmationService } from "primeng/api";
import { ToastModule } from "primeng/toast";
@Component({
	selector: "app-root",
	imports: [
		CommonModule,
		RouterOutlet,
		DrawerModule,
		ButtonModule,
		AvatarModule,
		RouterLink,
		RouterLinkActive,
		ConfirmDialog,
		ToastModule
	],
	providers: [MessageService, ConfirmationService],
	templateUrl: "./app.html",
	styleUrl: "./app.scss"
})
export class App {
	private readonly authService = inject(AuthService);

	private readonly router = inject(Router);

	readonly isSidebarVisible = signal<boolean>(false);

	protected readonly portfolioUrl = environment.portfolioUrl;

	user = this.authService.user;
	isAuthenticated = computed(() => this.user() !== null);

	toggleSidebar() {
		this.isSidebarVisible.update(isVisible => !isVisible);
	}

	async logout() {
		await this.authService.signOut();
		this.router.navigate(["/login"]);
		this.isSidebarVisible.set(false);
	}
}
