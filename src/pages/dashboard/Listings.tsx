export default function Listings() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        Manage Listings
                    </h2>
                    <p className="text-gray-600">
                        Add and manage your property listings
                    </p>
                </div>
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    + Add Listing
                </button>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <p className="text-gray-600 mb-2">
                    🏠 Listing management component coming soon
                </p>
                <p className="text-sm text-gray-500">
                    You'll be able to add, edit, and organize your property
                    listings here
                </p>
            </div>
        </div>
    );
}
