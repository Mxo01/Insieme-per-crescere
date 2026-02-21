import { Component, inject } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { RouterLink } from "@angular/router";
import { TagModule } from "primeng/tag";
import { Assets } from "src/app/shared/services/assets/assets";
import { base64ToBlob } from "src/app/shared/utils/utils";

@Component({
	selector: "app-home",
	imports: [ButtonModule, RouterLink, TagModule],
	templateUrl: "./home.html"
})
export class Home {
	private assetsService = inject(Assets);

	assets = this.assetsService.getAssets();

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
}
