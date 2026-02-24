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
