import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { customizeApi } from '../api/customizeApi';
import Button from '../components/common/Button';

const Customize = () => {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();
  const [formData, setFormData] = useState({
    phoneNumber: '',
    description: '',
    size: '',
    photo: null
  });
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      // Redirect to login with return path
      navigate('/login?redirect=/customize', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // If not authenticated, don't render the form
  if (!isAuthenticated()) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Phone number validation - only allow numeric input, max 11 digits
    if (name === 'phoneNumber') {
      const numericValue = value.replace(/\D/g, ''); // Remove non-numeric characters
      if (numericValue.length <= 11) {
        setFormData(prev => ({
          ...prev,
          [name]: numericValue
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    setError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      setFormData(prev => ({
        ...prev,
        photo: file
      }));
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!formData.phoneNumber.trim()) {
      setError('Phone number is required');
      return;
    }
    if (formData.phoneNumber.length !== 11) {
      setError('Phone number must be exactly 11 digits');
      return;
    }
    if (!formData.description.trim()) {
      setError('Please provide a description');
      return;
    }
    if (!formData.photo) {
      setError('Please upload a photo');
      return;
    }
    if (!formData.size.trim()) {
      setError('Please specify a size');
      return;
    }

    // Check authentication before submit
    if (!isAuthenticated() || !token) {
      navigate('/login?redirect=/customize', { replace: true });
      return;
    }

    setLoading(true);

    try {
      const result = await customizeApi.submitCustomizeRequest(
        formData.phoneNumber,
        formData.description,
        formData.size,
        formData.photo,
        token
      );

      if (result.success) {
        setSubmitted(true);
        // Reset form
        setFormData({
          phoneNumber: '',
          description: '',
          size: '',
          photo: null
        });
        setPreview(null);
        // Reset submitted state after 3 seconds
        setTimeout(() => {
          setSubmitted(false);
        }, 3000);
      } else {
        setError(result.message || 'Failed to submit customize request');
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-base py-8 pt-[120px] sm:pt-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center mt-8 sm:mt-12 md:mt-16">
          <h1 className="text-3xl md:text-4xl font-bold text-gold mb-4">
            Customize Your Product
          </h1>
          <p className="text-beige">
            Tell us about your custom requirements and we'll bring your vision to life
          </p>
        </div>

        {/* Success Message */}
        {submitted && (
          <div className="mb-6 p-4 bg-gold/20 border border-gold rounded-lg">
            <p className="text-gold font-semibold text-center">
              ✓ Your customize request has been submitted successfully! We'll get back to you soon.
            </p>
          </div>
        )}

        {/* Form */}
        <div className="bg-black border border-woody rounded-2xl shadow-lg p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Phone Number */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gold mb-2">
                Phone Number <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                maxLength={11}
                className="w-full px-4 py-3 bg-black border border-woody rounded-lg 
                         text-white placeholder-white/50 
                         focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold"
                placeholder="Enter 11-digit phone number"
                required
              />
              {formData.phoneNumber && formData.phoneNumber.length !== 11 && (
                <p className="text-xs text-woody-light mt-1">
                  {formData.phoneNumber.length} / 11 digits
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gold mb-2">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={6}
                className="w-full px-4 py-3 bg-black border border-woody rounded-lg 
                         text-white placeholder-white/50 
                         focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold
                         resize-none"
                placeholder="Describe your customization requirements in detail..."
                required
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label htmlFor="photo" className="block text-sm font-medium text-gold mb-2">
                Photo <span className="text-red-400">*</span>
              </label>
              <div className="space-y-4">
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="photo"
                    className="flex flex-col items-center justify-center w-full h-32 
                             border-2 border-dashed border-woody rounded-lg 
                             cursor-pointer hover:border-gold
                             bg-black"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg
                        className="w-8 h-8 mb-2 text-woody group-hover:text-gold"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p className="mb-2 text-sm text-beige">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-beige/70">PNG, JPG, GIF, WEBP (MAX. 5MB)</p>
                    </div>
                    <input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      required
                    />
                  </label>
                </div>

                {/* Preview */}
                {preview && (
                  <div className="mt-4">
                    <p className="text-sm text-beige mb-2">Preview:</p>
                    <div className="relative inline-block">
                      <img
                        src={preview}
                        alt="Preview"
                        className="max-w-full h-48 object-contain rounded-lg border border-woody"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPreview(null);
                          setFormData(prev => ({ ...prev, photo: null }));
                          document.getElementById('photo').value = '';
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full 
                                 w-6 h-6 flex items-center justify-center 
                                 hover:bg-red-600 transition-colors"
                        aria-label="Remove image"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Size */}
            <div>
              <label htmlFor="size" className="block text-sm font-medium text-gold mb-2">
                Size <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="size"
                name="size"
                value={formData.size}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-black border border-woody rounded-lg 
                         text-white placeholder-white/50 
                         focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold"
                placeholder="e.g., Small, Medium, Large, or specific dimensions"
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading || submitted}
                className="min-w-[150px] rounded-full"
              >
                {loading ? 'Submitting...' : submitted ? 'Submitted!' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </div>

        {/* Info Section */}
        <div className="mt-8 p-6 bg-dark-light border border-woody rounded-2xl">
          <h3 className="text-lg font-semibold text-gold mb-3">What happens next?</h3>
          <ul className="space-y-2 text-beige text-sm">
            <li className="flex items-start">
              <span className="text-gold mr-2">•</span>
              <span>Our team will review your customization request within 24-48 hours</span>
            </li>
            <li className="flex items-start">
              <span className="text-gold mr-2">•</span>
              <span>We'll contact you via email to discuss details and pricing</span>
            </li>
            <li className="flex items-start">
              <span className="text-gold mr-2">•</span>
              <span>Once approved, we'll proceed with creating your custom product</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Customize;

