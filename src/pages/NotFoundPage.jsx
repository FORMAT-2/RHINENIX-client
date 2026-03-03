import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-7xl font-extrabold text-primary-500">404</h1>
      <p className="mt-4 text-xl font-semibold text-gray-800">Page not found</p>
      <p className="mt-2 text-gray-500">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <Link to="/" className="btn-primary mt-6 inline-block">
        Go Home
      </Link>
    </div>
  );
}
