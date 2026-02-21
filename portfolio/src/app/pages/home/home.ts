import { Component } from '@angular/core';
import { ButtonModule } from "primeng/button";
import { RouterLink } from "@angular/router";
import { TagModule } from "primeng/tag";

@Component({
  selector: 'app-home',
  imports: [ButtonModule, RouterLink, TagModule],
  templateUrl: './home.html'
})
export class Home {

}
