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
import { firebaseConfig, recaptchaSiteKey } from "shared/firebase.config";
import { primengColors, italianTranslation } from "shared/primeng.config";
import { getAuth, provideAuth } from "@angular/fire/auth";
import { provideAppCheck, initializeAppCheck, ReCaptchaV3Provider } from "@angular/fire/app-check";

// `primengColors`/`italianTranslation` are shared with the portfolio (see
// shared/primeng.config); `definePreset`/`Aura` stay local to each app
// since the shared file lives outside either app's node_modules.
const primengPreset = definePreset(Aura, {
	semantic: { primary: primengColors }
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
			},
			translation: italianTranslation
		}),
		provideFirebaseApp(() => initializeApp(firebaseConfig)),
		provideAppCheck(() =>
			initializeAppCheck(getApp(), {
				provider: new ReCaptchaV3Provider(recaptchaSiteKey),
				isTokenAutoRefreshEnabled: true
			})
		),
		provideFirestore(() => getFirestore()),
		provideAuth(() => getAuth())
	]
};
