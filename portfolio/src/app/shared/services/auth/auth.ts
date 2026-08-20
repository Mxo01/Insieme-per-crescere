import { inject, Injectable, signal } from "@angular/core";
import {
	Auth,
	authState,
	isSignInWithEmailLink,
	sendSignInLinkToEmail,
	signInWithEmailLink
} from "@angular/fire/auth";

const PENDING_EMAIL_KEY = "bookingPendingEmail";

// Email verification via a Firebase Auth "magic link": no Cloud Function,
// no external email service, free even on the Spark plan. This is what
// prevents flooding with fake bookings: writing to `bookings` (see
// firestore.rules) requires an authenticated session with a verified
// email that matches the booking's email.
@Injectable({
	providedIn: "root"
})
export class AuthService {
	private readonly auth = inject(Auth);

	public readonly user = signal(this.auth.currentUser);

	constructor() {
		authState(this.auth).subscribe(user => this.user.set(user));
	}

	isVerifiedFor(email: string) {
		const user = this.user();
		return !!user && user.emailVerified && user.email === email;
	}

	async sendVerificationLink(email: string) {
		const actionCodeSettings = {
			url: `${window.location.origin}/booking`,
			handleCodeInApp: true
		};

		await sendSignInLinkToEmail(this.auth, email, actionCodeSettings);
		window.localStorage.setItem(PENDING_EMAIL_KEY, email);
	}

	get isReturningFromEmailLink() {
		return isSignInWithEmailLink(this.auth, window.location.href);
	}

	// Call this when the booking page loads, in case the user is coming back
	// from the link they received by email. Returns the email that was just
	// confirmed, or null if the link is invalid/expired or we can't find the
	// email we stored locally (e.g. the link was opened on another
	// device/browser).
	async completeSignInFromEmailLink(): Promise<string | null> {
		const storedEmail = window.localStorage.getItem(PENDING_EMAIL_KEY);
		if (!storedEmail) return null;

		try {
			const credential = await signInWithEmailLink(this.auth, storedEmail, window.location.href);
			window.localStorage.removeItem(PENDING_EMAIL_KEY);
			return credential.user.email;
		} catch {
			return null;
		}
	}
}
