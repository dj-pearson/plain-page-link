import { useParams } from "react-router-dom";

export default function ProfilePage() {
    const { slug } = useParams<{ slug: string }>();

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <span className="text-3xl font-bold text-blue-600">
                                {slug?.[0].toUpperCase()}
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            @{slug}
                        </h1>
                        <p className="text-gray-600 mb-6">
                            Real Estate Agent Profile
                        </p>
                        <div className="text-sm text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="font-medium text-blue-900 mb-2">
                                🚧 Profile Component Coming Soon
                            </p>
                            <p>
                                This will display the agent's profile with
                                listings, contact info, and lead capture forms.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
