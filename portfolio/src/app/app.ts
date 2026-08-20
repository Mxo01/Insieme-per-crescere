import { ApplicationRef, Component, DestroyRef, inject } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { Toast } from "primeng/toast";
import { MessageService } from "primeng/api";

@Component({
	selector: "app-root",
	imports: [RouterOutlet, Toast],
	providers: [MessageService],
	templateUrl: "./app.html",
	styleUrl: "./app.scss"
})
export class App {
	// PrimeNG's Toast updates its own state correctly off MessageService's
	// RxJS subject (confirmed: `markForCheck()` runs, its `messages` array
	// fills in), but nothing schedules a render pass for it under zoneless
	// change detection, so it never actually appears. Forcing a tick after
	// every message keeps every `messageService.add(...)` call site working
	// without having to patch each one individually.
	constructor() {
		const messageService = inject(MessageService);
		const appRef = inject(ApplicationRef);
		const destroyRef = inject(DestroyRef);

		const subscription = messageService.messageObserver.subscribe(() => appRef.tick());
		destroyRef.onDestroy(() => subscription.unsubscribe());
	}
}
