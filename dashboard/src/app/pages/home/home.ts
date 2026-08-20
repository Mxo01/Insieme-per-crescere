import { Component, inject, computed, signal, viewChild, effect } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TableModule } from "primeng/table";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { Menu, MenuModule } from "primeng/menu";
import { UIChart } from "primeng/chart";
import { MessageService, MenuItem, ConfirmationService } from "primeng/api";
import { Bookings } from "../../shared/services/bookings/bookings";
import { BookingDto } from "../../shared/services/bookings/bookings.model";
import { FormsModule } from "@angular/forms";
import { DialogModule } from "primeng/dialog";
import { DatePicker } from "primeng/datepicker";
import { Select } from "primeng/select";
import { timeOptions } from "src/app/shared/utils/constants";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { Dates } from "src/app/shared/services/dates/dates";
import {
	sendConfirmationEmail,
	getOneMonthFromNowRange,
	copyTextToClipboard
} from "src/app/shared/utils/utils";
import {
	getBookingsChartData,
	getMonthlyBookingCounts,
	getUpcomingConfirmedBookings,
	bookingsChartOptions,
	barValueLabelsPlugin
} from "./home.utils";

const AGENDA_PAGE_SIZE = 3;
type StatusFilter = "all" | "pending" | "accepted";

@Component({
	imports: [
		CommonModule,
		TableModule,
		ButtonModule,
		TagModule,
		MenuModule,
		UIChart,
		FormsModule,
		DialogModule,
		DatePicker,
		Select,
		ConfirmDialogModule
	],
	templateUrl: "./home.html"
})
export class Home {
	private readonly datesService = inject(Dates);
	private readonly bookingsService = inject(Bookings);
	private readonly messageService = inject(MessageService);
	private readonly confirmationService = inject(ConfirmationService);

	readonly menu = viewChild<Menu>("menu");

	readonly timeOptions = signal(timeOptions);
	readonly bookings = this.bookingsService.getBookings();

	readonly monthRange = computed(() => getOneMonthFromNowRange());

	readonly totalBookings = computed(() => this.bookings().length);
	readonly pendingBookings = computed(() => this.bookings().filter(b => !b.isAccepted).length);
	readonly acceptedBookings = computed(() => this.bookings().filter(b => b.isAccepted).length);

	// See home.utils.ts for how the chart's months/counts and the agenda's
	// filtered+sorted booking list are actually derived.
	readonly monthlyBookingCounts = computed(() => getMonthlyBookingCounts(this.bookings()));
	readonly chartData = computed(() => getBookingsChartData(this.monthlyBookingCounts()));
	readonly chartOptions = bookingsChartOptions;
	readonly chartPlugins = [barValueLabelsPlugin];
	readonly hasChartData = computed(() =>
		this.monthlyBookingCounts().some(month => month.count > 0)
	);

	// Table toolbar: a single search box (name/email) plus a status segment,
	// replacing the old per-column filter row.
	readonly searchQuery = signal("");
	readonly statusFilter = signal<StatusFilter>("all");
	readonly statusFilterOptions: { value: StatusFilter; label: string }[] = [
		{ value: "all", label: "Tutte" },
		{ value: "pending", label: "In attesa" },
		{ value: "accepted", label: "Accettate" }
	];

	readonly filteredBookings = computed(() => {
		const query = this.searchQuery().trim().toLowerCase();
		const status = this.statusFilter();

		return this.bookings().filter(booking => {
			if (status === "pending" && booking.isAccepted) return false;
			if (status === "accepted" && !booking.isAccepted) return false;
			if (!query) return true;

			return (
				booking.name.toLowerCase().includes(query) ||
				booking.lastName.toLowerCase().includes(query) ||
				booking.email.toLowerCase().includes(query)
			);
		});
	});

	// "Prossimi appuntamenti": shown 3-at-a-time.
	readonly agendaOpen = signal(true);
	readonly agendaPage = signal(0);

	readonly upcomingConfirmedBookings = computed(() =>
		getUpcomingConfirmedBookings(this.bookings())
	);

	readonly agendaTotalPages = computed(() =>
		Math.max(1, Math.ceil(this.upcomingConfirmedBookings().length / AGENDA_PAGE_SIZE))
	);

	readonly agendaPagedBookings = computed(() => {
		const page = this.agendaPage();
		return this.upcomingConfirmedBookings().slice(
			page * AGENDA_PAGE_SIZE,
			page * AGENDA_PAGE_SIZE + AGENDA_PAGE_SIZE
		);
	});

	readonly agendaPageIndexes = computed(() =>
		Array.from({ length: this.agendaTotalPages() }, (_, i) => i)
	);

