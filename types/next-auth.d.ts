// types/next-auth.d.ts
import NextAuth from "next-auth";
import type { Role } from "@prisma/client"; // optional if you want Role type

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            role?: Role | null; // or string
        };
    }

    interface User {
        id: string;
        role?: Role;
    }
}
