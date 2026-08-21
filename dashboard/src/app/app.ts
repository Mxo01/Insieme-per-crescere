import {
	Component,
	inject,
	signal,
	computed,
	DestroyRef,
	viewChild,
	ElementRef,
	afterNextRender
} from "@angular/core";
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

interface NavItem {
	key: string;
	label: string;
	icon: string;
	link?: string;
	href?: string;
}

const NAV_ITEMS: NavItem[] = [
	{ key: "home", label: "Prenotazioni", icon: "pi pi-calendar", link: "/home" },
	{
		key: "availability-management",
		label: "Gestione Disponibilità",
		icon: "pi pi-clock",
		link: "/availability-management"
	},
	{ key: "about", label: "About Me", icon: "pi pi-user", link: "/about" }
];

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
	private readonly destroyRef = inject(DestroyRef);

	readonly isSidebarVisible = signal<boolean>(false);

	protected readonly portfolioUrl = environment.portfolioUrl;
	protected readonly navItems = NAV_ITEMS;

	user = this.authService.user;
	isAuthenticated = computed(() => this.user() !== null);

	// Header hides on scroll-down and reappears on scroll-up, same behavior
	// as the portfolio's nav — always visible near the top (<80px).
	//
	// Animating `top` rather than `transform`: a `position: sticky` element
	// that also has `backdrop-blur` and an active `transform` hits a real
	// compositing bug in Chromium (confirmed via devtools — layout/
	// `getBoundingClientRect` stayed correct, but the painted frame didn't),
	// so the header visually ended up glued to the bottom of the viewport.
	// Sliding it away via `top` (its own stick offset) avoids that combo.
	readonly headerRef = viewChild<ElementRef<HTMLElement>>("headerEl");
	readonly isNavHidden = signal(false);
	readonly headerHeight = signal(0);
	private lastScrollY = 0;

	constructor() {
		afterNextRender(() => this.updateHeaderHeight());

		const onScroll = () => {
			const currentY = window.scrollY;
			this.isNavHidden.set(currentY >= 80 && currentY > this.lastScrollY);
			this.lastScrollY = currentY;
		};
		const onResize = () => this.updateHeaderHeight();

		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onResize);
		this.destroyRef.onDestroy(() => {
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", onResize);
		});
	}

	private updateHeaderHeight() {
		this.headerHeight.set(this.headerRef()?.nativeElement.offsetHeight ?? 0);
	}

	toggleSidebar() {
		this.isSidebarVisible.update(isVisible => !isVisible);
	}

	closeSidebar() {
		this.isSidebarVisible.set(false);
	}

	async logout() {
		await this.authService.signOut();
		this.router.navigate(["/login"]);
		this.isSidebarVisible.set(false);
	}
}
