import { inject, Injectable } from "@angular/core";
import { collectionData, doc, updateDoc, deleteDoc } from "@angular/fire/firestore";
import { Observable } from "rxjs";
import { toSignal } from "@angular/core/rxjs-interop";
import { Database } from "../database";
import { BookingDto } from "./bookings.model";

@Injectable({
	providedIn: "root"
})
export class Bookings {
	private db = inject(Database);

	getBookings() {
		const bookings$ = collectionData(this.db.bookingsCollection, { idField: "id" }) as Observable<
			BookingDto[]
		>;
		
		return toSignal(bookings$, { initialValue: [] });
	}

	async toggleBookingStatus(booking: BookingDto) {
		const docRef = doc(this.db.bookingsCollection, booking.id);
		return updateDoc(docRef, { isAccepted: !booking.isAccepted });
	}

	async deleteBooking(bookingId: string) {
		const docRef = doc(this.db.bookingsCollection, bookingId);
		return deleteDoc(docRef);
	}

	async updateBookingDate(bookingId: string, date: string, time: string) {
		const docRef = doc(this.db.bookingsCollection, bookingId);
		return updateDoc(docRef, { date, time });
	}
}
