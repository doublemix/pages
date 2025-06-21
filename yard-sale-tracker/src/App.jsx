import React, { useState, useEffect, useCallback, Component } from 'react'; // Import Component for ErrorBoundary

// Utility function to format amounts for display (e.g., $1.50 or 50¢)
const formatAmountDisplay = (amount) => {
    const value = parseFloat(amount);
    if (isNaN(value)) return '';

    if (value < 1 && value >= 0.01) { // Only show cents for values between 1 cent and 99 cents
        return `${Math.round(value * 100)}¢`;
    }
    return `$${value.toFixed(2)}`;
};

// --- ErrorBoundary Component ---
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    // Static method to update state when an error is caught
    static getDerivedStateFromError(error) {
        // Update state so the next render shows the fallback UI.
        return { hasError: true, error: error };
    }

    // Lifecycle method to catch error information
    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error in component (caught by ErrorBoundary):", error, errorInfo);
        this.setState({ errorInfo: errorInfo });

        // Re-throw the error to ensure it appears in the console for debugging by Gemini
        throw error;
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-red-100 text-red-800 p-8 text-center font-sans">
                    <h2 className="text-3xl font-bold mb-4">Oops! Something went wrong.</h2>
                    <p className="text-lg mb-6">We're sorry, but an unexpected error occurred.</p>
                    {/* Optionally display error details in development */}
                    {this.state.error && (
                        <div className="bg-red-200 p-4 rounded-lg text-sm text-left overflow-auto max-w-lg">
                            <details>
                                <summary className="font-semibold cursor-pointer">Error Details</summary>
                                <pre className="whitespace-pre-wrap break-all text-xs mt-2">
                                    {this.state.error.toString()}
                                    <br />
                                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        </div>
                    )}
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-8 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition duration-200"
                    >
                        Reload App
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

// --- Header Component ---
const AppHeader = ({ currentScreen, goToSettings, goBack, toggleDebugger }) => {
    let title = "Yard Sale Tracker"; // Default title
    if (currentScreen === 'settings') title = "Settings";
    else if (currentScreen === 'transaction') title = "New Transaction";
    else if (currentScreen === 'home') title = "Sales Reports";

    return (
        <header className="fixed top-0 left-0 right-0 bg-blue-700 text-white p-4 flex items-center justify-between shadow-md z-10 h-[60px] sm:h-[70px]">
            <div className="flex items-center"> {/* Group left-aligned buttons/placeholders */}
                {currentScreen === 'settings' ? (
                    <button
                        onClick={goBack}
                        className="text-white text-lg rounded-full hover:bg-blue-500 transition w-9 h-9 flex items-center justify-center mr-2" // Increased size
                        aria-label="Back"
                    >
                        <i className="fas fa-arrow-left"></i>
                    </button>
                ) : (
                    <div className="w-9 h-9 mr-2" /> // Placeholder to maintain spacing, matching new button size
                )}
            </div>
            <h1 className="text-xl font-bold flex-grow text-center">{title}</h1>
            <div className="flex items-center"> {/* Group right-aligned buttons/placeholders */}
                <button
                    onClick={toggleDebugger}
                    className="text-white text-lg rounded-full hover:bg-blue-500 transition w-9 h-9 flex items-center justify-center mr-2" // Increased size
                    aria-label="Toggle Debugger"
                >
                    <i className="fas fa-terminal"></i>
                </button>
                {currentScreen !== 'settings' && ( // Only show settings icon if not on settings page
                    <button
                        onClick={goToSettings}
                        className="text-white text-lg rounded-full hover:bg-blue-500 transition w-9 h-9 flex items-center justify-center" // Increased size
                        aria-label="Settings"
                    >
                        <i className="fas fa-cog"></i>
                    </button>
                )}
                {currentScreen === 'settings' && (
                    <div className="w-9 h-9 ml-2" /> // Placeholder to balance spacing when settings icon is hidden, matching new button size
                )}
            </div>
        </header>
    );
};

// --- Footer Component ---
const AppFooter = ({ currentScreen, goToTransaction, confirmPurchase, cancelTransaction, goToHome, currentTransactionLength }) => {
    return (
        <footer className="fixed bottom-0 left-0 right-0 bg-gray-100 p-3 sm:p-4 flex items-center justify-center shadow-md z-10 border-t border-gray-200 h-[76px] sm:h-[80px]">
            {currentScreen === 'home' && (
                <button
                    onClick={goToTransaction}
                    className="w-full sm:w-auto px-6 py-3 bg-green-500 text-white font-bold rounded-lg shadow-lg hover:bg-green-600 transition duration-200 ease-in-out transform hover:scale-105 flex items-center justify-center"
                >
                    <i className="fas fa-cash-register mr-2"></i>Start New Transaction
                </button>
            )}
            {currentScreen === 'transaction' && (
                <div className="flex w-full gap-3 sm:gap-4">
                    <button
                        onClick={confirmPurchase}
                        className="flex-1 py-3 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition duration-200 ease-in-out transform hover:scale-105"
                        disabled={currentTransactionLength === 0}
                    >
                        Confirm Purchase
                    </button>
                    <button
                        onClick={cancelTransaction}
                        className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 transition duration-200 ease-in-out transform hover:scale-105"
                        disabled={currentTransactionLength === 0}
                    >
                        Cancel Purchase
                    </button>
                </div>
            )}
            {/* The "Go to Home" button is removed from settings screen footer */}
        </footer>
    );
};

