import { inject, Injectable } from "@angular/core";
import { query, where, getDocs, addDoc, updateDoc, doc } from "@angular/fire/firestore";
import { Database } from "../database";
import { AvailableDateDto } from "./dates.model";
import { BookingDto } from "../bookings/bookings.model";

@Injectable({
	providedIn: "root"
})
export class Dates {
	private db = inject(Database);

	async saveAvailability(date: string, availableTimeSlots: string[]) {
		const q = query(this.db.datesCollection, where("date", "==", date));
		const querySnapshot = await getDocs(q);

		if (!querySnapshot.empty) {
			const existingDoc = querySnapshot.docs[0];
			const docRef = doc(this.db.datesCollection, existingDoc.id);
			return updateDoc(docRef, { availableTimeSlots });
		} else {
			return addDoc(this.db.datesCollection, {
				date,
				availableTimeSlots
			});
		}
	}

	async getAvailabilityByDate(
		date: string
	): Promise<(AvailableDateDto & { bookedTimeSlots: string[] }) | null> {
		const bookingsQuery = query(this.db.bookingsCollection, where("date", "==", date));
		const bookingsSnapshot = await getDocs(bookingsQuery);

		let bookedTimeSlots: string[] = [];

		if (!bookingsSnapshot.empty) {
			bookedTimeSlots = bookingsSnapshot.docs
				.map(doc => doc.data() as BookingDto)
				.map(({ time }) => time);
		}

		const datesQuery = query(this.db.datesCollection, where("date", "==", date));
		const querySnapshot = await getDocs(datesQuery);

		if (!querySnapshot.empty) {
			const data = querySnapshot.docs[0].data() as AvailableDateDto;
			data.availableTimeSlots.sort();
			return { ...data, id: querySnapshot.docs[0].id, bookedTimeSlots };
		}

		return null;
	}
}
