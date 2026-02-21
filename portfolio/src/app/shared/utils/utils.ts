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