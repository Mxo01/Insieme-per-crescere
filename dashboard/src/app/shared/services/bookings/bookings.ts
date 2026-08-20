import { inject, Injectable } from "@angular/core";
import {
	collectionData,
	doc,
	getDoc,
	updateDoc,
	writeBatch,
	arrayUnion,
	arrayRemove
} from "@angular/fire/firestore";
import { Observable, map } from "rxjs";
import { toSignal } from "@angular/core/rxjs-interop";
import { Database } from "../database";
import { BookingDto } from "./bookings.model";
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

	// The slot is already removed from `dates.availableTimeSlots` when the
	// booking is created (see Bookings.addBooking on the portfolio), so
	// accepting or putting a booking back on hold no longer needs to touch
	// `dates`.
	async toggleBookingStatus(booking: BookingDto) {
		const bookingsDocRef = doc(this.db.bookingsCollection, booking.id);
		await updateDoc(bookingsDocRef, { isAccepted: !booking.isAccepted });
	}

	// Deleting/rejecting a booking must give the slot back to public
	// availability.
	async deleteBooking(booking: BookingDto) {
		if (!booking.id) return;

		const bookingRef = doc(this.db.bookingsCollection, booking.id);
		const dateDocRef = await this.findDateDocRef(booking.date);

		const batch = writeBatch(this.db.firestore);
		batch.delete(bookingRef);
		if (dateDocRef) batch.update(dateDocRef, { availableTimeSlots: arrayUnion(booking.time) });

		await batch.commit();
	}

	// The document id is "date_time": moving a booking means recreating it
	// with a new id, giving back the old slot and taking the new one.
	async updateBookingDate(booking: BookingDto, newDate: Date, newTime: string) {
		if (!booking.id) return;

		const newDateStr = formatDateToISODateString(newDate);
		const newBookingRef = doc(this.db.bookingsCollection, `${newDateStr}_${newTime}`);

		const existing = await getDoc(newBookingRef);
		if (existing.exists()) {
			throw new Error("Lo slot scelto è già occupato da un'altra prenotazione.");
		}

		const oldBookingRef = doc(this.db.bookingsCollection, booking.id);
		const oldDateDocRef = await this.findDateDocRef(booking.date);
		const newDateDocRef = await this.findDateDocRef(newDateStr);

		const newBookingData: BookingDto = {
			name: booking.name,
			lastName: booking.lastName,
			email: booking.email,
			phone: booking.phone,
			notes: booking.notes,
			date: newDateStr,
			time: newTime,
			isAccepted: booking.isAccepted
		};

		const batch = writeBatch(this.db.firestore);
		batch.delete(oldBookingRef);
		batch.set(newBookingRef, newBookingData);
		if (oldDateDocRef)
			batch.update(oldDateDocRef, { availableTimeSlots: arrayUnion(booking.time) });
		if (newDateDocRef) batch.update(newDateDocRef, { availableTimeSlots: arrayRemove(newTime) });

		await batch.commit();
	}

	// `booking.date` here is already in local format ("dd/mm/yyyy", see
	// getBookings) or ISO ("yyyy-mm-dd", when it comes from
	// updateBookingDate): we normalize it before looking up the matching
	// `dates` document, whose id is that same date in ISO format.
	private async findDateDocRef(bookingDate: string) {
		const dateStr = /^\d{4}-\d{2}-\d{2}$/.test(bookingDate)
			? bookingDate
			: this.localDateStringToISO(bookingDate);

		const dateDocRef = doc(this.db.datesCollection, dateStr);
		const dateDoc = await getDoc(dateDocRef);

		return dateDoc.exists() ? dateDocRef : null;
	}

	private localDateStringToISO(localDate: string) {
		const [day, month, year] = localDate.split("/");
		const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day));
		return formatDateToISODateString(date);
	}
}
