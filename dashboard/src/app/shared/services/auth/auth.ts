import { inject, Injectable, signal } from "@angular/core";
import {
	GoogleAuthProvider,
	Auth,
	signInWithRedirect,
	getRedirectResult,
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
	public isAuthLoading = signal(true);

	readonly authReady: Promise<void>;

	constructor() {
		this.authReady = new Promise(resolve => {
			// getRedirectResult lets the SDK finish processing a pending
			// signInWithRedirect() before we read the auth state below; we
			// don't need its return value, authState() already reflects the
			// signed-in user once this settles.
			getRedirectResult(this.auth)
				.catch(() => null)
				.finally(() => {
					authState(this.auth)
						.pipe(take(1))
						.subscribe({
							next: user => {
								this.validateUser(user).finally(() => {
									this.isAuthLoading.set(false);
									resolve();
								});
							}
						});
				});
		});
	}

	// Using a full-page redirect instead of a popup: popups need
	// third-party storage access to relay the auth result back to the
	// opener, which privacy-focused browsers (Brave, Safari, Chrome with
	// tracking protection) block outright, breaking login. A redirect is a
	// normal top-level navigation and doesn't have that problem.
	public async signInWithGoogle() {
		await setPersistence(this.auth, browserSessionPersistence);

		try {
			await signInWithRedirect(this.auth, new GoogleAuthProvider());
		} catch {
			this.user.set(null);
		}
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
