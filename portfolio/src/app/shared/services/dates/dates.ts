import { inject, Injectable } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { collectionData, query, where } from "@angular/fire/firestore";
import { catchError, map, Observable, of } from "rxjs";
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
		// `catchError` matters even with `initialValue` set below: that only
		// covers the "no emission yet" case. Once the source errors (e.g. a
		// permission-denied in local dev), `toSignal` re-throws it on every
		// later read, which happens during change detection and aborts the
		// whole CD pass — silently breaking every other component (toasts,
		// dialogs, ...) for the rest of the session. Falling back to `[]`
		// keeps the app resilient.
		const availableDates$ = dates$.pipe(
			map(dates =>
				dates.map(availableDate => ({
					...availableDate,
					date: new Date(availableDate.date).toLocaleDateString(),
					availableTimeSlots: availableDate.availableTimeSlots.toSorted()
				}))
			),
			catchError(error => {
				console.error("Impossibile caricare le date disponibili:", error);
				return of([]);
			})
		);

		return toSignal(availableDates$, { initialValue: [] });
	}
}
