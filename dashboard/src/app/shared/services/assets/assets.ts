import { inject, Injectable } from "@angular/core";
import { doc, docData, updateDoc } from "@angular/fire/firestore";
import { Database } from "../database";
import { InfoDto } from "./assets.model";
import { toSignal } from "@angular/core/rxjs-interop";
import { catchError, Observable, of } from "rxjs";

@Injectable({
	providedIn: "root"
})
export class Assets {
	private readonly db = inject(Database);

	getAssets() {
		const docRef = doc(this.db.assetsCollection, "info");
		// Without `catchError`, `toSignal` re-throws the Firestore error every
		// time the signal is read after the source observable errors (e.g. a
		// permission-denied in local dev) — and since that read happens during
		// change detection, it aborts the whole CD pass, silently breaking
		// every other component (toasts, dialogs, ...) for the rest of the
		// session. Falling back to `undefined` keeps the app resilient.
		const assets$ = (docData(docRef) as Observable<InfoDto>).pipe(
			catchError(error => {
				console.error("Impossibile caricare gli assets:", error);
				return of(undefined);
			})
		);

		return toSignal(assets$);
	}

	updateAssets(assets: Partial<InfoDto>) {
		const docRef = doc(this.db.assetsCollection, "info");
		return updateDoc(docRef, assets);
	}
}
