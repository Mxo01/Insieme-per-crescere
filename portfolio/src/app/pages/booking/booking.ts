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
		RouterLink
	],
	providers: [MessageService],
	templateUrl: "./booking.html",
	styleUrl: "./booking.scss",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class Booking {
	private readonly fb = inject(FormBuilder);
	private readonly messageService = inject(MessageService);

	timeSection = viewChild<ElementRef<HTMLDivElement>>("timeSection");
	detailsSection = viewChild<ElementRef<HTMLDivElement>>("detailsSection");

	readonly selectedDate = signal<Date | null>(null);
	readonly selectedTime = signal<string | null>(null);

	readonly availableTimes = computed(() => ["09:00", "10:00", "11:00", "14:00", "15:00", "17:00"]);

	readonly minDate = new Date();

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

	onConfirm() {
		if (this.bookingForm.invalid) {
			this.messageService.add({
				severity: "error",
				summary: "Errore",
				detail: "Compila tutti i campi obbligatori correttamente."
			});
			return;
		}

		this.messageService.add({
			severity: "success",
			summary: "Prenotazione confermata",
			detail: "La tua consulenza è stata prenotata con successo!"
		});

		this.resetBooking();
	}

	onCancel() {
		this.resetBooking();
	}

	private resetBooking() {
		this.selectedDate.set(null);
		this.selectedTime.set(null);
		this.bookingForm.reset();
	}
}
