'use client';

import { useState, useRef, useEffect } from 'react';

export default function OTPInput({ length = 6, onComplete, loading = false }) {
  const [otp, setOtp] = useState(new Array(length).fill(''));
  const inputRefs = useRef([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Move to next input if value entered
    if (element.value && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }

    // Call onComplete when all digits filled
    if (newOtp.every((digit) => digit !== '')) {
      onComplete(newOtp.join(''));
    }
  };

  const handleKeyDown = (e, index) => {
    // Move to previous input on backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, length);
    const newOtp = [...otp];

    pastedData.split('').forEach((char, index) => {
      if (!isNaN(char) && index < length) {
        newOtp[index] = char;
      }
    });

    setOtp(newOtp);

    // Focus last filled input
    const lastFilledIndex = newOtp.findIndex((digit) => digit === '');
    if (lastFilledIndex !== -1) {
      inputRefs.current[lastFilledIndex].focus();
    } else {
      inputRefs.current[length - 1].focus();
      if (newOtp.every((digit) => digit !== '')) {
        onComplete(newOtp.join(''));
      }
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(ref) => (inputRefs.current[index] = ref)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e.target, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          disabled={loading}
          className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold bg-black/40 border-2 border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none transition disabled:opacity-50"
        />
      ))}
    </div>
  );
}
