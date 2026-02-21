import { inject, Injectable } from "@angular/core";
import { Firestore, collection } from "@angular/fire/firestore";

@Injectable({
	providedIn: "root"
})
export class Database {
	private _db = inject(Firestore);
	public assetsCollection = collection(this._db, "assets");
	public datesCollection = collection(this._db, "dates");
	public bookingsCollection = collection(this._db, "bookings");
}
