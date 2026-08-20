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
import { firebaseConfig, recaptchaSiteKey } from "shared/firebase.config";
import { primengColors, italianTranslation } from "shared/primeng.config";
import { provideAppCheck, initializeAppCheck, ReCaptchaV3Provider } from "@angular/fire/app-check";

// `primengColors`/`italianTranslation` are shared with the dashboard (see
// shared/primeng.config); `definePreset`/`Aura` stay local to each app
// since the shared file lives outside either app's node_modules.
const primengPreset = definePreset(Aura, {
	semantic: { primary: primengColors }
});

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
				provider: new ReCaptchaV3Provider(recaptchaSiteKey),
				isTokenAutoRefreshEnabled: true
			})
		),
		provideAuth(() => getAuth())
	]
};
