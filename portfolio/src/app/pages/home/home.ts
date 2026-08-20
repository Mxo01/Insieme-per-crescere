import {
	Component,
	computed,
	inject,
	signal,
	DestroyRef,
	viewChild,
	ElementRef,
	afterNextRender
} from "@angular/core";
import { ButtonModule } from "primeng/button";
import { RouterLink } from "@angular/router";
import { TagModule } from "primeng/tag";
import { Assets } from "src/app/shared/services/assets/assets";
import { base64ToBlob, copyTextToClipboard } from "src/app/shared/utils/utils";
import { MessageService } from "primeng/api";

@Component({
	selector: "app-home",
	imports: [ButtonModule, RouterLink, TagModule],
	templateUrl: "./home.html"
})
export class Home {
	private readonly assetsService = inject(Assets);
	private readonly messageService = inject(MessageService);
	private readonly destroyRef = inject(DestroyRef);

	assets = this.assetsService.getAssets();
	email = computed(() => "pedagogista.insiemepercrescere@gmail.com");

	// Nav hides on scroll-down and reappears on scroll-up, like most
	// content-heavy marketing sites — always visible near the top (<80px)
	// regardless of direction, so it doesn't flicker while reading the hero.
	//
	// Animating `top` rather than `transform`: a `position: sticky` element
	// that also has `backdrop-blur` and an active `transform` hits a real
	// compositing bug in Chromium (confirmed via devtools — layout/
	// `getBoundingClientRect` stayed correct, but the painted frame didn't),
	// so the nav visually ended up glued to the bottom of the viewport.
	// Sliding it away via `top` (its own stick offset) avoids that combo.
	readonly navRef = viewChild<ElementRef<HTMLElement>>("navEl");
	readonly isNavHidden = signal(false);
	readonly navHeight = signal(0);
	private lastScrollY = 0;

	constructor() {
		afterNextRender(() => this.updateNavHeight());

		const onScroll = () => {
			const currentY = window.scrollY;
			this.isNavHidden.set(currentY >= 80 && currentY > this.lastScrollY);
			this.lastScrollY = currentY;
		};
		const onResize = () => this.updateNavHeight();

		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onResize);
		this.destroyRef.onDestroy(() => {
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", onResize);
		});
	}

	private updateNavHeight() {
		this.navHeight.set(this.navRef()?.nativeElement.offsetHeight ?? 0);
	}

	// Handled manually instead of leaving it to plain anchor navigation +
	// the router's anchorScrolling: a plain `<a href="#...">` click is a
	// same-document navigation, but Angular's Location service also reacts
	// to the resulting `hashchange` and re-triggers the router, which then
	// scrolled to the stored/top position before jumping to the anchor —
	// a double scroll that looked like a page refresh. `scrollIntoView`
	// here always starts from wherever the user currently is.
	scrollToSection(event: Event, id: string) {
		event.preventDefault();
		document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
		// A bare `#${id}` resolves against `<base href="/">` and silently drops
		// the `/home` path segment from the URL, so the current path is built
		// in explicitly instead.
		history.replaceState(null, "", `${location.pathname}${location.search}#${id}`);
	}

	onImageError(event: Event) {
		const target = event.target as HTMLImageElement;
		target.src = "images/fallback-profile-pic.png";
		target.onerror = null;
	}

	onViewCV() {
		if (!this.assets()?.cvUrl) return;

		const blob = base64ToBlob(this.assets()!.cvUrl);
		const url = URL.createObjectURL(blob);

		window.open(url, "_blank");
	}

	async onCopyEmail() {
		try {
			await copyTextToClipboard(this.email());
			this.messageService.add({
				severity: "success",
				summary: "Successo",
				detail: "Email copiata con successo",
				life: 3000
			});
		} catch {
			this.messageService.add({
				severity: "error",
				summary: "Errore",
				detail: "Impossibile copiare l'email",
				life: 3000
			});
		}
	}
}
