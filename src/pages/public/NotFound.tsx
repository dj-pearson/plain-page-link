import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4">
            <div className="text-center">
                <div className="mb-8">
                    <Home className="h-20 w-20 text-blue-600 mx-auto mb-4" />
                    <h1 className="text-9xl font-bold text-gray-900 mb-4">
                        404
                    </h1>
                    <h2 className="text-3xl font-semibold text-gray-700 mb-4">
                        Page Not Found
                    </h2>
                    <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                        The page you're looking for doesn't exist or has been
                        moved.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Home className="h-5 w-5" />
                        Go Home
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center gap-2 border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:border-gray-400 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    );
}
