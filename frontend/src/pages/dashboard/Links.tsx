export default function Links() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        Custom Links
                    </h2>
                    <p className="text-gray-600">
                        Add custom CTAs and external links
                    </p>
                </div>
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    + Add Link
                </button>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <p className="text-gray-600 mb-2">
                    🔗 Link manager coming soon
                </p>
                <p className="text-sm text-gray-500">
                    Add links to open houses, market reports, and more
                </p>
            </div>
        </div>
    );
}
