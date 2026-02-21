import { inject, Injectable } from "@angular/core";
import { query, where, getDocs, addDoc, updateDoc, doc } from "@angular/fire/firestore";
import { Database } from "../database";
import { AvailableDateDto } from "./dates.model";

@Injectable({
	providedIn: "root"
})
export class Dates {
	private db = inject(Database);

	async saveAvailability(date: string, availableTimeSlots: string[]) {
		const q = query(this.db.datesCollection, where("date", "==", date));
		const querySnapshot = await getDocs(q);

		if (!querySnapshot.empty) {
			const existingDoc = querySnapshot.docs[0];
			const docRef = doc(this.db.datesCollection, existingDoc.id);
			return updateDoc(docRef, { availableTimeSlots });
		} else {
			return addDoc(this.db.datesCollection, {
				date,
				availableTimeSlots
			});
		}
	}

	async getAvailabilityByDate(date: string): Promise<AvailableDateDto | null> {
		const q = query(this.db.datesCollection, where("date", "==", date));
		const querySnapshot = await getDocs(q);

		if (!querySnapshot.empty) {
			const data = querySnapshot.docs[0].data() as AvailableDateDto;
			data.availableTimeSlots.sort();
			return { ...data, id: querySnapshot.docs[0].id };
		}

		return null;
	}
}
