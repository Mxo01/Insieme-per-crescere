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
import { ConfirmationService } from "primeng/api";
import { provideAppCheck, initializeAppCheck, ReCaptchaV3Provider } from "@angular/fire/app-check";

const primengPreset = definePreset(Aura, {
	semantic: {
		primary: {
			50: "{violet.50}",
			100: "{violet.100}",
			200: "{violet.200}",
			300: "{violet.300}",
			400: "{violet.400}",
			500: "{violet.500}",
			600: "{violet.600}",
			700: "{violet.700}",
			800: "{violet.800}",
			900: "{violet.900}",
			950: "{violet.950}"
		}
	}
});

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
			}
		}),
		provideFirebaseApp(() => initializeApp(firebaseConfig)),
		provideAppCheck(() =>
			initializeAppCheck(getApp(), {
				provider: new ReCaptchaV3Provider("6LeDfnQsAAAAACc06L9kvs3aWmYSizPIS4qKnzLz"),
				isTokenAutoRefreshEnabled: true
			})
		),
		provideFirestore(() => getFirestore()),
		provideAuth(() => getAuth()),
		ConfirmationService
	]
};
