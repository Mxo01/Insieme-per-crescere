import {
	Component,
	ChangeDetectionStrategy,
	inject,
	signal,
	computed,
	viewChild,
	ElementRef,
	effect,
	OnInit,
	DestroyRef
} from "@angular/core";
import { DatePicker, DatePickerMonthChangeEvent } from "primeng/datepicker";
import { ButtonModule } from "primeng/button";
import { InputText } from "primeng/inputtext";
import { Textarea } from "primeng/textarea";
import { MessageService } from "primeng/api";
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { Dates } from "src/app/shared/services/dates/dates";
import { Bookings } from "src/app/shared/services/bookings/bookings";
import { BookingDto } from "src/app/shared/services/bookings/bookings.model";
import { AuthService } from "src/app/shared/services/auth/auth";
import { Tag } from "primeng/tag";
import { formatDateToISODateString, getOneMonthFromNowRange } from "src/app/shared/utils/utils";
import { ALL_TIME_SLOTS } from "src/app/shared/utils/constants";

type VerificationState = "idle" | "confirming" | "awaiting-email";

@Component({
	selector: "app-booking",
	imports: [
		DatePicker,
		ButtonModule,
		InputText,
		Textarea,
		ReactiveFormsModule,
		FormsModule,
		RouterLink,
		Tag
	],
	templateUrl: "./booking.html",
	styleUrl: "./booking.scss",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class Booking implements OnInit {
	private readonly datesService = inject(Dates);
	private readonly bookingsService = inject(Bookings);
	private readonly authService = inject(AuthService);
	private readonly messageService = inject(MessageService);
	private readonly destroyRef = inject(DestroyRef);

	private readonly fb = inject(FormBuilder);

	readonly isSubmitting = signal<boolean>(false);

	// Anti-flooding: before writing to Firestore, whoever is booking must
	// prove they actually own the email they entered, by clicking a link
	// Firebase Auth sends them (no cost, no Cloud Function).
	readonly verificationState = signal<VerificationState>("idle");
	readonly pendingEmail = signal<string | null>(null);
	readonly resendCooldown = signal(0);

	timeSection = viewChild<ElementRef<HTMLDivElement>>("timeSection");
	detailsSection = viewChild<ElementRef<HTMLDivElement>>("detailsSection");

	readonly selectedDate = signal<Date | null>(null);
	readonly selectedTime = signal<string | null>(null);
	readonly monthRange = computed(() => getOneMonthFromNowRange());
	readonly allTimeSlots = ALL_TIME_SLOTS;

	// The datepicker's prev/next buttons ignore `minDate`/`maxDate` — they
	// only gray out individual days, so without this the user could still
	// page back into months that are entirely in the past. Tracked via
	// `onMonthChange` and compared against `monthRange().start`'s month
	// (tomorrow) so the button locks as soon as no earlier month has any
	// selectable day left.
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

	private readonly availableDates = this.datesService.getAvailableDates();

	private readonly selectedAvailableDate = computed(() => {
		const selectedDate = this.selectedDate()?.toLocaleDateString();
		return this.availableDates().find(day => day.date === selectedDate);
	});

	readonly availableTimeSlots = computed(() => {
		const availableTimeSlots = this.selectedAvailableDate()?.availableTimeSlots.toSorted();
		return !this.selectedDate() || !availableTimeSlots ? [] : availableTimeSlots;
	});

	readonly disabledDates = computed(() => {
		const availableDates = this.availableDates().map(({ date }) => date);
		const disabledDates: Date[] = [];

		const start = new Date(this.monthRange().start);
		const end = new Date(this.monthRange().end);

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

	async ngOnInit() {
		if (!this.authService.isReturningFromEmailLink) return;

		this.verificationState.set("confirming");

		const confirmedEmail = await this.authService.completeSignInFromEmailLink();

		// Clean up the URL from the link's query params (mode, oobCode, ...)
		// regardless of the outcome, so a refresh doesn't retry the sign-in.
		window.history.replaceState({}, "", window.location.pathname);

		if (!confirmedEmail) {
			this.verificationState.set("idle");
			this.messageService.add({
				severity: "error",
				summary: "Link non valido",
				detail:
					"Il link di conferma non è valido, è scaduto, oppure è stato aperto su un altro dispositivo. Ripeti la prenotazione.",
				life: 10000
			});
			return;
		}

		const pending = this.bookingsService.getPendingBooking();

		if (pending && pending.booking.email === confirmedEmail) {
			await this.completeBooking(pending.booking, pending.dateDocId);
			this.bookingsService.clearPendingBooking();
		} else {
			this.verificationState.set("idle");
			this.messageService.add({
				severity: "success",
				summary: "Email confermata",
				detail: "La tua email è stata verificata. Completa di nuovo la prenotazione qui sotto.",
				life: 10000
			});
		}
	}

	onDateChange(date: Date) {
		this.selectedDate.set(date);
		this.selectedTime.set(null);
		this.bookingForm.reset();
		this.timeSection()?.nativeElement.scrollIntoView({ behavior: "smooth", block: "start" });
	}

	onMonthChange(event: DatePickerMonthChangeEvent) {
		if (event.month === undefined || event.year === undefined) return;
		this.viewedMonth.set({ month: event.month, year: event.year });
	}

	onTimeSelect(time: string) {
		if (!this.availableTimeSlots().includes(time)) return;
		this.selectedTime.set(time);
	}

	onConfirmBooking() {
		const dateDocId = this.selectedAvailableDate()?.id;

		if (this.bookingForm.invalid || !this.selectedDate() || !this.selectedTime() || !dateDocId) {
			this.messageService.add({
				severity: "error",
				summary: "Errore",
				detail: "Compila tutti i campi obbligatori correttamente."
			});

			return;
		}

		const booking: BookingDto = {
			name: this.bookingForm.value.name!,
			lastName: this.bookingForm.value.lastName!,
			email: this.bookingForm.value.email!.trim().toLowerCase(),
			phone: this.bookingForm.value.phone!,
			notes: this.bookingForm.value.notes,
			date: formatDateToISODateString(this.selectedDate()!),
			time: this.selectedTime()!,
			isAccepted: false
		};

		if (this.authService.isVerifiedFor(booking.email)) {
			this.isSubmitting.set(true);
			this.completeBooking(booking, dateDocId).finally(() => this.isSubmitting.set(false));
			return;
		}

		this.isSubmitting.set(true);

		this.bookingsService.savePendingBooking(booking, dateDocId);

		this.authService
			.sendVerificationLink(booking.email)
			.then(() => {
				this.pendingEmail.set(booking.email);
				this.verificationState.set("awaiting-email");
				this.startResendCooldown();
			})
			.catch(() => {
				this.bookingsService.clearPendingBooking();
				this.messageService.add({
					severity: "error",
					summary: "Errore",
					detail: "Impossibile inviare l'email di conferma. Riprova più tardi."
				});
			})
			.finally(() => this.isSubmitting.set(false));
	}

	onResendVerificationLink() {
		const email = this.pendingEmail();
		if (!email || this.resendCooldown() > 0) return;

		this.authService
			.sendVerificationLink(email)
			.then(() => {
				this.messageService.add({
					severity: "success",
					summary: "Email inviata",
					detail: "Ti abbiamo inviato di nuovo il link di conferma."
				});
				this.startResendCooldown();
			})
			.catch(() => {
				this.messageService.add({
					severity: "error",
					summary: "Errore",
					detail: "Impossibile inviare l'email di conferma. Riprova più tardi."
				});
			});
	}

	onCancelVerification() {
		this.bookingsService.clearPendingBooking();
		this.pendingEmail.set(null);
		this.verificationState.set("idle");
	}

	onCancelBooking() {
		this.resetBooking();
	}

	private async completeBooking(booking: BookingDto, dateDocId: string) {
		try {
			await this.bookingsService.addBooking(booking, dateDocId);

			this.messageService.add({
				severity: "success",
				summary: "Prenotazione effettuata",
				detail:
					"La tua prenotazione è stata inoltrata! Riceverai una mail di conferma appena possibile.",
				life: 10000
			});

			this.verificationState.set("idle");
			this.pendingEmail.set(null);
			this.resetBooking();
		} catch (error) {
			this.messageService.add({
				severity: "error",
				summary: "Errore",
				detail: (error as Error).message
			});
		}
	}

	private startResendCooldown(seconds = 30) {
		this.resendCooldown.set(seconds);

		const intervalId = setInterval(() => {
			this.resendCooldown.update(remaining => {
				if (remaining <= 1) {
					clearInterval(intervalId);
					return 0;
				}
				return remaining - 1;
			});
		}, 1000);

		this.destroyRef.onDestroy(() => clearInterval(intervalId));
	}

	private resetBooking() {
		this.selectedDate.set(null);
		this.selectedTime.set(null);
		this.bookingForm.reset();
	}
}
