import { inject, Injectable } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { collectionData } from "@angular/fire/firestore";
import { Observable } from "rxjs";
import { AvailableDateDto } from "./dates.model";
import { Database } from "../database";

@Injectable({
	providedIn: "root"
})
export class Dates {
	private db = inject(Database);

	getAvailableDates() {
		const days$ = collectionData(this.db.datesCollection, { idField: "id" }) as Observable<
			AvailableDateDto[]
		>;

		return toSignal(days$, { initialValue: [] });
	}
}
