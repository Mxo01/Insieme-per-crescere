import { inject, Injectable } from "@angular/core";
import { query, where, getDocs, addDoc, updateDoc, doc, deleteDoc } from "@angular/fire/firestore";
import { Database } from "../database";
import { AvailableDateDto } from "./dates.model";
import { BookingDto } from "../bookings/bookings.model";

@Injectable({
	providedIn: "root"
})
export class Dates {
	private db = inject(Database);

	async saveAvailability(date: string, availableTimeSlots: string[]) {
		await this.cleanupOldDates();

		const q = query(this.db.datesCollection, where("date", "==", date));
		const querySnapshot = await getDocs(q);

		if (!querySnapshot.empty) {
			const noOneTimeSlotsSelected = !availableTimeSlots?.length;
			const existingDoc = querySnapshot.docs[0];
			const docRef = doc(this.db.datesCollection, existingDoc.id);
			return noOneTimeSlotsSelected ? deleteDoc(docRef) : updateDoc(docRef, { availableTimeSlots });
		} else {
			return addDoc(this.db.datesCollection, {
				date,
				availableTimeSlots
			});
		}
	}

	private async cleanupOldDates() {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const querySnapshot = await getDocs(this.db.datesCollection);

		const deletePromises = querySnapshot.docs
			.filter(doc => {
				const data = doc.data() as AvailableDateDto;
				const [day, month, year] = data.date.split("/").map(Number);
				const date = new Date(year, month - 1, day);
				return date < today;
			})
			.map(doc => deleteDoc(doc.ref));

		return Promise.all(deletePromises);
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
