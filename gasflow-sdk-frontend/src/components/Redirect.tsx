import { useEffect } from 'react';

interface RedirectProps {
  to: string;
  message?: string;
}

const Redirect = ({ to, message = "Redirecting..." }: RedirectProps) => {
  useEffect(() => {
    window.location.href = to;
  }, [to]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

export default Redirect;
