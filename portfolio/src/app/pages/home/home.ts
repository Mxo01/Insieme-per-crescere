import { Component, computed, inject } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { RouterLink } from "@angular/router";
import { TagModule } from "primeng/tag";
import { Assets } from "src/app/shared/services/assets/assets";
import { base64ToBlob } from "src/app/shared/utils/utils";
import { MessageService } from "primeng/api";

@Component({
	selector: "app-home",
	imports: [ButtonModule, RouterLink, TagModule],
	templateUrl: "./home.html"
})
export class Home {
	private readonly assetsService = inject(Assets);
	private readonly messageService = inject(MessageService);

	assets = this.assetsService.getAssets();
	email = computed(() => "pedagogista.insiemepercrescere@gmail.com");

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

	onCopyEmail() {
		navigator?.clipboard
			?.writeText(this.email())
			.then(() => {
				this.messageService.add({
					severity: "success",
					summary: "Successo",
					detail: "Email copiata con successo",
					life: 3000
				});
			})
			.catch(() => {
				this.messageService.add({
					severity: "error",
					summary: "Errore",
					detail: "Impossibile copiare l'email",
					life: 3000
				});
			});
	}
}
