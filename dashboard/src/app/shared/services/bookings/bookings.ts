import { inject, Injectable } from "@angular/core";
import {
	collectionData,
	doc,
	updateDoc,
	deleteDoc,
	getDocs,
	query,
	where
} from "@angular/fire/firestore";
import { Observable, map } from "rxjs";
import { toSignal } from "@angular/core/rxjs-interop";
import { Database } from "../database";
import { BookingDto } from "./bookings.model";
import { AvailableDateDto } from "../dates/dates.model";
import { formatDateToISODateString } from "../../utils/utils";

@Injectable({
	providedIn: "root"
})
export class Bookings {
	private db = inject(Database);

	getBookings() {
		const bookings$ = collectionData(this.db.bookingsCollection, { idField: "id" }) as Observable<
			BookingDto[]
		>;

		return toSignal(
			bookings$.pipe(
				map(bookings =>
					bookings.map(booking => ({
						...booking,
						date: new Date(booking.date).toLocaleDateString()
					}))
				)
			),
			{ initialValue: [] }
		);
	}

	async toggleBookingStatus(booking: BookingDto) {
		const bookingsDocRef = doc(this.db.bookingsCollection, booking.id);
		const newStatus = !booking.isAccepted;

		await updateDoc(bookingsDocRef, { isAccepted: newStatus });

		if (newStatus) {
			const [day, month, year] = booking.date.split("/");
			const date = new Date(
				Number.parseInt(year),
				Number.parseInt(month) - 1,
				Number.parseInt(day)
			);
			const q = query(
				this.db.datesCollection,
				where("date", "==", formatDateToISODateString(date))
			);
			const querySnapshot = await getDocs(q);

			if (!querySnapshot.empty) {
				const docId = querySnapshot.docs[0].id;
				const existingDoc = querySnapshot.docs[0].data() as AvailableDateDto;
				const availableTimeSlots = existingDoc.availableTimeSlots.filter(
					slot => slot !== booking.time
				);

				const datesDocRef = doc(this.db.datesCollection, docId);
				await updateDoc(datesDocRef, { availableTimeSlots });
			}
		}
	}

	async deleteBooking(bookingId: string) {
		const docRef = doc(this.db.bookingsCollection, bookingId);
		await deleteDoc(docRef);
	}

	async updateBookingDate(bookingId: string, date: Date, time: string) {
		const docRef = doc(this.db.bookingsCollection, bookingId);

		const q = query(this.db.datesCollection, where("date", "==", formatDateToISODateString(date)));
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