	readonly selectedBooking = signal<BookingDto | null>(null);
	readonly selectedDate = signal<Date | null>(null);
	readonly selectedTime = signal<string | null>(null);

	readonly isNotesDialogVisible = signal(false);
	readonly isDateEditVisible = signal(false);
	readonly isDateEditLoading = signal(false);
	readonly isDeleteLoading = signal(false);
	readonly isAcceptLoading = signal(false);

	readonly menuItems = computed<MenuItem[]>(() => {
		const booking = this.selectedBooking();

		if (!booking) return [];

		return [
			{
				label: booking.isAccepted ? "Metti in attesa" : "Accetta",
				icon: booking.isAccepted ? "pi pi-clock" : "pi pi-check-circle",
				command: () => this.confirmAcceptBooking(booking)
			},
			{
				label: "Modifica data",
				icon: "pi pi-calendar",
				disabled: booking.isAccepted,
				command: () => this.openDateEdit(booking)
			},
			{
				label: "Visualizza note",
				icon: "pi pi-info-circle",
				disabled: !booking.notes,
				command: () => this.onViewNotes()
			},
			{
				label: "Elimina",
				icon: "pi pi-trash",
				iconClass: "text-red-500!",
				labelClass: "text-red-500",
				command: event => this.deleteBooking(event.originalEvent, booking)
			}
		];
	});

	constructor() {
		effect(async () => {
			const date = this.selectedDate();
			this.selectedTime.set(null);

			if (date) {
				const existingAvailability = await this.datesService.getAvailabilityByDate(date);
				this.timeOptions.update(options =>
					options.map(option => ({
						...option,
						isBooked: !!existingAvailability?.bookedTimeSlots.includes(option.value)
					}))
				);
			}
		});

		// Keep the agenda's current page in range as bookings are
		// accepted/put on hold/deleted around it.
		effect(() => {
			if (this.agendaPage() >= this.agendaTotalPages()) this.agendaPage.set(0);
		});
	}

	toggleAgenda() {
		this.agendaOpen.update(isOpen => !isOpen);
	}

	agendaGoToPage(page: number) {
		this.agendaPage.set(page);
	}

	agendaPrevPage() {
		this.agendaPage.update(page => Math.max(0, page - 1));
	}

	agendaNextPage() {
		this.agendaPage.update(page => Math.min(this.agendaTotalPages() - 1, page + 1));
	}

	openBookingNotes(booking: BookingDto) {
		this.selectedBooking.set(booking);
		this.onViewNotes();
	}

	onViewNotes() {
		this.isNotesDialogVisible.set(true);
	}

	onRowActionsClick(event: Event, booking: BookingDto) {
		this.selectedBooking.set(booking);
		this.menu()?.toggle(event);
	}

	onToggleFromDialog(booking: BookingDto) {
		this.isNotesDialogVisible.set(false);
		this.confirmAcceptBooking(booking);
	}

	async copyToClipboard(text: string) {
		try {
			await copyTextToClipboard(text);
			this.messageService.add({
				severity: "success",
				summary: "Copiato",
				detail: text,
				life: 2500
			});
		} catch {
			this.messageService.add({
				severity: "error",
				summary: "Errore",
				detail: "Impossibile copiare"
			});
		}
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

	private confirmAcceptBooking(booking: BookingDto) {
		if (booking.isAccepted) {
			this.toggleBookingStatus(booking);
			return;
		}

		if (!booking.id) return;

		this.confirmationService.confirm({
			header: "Conferma prenotazione",
			message: "Vuoi inviare una mail di conferma al cliente?",
			icon: "pi pi-envelope",
			acceptIcon: "pi pi-send",
			closable: true,
			acceptButtonProps: {
				label: "Sì, invia",
				rounded: true
			},
			rejectButtonProps: {
				label: "No, accetta senza inviare",
				severity: "secondary",
				rounded: true
			},
			accept: () => {
				sendConfirmationEmail(booking);
				this.toggleBookingStatus(booking);
			},
			reject: () => this.toggleBookingStatus(booking)
		});
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
					.deleteBooking(booking)
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
			.updateBookingDate(this.selectedBooking()!, this.selectedDate()!, this.selectedTime()!)
			.then(() => {
				this.messageService.add({
					severity: "success",
					summary: "Successo",
					detail: "Data della prenotazione modificata con successo"
				});

				this.isDateEditVisible.set(false);
			})
			.catch((error: Error) =>
				this.messageService.add({
					severity: "error",
					summary: "Errore",
					detail: error.message || "Impossibile modificare la data della prenotazione"
				})
			)
			.finally(() => this.isDateEditLoading.set(false));
	}
}
