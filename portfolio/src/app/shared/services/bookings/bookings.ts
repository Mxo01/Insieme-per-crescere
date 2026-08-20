import { inject, Injectable } from "@angular/core";
import { arrayRemove, doc, writeBatch } from "@angular/fire/firestore";
import { Database } from "../database";
import { BookingDto } from "./bookings.model";

const PENDING_BOOKING_KEY = "pendingBooking";

interface PendingBooking {
	booking: BookingDto;
	dateDocId: string;
}

@Injectable({
	providedIn: "root"
})
export class Bookings {
	private db = inject(Database);

	// The document id is deterministic ("date_time"): if two users try to
	// book the same slot at the same time, only the first `create` is
	// accepted by Firestore — the second is seen by the security rules as
	// an "update" on a document that already exists, and gets rejected.
	// Creating the booking and removing the slot from `dates` are sent
	// together in a single atomic batch: either both succeed, or neither does.
	async addBooking(booking: BookingDto, dateDocId: string) {
		const bookingId = `${booking.date}_${booking.time}`;
		const bookingRef = doc(this.db.bookingsCollection, bookingId);
		const dateRef = doc(this.db.datesCollection, dateDocId);

		const batch = writeBatch(this.db.firestore);
		batch.set(bookingRef, booking);
		batch.update(dateRef, { availableTimeSlots: arrayRemove(booking.time) });

		try {
			await batch.commit();
		} catch {
			throw new Error(
				"Lo slot orario è già stato occupato da un altro utente, oppure non è più disponibile. Riprova con un altro orario."
			);
		}

		this.notifyTelegram(bookingId);
	}

	// Best-effort admin notification: the booking is already saved at this
	// point, so a failure here (bot not configured yet, network hiccup, ...)
	// must never surface to the person booking. The API route re-verifies
	// the booking exists in Firestore via the Admin SDK before notifying —
	// see portfolio/api/notify-telegram.ts — so the Telegram bot token never
	// has to be exposed to the browser.
	private notifyTelegram(bookingId: string) {
		fetch("/api/notify-telegram", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ bookingId })
		}).catch(() => undefined);
	}

	// The booking is "parked" in localStorage while the user leaves the site
	// to confirm their email: when they come back (same browser) we complete
	// it automatically without making them re-enter everything.
	savePendingBooking(booking: BookingDto, dateDocId: string) {
		const pending: PendingBooking = { booking, dateDocId };
		window.localStorage.setItem(PENDING_BOOKING_KEY, JSON.stringify(pending));
	}

	getPendingBooking(): PendingBooking | null {
		const raw = window.localStorage.getItem(PENDING_BOOKING_KEY);
		if (!raw) return null;

		try {
			return JSON.parse(raw) as PendingBooking;
		} catch {
			return null;
		}
	}

	clearPendingBooking() {
		window.localStorage.removeItem(PENDING_BOOKING_KEY);
	}
}
