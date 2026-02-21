import { inject, Injectable } from "@angular/core";
import { Database } from "../database";
import { doc, docData } from "@angular/fire/firestore";
import { Observable } from "rxjs";
import { toSignal } from "@angular/core/rxjs-interop";
import { InfoDto } from "./assets.model";

@Injectable({
	providedIn: "root"
})
export class Assets {
	private db = inject(Database);

	getAssets() {
		const docRef = doc(this.db.assetsCollection, "info");
		const assets$ = docData(docRef) as Observable<InfoDto>;

		return toSignal(assets$);
	}
}
