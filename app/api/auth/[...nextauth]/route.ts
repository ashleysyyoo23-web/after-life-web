import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";

type TokenWithAccess = JWT & { accessToken?: string };

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  // 기본 영어 로그인·오류 화면 대신 우리 로그인 입구
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/drive.readonly",
            "https://www.googleapis.com/auth/drive.metadata.readonly",
          ].join(" "),
          access_type: "offline",
          prompt: "select_account",
        },
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      if (new URL(url).origin === baseUrl) {
        return url;
      }

      return `${baseUrl}/mainland?settings=legacy`;
    },
    async jwt({ token, account }) {
      if (account?.access_token) {
        (token as TokenWithAccess).accessToken = account.access_token;
      }

      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        accessToken: (token as TokenWithAccess).accessToken,
      };
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
