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

// navigator.clipboard is only reliably available in a secure, top-level
// browsing context: it's silently undefined in some embedded/iframe
// previews, so writeText() would resolve into nothing and no feedback
// would ever show. Falls back to the older execCommand approach there.
export async function copyTextToClipboard(text: string): Promise<void> {
	if (navigator.clipboard && window.isSecureContext) {
		await navigator.clipboard.writeText(text);
		return;
	}

	const textarea = document.createElement("textarea");
	textarea.value = text;
	textarea.style.position = "fixed";
	textarea.style.opacity = "0";
	document.body.appendChild(textarea);
	textarea.focus();
	textarea.select();

	try {
		const succeeded = document.execCommand("copy");
		if (!succeeded) throw new Error("execCommand('copy') failed");
	} finally {
		document.body.removeChild(textarea);
	}
}

export function getOneMonthFromNowRange() {
	// Booking closes for today: the earliest bookable day is tomorrow.
	const start = new Date();
	start.setDate(start.getDate() + 1);
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
