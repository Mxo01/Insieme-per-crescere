import {
	Component,
	ChangeDetectionStrategy,
	inject,
	signal,
	computed,
	viewChild,
	ElementRef,
	effect
} from "@angular/core";
import { DatePicker } from "primeng/datepicker";
import { ButtonModule } from "primeng/button";
import { InputText } from "primeng/inputtext";
import { Textarea } from "primeng/textarea";
import { Toast } from "primeng/toast";
import { MessageService } from "primeng/api";
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { Dates } from "src/app/shared/services/dates/dates";
import { Bookings } from "src/app/shared/services/bookings/bookings";
import { BookingDto } from "src/app/shared/services/bookings/bookings.model";
import { Tag } from "primeng/tag";

@Component({
	selector: "app-booking",
	imports: [
		DatePicker,
		ButtonModule,
		InputText,
		Textarea,
		Toast,
		ReactiveFormsModule,
		FormsModule,
		RouterLink,
		Tag
	],
	providers: [MessageService],
	templateUrl: "./booking.html",
	styleUrl: "./booking.scss",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class Booking {
	private readonly datesService = inject(Dates);
	private readonly bookingsService = inject(Bookings);
	private readonly messageService = inject(MessageService);

	private readonly fb = inject(FormBuilder);

	readonly isSubmitting = signal<boolean>(false);

	timeSection = viewChild<ElementRef<HTMLDivElement>>("timeSection");
	detailsSection = viewChild<ElementRef<HTMLDivElement>>("detailsSection");

	readonly selectedDate = signal<Date | null>(null);
	readonly selectedTime = signal<string | null>(null);

	readonly minDate = computed(() => {
		const date = new Date();
		date.setHours(0, 0, 0, 0);
		return date;
	});
	readonly maxDate = computed(() => {
		const date = new Date();
		date.setHours(23, 59, 59, 999);
		date.setMonth(date.getMonth() + 1);
		return date;
	});

	private readonly availableDates = this.datesService.getAvailableDates();

	readonly availableTimeSlots = computed(() => {
		const selectedDate = this.selectedDate()?.toLocaleDateString();
		const availableTimeSlots = this.availableDates()
			.find(day => day.date === selectedDate)
			?.availableTimeSlots.toSorted();
		return !selectedDate || !availableTimeSlots ? [] : availableTimeSlots;
	});

	readonly disabledDates = computed(() => {
		const availableDates = this.availableDates().map(({ date }) => date);
		const disabledDates: Date[] = [];

		const start = new Date(this.minDate());
		const end = new Date(this.maxDate());

		for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
			const dateStr = day.toLocaleDateString();
			if (!availableDates.includes(dateStr)) disabledDates.push(new Date(day));
		}

		return disabledDates;
	});

	readonly bookingForm = this.fb.nonNullable.group({
		name: ["", Validators.required],
		lastName: ["", Validators.required],
		email: ["", [Validators.required, Validators.email]],
		phone: ["", [Validators.required, Validators.pattern(/^(?:(?:0039|39)?(3\d{9}|0\d{5,10}))$/)]],
		notes: [""]
	});

	constructor() {
		effect(() => {
			if (this.selectedTime()) {
				this.detailsSection()?.nativeElement.scrollIntoView({ behavior: "smooth", block: "start" });
			}
		});
	}

	onDateChange(date: Date) {
		this.selectedDate.set(date);
		this.selectedTime.set(null);
		this.bookingForm.reset();
		this.timeSection()?.nativeElement.scrollIntoView({ behavior: "smooth", block: "start" });
	}

	onTimeSelect(time: string) {
		this.selectedTime.set(time);
	}

	onConfirmBooking() {
		if (this.bookingForm.invalid || !this.selectedDate() || !this.selectedTime()) {
			this.messageService.add({
				severity: "error",
				summary: "Errore",
				detail: "Compila tutti i campi obbligatori correttamente."
			});

			return;
		}

		this.isSubmitting.set(true);

		const booking: BookingDto = {
			name: this.bookingForm.value.name!,
			lastName: this.bookingForm.value.lastName!,
			email: this.bookingForm.value.email!,
			phone: this.bookingForm.value.phone!,
			notes: this.bookingForm.value.notes,
			date: this.selectedDate()!.toLocaleDateString(),
			time: this.selectedTime()!,
			isAccepted: false
		};

		this.bookingsService
			.addBooking(booking)
			.then(() => {
				this.messageService.add({
					severity: "success",
					summary: "Prenotazione effettuata",
					detail:
						"La tua prenotazione è stata inoltrata! Riceverai una mail di conferma appena possibile.",
					life: 10000
				});

				this.resetBooking();
			})
			.catch(() => {
				this.messageService.add({
					severity: "error",
					summary: "Errore",
					detail: "Errore durante la prenotazione. Riprova più tardi."
				});
			})
			.finally(() => this.isSubmitting.set(false));
	}

	onCancelBooking() {
		this.resetBooking();
	}

	private resetBooking() {
		this.selectedDate.set(null);
		this.selectedTime.set(null);
		this.bookingForm.reset();
	}
}
