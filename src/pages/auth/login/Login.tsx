// src/pages/auth/Login.tsx:

import LoginForm from './Login-Form';
import React from 'react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';

const Login = () => {
  const { setTheme } = useTheme();

  React.useEffect(() => {
    setTheme('light');
  }, [setTheme]);

  return (
    <React.Fragment>
      <div className="min-h-screen bg-white flex items-center justify-center overflow-hidden">
        <div className="w-full min-h-screen grid lg:grid-cols-[50%_50%] lg:h-screen p-4 sm:p-6 md:p-8">
          {/* Left Side: Car Image with Promotional Text */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="hidden lg:flex items-center justify-center relative overflow-hidden rounded-3xl"
            style={{
              backgroundImage: `url('/images/auth/login.svg')`,
              backgroundSize: '100% auto',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            {/* Overlay for better text readability */}
            <div className="absolute inset-0 bg-black/20"></div>

            {/* Promotional Text Overlay */}
            <div className="absolute top-20 z-10 max-w-2xl px-6 lg:px-10">
              <p className="text-[#FFFFFF] text-2xl md:text-3xl lg:text-4xl font-semibold leading-tight drop-shadow-lg font-montserrat">
                Rent Your Dream Ride Today! Seamless Vehicle Reservation at Your Fingertips.
              </p>
            </div>
          </motion.div>

          {/* Right Side: Login Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-8 overflow-y-auto bg-white w-full min-h-screen lg:min-h-0"
          >
            <div className="w-full max-w-md mx-auto">
              {/* Logo */}
              <div className="flex justify-center mb-4 sm:mb-6">
                <img
                  src="/images/logo1.svg"
                  alt="Logo"
                  className='w-[130px] h-[25px] sm:w-[156px] sm:h-[30px]'
                />
              </div>

              {/* Welcome Section */}
              <div className="mb-6 sm:mb-8 text-center px-2 sm:px-0">
                <h2 className="text-2xl sm:text-3xl font-semibold text-[#1A1A1A] mb-2 font-montserrat">
                  Welcome Back
                </h2>
                <p className="text-[#999999] text-xs sm:text-sm">
                  Enter your email and password to access your account.
                </p>
              </div>

              {/* Login Form */}
              <LoginForm />
            </div>
          </motion.div>
        </div>
      </div>
    </React.Fragment>
  );
};
export default Login;
