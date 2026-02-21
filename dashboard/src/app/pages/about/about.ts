import { Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Card } from "primeng/card";
import { FileSelectEvent, FileUpload } from "primeng/fileupload";
import { Toast } from "primeng/toast";
import { MessageService } from "primeng/api";
import { Assets } from "../../shared/services/assets/assets";
import { convertFileToBase64 } from "src/app/shared/utils/utils";
import { Button } from "primeng/button";

@Component({
	selector: "app-about",
	imports: [CommonModule, Card, FileUpload, Toast, Button],
	providers: [MessageService],
	templateUrl: "./about.html",
	styleUrl: "./about.scss"
})
export class About {
	private readonly assetsService = inject(Assets);
	private readonly messageService = inject(MessageService);

	assets = this.assetsService.getAssets();

	public isCvLoading = signal(false);
	public isPicLoading = signal(false);

	async onUploadCv(event: FileSelectEvent) {
		const file = event.files[0];
		if (!file) return;

		const base64 = await convertFileToBase64(file);
		this.isCvLoading.set(true);

		this.assetsService
			.updateAssets({ cvUrl: base64 })
			.then(() => {
				this.messageService.add({
					severity: "success",
					summary: "Success",
					detail: "CV aggiornato con successo"
				});
			})
			.catch(() => {
				this.messageService.add({
					severity: "error",
					summary: "Error",
					detail: "Errore durante l'aggiornamento del CV"
				});
			})
			.finally(() => {
				this.isCvLoading.set(false);
			});
	}

	async onRemoveCv() {
		this.isCvLoading.set(true);

		this.assetsService
			.updateAssets({ cvUrl: "" })
			.then(() => {
				this.messageService.add({
					severity: "success",
					summary: "Success",
					detail: "CV rimosso con successo"
				});
			})
			.catch(() => {
				this.messageService.add({
					severity: "error",
					summary: "Error",
					detail: "Errore durante la rimozione del CV"
				});
			})
			.finally(() => {
				this.isCvLoading.set(false);
			});
	}
}
