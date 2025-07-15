import React, { useState } from 'react';

const Modal = ({ onClose, onAdd, onRemove, selectedDate, selectedEvent }) => {
  const [title, setTitle] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4">
          {selectedEvent ? 'Event Details' : 'Add New Event'}
        </h2>

        {selectedEvent ? (
          <>
            <p><strong>Title:</strong> {selectedEvent.title}</p>
            <p><strong>Date:</strong> {selectedEvent.startStr}</p>
            <div className="flex justify-end mt-6 space-x-2">
              <button
                onClick={onRemove}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Delete
              </button>
              <button
                onClick={onClose}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mb-2">Selected Date: {selectedDate}</p>
            <input
              type="text"
              placeholder="Event Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => onAdd(title)}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Add
              </button>
              <button
                onClick={onClose}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Modal;
