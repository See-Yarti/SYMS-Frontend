// src/pages/auth/Login.tsx:

import LoginForm from './Login-Form';
import { Label } from '@/components/ui/label';
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import BlurFade from '@/components/ui/blur-fade';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';

const Login = () => {
  const { setTheme } = useTheme();

  React.useEffect(() => {
    setTheme('light'); 
  }, [setTheme]);

  return (
    <React.Fragment>
      <div className="min-h-screen bg-gradient-to-r from-blue-50 to-purple-50 flex items-center justify-center light overflow-hidden">
        <div className="w-full h-screen grid lg:grid-cols-2 p-4">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center justify-center p-8 overflow-y-auto"
          >
            <div className="w-full max-w-md">
              <div className="flex-1">
                <BlurFade delay={0.5} inView>
                  <div className="flex items-center space-x-2">
                    <Avatar className="rounded-md">
                      <AvatarImage src="https://images.unsplash.com/photo-1517026575980-3e1e2dedeab4?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjV8fGNhcnxlbnwwfHwwfHx8MA%3D%3D" alt="car-logo" />
                      <AvatarFallback>CR</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <Label className="text-2xl font-bold text-gray-900">CarRentals</Label>
                      <Label className="text-sm text-gray-500">
                        Your gateway to the best car rental experience
                      </Label>
                    </div>
                  </div>
                </BlurFade>
              </div>
              <BlurFade delay={0.6} inView>
                <div className="mt-10">
                  <div className="mb-6 space-y-2">
                    <Label className="text-3xl font-bold text-gray-900">Welcome Back</Label>
                    <Label className="block text-gray-500 text-sm">
                      Enter your email and password to access your account.
                    </Label>
                  </div>
                  <LoginForm />
                  {/* <div className="flex items-center justify-center w-full my-5">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="px-4 text-gray-500">or</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div> */}
                  {/* <div className="mt-6">
                    <p className="text-start text-sm text-gray-500">
                      Don't have an account?{' '}
                      <Link
                        to="/register"
                        className="font-medium text-gray-600 hover:text-gray-800"
                      >
                        Register now
                      </Link>
                    </p>
                  </div> */}
                </div>
              </BlurFade>
            </div>
          </motion.div>

          {/* Right Side: Car Image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="hidden lg:flex items-center justify-center bg-cover bg-center overflow-hidden rounded-xl" // Ensure no overflow
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1567808291548-fc3ee04dbcf0?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fGNhcnxlbnwwfHwwfHx8MA%3D%3D')`,
            }}
          >

          </motion.div>
        </div>
      </div>
    </React.Fragment>
  );
};
export default Login;