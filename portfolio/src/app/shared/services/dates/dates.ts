import { inject, Injectable } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { collectionData, query, where } from "@angular/fire/firestore";
import { combineLatest, map, Observable } from "rxjs";
import { AvailableDateDto } from "./dates.model";
import { Database } from "../database";
import { BookingDto } from "../bookings/bookings.model";
import { getOneMonthFromNowRange, formatDateToISODateString } from "../../utils/utils";

@Injectable({
	providedIn: "root"
})
export class Dates {
	private db = inject(Database);

	getAvailableDates() {
		const { start, end } = getOneMonthFromNowRange();
		const startStr = formatDateToISODateString(start);
		const endStr = formatDateToISODateString(end);

		const datesQuery = query(
			this.db.datesCollection,
			where("date", ">=", startStr),
			where("date", "<=", endStr)
		);
		const dates$ = collectionData(datesQuery, { idField: "id" }) as Observable<AvailableDateDto[]>;

		const bookingsQuery = query(
			this.db.bookingsCollection,
			where("date", ">=", startStr),
			where("date", "<=", endStr)
		);
		const bookings$ = collectionData(bookingsQuery) as Observable<BookingDto[]>;

		const merged$ = combineLatest([dates$, bookings$]).pipe(
			map(([dates, bookings]) => {
				const availableDates = dates.map(availableDate => {
					const bookedTimeSlots = new Set(
						bookings.filter(booking => booking.date === availableDate.date).map(({ time }) => time)
					);
					const availableTimeSlots = availableDate.availableTimeSlots
						.filter(time => !bookedTimeSlots.has(time))
						.toSorted();

					return {
						...availableDate,
						date: new Date(availableDate.date).toLocaleDateString(),
						availableTimeSlots
					};
				});

				return availableDates;
			})
		);

		return toSignal(merged$, { initialValue: [] });
	}
}
