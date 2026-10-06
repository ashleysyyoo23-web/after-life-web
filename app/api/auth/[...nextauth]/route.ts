import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";
import type { Account } from "next-auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type TokenWithAccess = JWT & { accessToken?: string };

// 로그인할 때 받은 Drive 권한을 "연결된 Google 계정"으로 바로 저장 → 고인 불러오기에서 동의를 한 번 더 받지 않아도 됨.
// 오래 쓰는 권한(refresh_token)은 Google 이 그 계정이 처음 동의할 때만 주므로, 받았을 때만 저장해요.
// (이미 동의했던 계정은 예전처럼 "Google Drive 계정 연결하기"로 연결)
async function saveLoginDriveConnection(email: string, account: Account) {
  if (!account.access_token || !account.refresh_token) return;
  // 동의 화면에서 "Google Drive 파일 보기" 체크를 뺐으면 사진을 읽을 수 없으니 저장하지 않음
  if (!account.scope?.includes("auth/drive.readonly")) return;
  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("drive_connections").upsert(
      {
        owner_email: email,
        google_email: email,
        access_token: account.access_token,
        refresh_token: account.refresh_token,
        needs_reconnect: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "owner_email,google_email" },
    );
    if (error) console.error("[auth] login Drive connection save failed", error.message);
  } catch (saveError) {
    // 저장을 못 해도 로그인은 그대로 (나중에 따로 연결하면 됨)
    console.error("[auth] login Drive connection save failed", saveError);
  }
}

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
        if (token.email) await saveLoginDriveConnection(token.email, account);
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
