import { Component, inject, signal, effect, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DatePicker } from "primeng/datepicker";
import { MultiSelect } from "primeng/multiselect";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { MessageService } from "primeng/api";
import { Dates } from "../../shared/services/dates/dates";
import { timeOptions } from "../../shared/utils/constants";
import { TimeOption } from "src/app/shared/models/time-option.model";
import { getOneMonthFromNowRange } from "src/app/shared/utils/utils";

@Component({
	selector: "app-availability-management",
	imports: [CommonModule, FormsModule, DatePicker, MultiSelect, ButtonModule, CardModule],
	templateUrl: "./availability-management.html",
	styleUrl: "./availability-management.scss"
})
export class AvailabilityManagement {
	private readonly datesService = inject(Dates);
	private readonly messageService = inject(MessageService);

	readonly timeOptions = signal<TimeOption[]>(timeOptions);

	readonly selectedDate = signal<Date | null>(null);
	readonly selectedTimeSlots = signal<string[]>([]);

	readonly isSaving = signal(false);
	readonly isFetching = signal(false);

	readonly monthRange = computed(() => getOneMonthFromNowRange());

	constructor() {
		effect(async () => {
			const date = this.selectedDate();
			this.selectedTimeSlots.set([]);

			if (date) {
				this.isFetching.set(true);

				const existingAvailability = await this.datesService.getAvailabilityByDate(date);

				this.isFetching.set(false);

				this.selectedTimeSlots.set(existingAvailability?.availableTimeSlots ?? []);
				this.timeOptions.update(options =>
					options.map(option => ({
						...option,
						isBooked: existingAvailability?.bookedTimeSlots.includes(option.value)
					}))
				);
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
			.saveAvailability(this.selectedDate()!, this.selectedTimeSlots())
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
