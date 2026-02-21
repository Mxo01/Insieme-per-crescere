import { Component, inject, signal, effect } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DatePicker } from "primeng/datepicker";
import { MultiSelect } from "primeng/multiselect";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { ToastModule } from "primeng/toast";
import { MessageService } from "primeng/api";
import { Dates } from "../../shared/services/dates/dates";
import { timeOptions } from "../../shared/utils/constants";

@Component({
	selector: "app-availability-management",
	imports: [
		CommonModule,
		FormsModule,
		DatePicker,
		MultiSelect,
		ButtonModule,
		CardModule,
		ToastModule
	],
	providers: [MessageService],
	templateUrl: "./availability-management.html",
	styleUrl: "./availability-management.scss"
})
export class AvailabilityManagement {
	private readonly datesService = inject(Dates);
	private readonly messageService = inject(MessageService);

	timeOptions = signal(timeOptions);

	selectedDate = signal<Date | null>(null);
	selectedTimeSlots = signal<string[]>([]);

	isSaving = signal(false);

	constructor() {
		effect(async () => {
			const date = this.selectedDate();
			this.selectedTimeSlots.set([]);

			if (date) {
				const existingAvailability = await this.datesService.getAvailabilityByDate(
					date.toLocaleDateString()
				);
				this.selectedTimeSlots.set(existingAvailability?.availableTimeSlots ?? []);
			}
		});
	}

	onSave() {
		if (!this.selectedDate()) {
			this.messageService.add({
				severity: "warn",
				summary: "Attenzione",
				detail: "Seleziona prima una data"
			});

			return;
		}

		this.isSaving.set(true);

		this.datesService
			.saveAvailability(this.selectedDate()!.toLocaleDateString(), this.selectedTimeSlots())
			.then(() =>
				this.messageService.add({
					severity: "success",
					summary: "Successo",
					detail: "Disponibilità salvata correttamente"
				})
			)
			.catch(() =>
				this.messageService.add({
					severity: "error",
					summary: "Errore",
					detail: "Impossibile salvare la disponibilità"
				})
			)
			.finally(() => this.isSaving.set(false));
	}
}
