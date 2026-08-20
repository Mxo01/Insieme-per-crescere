import {
	ApplicationConfig,
	provideBrowserGlobalErrorListeners,
	provideZonelessChangeDetection
} from "@angular/core";
import { provideRouter } from "@angular/router";
import { providePrimeNG } from "primeng/config";
import Aura from "@primeuix/themes/aura";
import { definePreset } from "@primeuix/themes";
import { getApp, initializeApp, provideFirebaseApp } from "@angular/fire/app";
import { getFirestore, provideFirestore } from "@angular/fire/firestore";
import { routes } from "./app.routes";
import { firebaseConfig } from "shared/firebase.config";
import { getAuth, provideAuth } from "@angular/fire/auth";
import { provideAppCheck, initializeAppCheck, ReCaptchaV3Provider } from "@angular/fire/app-check";

const primengPreset = definePreset(Aura, {
	semantic: {
		primary: {
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
		}
	}
});

const italianTranslation = {
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

export const appConfig: ApplicationConfig = {
	providers: [
		provideBrowserGlobalErrorListeners(),
		provideZonelessChangeDetection(),
		provideRouter(routes),
		providePrimeNG({
			theme: {
				preset: primengPreset,
				options: {
					darkModeSelector: "none"
				}
			},
			translation: italianTranslation
		}),
		provideFirebaseApp(() => initializeApp(firebaseConfig)),
		provideAppCheck(() =>
			initializeAppCheck(getApp(), {
				provider: new ReCaptchaV3Provider("6LeKfXQsAAAAAKMj4s3N_WcmO5UFQRjqEu8pHqyx"),
				isTokenAutoRefreshEnabled: true
			})
		),
		provideFirestore(() => getFirestore()),
		provideAuth(() => getAuth())
	]
};
