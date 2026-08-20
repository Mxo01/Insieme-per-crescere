import { BookingDto } from "../services/bookings/bookings.model";

export function sendConfirmationEmail(booking: BookingDto) {
	const googleCalendarLink = generateGoogleCalendarLink(booking);
	const subject = encodeURIComponent(`Conferma appuntamento: ${booking.date}`);
	const body = encodeURIComponent(
		`Gentile ${booking.name} ${booking.lastName},\n\n` +
			`La sua richiesta di consulenza è stata confermata.\n\n` +
			`📅 Data: ${booking.date}\n` +
			`🕐 Ora: ${booking.time}\n\n` +
			`Aggiungi a Google Calendar: ${googleCalendarLink}\n\n` +
			`A presto,\n` +
			`Insieme per Crescere`
	);
	const gmailUrl = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(booking.email)}&su=${subject}&body=${body}`;

	window.open(gmailUrl, "_blank");
}

export function generateGoogleCalendarLink(booking: BookingDto) {
	const [day, month, year] = booking.date.split("/").map(Number);
	const [hours, minutes] = booking.time.split(":").map(Number);
	const start = new Date(year, month - 1, day, hours, minutes, 0);
	const end = new Date(start.getTime() + 45 * 60 * 1000);
	const formatDate = (d: Date) =>
		formatDateToISODateString(d).replace(/[-:]/g, "").split(".")[0] + "Z";

	const googleUrl =
		`https://www.google.com/calendar/render?action=TEMPLATE` +
		`&text=${encodeURIComponent(`Consulenza Pedagogica - ${booking.name} ${booking.lastName}`)}` +
		`&dates=${formatDate(start)}/${formatDate(end)}` +
		`&add=${encodeURIComponent(booking.email)}` +
		`&conference=true`;

	return googleUrl;
}

// Firestore documents are capped at 1MiB, and this project has no Firebase
// Storage: images are stored as base64 directly on the `assets/info` doc
// (like the CV). Resizing/re-encoding client-side on an offscreen canvas
// keeps the upload well under that limit while staying as close to the
// original quality as reasonably possible.
export function resizeImageToBase64(
	file: File,
	maxDimension = 1600,
	quality = 0.9
): Promise<string> {
	return new Promise((resolve, reject) => {
		const objectUrl = URL.createObjectURL(file);
		const image = new Image();

		image.onload = () => {
			URL.revokeObjectURL(objectUrl);

			const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
			const width = Math.round(image.width * scale);
			const height = Math.round(image.height * scale);

			const canvas = document.createElement("canvas");
			canvas.width = width;
			canvas.height = height;

			const context = canvas.getContext("2d");
			if (!context) {
				reject(new Error("Impossibile elaborare l'immagine."));
				return;
			}

			context.drawImage(image, 0, 0, width, height);
			resolve(canvas.toDataURL("image/jpeg", quality));
		};

		image.onerror = () => {
			URL.revokeObjectURL(objectUrl);
			reject(new Error("Impossibile leggere l'immagine selezionata."));
		};

		image.src = objectUrl;
	});
}

export function convertFileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = () => {
			resolve(reader.result as string);
		};

		reader.onerror = error => {
			console.error("FileReader failed to read the file:", error);
			reject(new Error("Failed to convert file to Base64."));
		};

		reader.readAsDataURL(file);
	});
}

export function base64ToBlob(base64: string): Blob {
	const parts = base64.split(";base64,");
	const contentType = parts[0].split(":")[1];
	const rawBase64 = parts[1];

	const byteCharacters = atob(rawBase64);
	const byteArrays = [];

	for (let offset = 0; offset < byteCharacters.length; offset += 512) {
		const slice = byteCharacters.slice(offset, offset + 512);
		const byteNumbers = new Array(slice.length);

		for (let i = 0; i < slice.length; i++) {
			byteNumbers[i] = slice.charCodeAt(i);
		}

		const byteArray = new Uint8Array(byteNumbers);
		byteArrays.push(byteArray);
	}

	return new Blob(byteArrays, { type: contentType });
}

export function getOneMonthFromNowRange() {
	const start = new Date();
	start.setHours(0, 0, 0, 0);
	const end = new Date();
	end.setHours(23, 59, 59, 999);
	end.setMonth(end.getMonth() + 1);

	return { start, end };
}

export function formatDateToISODateString(date: Date): string {
	const offset = date.getTimezoneOffset();
	const localDate = new Date(date.getTime() - offset * 60 * 1000);
	return localDate.toISOString().split("T")[0];
}
