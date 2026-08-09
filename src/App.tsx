import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { ScreenType } from './types';
import { StorageService } from './lib/storage';
import { auth, FirebaseService } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { SplashScreen } from './components/SplashScreen';
import { OnboardingCarousel } from './components/OnboardingCarousel';
import { LoginView } from './components/Auth/LoginView';
import { RegisterView } from './components/Auth/RegisterView';
import { RegisterDetailView } from './components/Auth/RegisterDetailView';
import { DashboardView } from './components/DashboardView';
import { EmergencySmsView } from './components/EmergencySmsView';
import { RecordAudioView } from './components/RecordAudioView';
import { TrackMeView } from './components/TrackMeView';
import { AddedContactsView } from './components/AddedContactsView';
import { AddContactsView } from './components/AddContactsView';
import { ARIAView } from './components/ARIAView';
import { SafePlacesView } from './components/SafePlacesView';
import { HelplinesView } from './components/HelplinesView';
import { SelfDefenseView } from './components/SelfDefenseView';
import InstallPWA from './components/InstallPWA';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('splash');
  const [registerData, setRegisterData] = useState<{
    name: string;
    email: string;
    pass: string;
  }>({ name: '', email: '', pass: '' });

  useEffect(() => {
    // Listen to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const currentUser = StorageService.getCurrentUser();
        if (!currentUser || currentUser.uid !== firebaseUser.uid) {
          const userObj = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || currentUser?.name || 'Guardian User',
            email: firebaseUser.email || currentUser?.email || 'user@guardian.app',
            phone: firebaseUser.phoneNumber || currentUser?.phone || '',
            dob: currentUser?.dob || '',
          };
          StorageService.setCurrentUser(userObj);
        }

        // Fetch contacts from Firestore and sync local storage
        try {
          const remoteContacts = await FirebaseService.getContacts(firebaseUser.uid);
          if (remoteContacts && remoteContacts.length > 0) {
            StorageService.setContacts(remoteContacts);
          }
          const remoteAudio = await FirebaseService.getAudioRecordings(firebaseUser.uid);
          if (remoteAudio && remoteAudio.length > 0) {
            StorageService.saveAudioRecordings(remoteAudio);
          }
        } catch (e) {
          console.error('Error fetching Firestore user data on auth change:', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const action = params.get('action')
    if (action === 'sos' && currentScreen === 'dashboard') {
      // Will auto-trigger SOS when opened via homescreen shortcut
      console.log('SOS shortcut triggered')
    }
    if (action === 'aria') {
      setCurrentScreen('aria')
    }
    if (action === 'helplines') {
      setCurrentScreen('helplines')
    }
  }, [])

  const handleSplashFinish = () => {
    if (!StorageService.isOnboardingFinished()) {
      setCurrentScreen('onboarding');
    } else if (StorageService.getCurrentUser()) {
      setCurrentScreen('dashboard');
    } else {
      setCurrentScreen('login');
    }
  };

  const handleOnboardingComplete = () => {
    StorageService.setOnboardingFinished(true);
    if (StorageService.getCurrentUser()) {
      setCurrentScreen('dashboard');
    } else {
      setCurrentScreen('login');
    }
  };

  const handleLogout = () => {
    StorageService.logoutUser();
    setCurrentScreen('login');
  };

  return (
    <>
      <Toaster position="top-center" />
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        <div className="min-h-screen bg-slate-200 flex items-center justify-center font-sans antialiased sm:py-6">
          <div className="w-full max-w-md bg-white sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
            {currentScreen === 'splash' && (
              <SplashScreen onFinish={handleSplashFinish} />
            )}

            {currentScreen === 'onboarding' && (
              <OnboardingCarousel onComplete={handleOnboardingComplete} />
            )}

            {currentScreen === 'login' && (
              <LoginView
                onNavigateRegister={() => setCurrentScreen('register')}
                onLoginSuccess={() => setCurrentScreen('dashboard')}
              />
            )}

            {currentScreen === 'register' && (
              <RegisterView
                onNavigateLogin={() => setCurrentScreen('login')}
                onNext={(data: any) => {
                  setRegisterData(data);
                  setCurrentScreen('register_detail');
                }}
              />
            )}

            {currentScreen === 'register_detail' && (
              <RegisterDetailView
                initialData={registerData}
                onBack={() => setCurrentScreen('register')}
                onRegisterSuccess={() => setCurrentScreen('dashboard')}
              />
            )}

            {currentScreen === 'dashboard' && (
              <DashboardView
                onNavigate={setCurrentScreen}
                onLogout={handleLogout}
              />
            )}

            {currentScreen === 'emergency_sms' && (
              <EmergencySmsView onBack={() => setCurrentScreen('dashboard')} onNavigate={(screen: any) => setCurrentScreen(screen)} />
            )}

            {currentScreen === 'record_audio' && (
              <RecordAudioView onBack={() => setCurrentScreen('dashboard')} />
            )}

            {currentScreen === 'track_me' && (
              <TrackMeView onBack={() => setCurrentScreen('dashboard')} />
            )}

            {currentScreen === 'added_contacts' && (
              <AddedContactsView
                onBack={() => setCurrentScreen('dashboard')}
                onNavigateAdd={() => setCurrentScreen('add_contacts')}
              />
            )}

            {currentScreen === 'add_contacts' && (
              <AddContactsView onBack={() => setCurrentScreen('added_contacts')} />
            )}

            {currentScreen === 'aria' && (
              <ARIAView onBack={() => setCurrentScreen('dashboard')} />
            )}

            {currentScreen === 'safe_places' && (
              <SafePlacesView onBack={() => setCurrentScreen('dashboard')} />
            )}

            {currentScreen === 'helplines' && (
              <HelplinesView onBack={() => setCurrentScreen('dashboard')} />
            )}

            {currentScreen === 'self_defense' && (
              <SelfDefenseView onBack={() => setCurrentScreen('dashboard')} />
            )}
          </div>
        </div>
      </SignedIn>
      <InstallPWA />
    </>
  );
}

export default App;
