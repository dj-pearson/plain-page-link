export default function Testimonials() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        Testimonials
                    </h2>
                    <p className="text-gray-600">
                        Showcase client reviews and success stories
                    </p>
                </div>
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    + Add Testimonial
                </button>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <p className="text-gray-600 mb-2">
                    ⭐ Testimonial manager coming soon
                </p>
                <p className="text-sm text-gray-500">
                    Add and display client testimonials with ratings
                </p>
            </div>
        </div>
    );
}
