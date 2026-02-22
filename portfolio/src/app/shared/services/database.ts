import { inject, Injectable } from "@angular/core";
import { Firestore, collection } from "@angular/fire/firestore";

@Injectable({
	providedIn: "root"
})
export class Database {
	readonly firestore = inject(Firestore);
	readonly assetsCollection = collection(this.firestore, "assets");
	readonly datesCollection = collection(this.firestore, "dates");
	readonly bookingsCollection = collection(this.firestore, "bookings");
}