// --- Settings Screen Component ---
const SettingsScreen = ({
    sellers, setSellers, newSellerName, setNewSellerName, addSeller,
    editingSellerId, startEditSeller, saveEditedSeller, cancelEditSeller, deleteSeller, editedSellerName, setEditedSellerName,
    quickItems, setQuickItems, newQuickItemName, setNewQuickItemName, newQuickItemAmount, setNewQuickItemAmount, newQuickItemSellerId, setNewQuickItemSellerId, addQuickItem,
    editingQuickItemId, startEditQuickItem, saveEditedQuickItem, cancelEditQuickItem, deleteQuickItem, editedQuickItemName, setEditedQuickItemName, editedQuickItemAmount, setEditedQuickItemAmount, editedQuickItemSellerId, setEditedQuickItemSellerId,
    getSellerName, handleSaveToFile, handleLoadFromFile, statusMessage, setStatusMessage,
    itemToCreateQuickFrom, clearItemToCreateQuickFrom,
    showSaveModal, setShowSaveModal, showLoadModal, setShowLoadModal, jsonToSave, setJsonToSave, jsonToLoad, setJsonToLoad, handleLoadFromPastedJson
}) => {
    // Effect to pre-populate quick item form if itemToCreateQuickFrom is present
    useEffect(() => {
        if (itemToCreateQuickFrom) {
            setNewQuickItemName(itemToCreateQuickFrom.name);
            setNewQuickItemAmount(itemToCreateQuickFrom.amount.toFixed(2));
            setNewQuickItemSellerId(itemToCreateQuickFrom.sellerId);
            clearItemToCreateQuickFrom(); // Clear the flag in parent after using it
        }
    }, [itemToCreateQuickFrom, setNewQuickItemName, setNewQuickItemAmount, setNewQuickItemSellerId, clearItemToCreateQuickFrom]);

    const copyToClipboard = () => {
        const textarea = document.createElement('textarea');
        textarea.value = jsonToSave;
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            setStatusMessage('Data copied to clipboard!');
        } catch (err) {
            setStatusMessage('Failed to copy data to clipboard. Please copy manually.');
            console.error('Failed to copy:', err);
        }
        document.body.removeChild(textarea);
        setTimeout(() => setStatusMessage(''), 3000); // Clear message after 3 seconds
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 flex flex-col items-stretch w-full sm:max-w-2xl sm:mx-auto sm:my-8">
            {/* File Management Buttons */}
            <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-4 pb-2 border-b border-gray-200">File Management</h3>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
                <button
                    onClick={handleSaveToFile}
                    className="flex-1 py-2 sm:py-3 bg-indigo-500 text-white text-sm sm:text-base font-semibold rounded-lg shadow-md hover:bg-indigo-600 transition duration-200 ease-in-out transform hover:scale-105 flex items-center justify-center"
                >
                    <i className="fas fa-save mr-2"></i>Save Data to File
                </button>
                <button
                    onClick={handleLoadFromFile}
                    className="flex-1 py-2 sm:py-3 bg-purple-500 text-white text-sm sm:text-base font-semibold rounded-lg shadow-md hover:bg-purple-600 transition duration-200 ease-in-out transform hover:scale-105 flex items-center justify-center"
                >
                    <i className="fas fa-folder-open mr-2"></i>Load Data from File
                </button>
            </div>
            {statusMessage && (
                <p className="text-center text-xs sm:text-sm mb-4 p-2 bg-gray-100 rounded-lg text-gray-700">{statusMessage}</p>
            )}

            {/* Save Data Modal/Section */}
            {showSaveModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-20">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl flex flex-col items-stretch">
                        <h4 className="text-lg font-bold mb-4">Copy Data to Clipboard</h4>
                        <p className="text-sm text-gray-700 mb-4">Your browser does not support direct file saving. Please copy the data below and save it to a file manually.</p>
                        <textarea
                            readOnly
                            value={jsonToSave}
                            className="w-full h-40 p-3 border border-gray-300 rounded-lg font-mono text-xs overflow-auto resize-none mb-4"
                        ></textarea>
                        <div className="flex gap-3">
                            <button
                                onClick={copyToClipboard}
                                className="flex-1 py-2 px-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition"
                            >
                                Copy to Clipboard
                            </button>
                            <button
                                onClick={() => setShowSaveModal(false)}
                                className="flex-1 py-2 px-4 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Load Data Modal/Section */}
            {showLoadModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-20">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl flex flex-col items-stretch">
                        <h4 className="text-lg font-bold mb-4">Paste Data to Load</h4>
                        <p className="text-sm text-gray-700 mb-4">Your browser does not support direct file loading. Please paste your Yard Sale data JSON below.</p>
                        <textarea
                            placeholder="Paste JSON data here..."
                            value={jsonToLoad}
                            onChange={(e) => setJsonToLoad(e.target.value)}
                            className="w-full h-40 p-3 border border-gray-300 rounded-lg font-mono text-xs overflow-auto resize-none mb-4"
                        ></textarea>
                        <div className="flex gap-3">
                            <button
                                onClick={handleLoadFromPastedJson}
                                className="flex-1 py-2 px-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition"
                            >
                                Load Data
                            </button>
                            <button
                                onClick={() => setShowLoadModal(false)}
                                className="flex-1 py-2 px-4 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sellers Management */}
            <h3 className="text-xl sm:text-2xl font-bold text-blue-600 mb-4 pb-2 border-b border-blue-100">Manage Sellers</h3>
            {/* Form for adding new seller */}
            <form onSubmit={addSeller} className="flex mb-4 gap-2">
                <input
                    type="text"
                    placeholder="New Seller Name"
                    value={newSellerName}
                    onChange={(e) => setNewSellerName(e.target.value)}
                    className="flex-grow p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                />
                <button
                    type="submit" // Set type to submit for form submission
                    className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition duration-200 ease-in-out transform hover:scale-105"
                >
                    Add Seller
                </button>
            </form>
            <div className="max-h-64 overflow-y-auto mb-6">
                {sellers.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No sellers defined yet. Add some!</p>
                ) : (
                    <ul className="space-y-2">
                        {sellers.map(seller => (
                            <li key={seller.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg shadow-sm hover:bg-blue-100 transition duration-150">
                                {editingSellerId === seller.id ? (
                                    // Form for editing seller
                                    <form onSubmit={(e) => { e.preventDefault(); saveEditedSeller(seller.id); }} className="flex items-center w-full gap-2">
                                        <input
                                            type="text"
                                            value={editedSellerName}
                                            onChange={(e) => setEditedSellerName(e.target.value)}
                                            className="flex-grow p-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-400"
                                        />
                                        <button type="submit" className="text-green-600 hover:text-green-800 rounded-full hover:bg-green-100 transition w-8 h-8 flex items-center justify-center"><i className="fas fa-check"></i></button>
                                        <button type="button" onClick={cancelEditSeller} className="text-red-600 hover:text-red-800 rounded-full hover:bg-red-100 transition w-8 h-8 flex items-center justify-center"><i className="fas fa-times"></i></button>
                                    </form>
                                ) : (
                                    <>
                                        <span className="font-medium text-blue-800">{seller.name}</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => startEditSeller(seller)} className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100 transition"><i className="fas fa-edit"></i></button>
                                            <button onClick={() => deleteSeller(seller.id)} className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100 transition"><i className="fas fa-trash-alt"></i></button>
                                        </div>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Quick Items Management */}
            <h3 className="text-xl sm:text-2xl font-bold text-purple-600 mb-4 pb-2 border-b border-purple-100 mt-6">Manage Quick Items</h3>
            {sellers.length === 0 ? (
                <p className="text-red-500 mb-4 text-center">Add sellers first to define quick items.</p>
            ) : (
                // Form for adding new quick item
                <form onSubmit={addQuickItem} className="mb-4 space-y-2">
                    <input
                        type="text"
                        placeholder="Quick Item Name (Optional)"
                        value={newQuickItemName}
                        onChange={(e) => setNewQuickItemName(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
                    />
                    <input
                        type="number"
                        step="0.01"
                        placeholder="Amount ($)"
                        value={newQuickItemAmount}
                        onChange={(e) => setNewQuickItemAmount(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
                    />
                    <select
                        value={newQuickItemSellerId}
                        onChange={(e) => setNewQuickItemSellerId(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 bg-white"
                    >
                        <option value="">Select Seller</option>
                        {sellers.map(seller => (
                            <option key={seller.id} value={seller.id}>{seller.name}</option>
                        ))}
                    </select>
                    <button
                        type="submit" // Set type to submit for form submission
                        className="w-full py-2 bg-purple-500 text-white font-semibold rounded-lg shadow-md hover:bg-purple-600 transition duration-200 ease-in-out transform hover:scale-105"
                        disabled={!newQuickItemSellerId || parseFloat(newQuickItemAmount) <= 0}
                    >
                        Add Quick Item
                    </button>
                </form>
            )}
            <div className="max-h-64 overflow-y-auto">
                {quickItems.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No quick items defined.</p>
                ) : (
                    <ul className="space-y-2">
                        {quickItems.map(item => (
                            <li key={item.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg shadow-sm hover:bg-purple-100 transition duration-150">
                                {editingQuickItemId === item.id ? (
                                    // Form for editing quick item
                                    <form onSubmit={(e) => { e.preventDefault(); saveEditedQuickItem(item.id); }} className="flex flex-col gap-2 w-full">
                                        <input
                                            type="text"
                                            value={editedQuickItemName}
                                            onChange={(e) => setEditedQuickItemName(e.target.value)}
                                            className="p-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-400"
                                        />
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={editedQuickItemAmount}
                                            onChange={(e) => setEditedQuickItemAmount(e.target.value)}
                                            className="p-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-400"
                                        />
                                        <select
                                            value={editedQuickItemSellerId}
                                            onChange={(e) => setEditedQuickItemSellerId(e.target.value)}
                                            className="p-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-400 bg-white"
                                        >
                                            {sellers.map(seller => (
                                                <option key={seller.id} value={seller.id}>{seller.name}</option>
                                            ))}
                                        </select>
                                        <div className="flex gap-2 justify-end">
                                            <button type="submit" className="text-green-600 hover:text-green-800 rounded-full hover:bg-green-100 transition w-8 h-8 flex items-center justify-center"><i className="fas fa-check"></i></button>
                                            <button type="button" onClick={cancelEditQuickItem} className="text-red-600 hover:text-red-800 rounded-full hover:bg-red-100 transition w-8 h-8 flex items-center justify-center"><i className="fas fa-times"></i></button>
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        <div className="flex-grow">
                                            <span className="font-medium text-purple-800">{item.name || 'Untitled Quick Item'}</span>
                                            <span className="text-sm text-gray-600 block">({getSellerName(item.sellerId)}) - {formatAmountDisplay(item.amount)}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => startEditQuickItem(item)} className="text-purple-600 hover:text-purple-800 p-1 rounded-full hover:bg-purple-100 transition"><i className="fas fa-edit"></i></button>
                                            <button onClick={() => deleteQuickItem(item.id)} className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100 transition"><i className="fas fa-trash-alt"></i></button>
                                        </div>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

// --- Home Screen Component ---
const HomeScreen = ({
    sellers, soldItems, salesPerSeller, goToSettings, goToTransaction,
    editingSoldItemId, startEditSoldItem, saveEditedSoldItem, cancelEditSoldItem, deleteSoldItem, editedSoldItemName, setEditedSoldItemName, editedSoldItemAmount, setEditedSoldItemAmount, editedSoldItemSellerId, setEditedSoldItemSellerId,
    getSellerName, createQuickItemFromSoldItem, // New prop for quick item creation
    selectedFilterSellerId, setSelectedFilterSellerId // New props for filtering
}) => {
    const grandTotal = Object.values(salesPerSeller).reduce((sum, total) => sum + total, 0);

    const filteredSoldItems = selectedFilterSellerId
        ? soldItems.filter(item => item.sellerId === selectedFilterSellerId)
        : soldItems;

    const getFilteredTitle = () => {
        if (selectedFilterSellerId) {
            const seller = sellers.find(s => s.id === selectedFilterSellerId);
            return seller ? `Sold Items for ${seller.name}` : 'Sold Items (Unknown Seller)';
        }
        return 'All Sold Items:';
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 flex flex-col items-stretch w-full sm:max-w-2xl sm:mx-auto sm:my-8">
            {/* Grand Total at Top */}
            <div className="flex justify-between items-center text-xl sm:text-2xl font-bold text-sky-800 mb-6 pb-2 border-b-2 border-sky-300">
                <span>Grand Total:</span>
                <span>${grandTotal.toFixed(2)}</span>
            </div>

            {/* Sales Per Seller Cards */}
            <h3 className="text-xl sm:text-2xl font-semibold text-sky-800 mb-2">Sales Per Seller:</h3>
            {sellers.length === 0 ? (
                <p className="text-gray-500 mb-6">No sellers to report on.</p>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                    {sellers.map(seller => (
                        <button
                            key={seller.id}
                            onClick={() => {
                                // Toggle filter: if already selected, clear it; otherwise, set it
                                setSelectedFilterSellerId(prevId => prevId === seller.id ? null : seller.id);
                            }}
                            className={`flex flex-col items-center justify-center p-3 rounded-lg shadow-md transition duration-200 ease-in-out transform hover:scale-105
                                ${selectedFilterSellerId === seller.id
                                    ? 'bg-sky-600 text-white ring-2 ring-sky-800 ring-offset-2 ring-offset-white'
                                    : 'bg-sky-100 text-sky-700 hover:bg-sky-200'
                                }`}
                        >
                            <span className="font-bold text-lg">{seller.name}</span>
                            <span className="text-sm">{formatAmountDisplay(salesPerSeller[seller.id] || 0)}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* All Sold Items (Filtered) */}
            <h3 className="text-xl sm:text-2xl font-semibold text-sky-800 mb-2">{getFilteredTitle()}</h3>
            <div className="flex-grow overflow-y-auto sm:max-h-96">
                {filteredSoldItems.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                        {selectedFilterSellerId ? `No items sold for ${getSellerName(selectedFilterSellerId)}.` : 'No items sold yet.'}
                    </p>
                ) : (
                    <ul className="space-y-2">
                        {filteredSoldItems
                            .sort((a, b) => b.timestamp - a.timestamp) // Sort by most recent first
                            .map(item => (
                                <li key={item.id} className="flex flex-col p-3 bg-sky-50 rounded-lg shadow-sm hover:bg-sky-100 transition duration-150">
                                    {editingSoldItemId === item.id ? (
                                        // Form for editing sold item
                                        <form onSubmit={(e) => { e.preventDefault(); saveEditedSoldItem(item.id); }} className="flex flex-col gap-2 w-full">
                                            <input
                                                type="text"
                                                value={editedSoldItemName}
                                                onChange={(e) => setEditedSoldItemName(e.target.value)}
                                                className="p-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-sky-400"
                                            />
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={editedSoldItemAmount}
                                                onChange={(e) => setEditedSoldItemAmount(e.target.value)}
                                                className="p-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-sky-400"
                                            />
                                            <select
                                                value={editedSoldItemSellerId}
                                                onChange={(e) => setEditedSoldItemSellerId(e.target.value)}
                                                className="p-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-sky-400 bg-white"
                                            >
                                                {sellers.map(seller => (
                                                    <option key={seller.id} value={seller.id}>{seller.name}</option>
                                                ))}
                                            </select>
                                            <div className="flex gap-2 justify-end">
                                                {/* Explicit width/height for 1:1 aspect ratio on icons */}
                                                <button type="submit" className="text-green-600 hover:text-green-800 rounded-full hover:bg-green-100 transition w-8 h-8 flex items-center justify-center"><i className="fas fa-check"></i></button>
                                                {/* Explicit width/height for 1:1 aspect ratio on icons */}
                                                <button type="button" onClick={cancelEditSoldItem} className="text-red-600 hover:text-red-800 rounded-full hover:bg-red-100 transition w-8 h-8 flex items-center justify-center"><i className="fas fa-times"></i></button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="flex justify-between items-center w-full">
                                            {/* Original display for sold items matching transaction display */}
                                            {item.name ? (
                                                <div className="flex-grow mr-2">
                                                    <span className="font-medium text-sky-800 text-base sm:text-lg">{item.name}</span>
                                                    <span className="text-xs sm:text-sm text-gray-600 block leading-tight">({getSellerName(item.sellerId)})</span>
                                                </div>
                                            ) : (
                                                <div className="flex-grow mr-2">
                                                    <span className="font-medium text-sky-800 text-base sm:text-lg">
                                                        {getSellerName(item.sellerId)}'s Item
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-lg sm:text-xl text-sky-900">{formatAmountDisplay(item.amount)}</span>
                                                <button onClick={() => createQuickItemFromSoldItem(item)} className="text-yellow-500 hover:text-yellow-600 rounded-full hover:bg-yellow-100 transition w-8 h-8 flex items-center justify-center" title="Add to Quick Items"><i className="fas fa-star"></i></button>
                                                <button onClick={() => startEditSoldItem(item)} className="text-sky-600 hover:text-sky-800 rounded-full hover:bg-sky-100 transition w-8 h-8 flex items-center justify-center"><i className="fas fa-edit"></i></button>
                                                <button onClick={() => deleteSoldItem(item.id)} className="text-red-600 hover:text-red-800 rounded-full hover:bg-red-100 transition w-8 h-8 flex items-center justify-center"><i className="fas fa-trash-alt"></i></button>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

// --- Transaction Screen Component ---
const TransactionScreen = ({
    sellers, selectedSellerId, setSelectedSellerId,
    currentTransaction, removeItemFromTransaction,
    quickItems,
    addItemToTransaction,
    currentItemName, setCurrentItemName, customItemAmount, setCustomItemAmount,
    getSellerName
}) => {
    const transactionTotal = parseFloat(currentTransaction.reduce((sum, item) => sum + item.amount, 0).toFixed(2));

    // Handler for quick amount buttons - now uses currentItemName
    const handleQuickAmountClick = (amount) => {
        addItemToTransaction(amount, currentItemName, selectedSellerId);
    };

    // Handler for predefined quick items - uses item's own name and sellerId
    const handleQuickItemClick = (item) => { // Renamed from handlePredefinedQuickItemClick
        addItemToTransaction(item.amount, item.name, item.sellerId);
    };

    // Handler for manual item addition
    const handleCustomItemAdd = (e) => {
        e.preventDefault(); // Prevent form default submission
        if (parseFloat(customItemAmount) > 0 && selectedSellerId) { // Only allow if a seller is selected for custom items
            addItemToTransaction(customItemAmount, currentItemName, selectedSellerId);
            setCustomItemAmount(''); // Clear custom amount input
            setCurrentItemName(''); // Clear item name input
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 flex flex-col items-stretch w-full sm:max-w-2xl sm:mx-auto sm:my-8">
            {sellers.length === 0 && (
                <p className="text-red-500 mb-4 text-center">Please add at least one seller in Settings to start a transaction.</p>
            )}

            {/* Seller Selection */}
            <h3 className="text-xl sm:text-2xl font-semibold text-teal-800 mb-2">Select Seller:</h3>
            <div className="flex flex-wrap gap-2 mb-4 items-center">
                {sellers.length === 0 ? (
                    <p className="text-gray-500">No sellers to select.</p>
                ) : (
                    sellers.map(seller => (
                        <button
                            key={seller.id}
                            onClick={() => {
                                if (selectedSellerId === seller.id) {
                                    setSelectedSellerId(''); // Deselect if already active
                                } else {
                                    setSelectedSellerId(seller.id); // Select if not active
                                }
                            }}
                            className={`py-2 px-3 text-sm sm:px-4 sm:text-base rounded-full font-semibold transition duration-200 ease-in-out transform hover:scale-105 ${
                                selectedSellerId === seller.id
                                    ? 'bg-teal-600 text-white shadow-lg'
                                    : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                            }`}
                        >
                            {seller.name}
                        </button>
                    ))
                )}
            </div>
            {selectedSellerId && <p className="text-xs sm:text-sm text-gray-600 mb-4">Selected Seller: <span className="font-bold text-teal-800">{getSellerName(selectedSellerId)}</span></p>}
            {!selectedSellerId && sellers.length > 0 && <p className="text-orange-500 text-xs sm:text-sm mb-4">Please select a seller for custom items. Quick items can be added without a seller selected.</p>}

            {/* Unified Item Entry */}
            <h3 className="text-xl sm:text-2xl font-semibold text-teal-800 mb-2">Add Item:</h3>
            <div className="mb-4 space-y-3">
                <form onSubmit={handleCustomItemAdd} className="flex flex-col gap-2"> {/* Form for custom item */}
                    <input
                        type="text"
                        placeholder="Item Name (Optional)"
                        value={currentItemName}
                        onChange={(e) => setCurrentItemName(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 text-sm sm:text-base"
                        disabled={!selectedSellerId && sellers.length > 0} // Disable only if no seller and sellers exist
                    />

                    {/* Quick Amount Buttons */}
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                        {['0.25', '0.50', '1', '2', '3', '5', '10', '20'].map(amount => (
                            <button
                                type="button" // Important: not a submit button for this form
                                key={amount}
                                onClick={() => handleQuickAmountClick(parseFloat(amount))}
                                className="p-3 bg-green-100 text-green-700 font-semibold rounded-lg hover:bg-green-200 transition duration-150 transform hover:scale-105 text-base sm:text-lg"
                                disabled={!selectedSellerId && sellers.length > 0} // Disable only if no seller and sellers exist
                            >
                                {formatAmountDisplay(amount)}
                            </button>
                        ))}
                    </div>

                    {/* Custom Amount Input */}
                    <div className="flex gap-2 mt-4">
                        <input
                            type="number"
                            step="0.01"
                            placeholder="Custom Amount ($)"
                            value={customItemAmount}
                            onChange={(e) => setCustomItemAmount(e.target.value)}
                            className="flex-grow p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 text-sm sm:text-base"
                            disabled={!selectedSellerId || parseFloat(customItemAmount) <= 0}
                        />
                        <button
                            type="submit" // This button submits the form
                            className="px-4 py-2 bg-teal-500 text-white font-semibold rounded-lg shadow-md hover:bg-teal-600 transition duration-200 ease-in-out transform hover:scale-105 text-sm sm:text-base"
                            disabled={!selectedSellerId || parseFloat(customItemAmount) <= 0}
                        >
                            Add
                        </button>
                    </div>
                </form>
            </div>

            {/* Quick Items (was Reusable Quick Transaction Items) */}
            <h3 className="text-xl sm:text-2xl font-semibold text-teal-800 mb-2">Quick Items:</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mb-4"> {/* Adjusted grid columns */}
                {quickItems.length === 0 ? (
                    <p className="text-gray-500 text-center py-2 col-span-full">No quick items defined.</p>
                ) : (
                    quickItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleQuickItemClick(item)} // Renamed handler
                            // Removed disabled state as quick items don't require pre-selected seller
                            className="py-1 px-2 min-w-[120px] bg-orange-100 text-orange-700 font-semibold rounded-lg hover:bg-orange-200 transition duration-150 transform hover:scale-105 flex flex-col items-start text-left overflow-hidden relative" // Increased min-w
                        >
                            {/* Condensed display to 2 lines */}
                            <span className="font-bold text-base sm:text-lg leading-tight whitespace-nowrap overflow-hidden text-ellipsis w-full">
                                {formatAmountDisplay(item.amount)}
                            </span>
                            <span className="text-xs text-gray-500 leading-tight whitespace-nowrap overflow-hidden text-ellipsis w-full">
                                {item.name && `${item.name} - `} {/* Only show name if it exists, followed by hyphen */}
                                ({getSellerName(item.sellerId)})
                            </span>
                        </button>
                    ))
                )}
            </div>

            {/* The height is handled by the main container's padding, flex-grow will fill remaining space */}
            <div className="flex-grow overflow-y-auto sm:max-h-64 mb-4">
                <h3 className="text-xl sm:text-2xl font-semibold text-teal-800 mb-2">Items in Transaction:</h3>
                {currentTransaction.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No items in current transaction.</p>
                ) : (
                    <ul className="space-y-2">
                        {currentTransaction.map(item => (
                            <li key={item.id} className="flex flex-col p-3 bg-teal-50 rounded-lg shadow-sm hover:bg-teal-100 transition duration-150">
                                <div className="flex justify-between items-center w-full">
                                    {/* Reverted display for current transaction items */}
                                    {item.name ? (
                                        <div className="flex-grow mr-2">
                                            <span className="font-medium text-teal-800 text-base sm:text-lg">{item.name}</span>
                                            <span className="text-xs sm:text-sm text-gray-600 block leading-tight">(from {getSellerName(item.sellerId)})</span>
                                        </div>
                                    ) : (
                                        <div className="flex-grow mr-2">
                                            <span className="font-medium text-teal-800 text-base sm:text-lg">
                                                {getSellerName(item.sellerId)}'s Item
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-lg sm:text-xl text-teal-900">{formatAmountDisplay(item.amount)}</span>
                                        {/* Explicit width/height for 1:1 aspect ratio on icons */}
                                        <button onClick={() => removeItemFromTransaction(item.id)} className="text-red-600 hover:text-red-800 rounded-full hover:bg-red-100 transition w-8 h-8 flex items-center justify-center"><i className="fas fa-times-circle"></i></button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="pt-4 border-t border-teal-200">
                <div className="flex justify-between items-center text-xl sm:text-2xl font-bold text-teal-800 mb-4">
                    <span>Total:</span>
                    <span>${transactionTotal.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
};

// --- Safe Area Debugger Component ---
const SafeAreaDebugger = () => {
    const [insets, setInsets] = useState({});
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const updateValues = () => {
            const getCssVariableValue = (varName) => {
                // Read the computed value of the CSS custom property
                const value = parseFloat(window.getComputedStyle(document.documentElement).getPropertyValue(varName));
                return isNaN(value) ? 0 : value;
            };

            setInsets({
                top: getCssVariableValue('--effective-safe-area-inset-top'),
                right: getCssVariableValue('--safe-area-inset-right'),
                bottom: getCssVariableValue('--effective-safe-area-inset-bottom'),
                left: getCssVariableValue('--safe-area-inset-left'),
            });
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        updateValues(); // Initial read
        window.addEventListener('resize', updateValues); // Update on resize
        return () => window.removeEventListener('resize', updateValues);
    }, []);

    return (
        <div className="fixed top-2 right-2 bg-gray-800 bg-opacity-75 text-white text-xs p-2 rounded-lg z-50 pointer-events-none opacity-90">
            <div className="font-bold mb-1">Debug Info:</div>
            <div>W: {dimensions.width}px, H: {dimensions.height}px</div>
            <div>Effective Safe Area Insets:</div>
            <div>T: {insets.top}px, R: {insets.right}px</div>
            <div>B: {insets.bottom}px, L: {insets.left}px</div>
        </div>
    );
};


// --- Main App Component ---
const App = () => {
    // States for data
    const [sellers, setSellers] = useState(() => {
        const savedSellers = localStorage.getItem('yardSaleSellers');
        return savedSellers ? JSON.parse(savedSellers) : [];
    });
    const [quickItems, setQuickItems] = useState(() => {
        const savedQuickItems = localStorage.getItem('yardSaleQuickItems');
        return savedQuickItems ? JSON.parse(savedQuickItems) : [];
    });
    const [soldItems, setSoldItems] = useState(() => {
        const savedSoldItems = localStorage.getItem('yardSaleSoldItems');
        return savedSoldItems ? JSON.parse(savedSoldItems) : [];
    });

    // State for app status messages (for file operations)
    const [statusMessage, setStatusMessage] = useState('');
    // State for mobile detection
    const [isMobile, setIsMobile] = useState(window.innerWidth < 640); // Initial check

    // States for screen navigation
    const [currentScreen, setCurrentScreen] = useState('home'); // Default to 'home'
    const [previousScreen, setPreviousScreen] = useState('home'); // Tracks previous screen for back navigation
    const [showDebugger, setShowDebugger] = useState(false); // State to control debugger visibility
    const [selectedSellerId, setSelectedSellerId] = useState(''); // For current transaction seller
    const [currentItemName, setCurrentItemName] = useState(''); // Optional name for item being added
    const [customItemAmount, setCustomItemAmount] = useState(''); // For manual amount input
    const [currentTransaction, setCurrentTransaction] = useState([]); // Items in current transaction

    // State for holding data of a sold item to be converted into a quick item
    const [itemToCreateQuickFrom, setItemToCreateQuickFrom] = useState(null);

    // States for Save/Load via Clipboard/Text Area Fallback
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [jsonToSave, setJsonToSave] = useState('');
    const [jsonToLoad, setJsonToLoad] = useState('');

    // State for filtering sold items by seller on Home Screen
    const [selectedFilterSellerId, setSelectedFilterSellerId] = useState(null);


    // States for Seller Management in Settings
    const [newSellerName, setNewSellerName] = useState('');
    const [editingSellerId, setEditingSellerId] = useState(null);
    const [editedSellerName, setEditedSellerName] = useState('');

    // States for Quick Item Management in Settings
    const [newQuickItemName, setNewQuickItemName] = useState('');
    const [newQuickItemAmount, setNewQuickItemAmount] = useState('');
    const [newQuickItemSellerId, setNewQuickItemSellerId] = useState('');
    const [editingQuickItemId, setEditingQuickItemId] = useState(null);
    const [editedQuickItemName, setEditedQuickItemName] = useState('');
    const [editedQuickItemAmount, setEditedQuickItemAmount] = useState('');
    const [editedQuickItemSellerId, setEditedQuickItemSellerId] = useState('');

    // States for Sold Item Editing in Home
    const [editingSoldItemId, setEditingSoldItemId] = useState(null);
    const [editedSoldItemName, setEditedSoldItemName] = useState('');
    const [editedSoldItemAmount, setEditedSoldItemAmount] = useState('');
    const [editedSoldItemSellerId, setEditedSoldItemSellerId] = useState('');


    // --- Effects for Local Storage ---
    useEffect(() => {
        localStorage.setItem('yardSaleSellers', JSON.stringify(sellers));
    }, [sellers]);

    useEffect(() => {
        localStorage.setItem('yardSaleSoldItems', JSON.stringify(soldItems));
    }, [soldItems]);

    useEffect(() => {
        localStorage.setItem('yardSaleQuickItems', JSON.stringify(quickItems));
    }, [quickItems]);

    // --- Dynamic Sizing and Safe Area Handling ---
    useEffect(() => {
        const MOBILE_BREAKPOINT = 640; // Tailwind's 'sm' breakpoint
        const MOBILE_TOP_FALLBACK_PX = 20; // Conservative fallback for notch/status bar
        const MOBILE_BOTTOM_FALLBACK_PX = 40; // Conservative fallback for home indicator/gesture bar

        const updateLayoutVariables = () => {
            const screenIsMobile = window.innerWidth < MOBILE_BREAKPOINT;
            setIsMobile(screenIsMobile);

            // Function to get the computed value of an env() variable via a temporary element
            const getComputedEnvValue = (envVarName) => {
                const tempDiv = document.createElement('div');
                tempDiv.style.position = 'fixed';
                tempDiv.style.visibility = 'hidden';
                tempDiv.style.width = '1px';
                tempDiv.style.height = '1px';
                // Use a standard CSS property like padding to read the computed value of env()
                tempDiv.style.paddingLeft = `env(${envVarName}, 0px)`;
                document.body.appendChild(tempDiv);
                const value = parseFloat(window.getComputedStyle(tempDiv).paddingLeft);
                document.body.removeChild(tempDiv);
                return isNaN(value) ? 0 : value;
            };

            const actualTopInset = getComputedEnvValue('safe-area-inset-top');
            const actualBottomInset = getComputedEnvValue('safe-area-inset-bottom');

            // Determine effective safe area insets: actual env value or a fallback for mobile
            const effectiveTop = screenIsMobile && actualTopInset === 0 ? MOBILE_TOP_FALLBACK_PX : actualTopInset;
            const effectiveBottom = screenIsMobile && actualBottomInset === 0 ? MOBILE_BOTTOM_FALLBACK_PX : actualBottomInset;

            // Set CSS custom properties for use in calc() functions
            document.documentElement.style.setProperty('--effective-safe-area-inset-top', `${effectiveTop}px`);
            document.documentElement.style.setProperty('--effective-safe-area-inset-bottom', `${effectiveBottom}px`);

            // Set base heights for headers/footers based on screen size (for calc in main)
            const headerHeight = screenIsMobile ? '60px' : '70px';
            const footerHeight = screenIsMobile ? '76px' : '80px';
            document.documentElement.style.setProperty('--header-base-height', headerHeight);
            document.documentElement.style.setProperty('--footer-base-height', footerHeight);
        };

        updateLayoutVariables(); // Initial check on mount
        window.addEventListener('resize', updateLayoutVariables); // Update on resize
        return () => window.removeEventListener('resize', updateLayoutVariables); // Cleanup
    }, []);


    // --- Initial Screen Logic ---
    useEffect(() => {
        if (sellers.length === 0) {
            setCurrentScreen('settings');
        }
    }, [sellers.length]); // Run once on mount and if sellers become empty/non-empty

    // --- Global Error Handlers (displaying on screen) ---
    useEffect(() => {
        const globalErrorDisplay = document.getElementById('global-error-message-display');
        const dismissButton = document.getElementById('global-error-dismiss-button');

        const displayErrorMessage = (message) => {
            if (globalErrorDisplay) {
                globalErrorDisplay.textContent = message;
                globalErrorDisplay.style.display = 'flex'; // Make it visible
            }
        };

        const hideErrorMessage = () => {
            if (globalErrorDisplay) {
                globalErrorDisplay.style.display = 'none';
            }
        };

        if (dismissButton) {
            dismissButton.addEventListener('click', hideErrorMessage);
        }

        const handleGlobalError = (event) => {
            console.error("[GLOBAL ERROR]: Uncaught JavaScript Error:", event.error || event.message || event);
            displayErrorMessage(`An error occurred: ${event.message || 'Unknown error'}`);
            // Prevent default browser error reporting if we are handling it visually
            event.preventDefault();
        };

        const handleUnhandledRejection = (event) => {
            console.error("[GLOBAL ERROR]: Unhandled Promise Rejection:", event.reason);
            displayErrorMessage(`A promise rejection occurred: ${event.reason.message || event.reason || 'Unknown rejection'}`);
            // Prevent default browser error reporting if we are handling it visually
            event.preventDefault();
        };

        window.addEventListener('error', handleGlobalError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
            window.removeEventListener('error', handleGlobalError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
            if (dismissButton) {
                dismissButton.removeEventListener('click', hideErrorMessage);
            }
        };
    }, []); // Empty dependency array means this runs once on mount and cleans up on unmount


    // --- Navigation Functions ---
    const goToSettings = () => {
        setPreviousScreen(currentScreen); // Save current screen before navigating
        setCurrentScreen('settings');
    };

    const goToHome = () => {
        setPreviousScreen(currentScreen); // Save current screen before navigating
        setCurrentScreen('home');
        setCurrentTransaction([]); // Clear transaction if going home from elsewhere
        setSelectedSellerId(''); // Reset selected seller
        setCurrentItemName(''); // Reset optional item name
        setCustomItemAmount(''); // Reset custom amount
        setStatusMessage(''); // Clear any status messages on navigation
    };

    const goToTransaction = () => {
        setPreviousScreen(currentScreen); // Save current screen before navigating
        // Only allow if sellers exist
        if (sellers.length > 0) {
            setCurrentScreen('transaction');
        } else {
            setStatusMessage('Please define at least one seller in Settings before starting a transaction.');
            setCurrentScreen('settings'); // Redirect to settings if no sellers
        }
    };

    const goBack = () => {
        // If coming from home or transaction, go back to that specific screen
        if (previousScreen === 'home' || previousScreen === 'transaction') {
            setCurrentScreen(previousScreen);
        } else {
            // If previous screen was settings itself (e.g., direct access, or loop), go to home
            setCurrentScreen('home');
        }
        setPreviousScreen(''); // Clear previous screen after going back
    };

    const toggleDebugger = () => {
        setShowDebugger(prev => !prev);
    };

    // --- File System Access API Functions ---
    const handleSaveToFile = async () => {
        if ('showSaveFilePicker' in window) {
            try {
                setStatusMessage('Saving data...');
                const dataToSave = {
                    sellers: sellers,
                    quickItems: quickItems,
                    soldItems: soldItems
                };
                const jsonString = JSON.stringify(dataToSave, null, 2); // Pretty print JSON

                const fileHandle = await window.showSaveFilePicker({
                    types: [{
                        description: 'Yard Sale Data',
                        accept: { 'application/json': ['.json'] },
                    }],
                    suggestedName: 'yard_sale_data.json',
                });

                const writableStream = await fileHandle.createWritable();
                await writableStream.write(jsonString);
                await writableStream.close();
                setStatusMessage('Data saved successfully!');
                setShowSaveModal(false); // Close modal if successful
            } catch (error) {
                if (error.name === 'AbortError') {
                    setStatusMessage('Save operation cancelled.');
                } else if (error.name === 'SecurityError') {
                    // Fallback to clipboard if SecurityError (cross-origin iframe)
                    setStatusMessage('Direct file saving not allowed. Copy data to clipboard instead.');
                    setJsonToSave(JSON.stringify({ sellers, quickItems, soldItems }, null, 2));
                    setShowSaveModal(true);
                }
                else {
                    console.error('Error saving data:', error);
                    setStatusMessage(`Error saving data: ${error.message || 'Unknown error'}`);
                }
            }
        } else {
            setStatusMessage('File System Access API is not supported in this browser. Copy data to clipboard instead.');
            setJsonToSave(JSON.stringify({ sellers, quickItems, soldItems }, null, 2));
            setShowSaveModal(true);
        }
    };

    const handleLoadFromFile = async () => {
        if ('showOpenFilePicker' in window) {
            try {
                setStatusMessage('Loading data...');
                const [fileHandle] = await window.showOpenFilePicker({
                    types: [{
                        description: 'Yard Sale Data',
                        accept: { 'application/json': ['.json'] },
                    }],
                    multiple: false,
                });

                const file = await fileHandle.getFile();
                const content = await file.text();
                const loadedData = JSON.parse(content);

                // Basic validation of loaded data structure
                if (loadedData.sellers && Array.isArray(loadedData.sellers) &&
                    loadedData.quickItems && Array.isArray(loadedData.quickItems) &&
                    loadedData.soldItems && Array.isArray(loadedData.soldItems)) {
                    setSellers(loadedData.sellers);
                    setQuickItems(loadedData.quickItems);
                    setSoldItems(loadedData.soldItems);
                    setStatusMessage('Data loaded successfully!');
                    goToHome(); // Navigate to home after loading
                    setShowLoadModal(false); // Close modal if successful
                } else {
                    setStatusMessage('Invalid data format in file.');
                    console.error('Loaded file has an invalid data structure:', loadedData);
                }

            } catch (error) {
                if (error.name === 'AbortError') {
                    setStatusMessage('Load operation cancelled.');
                } else if (error.name === 'SecurityError' || error instanceof TypeError) { // Handle TypeError for JSON.parse or other issues
                    setStatusMessage('Direct file loading not allowed. Please paste data below.');
                    setJsonToLoad(''); // Clear previous paste data
                    setShowLoadModal(true);
                } else {
                    console.error('Error loading data:', error);
                    setStatusMessage(`Error loading data: ${error.message || 'Unknown error'}. Make sure it's a valid Yard Sale JSON file.`);
                }
            }
        } else {
            setStatusMessage('File System Access API is not supported in this browser. Please paste data below.');
            setJsonToLoad(''); // Clear previous paste data
            setShowLoadModal(true);
        }
    };

    const handleLoadFromPastedJson = () => {
        try {
            const loadedData = JSON.parse(jsonToLoad);
            if (loadedData.sellers && Array.isArray(loadedData.sellers) &&
                loadedData.quickItems && Array.isArray(loadedData.quickItems) &&
                loadedData.soldItems && Array.isArray(loadedData.soldItems)) {
                setSellers(loadedData.sellers);
                setQuickItems(loadedData.quickItems);
                setSoldItems(loadedData.soldItems);
                setStatusMessage('Data loaded successfully from pasted JSON!');
                goToHome();
                setShowLoadModal(false);
                setJsonToLoad(''); // Clear pasted JSON
            } else {
                setStatusMessage('Invalid data format in pasted JSON.');
            }
        } catch (error) {
            setStatusMessage('Invalid JSON format. Please check your pasted data.');
            console.error('Error parsing pasted JSON:', error);
        }
    };


    // --- Seller Management Logic (Passed to SettingsScreen) ---
    const addSeller = (e) => {
        e.preventDefault(); // Prevent default form submission
        if (newSellerName.trim() === '') return;
        const newSeller = { id: `seller-${Date.now()}`, name: newSellerName.trim() };
        setSellers([...sellers, newSeller]);
        setNewSellerName('');
    };

    const startEditSeller = (seller) => {
        setEditingSellerId(seller.id);
        setEditedSellerName(seller.name);
    };

    const saveEditedSeller = (id) => {
        // No e.preventDefault() needed here as it's handled in the form's onSubmit
        setSellers(sellers.map(s => s.id === id ? { ...s, name: editedSellerName.trim() } : s));
        setEditingSellerId(null);
        setEditedSellerName('');
    };

    const cancelEditSeller = () => {
        setEditingSellerId(null);
        setEditedSellerName('');
    };

    const deleteSeller = (id) => {
        // Check if the seller has any sold items
        const hasSoldItems = soldItems.some(item => item.sellerId === id);
        if (hasSoldItems) {
            setStatusMessage('Cannot delete seller: This seller has associated sold items. Please remove them first.');
            return;
        }

        if (window.confirm("Are you sure you want to delete this seller? All their associated quick items will also be removed.")) {
            setSellers(sellers.filter(s => s.id !== id));
            // Propagate deletion to quick items
            setQuickItems(quickItems.filter(item => item.sellerId !== id));
            if (selectedSellerId === id) {
                setSelectedSellerId('');
            }
            setStatusMessage('Seller and associated quick items deleted successfully.');
        }
    };

    // --- Quick Item Management Logic (Passed to SettingsScreen) ---
    const addQuickItem = (e) => {
        e.preventDefault(); // Prevent default form submission
        if (!newQuickItemSellerId || parseFloat(newQuickItemAmount) <= 0) return;
        const newQuick = {
            id: `quick-${Date.now()}`,
            name: newQuickItemName.trim(),
            amount: parseFloat(parseFloat(newQuickItemAmount).toFixed(2)),
            sellerId: newQuickItemSellerId,
        };
        setQuickItems([...quickItems, newQuick]);
        setNewQuickItemName('');
        setNewQuickItemAmount('');
        setNewQuickItemSellerId('');
    };

    const startEditQuickItem = (item) => {
        setEditingQuickItemId(item.id);
        setEditedQuickItemName(item.name);
        setEditedQuickItemAmount(item.amount.toFixed(2));
        setEditedQuickItemSellerId(item.sellerId);
    };

    const saveEditedQuickItem = (id) => {
        // No e.preventDefault() needed here as it's handled in the form's onSubmit
        setQuickItems(quickItems.map(item =>
            item.id === id
                ? {
                    ...item,
                    name: editedQuickItemName.trim(),
                    amount: parseFloat(parseFloat(editedQuickItemAmount).toFixed(2)),
                    sellerId: editedQuickItemSellerId,
                }
                : item
        ));
        setEditingQuickItemId(null);
        setEditedQuickItemName('');
        setEditedQuickItemAmount('');
        setEditedQuickItemSellerId('');
    };

    const cancelEditQuickItem = () => {
        setEditingQuickItemId(null);
        setEditedQuickItemName('');
        setEditedQuickItemAmount('');
        setEditedQuickItemSellerId('');
    };

    const deleteQuickItem = (id) => {
        if (window.confirm("Are you sure you want to delete this quick item?")) {
            setQuickItems(quickItems.filter(item => item.id !== id));
            setStatusMessage('Quick item deleted successfully.');
        }
    };

    // --- Transaction Logic (Passed to TransactionScreen) ---
    const addItemToTransaction = (amount, name = '', sellerId) => {
        // If a predefined item provides its own sellerId, use that. Otherwise, fall back to the currently selectedSellerId.
        const effectiveSellerId = sellerId || selectedSellerId;

        if (!effectiveSellerId || parseFloat(amount) <= 0) {
            // Show a more user-friendly message or disable buttons if no valid seller can be determined
            console.error("Seller not selected or invalid amount provided for transaction item.");
            setStatusMessage('Error: Select a seller for custom items, or add a seller in settings.');
            return;
        }
        setStatusMessage(''); // Clear status message on successful add

        const item = {
            id: `temp-item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            sellerId: effectiveSellerId,
            amount: parseFloat(parseFloat(amount).toFixed(2)),
            name: name.trim(), // Use the passed name, which could be currentItemName
        };
        setCurrentTransaction([...currentTransaction, item]);
        setCurrentItemName(''); // Clear current item name after adding to transaction
        setCustomItemAmount(''); // Clear custom amount too
    };

    const removeItemFromTransaction = (id) => {
        setCurrentTransaction(currentTransaction.filter(item => item.id !== id));
    };

    const confirmPurchase = () => {
        if (currentTransaction.length === 0) return;

        const newSoldItems = currentTransaction.map(item => ({
            ...item,
            id: `sold-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
        }));
        setSoldItems([...soldItems, ...newSoldItems]);
        setStatusMessage('Purchase confirmed! Items added to sales report.');
        goToHome(); // Go back to home after successful purchase
    };

    const cancelTransaction = () => {
        // Ensure this reliably returns to home
        if (window.confirm("Are you sure you want to cancel this transaction? All items will be removed.")) {
            setCurrentTransaction([]); // Clear current transaction items
            setStatusMessage('Transaction cancelled. Items removed from current transaction.');
            goToHome(); // This should always redirect to home
        }
    };

    // --- Sold Items Editing Logic (Passed to HomeScreen) ---
    const startEditSoldItem = (item) => {
        setEditingSoldItemId(item.id);
        setEditedSoldItemName(item.name);
        setEditedSoldItemAmount(item.amount.toFixed(2));
        setEditedSoldItemSellerId(item.sellerId);
    };

    const saveEditedSoldItem = (id) => {
        // No e.preventDefault() needed here as it's handled in the form's onSubmit
        setSoldItems(soldItems.map(item =>
            item.id === id
                ? {
                    ...item,
                    name: editedSoldItemName.trim(),
                    amount: parseFloat(parseFloat(editedSoldItemAmount).toFixed(2)),
                    sellerId: editedSoldItemSellerId,
                }
                : item
        ));
        setEditingSoldItemId(null);
        setEditedSoldItemName('');
        setEditedSoldItemAmount('');
        setEditedSoldItemSellerId('');
    };

    const cancelEditSoldItem = () => {
        setEditingSoldItemId(null);
        setEditedSoldItemName('');
        setEditedSoldItemAmount('');
        setEditedSoldItemSellerId('');
    };

    const deleteSoldItem = (id) => {
        setSoldItems(soldItems.filter(item => item.id !== id));
        setStatusMessage('Sold item deleted successfully.');
    };

    // --- Function to create quick item from sold item (passed to HomeScreen) ---
    const createQuickItemFromSoldItem = (item) => {
        setItemToCreateQuickFrom({
            name: item.name,
            amount: item.amount,
            sellerId: item.sellerId
        });
        goToSettings(); // Navigate to settings screen
        setStatusMessage('Quick item form pre-filled from sold item. Review and add.');
    };

    // Function to clear itemToCreateQuickFrom after it's used by SettingsScreen
    const clearItemToCreateQuickFrom = () => {
        setItemToCreateQuickFrom(null);
    };


    // --- Utility Function (Used across components) ---
    const getSellerName = useCallback((sellerId) => {
        const seller = sellers.find(s => s.id === sellerId);
        return seller ? seller.name : 'Unknown Seller';
    }, [sellers]);

    // Calculate total sales per seller for reports
    const salesPerSeller = sellers.reduce((acc, seller) => {
        acc[seller.id] = parseFloat(soldItems.filter(item => item.sellerId === seller.id)
            .reduce((sum, item) => sum + item.amount, 0).toFixed(2));
        return acc;
    }, {});


    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 font-sans text-gray-800 flex flex-col">
                <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
                <style>
                    {`
                        body {
                            margin: 0;
                            padding: 0;
                            /* Ensure viewport-fit=cover works */
                            height: 100vh;
                        }
                        /* Define CSS variables for safe area insets for easier calc() usage */
                        :root {
                            /* These will be dynamically set by JS based on actual env values or fallbacks */
                            --effective-safe-area-inset-top: env(safe-area-inset-top, 0px);
                            --effective-safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
                            /* Keep original env variables for direct debugger reading if needed */
                            --safe-area-inset-right: env(safe-area-inset-right, 0px);
                            --safe-area-inset-left: env(safe-area-inset-left, 0px);

                            /* These base heights will be dynamically set by JS based on isMobile state */
                            --header-base-height: 60px; /* Default for mobile */
                            --footer-base-height: 76px; /* Default for mobile */
                        }

                        @media (min-width: 640px) { /* sm breakpoint */
                             :root {
                                /* Overridden by JS for desktop sizes, but also set here for clarity */
                                --header-base-height: 70px;
                                --footer-base-height: 80px;
                            }
                        }

                        /* Set padding for main content area to clear fixed headers/footers and effective safe areas */
                        main {
                            padding-top: calc(var(--header-base-height) + var(--effective-safe-area-inset-top));
                            padding-bottom: calc(var(--footer-base-height) + var(--effective-safe-area-inset-bottom));
                        }

                        /* Global Error Message Display Styling */
                        #global-error-message-display {
                            display: none; /* Hidden by default */
                            position: fixed;
                            bottom: calc(var(--footer-base-height) + var(--effective-safe-area-inset-bottom) + 10px); /* Position above footer */
                            left: 50%;
                            transform: translateX(-50%);
                            background-color: #ef4444; /* Red-500 */
                            color: white;
                            padding: 1rem;
                            border-radius: 0.5rem;
                            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                            z-index: 1000; /* Ensure it's on top */
                            font-size: 0.9rem;
                            text-align: center;
                            max-width: 90%;
                            width: fit-content;
                            flex-direction: column; /* For vertical layout of text and button */
                            align-items: center;
                            gap: 0.5rem;
                        }

                        #global-error-message-display button {
                            background-color: rgba(255, 255, 255, 0.2);
                            border: 1px solid rgba(255, 255, 255, 0.5);
                            color: white;
                            padding: 0.25rem 0.75rem;
                            border-radius: 0.25rem;
                            cursor: pointer;
                            font-size: 0.8rem;
                            transition: background-color 0.2s;
                        }

                        #global-error-message-display button:hover {
                            background-color: rgba(255, 255, 255, 0.3);
                        }
                    `}
                </style>

                {/* Header */}
                <AppHeader currentScreen={currentScreen} goToSettings={goToSettings} goBack={goBack} toggleDebugger={toggleDebugger} />

                {/* Main Content Area (Scrollable) */}
                <main className="flex-grow overflow-y-auto px-4 sm:px-0">
                    {currentScreen === 'settings' && (
                        <SettingsScreen
                            sellers={sellers} setSellers={setSellers} newSellerName={newSellerName} setNewSellerName={setNewSellerName} addSeller={addSeller}
                            editingSellerId={editingSellerId} startEditSeller={startEditSeller} saveEditedSeller={saveEditedSeller} cancelEditSeller={cancelEditSeller} deleteSeller={deleteSeller} editedSellerName={editedSellerName} setEditedSellerName={setEditedSellerName}
                            quickItems={quickItems} setQuickItems={setQuickItems} newQuickItemName={newQuickItemName} setNewQuickItemName={setNewQuickItemName} newQuickItemAmount={newQuickItemAmount} setNewQuickItemAmount={setNewQuickItemAmount} newQuickItemSellerId={newQuickItemSellerId} setNewQuickItemSellerId={setNewQuickItemSellerId} addQuickItem={addQuickItem}
                            editingQuickItemId={editingQuickItemId} startEditQuickItem={startEditQuickItem} saveEditedQuickItem={saveEditedQuickItem} cancelEditQuickItem={cancelEditQuickItem} editedQuickItemName={editedQuickItemName} setEditedQuickItemName={setEditedQuickItemName} editedQuickItemAmount={editedQuickItemAmount} setEditedQuickItemAmount={setEditedQuickItemAmount} editedQuickItemSellerId={editedQuickItemSellerId} setEditedQuickItemSellerId={editedQuickItemSellerId}
                            getSellerName={getSellerName}
                            handleSaveToFile={handleSaveToFile} handleLoadFromFile={handleLoadFromFile} statusMessage={statusMessage} setStatusMessage={setStatusMessage}
                            itemToCreateQuickFrom={itemToCreateQuickFrom} clearItemToCreateQuickFrom={clearItemToCreateQuickFrom} // Pass new props
                            showSaveModal={showSaveModal} setShowSaveModal={setShowSaveModal} jsonToSave={jsonToSave} setJsonToSave={setJsonToSave}
                            showLoadModal={showLoadModal} setShowLoadModal={setShowLoadModal} jsonToLoad={jsonToLoad} setJsonToLoad={setJsonToLoad} handleLoadFromPastedJson={handleLoadFromPastedJson}
                        />
                    )}

                    {currentScreen === 'home' && (
                        <HomeScreen
                            sellers={sellers} soldItems={soldItems} salesPerSeller={salesPerSeller}
                            goToSettings={goToSettings} goToTransaction={goToTransaction}
                            editingSoldItemId={editingSoldItemId} startEditSoldItem={startEditSoldItem} saveEditedSoldItem={saveEditedSoldItem} cancelEditSoldItem={cancelEditSoldItem} deleteSoldItem={deleteSoldItem} editedSoldItemName={editedSoldItemName} setEditedSoldItemName={setEditedSoldItemName} editedSoldItemAmount={editedSoldItemAmount} setEditedSoldItemAmount={setEditedSoldItemAmount} editedSoldItemSellerId={editedSoldItemSellerId} setEditedSoldItemSellerId={setEditedSoldItemSellerId}
                            getSellerName={getSellerName}
                            createQuickItemFromSoldItem={createQuickItemFromSoldItem} // Pass new function
                            selectedFilterSellerId={selectedFilterSellerId} setSelectedFilterSellerId={setSelectedFilterSellerId} // Pass new filtering props
                        />
                    )}

                    {currentScreen === 'transaction' && (
                        <TransactionScreen
                            sellers={sellers} selectedSellerId={selectedSellerId} setSelectedSellerId={setSelectedSellerId}
                            currentTransaction={currentTransaction} removeItemFromTransaction={removeItemFromTransaction}
                            quickItems={quickItems}
                            addItemToTransaction={addItemToTransaction}
                            currentItemName={currentItemName} setCurrentItemName={setCurrentItemName} customItemAmount={customItemAmount} setCustomItemAmount={setCustomItemAmount}
                            getSellerName={getSellerName}
                        />
                    )}
                </main>

                {/* Footer */}
                <AppFooter
                    currentScreen={currentScreen}
                    goToTransaction={goToTransaction}
                    confirmPurchase={confirmPurchase}
                    cancelTransaction={cancelTransaction}
                    goToHome={goToHome}
                    currentTransactionLength={currentTransaction.length}
                />

                {/* Safe Area Debugger (fixed on top right) */}
                {showDebugger && <SafeAreaDebugger />}

                {/* Font Awesome for icons */}
                {/* <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" /> */}
                {/* Tailwind CSS CDN */}
                {/* <script src="https://cdn.tailwindcss.com"></script> */}
            </div>
            {/* Global Error Message Display - outside React root */}
            {/* <div id="global-error-message-display">
                <span id="global-error-text"></span>
                <button id="global-error-dismiss-button">Dismiss</button>
            </div> */}
        </ErrorBoundary>
    );
};

export default App;
