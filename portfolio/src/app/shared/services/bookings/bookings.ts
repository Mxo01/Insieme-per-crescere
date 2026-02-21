import { inject, Injectable } from "@angular/core";
import { addDoc, doc, getDocs, query, updateDoc, where } from "@angular/fire/firestore";
import { Database } from "../database";
import { BookingDto } from "./bookings.model";
import { AvailableDateDto } from "../dates/dates.model";

@Injectable({
	providedIn: "root"
})
export class Bookings {
	private db = inject(Database);

	async addBooking(booking: BookingDto) {
		const { date, time } = booking;
		const q = query(this.db.datesCollection, where("date", "==", date));
		const querySnapshot = await getDocs(q);

		if (!querySnapshot.empty) {
			const docId = querySnapshot.docs[0].id;
			const existingDoc = querySnapshot.docs[0].data() as AvailableDateDto;
			const availableTimeSlots = existingDoc.availableTimeSlots.filter(slot => slot !== time);
			
			const docRef = doc(this.db.datesCollection, docId);
			await updateDoc(docRef, { availableTimeSlots });
		}

		await addDoc(this.db.bookingsCollection, booking);
	}
}
