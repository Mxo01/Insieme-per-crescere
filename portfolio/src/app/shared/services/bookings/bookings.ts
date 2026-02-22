import { inject, Injectable } from "@angular/core";
import { doc, getDocs, query, runTransaction, where } from "@angular/fire/firestore";
import { Database } from "../database";
import { BookingDto } from "./bookings.model";

@Injectable({
	providedIn: "root"
})
export class Bookings {
	private db = inject(Database);

	async addBooking(booking: BookingDto) {
		const { date, time } = booking;

		try {
			await runTransaction(this.db.firestore, async transaction => {
				const bookingsQuery = query(
					this.db.bookingsCollection,
					where("date", "==", date),
					where("time", "==", time)
				);

				const snapshot = await getDocs(bookingsQuery);

				if (!snapshot.empty) {
					throw new Error("Lo slot orario è già stato occupato da un altro utente.");
				}

				const newBookingRef = doc(this.db.bookingsCollection);

				transaction.set(newBookingRef, booking);
			});
		} catch (error) {
			throw new Error("Errore durante la prenotazione. Riprova più tardi.");
		}
	}
}
