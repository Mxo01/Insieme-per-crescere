import type { VercelRequest, VercelResponse } from "@vercel/node";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

interface BookingRecord {
	name: string;
	lastName: string;
	email: string;
	phone: string;
	date: string;
	time: string;
	notes?: string;
}

// This runs as a Vercel Serverless Function (Node.js runtime), never in the
// browser: it's the only place allowed to hold the Telegram bot token and
// the Firebase Admin service account, since either one landing in the
// client bundle would let anyone impersonate the bot / bypass Firestore
// rules. The client only ever sends the id of a booking it just created.
//
// Required env vars (set on Vercel, never committed):
// - TELEGRAM_BOT_TOKEN
// - TELEGRAM_CHAT_ID
// - FIREBASE_SERVICE_ACCOUNT_KEY (the full JSON key, as one string)

function getAdminFirestore() {
	const app =
		getApps()[0] ??
		initializeApp({
			credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY ?? "{}"))
		});

	return getFirestore(app);
}

// Admin SDK reads bypass firestore.rules entirely (it authenticates as a
// service account, not as an app user), so this is the source of truth
// that a booking claimed by the client actually exists — a bare POST with
// made-up data can't trigger a Telegram message.
async function bookingExists(bookingId: string): Promise<BookingRecord | null> {
	const snapshot = await getAdminFirestore().collection("bookings").doc(bookingId).get();
	return snapshot.exists ? (snapshot.data() as BookingRecord) : null;
}

async function sendTelegramMessage(text: string) {
	const token = process.env.TELEGRAM_BOT_TOKEN;
	const chatId = process.env.TELEGRAM_CHAT_ID;

	if (!token || !chatId) throw new Error("Telegram bot is not configured");

	const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ chat_id: chatId, text })
	});

	if (!response.ok) throw new Error(`Telegram API responded with ${response.status}`);
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
	if (request.method !== "POST") {
		response.status(405).json({ error: "Method not allowed" });
		return;
	}

	const bookingId = request.body?.bookingId;

	if (typeof bookingId !== "string" || !bookingId) {
		response.status(400).json({ error: "Missing bookingId" });
		return;
	}

	try {
		const booking = await bookingExists(bookingId);

		if (!booking) {
			response.status(404).json({ error: "Booking not found" });
			return;
		}

		const lines = [
			"📅 Nuova prenotazione!",
			"",
			`${booking.name} ${booking.lastName}`,
			`${booking.date} alle ${booking.time}`,
			`✉️ ${booking.email}`,
			`📞 ${booking.phone}`
		];

		if (booking.notes) lines.push(`📝 ${booking.notes}`);

		await sendTelegramMessage(lines.join("\n"));

		response.status(200).json({ ok: true });
	} catch (error) {
		console.error("notify-telegram error:", error);
		response.status(500).json({ error: "Internal error" });
	}
}
