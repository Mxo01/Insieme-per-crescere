import { inject, Injectable, signal } from "@angular/core";
import {
	GoogleAuthProvider,
	Auth,
	signInWithPopup,
	User,
	signOut,
	authState,
	deleteUser,
	setPersistence,
	browserSessionPersistence
} from "@angular/fire/auth";
import { firstValueFrom, take } from "rxjs";
import { Whitelist } from "../whitelist/whitelist";

@Injectable({
	providedIn: "root"
})
export class AuthService {
	private readonly whitelistService = inject(Whitelist);

	private readonly auth = inject(Auth);

	public user = signal<User | null>(null);

	constructor() {
		this.checkSessionPersistence();
	}

	private checkSessionPersistence() {
		authState(this.auth)
			.pipe(take(1))
			.subscribe({ next: user => this.validateUser(user) });
	}

	public async signInWithGoogle() {
		await setPersistence(this.auth, browserSessionPersistence);

		return signInWithPopup(this.auth, new GoogleAuthProvider())
			.then(userCredential => this.validateUser(userCredential.user))
			.catch(() => this.user.set(null));
	}

	public async signOut() {
		await signOut(this.auth);
		this.user.set(null);
	}

	private async validateUser(user: User | null) {
		if (!user) {
			this.user.set(null);
			return;
		}

		const isUserInWhitelist = await firstValueFrom(this.whitelistService.isInWhitelist(user.uid));

		if (!isUserInWhitelist) {
			try {
				await deleteUser(user);
			} catch {
				await this.signOut();
			}

			this.user.set(null);
			return;
		}

		this.user.set(user);
	}
}
