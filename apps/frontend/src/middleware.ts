import NextAuth from "next-auth"
import authConfig from "./auth.config"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isPublicRoute = [
    '/',
    '/sign-up-login',
    '/contests',
    '/api/auth',
  ].some(route => req.nextUrl.pathname.startsWith(route));

  if (!isPublicRoute && !req.auth) {
    const newUrl = new URL("/sign-up-login", req.nextUrl.origin)
    return Response.redirect(newUrl)
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
