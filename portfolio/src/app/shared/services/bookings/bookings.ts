import { inject, Injectable } from "@angular/core";
import { addDoc } from "@angular/fire/firestore";
import { Database } from "../database";
import { BookingDto } from "./bookings.model";

@Injectable({
	providedIn: "root"
})
export class Bookings {
	private db = inject(Database);

	async addBooking(booking: BookingDto) {
		await addDoc(this.db.bookingsCollection, booking);
	}
}
