import { inject, Injectable } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { collectionData, query, where } from "@angular/fire/firestore";
import { map, Observable } from "rxjs";
import { AvailableDateDto } from "./dates.model";
import { Database } from "../database";
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

		// `dates.availableTimeSlots` is the only source of truth for free
		// slots: when a booking is created, the slot is removed from here in
		// a single atomic batch (see Bookings.addBooking). No need to read
		// the `bookings` collection anymore, which is no longer publicly
		// readable (it contains PII).
		const availableDates$ = dates$.pipe(
			map(dates =>
				dates.map(availableDate => ({
					...availableDate,
					date: new Date(availableDate.date).toLocaleDateString(),
					availableTimeSlots: availableDate.availableTimeSlots.toSorted()
				}))
			)
		);

		return toSignal(availableDates$, { initialValue: [] });
	}
}
