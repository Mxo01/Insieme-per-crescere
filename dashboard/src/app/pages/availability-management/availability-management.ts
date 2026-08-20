import { Component, inject, signal, effect, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DatePicker, DatePickerMonthChangeEvent } from "primeng/datepicker";
import { MessageService } from "primeng/api";
import { Dates } from "../../shared/services/dates/dates";
import { timeOptions } from "../../shared/utils/constants";
import { TimeOption } from "src/app/shared/models/time-option.model";
import { getOneMonthFromNowRange } from "src/app/shared/utils/utils";

@Component({
	selector: "app-availability-management",
	imports: [CommonModule, FormsModule, DatePicker],
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

	// The datepicker's prev/next buttons ignore `minDate` — they only gray
	// out individual days, so without this the admin could still page back
	// into months that are entirely in the past. Tracked via
	// `onMonthChange` and compared against `monthRange().start`'s month.
	readonly viewedMonth = signal({
		month: new Date().getMonth() + 1,
		year: new Date().getFullYear()
	});

	readonly isPrevMonthDisabled = computed(() => {
		const earliest = this.monthRange().start;
		const { month, year } = this.viewedMonth();
		return (
			year < earliest.getFullYear() ||
			(year === earliest.getFullYear() && month <= earliest.getMonth() + 1)
		);
	});

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

	onMonthChange(event: DatePickerMonthChangeEvent) {
		if (event.month === undefined || event.year === undefined) return;
		this.viewedMonth.set({ month: event.month, year: event.year });
	}

	onToggleTimeSlot(value: string) {
		this.selectedTimeSlots.update(slots =>
			slots.includes(value) ? slots.filter(slot => slot !== value) : [...slots, value]
		);
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
