import {
	ApplicationConfig,
	provideBrowserGlobalErrorListeners,
	provideZonelessChangeDetection
} from "@angular/core";
import { provideRouter, withInMemoryScrolling } from "@angular/router";
import { providePrimeNG } from "primeng/config";
import Aura from "@primeuix/themes/aura";
import { definePreset } from "@primeuix/themes";
import { getApp, initializeApp, provideFirebaseApp } from "@angular/fire/app";
import { getFirestore, provideFirestore } from "@angular/fire/firestore";
import { getAuth, provideAuth } from "@angular/fire/auth";
import { routes } from "./app.routes";
import { firebaseConfig } from "shared/firebase.config";
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
		// `anchorScrolling` is deliberately left off: the in-page nav links
		// (#chi-sono, #consulenze, #contatti) are handled manually in
		// `Home.scrollToSection` with a native `scrollIntoView`, which starts
		// from the current scroll position. Letting the router also react to
		// the fragment change caused a double scroll — first to the stored
		// position (or the top), then to the anchor — which showed up as a
		// jarring flicker/"refresh" on every in-page nav click.
		provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: "enabled" })),
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
		provideFirestore(() => getFirestore()),
		provideAppCheck(() =>
			initializeAppCheck(getApp(), {
				provider: new ReCaptchaV3Provider("6LeKfXQsAAAAAKMj4s3N_WcmO5UFQRjqEu8pHqyx"),
				isTokenAutoRefreshEnabled: true
			})
		),
		provideAuth(() => getAuth())
	]
};
