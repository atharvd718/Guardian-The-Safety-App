import React, { createContext, useContext } from 'react';
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  useUser as useClerkUser,
  UserButton,
} from '@clerk/clerk-react';
import { StorageService } from './storage';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
export const isClerkConfigured = Boolean(
  CLERK_PUBLISHABLE_KEY && CLERK_PUBLISHABLE_KEY.trim().length > 0
);

export interface AppUser {
  id: string;
  firstName: string | null;
  fullName: string | null;
  primaryEmailAddress: { emailAddress: string } | null;
  emailAddresses: { emailAddress: string }[];
}

interface AuthContextValue {
  user: AppUser | null;
  isLoaded: boolean;
  isClerk: boolean;
}

const AppAuthContext = createContext<AuthContextValue>({
  user: null,
  isLoaded: true,
  isClerk: false,
});

const ClerkAuthBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoaded } = useClerkUser();
  const mappedUser: AppUser | null = user
    ? {
        id: user.id,
        firstName: user.firstName,
        fullName: user.fullName,
        primaryEmailAddress: user.primaryEmailAddress
          ? { emailAddress: user.primaryEmailAddress.emailAddress }
          : null,
        emailAddresses: user.emailAddresses.map((e) => ({
          emailAddress: e.emailAddress,
        })),
      }
    : null;

  return (
    <AppAuthContext.Provider value={{ user: mappedUser, isLoaded, isClerk: true }}>
      {children}
    </AppAuthContext.Provider>
  );
};

const LocalAuthBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const stored = StorageService.getCurrentUser();
  const mappedUser: AppUser | null = stored
    ? {
        id: stored.uid,
        firstName: stored.name.split(' ')[0] || stored.name,
        fullName: stored.name,
        primaryEmailAddress: stored.email ? { emailAddress: stored.email } : null,
        emailAddresses: stored.email ? [{ emailAddress: stored.email }] : [],
      }
    : null;

  return (
    <AppAuthContext.Provider value={{ user: mappedUser, isLoaded: true, isClerk: false }}>
      {children}
    </AppAuthContext.Provider>
  );
};

export const AppAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (isClerkConfigured) {
    return (
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        <ClerkAuthBridge>{children}</ClerkAuthBridge>
      </ClerkProvider>
    );
  }
  return <LocalAuthBridge>{children}</LocalAuthBridge>;
};

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (isClerkConfigured) {
    return (
      <>
        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
        <SignedIn>{children}</SignedIn>
      </>
    );
  }
  return <>{children}</>;
};

export function useAppUser() {
  return useContext(AppAuthContext);
}

export const AppUserButton: React.FC = () => {
  const { user, isClerk } = useAppUser();
  if (isClerk) {
    return <UserButton afterSignOutUrl="/" />;
  }
  const initial = (user?.firstName || user?.fullName || 'G').charAt(0).toUpperCase();
  return (
    <div
      className="w-9 h-9 rounded-full bg-[var(--color-primary)] text-white font-bold flex items-center justify-center text-sm shadow-sm"
      title={user?.fullName || 'Guardian User'}
    >
      {initial}
    </div>
  );
};
