import React, { useState } from 'react'
import { X } from "lucide-react"
import axios from "axios";

function StatusModal({onClose, status}) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                {/* Modal Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-xl">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Enter Shipping Price</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                    {/* Modal content */}
                    <div>
                        {status}
                    </div>
                {/* Form for entering shipping price */}
                <div className="p-6">
                    <div className="mb-4">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StatusModal