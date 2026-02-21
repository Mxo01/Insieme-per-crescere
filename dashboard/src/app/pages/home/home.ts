import { Component, inject, computed, signal, viewChild, ElementRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TableModule } from "primeng/table";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { Menu, MenuModule } from "primeng/menu";
import { ToastModule } from "primeng/toast";
import { MessageService, MenuItem, ConfirmationService } from "primeng/api";
import { Bookings } from "../../shared/services/bookings/bookings";
import { BookingDto } from "../../shared/services/bookings/bookings.model";
import { FormsModule } from "@angular/forms";
import { DialogModule } from "primeng/dialog";
import { DatePicker } from "primeng/datepicker";
import { Select } from "primeng/select";
import { timeOptions } from "src/app/shared/utils/constants";
import { ConfirmDialogModule } from "primeng/confirmdialog";

@Component({
	imports: [
		CommonModule,
		TableModule,
		CardModule,
		ButtonModule,
		TagModule,
		MenuModule,
		ToastModule,
		FormsModule,
		DialogModule,
		DatePicker,
		Select,
		ConfirmDialogModule
	],
	providers: [MessageService],
	templateUrl: "./home.html"
})
export class Home {
	private readonly bookingsService = inject(Bookings);
	private readonly messageService = inject(MessageService);
	private readonly confirmationService = inject(ConfirmationService);

	menu = viewChild<Menu>("menu");

	timeOptions = signal(timeOptions);
	bookings = this.bookingsService.getBookings();

	totalBookings = computed(() => this.bookings().length);
	pendingBookings = computed(() => this.bookings().filter(b => !b.isAccepted).length);
	acceptedBookings = computed(() => this.bookings().filter(b => b.isAccepted).length);

	selectedBooking = signal<BookingDto | null>(null);
	selectedDate = signal<Date | null>(null);
	selectedTime = signal<string | null>(null);

	isNotesDialogVisible = signal(false);
	isDateEditVisible = signal(false);
	isDateEditLoading = signal(false);
	isDeleteLoading = signal(false);

	menuItems = computed<MenuItem[]>(() => {
		const booking = this.selectedBooking();

		if (!booking) return [];

		return [
			{
				label: booking.isAccepted ? "Metti in attesa" : "Accetta",
				icon: booking.isAccepted ? "pi pi-clock" : "pi pi-check-circle",
				command: () => this.toggleBookingStatus(booking)
			},
			{
				label: "Elimina",
				icon: "pi pi-trash",
				command: event => this.deleteBooking(event.originalEvent, booking)
			},
			{
				label: "Modifica data",
				icon: "pi pi-calendar",
				command: () => this.openDateEdit(booking)
			}
		];
	});

	onViewNotes(booking: BookingDto) {
		this.selectedBooking.set(booking);
		this.isNotesDialogVisible.set(true);
	}

	onRowActionsClick(event: Event, booking: BookingDto) {
		this.selectedBooking.set(booking);
		this.menu()?.toggle(event);
	}

	private toggleBookingStatus(booking: BookingDto) {
		if (!booking.id) return;

		this.bookingsService
			.toggleBookingStatus(booking)
			.then(() =>
				this.messageService.add({
					severity: "success",
					summary: "Successo",
					detail: booking.isAccepted ? "Prenotazione messa in attesa" : "Prenotazione accettata"
				})
			)
			.catch(() =>
				this.messageService.add({
					severity: "error",
					summary: "Errore",
					detail: "Impossibile cambiare lo stato della prenotazione"
				})
			);
	}

	private deleteBooking(event: Event | undefined, booking: BookingDto) {
		if (!booking.id || !event) return;

		this.confirmationService.confirm({
			target: event.currentTarget as EventTarget,
			header: "Attenzione!",
			message: "Sei sicuro di voler eliminare la prenotazione?",
			icon: "pi pi-info-circle",
			rejectButtonProps: {
				label: "Annulla",
				severity: "secondary",
				rounded: true
			},
			acceptButtonProps: {
				label: "Elimina",
				rounded: true,
				severity: "danger"
			},
			accept: () => {
				this.isDeleteLoading.set(true);

				this.bookingsService
					.deleteBooking(booking.id!)
					.then(() =>
						this.messageService.add({
							severity: "success",
							summary: "Successo",
							detail: "Prenotazione eliminata"
						})
					)
					.catch(() =>
						this.messageService.add({
							severity: "error",
							summary: "Errore",
							detail: "Impossibile eliminare"
						})
					)
					.finally(() => this.isDeleteLoading.set(false));
			}
		});
	}

	private openDateEdit(booking: BookingDto) {
		this.selectedBooking.set(booking);

		const [day, month, year] = booking.date.split("/");

		this.selectedDate.set(
			new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
		);
		this.selectedTime.set(booking.time);
		this.isDateEditVisible.set(true);
	}

	onEditDateDialogHide() {
		this.selectedBooking.set(null);
		this.selectedDate.set(null);
		this.selectedTime.set(null);
	}

	onSaveDate() {
		if (!this.selectedBooking()?.id || !this.selectedDate() || !this.selectedTime()) return;

		this.isDateEditLoading.set(true);

		this.bookingsService
			.updateBookingDate(
				this.selectedBooking()!.id!,
				this.selectedDate()!.toLocaleDateString(),
				this.selectedTime()!
			)
			.then(() => {
				this.messageService.add({
					severity: "success",
					summary: "Successo",
					detail: "Data della prenotazione modificata con successo"
				});

				this.isDateEditVisible.set(false);
			})
			.catch(() =>
				this.messageService.add({
					severity: "error",
					summary: "Errore",
					detail: "Impossibile modificare la data	della prenotazione"
				})
			)
			.finally(() => this.isDateEditLoading.set(false));
	}
}
