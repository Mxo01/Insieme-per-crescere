import { inject, Injectable } from "@angular/core";
import { collectionData, doc, updateDoc, deleteDoc, getDocs, query, where } from "@angular/fire/firestore";
import { Observable } from "rxjs";
import { toSignal } from "@angular/core/rxjs-interop";
import { Database } from "../database";
import { BookingDto } from "./bookings.model";
import { AvailableDateDto } from "../dates/dates.model";

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
		await updateDoc(docRef, { isAccepted: !booking.isAccepted });
	}

	async deleteBooking(bookingId: string) {
		const docRef = doc(this.db.bookingsCollection, bookingId);
		await deleteDoc(docRef);
	}

	async updateBookingDate(bookingId: string, date: string, time: string) {
		const docRef = doc(this.db.bookingsCollection, bookingId);
		
		const q = query(this.db.datesCollection, where("date", "==", date));
		const querySnapshot = await getDocs(q);

		if (!querySnapshot.empty) {
			const docId = querySnapshot.docs[0].id;
			const existingDoc = querySnapshot.docs[0].data() as AvailableDateDto;
			const availableTimeSlots = existingDoc.availableTimeSlots.filter(slot => slot !== time);
			
			const docRef = doc(this.db.datesCollection, docId);
			await updateDoc(docRef, { availableTimeSlots });
		}
		
		await updateDoc(docRef, { date, time });
	}
}
