import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth/auth";

export const adminGuard: CanActivateFn = () => {
	/* const authService = inject(AuthService);
	const router = inject(Router);

	const isAuthenticated = authService.user() !== null;

	if (!isAuthenticated) router.navigate(["login"]);

	return isAuthenticated; */
	return true
};
