import { Component } from "@angular/core";
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
export class App {}
