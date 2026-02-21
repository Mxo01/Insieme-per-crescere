import { inject, Injectable } from "@angular/core";
import { doc, docData } from "@angular/fire/firestore";
import { map, Observable } from "rxjs";
import { WhitelistIds } from "./whitelist.model";
import { Database } from "../database";

@Injectable({
	providedIn: "root"
})
export class Whitelist {
	private readonly _db = inject(Database);

	public isInWhitelist(uid: string) {
		const docRef = doc(this._db.whitelistCollection, "whitelistIds");
		const whitelistIds$ = docData(docRef) as Observable<WhitelistIds>;

		return whitelistIds$.pipe(map(({ whitelistIds }: WhitelistIds) => whitelistIds.includes(uid)));
	}
}
