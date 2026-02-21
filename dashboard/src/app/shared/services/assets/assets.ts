import { inject, Injectable } from "@angular/core";
import { doc, docData, updateDoc } from "@angular/fire/firestore";
import { Database } from "../database";
import { InfoDto } from "./assets.model";
import { toSignal } from "@angular/core/rxjs-interop";
import { Observable } from "rxjs";

@Injectable({
	providedIn: "root"
})
export class Assets {
	private readonly db = inject(Database);

	getAssets() {
		const docRef = doc(this.db.assetsCollection, "info");
		const assets$ = docData(docRef) as Observable<InfoDto>;

		return toSignal(assets$);
	}

	updateAssets(assets: Partial<InfoDto>) {
		const docRef = doc(this.db.assetsCollection, "info");
		return updateDoc(docRef, assets);
	}
}
