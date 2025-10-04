import {
	convexAuthNextjsMiddleware,
	createRouteMatcher,
	nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isSignInPage = createRouteMatcher(["/signin"]);
const isAuthPage = createRouteMatcher(["/signin", "/verify-email", "/reset-password"]);
const isProtectedRoute = createRouteMatcher(["/", "/server", "/game", "/lobby", "/problems"]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
	const isAuthenticated = await convexAuth.isAuthenticated();
	
	// Redirect authenticated users away from auth pages
	if (isAuthPage(request) && isAuthenticated) {
		return nextjsMiddlewareRedirect(request, "/");
	}
	
	// Redirect unauthenticated users to sign in
	if (isProtectedRoute(request) && !isAuthenticated) {
		return nextjsMiddlewareRedirect(request, "/signin");
	}
	
	// For authenticated users on protected routes, allow request to continue
	if (isProtectedRoute(request) && isAuthenticated) {
		return;
	}
});

export const config = {
	// The following matcher runs middleware on all routes
	// except static assets.
	matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
