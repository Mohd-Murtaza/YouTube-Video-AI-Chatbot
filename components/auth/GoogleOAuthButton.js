'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function GoogleOAuthButton({ mode = 'signin' }) {
  const { setUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Load Google OAuth script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
        });

        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          {
            theme: 'filled_black',
            size: 'large',
            text: mode === 'signin' ? 'signin_with' : 'signup_with',
            shape: 'rectangular',
            width: '100%',
          }
        );
      }
    };

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, [mode]);

  const handleGoogleCallback = async (response) => {
    try {
      // Send the credential token to your backend
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          credential: response.credential,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        console.log('✅ Google OAuth Success! User data:', data.user);
        
        // Set user in context AND localStorage (setUser is now setUserWithStorage)
        if (setUser) {
          setUser(data.user);
          console.log('✅ User set in AuthContext + localStorage');
        }
        
        // Redirect to home page
        console.log('✅ Redirecting to home...');
        window.location.href = '/';
      } else {
        console.error('❌ Google OAuth failed:', data.message);
        alert(data.message || 'Google authentication failed');
      }
    } catch (error) {
      console.error('❌ Google OAuth error:', error);
      alert('An error occurred during Google sign-in. Please try again.');
    }
  };

  return (
    <div className="w-full">
      <div id="google-signin-button" className="w-full"></div>
    </div>
  );
}
