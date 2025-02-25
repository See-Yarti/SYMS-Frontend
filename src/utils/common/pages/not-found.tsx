import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const router = useNavigate();
  return (
    <section className="">
      <div className="container flex justify-center items-center min-h-screen px-6 py-12 mx-auto">
        <div>
          <p className="text-sm font-medium">404 error</p>
          <h1 className="mt-3 text-2xl font-semibold md:text-3xl">
            We can’t find that page
          </h1>
          <p className="mt-4">
            Sorry, the page you are looking for doesn't exist or has been moved.
          </p>

          <div className="flex items-center mt-6 gap-x-3">
            <Button
              className="flex items-center justify-center w-1/2 px-5 py-2 text-sm duration-200 gap-x-2 sm:w-auto"
              variant="secondary"
              onClick={() => {
                router(-1);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                className="w-5 h-5 rtl:rotate-180"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18"
                />
              </svg>
              <span>Go back</span>
            </Button>
            <Button
              className="w-1/2 px-5 py-2 text-sm tracking-wide transition-colors duration-200  rounded-lg shrink-0 sm:w-auto"
              onClick={() => {
                router('/');
              }}
            >
              Take me home
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NotFound;
