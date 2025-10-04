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
	
	// For authenticated users on protected routes, check email verification
	if (isProtectedRoute(request) && isAuthenticated) {
		try {
			const user = await convexAuth.getUser();
			if (user && !user.emailVerificationTime) {
				// Allow access to verification page
				if (request.nextUrl.pathname === "/verify-email") {
					return;
				}
				// Redirect unverified users to verification page
				return nextjsMiddlewareRedirect(request, "/verify-email");
			}
		} catch (error) {
			console.error("Error checking user verification status:", error);
			// If there's an error checking verification, allow access
		}
	}
});

export const config = {
	// The following matcher runs middleware on all routes
	// except static assets.
	matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
