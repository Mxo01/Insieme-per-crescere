import { inject, Injectable } from "@angular/core";
import { query, where, getDocs, addDoc, updateDoc, doc, deleteDoc } from "@angular/fire/firestore";
import { Database } from "../database";
import { AvailableDateDto } from "./dates.model";
import { BookingDto } from "../bookings/bookings.model";
import { formatDateToISODateString, getOneMonthFromNowRange } from "../../utils/utils";

@Injectable({
	providedIn: "root"
})
export class Dates {
	private db = inject(Database);

	async saveAvailability(date: Date, availableTimeSlots: string[]) {
		const dateStr = formatDateToISODateString(date);

		await this.cleanupOldDates();

		const q = query(this.db.datesCollection, where("date", "==", dateStr));
		const querySnapshot = await getDocs(q);

		if (!querySnapshot.empty) {
			const noOneTimeSlotsSelected = !availableTimeSlots?.length;
			const existingDoc = querySnapshot.docs[0];
			const docRef = doc(this.db.datesCollection, existingDoc.id);
			return noOneTimeSlotsSelected ? deleteDoc(docRef) : updateDoc(docRef, { availableTimeSlots });
		} else {
			return addDoc(this.db.datesCollection, {
				date: dateStr,
				availableTimeSlots
			});
		}
	}

	private async cleanupOldDates() {
		const { start } = getOneMonthFromNowRange();

		const querySnapshot = await getDocs(
			query(this.db.datesCollection, where("date", "<", formatDateToISODateString(start)))
		);
		const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
		
		return Promise.all(deletePromises);
	}

	async getAvailabilityByDate(
		date: Date
	): Promise<(AvailableDateDto & { bookedTimeSlots: string[] }) | null> {
		const dateStr = formatDateToISODateString(date);
		const bookingsQuery = query(this.db.bookingsCollection, where("date", "==", dateStr));
		const bookingsSnapshot = await getDocs(bookingsQuery);

		let bookedTimeSlots: string[] = [];

		if (!bookingsSnapshot.empty) {
			bookedTimeSlots = bookingsSnapshot.docs
				.map(doc => doc.data() as BookingDto)
				.map(({ time }) => time);
		}

		const datesQuery = query(this.db.datesCollection, where("date", "==", dateStr));
		const querySnapshot = await getDocs(datesQuery);

		if (!querySnapshot.empty) {
			const data = querySnapshot.docs[0].data() as AvailableDateDto;
			data.availableTimeSlots = data.availableTimeSlots
				.filter(time => !bookedTimeSlots.includes(time))
				.toSorted();
			return { ...data, id: querySnapshot.docs[0].id, bookedTimeSlots };
		}

		return null;
	}
}
