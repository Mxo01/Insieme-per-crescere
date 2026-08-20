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
	//
	// The tick is deferred with `queueMicrotask` rather than called inline:
	// called synchronously, it ran before Toast's own subscriber (also on
	// `messageObserver`) had applied the new message, and it could also fire
	// while Angular's own event dispatch was still mid-flight (e.g. the
	// close button's click handler), which left the zoneless scheduler's
	// pending-tick bookkeeping out of sync and silently dropped later
	// updates (a message needing an extra click to appear, or the toast not
	// disappearing when closed). Deferring lets every synchronous handler
	// for the current event finish first, so the tick always sees fresh
	// state and never overlaps Angular's own scheduling.
	constructor() {
		const messageService = inject(MessageService);
		const appRef = inject(ApplicationRef);
		const destroyRef = inject(DestroyRef);

		const subscription = messageService.messageObserver.subscribe(() =>
			queueMicrotask(() => appRef.tick())
		);
		destroyRef.onDestroy(() => subscription.unsubscribe());
	}
}
