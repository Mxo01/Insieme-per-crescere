// Shared between portfolio and dashboard so their PrimeNG components
// (buttons, tags, datepicker, table, dialog, ...) stay pixel-identical
// instead of two hand-kept copies drifting apart. Kept dependency-free
// (no `@primeuix/themes` import) since this file lives outside either
// app's `node_modules` — each app's own app.config.ts calls
// `definePreset(Aura, { semantic: { primary: primengColors } })` locally.
export const primengColors = {
	50: "#f6f1fc",
	100: "#eadff9",
	200: "#d9c3f3",
	300: "#b58be8",
	400: "#8a58d1",
	500: "#7237be",
	600: "#5d2b9e",
	700: "#47207f",
	800: "#341864",
	900: "#24123b",
	950: "#180c28"
};

export const italianTranslation = {
	dayNames: ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"],
	dayNamesShort: ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"],
	dayNamesMin: ["Do", "Lu", "Ma", "Me", "Gi", "Ve", "Sa"],
	monthNames: [
		"Gennaio",
		"Febbraio",
		"Marzo",
		"Aprile",
		"Maggio",
		"Giugno",
		"Luglio",
		"Agosto",
		"Settembre",
		"Ottobre",
		"Novembre",
		"Dicembre"
	],
	monthNamesShort: [
		"Gen",
		"Feb",
		"Mar",
		"Apr",
		"Mag",
		"Giu",
		"Lug",
		"Ago",
		"Set",
		"Ott",
		"Nov",
		"Dic"
	],
	firstDayOfWeek: 1,
	today: "Oggi",
	clear: "Cancella",
	weekHeader: "Sett"
};
