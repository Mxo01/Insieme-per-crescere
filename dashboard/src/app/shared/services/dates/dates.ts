import { inject, Injectable } from "@angular/core";
import { query, where, getDocs, getDoc, setDoc, doc, deleteDoc } from "@angular/fire/firestore";
import { Database } from "../database";
import { AvailableDateDto } from "./dates.model";
import { BookingDto } from "../bookings/bookings.model";
import { formatDateToISODateString, getOneMonthFromNowRange } from "../../utils/utils";

@Injectable({
	providedIn: "root"
})
export class Dates {
	private db = inject(Database);

	// The document id is the date itself ("yyyy-mm-dd"), no longer
	// auto-generated: this lets the Firestore Security Rules verify with a
	// direct get() (no query) that a slot booked by the public matches a
	// slot that was really published, preventing fake bookings on
	// made-up dates/times.
	async saveAvailability(date: Date, availableTimeSlots: string[]) {
		const dateStr = formatDateToISODateString(date);

		await this.cleanupOldDates();

		const docRef = doc(this.db.datesCollection, dateStr);
		const noTimeSlotsSelected = !availableTimeSlots?.length;

		return noTimeSlotsSelected
			? deleteDoc(docRef)
			: setDoc(docRef, { date: dateStr, availableTimeSlots });
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

		const dateDoc = await getDoc(doc(this.db.datesCollection, dateStr));

		if (dateDoc.exists()) {
			const data = dateDoc.data() as AvailableDateDto;
			data.availableTimeSlots = data.availableTimeSlots
				.filter(time => !bookedTimeSlots.includes(time))
				.toSorted();
			return { ...data, id: dateDoc.id, bookedTimeSlots };
		}

		return null;
	}
}
