import { ApplicationRef, Component, DestroyRef, inject, signal, computed } from "@angular/core";
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

	readonly isSidebarVisible = signal<boolean>(false);

	protected readonly portfolioUrl = environment.portfolioUrl;
	protected readonly navItems = NAV_ITEMS;

	user = this.authService.user;
	isAuthenticated = computed(() => this.user() !== null);

	// p-toast and p-confirm-dialog update their own state correctly off
	// MessageService/ConfirmationService's RxJS subjects (confirmed via
	// direct inspection: `markForCheck()` runs, their internal state
	// updates), but nothing schedules a render pass for them under zoneless
	// change detection, so they never actually appear. Forcing a tick after
	// every emission keeps every call site working without patching each
	// one individually.
	//
	// The tick is deferred with `queueMicrotask` rather than called inline:
	// called synchronously, it ran before Toast/ConfirmDialog's own
	// subscriber (also on these same subjects) had applied the new state,
	// and it could also fire while Angular's own event dispatch was still
	// mid-flight (e.g. a close-button click handler), which left the
	// zoneless scheduler's pending-tick bookkeeping out of sync and
	// silently dropped later updates (a message needing an extra click to
	// appear, or a toast not disappearing when closed). Deferring lets
	// every synchronous handler for the current event finish first, so the
	// tick always sees fresh state and never overlaps Angular's own
	// scheduling.
	constructor() {
		const messageService = inject(MessageService);
		const confirmationService = inject(ConfirmationService);
		const appRef = inject(ApplicationRef);
		const destroyRef = inject(DestroyRef);

		const scheduleTick = () => queueMicrotask(() => appRef.tick());
		const subscriptions = [
			messageService.messageObserver.subscribe(scheduleTick),
			confirmationService.requireConfirmation$.subscribe(scheduleTick)
		];
		destroyRef.onDestroy(() => subscriptions.forEach(s => s.unsubscribe()));
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
