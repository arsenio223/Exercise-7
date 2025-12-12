import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';

export default function Register() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  // State for multi-step form
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    userType: 'student',
    schoolId: '',
    firstname: '',
    lastname: '',
    email: '',
    classId: '',
    password: '',
    confirmPassword: '',
    profilePicture: null,
    selectedAvatar: null,
    classesHandled: []
  });
  
  const [previewUrl, setPreviewUrl] = useState('');
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const defaultAvatars = [
    'ad.png',
    'dwight.png', 
    'lebron.png',
    'russell.png',
    'default-avatar.png'
  ];

  useEffect(() => {
    if (formData.userType === 'student' || formData.userType === 'faculty') {
      fetchAvailableClasses();
    }
  }, [formData.userType]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const fetchAvailableClasses = async () => {
    setLoadingClasses(true);
    try {
      const response = await axios.get('/api/classes');
      const classesData = Array.isArray(response.data) ? response.data : [];
      setClasses(classesData);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Image size should be less than 5MB');
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setFormData(prev => ({ 
      ...prev, 
      profilePicture: file,
      selectedAvatar: null
    }));
    setError('');
  };

  const handleAvatarSelect = (avatar) => {
    setFormData(prev => ({ 
      ...prev, 
      selectedAvatar: avatar,
      profilePicture: null
    }));
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
  };

  const removeProfilePicture = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
    setFormData(prev => ({ 
      ...prev, 
      profilePicture: null,
      selectedAvatar: null 
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const validateStep = (step) => {
    switch(step) {
      case 1:
        if (!formData.userType) {
          setError('Please select account type');
          return false;
        }
        if (!formData.schoolId || !formData.firstname || !formData.lastname || !formData.email) {
          setError('Please fill all required fields');
          return false;
        }
        break;
      case 2:
        // Profile picture is optional, so no validation needed
        break;
      case 3:
        if (formData.userType === 'student' && !formData.classId) {
          setError('Please select your class');
          return false;
        }
        break;
      case 4:
        if (!formData.password || !formData.confirmPassword) {
          setError('Please fill password fields');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          return false;
        }
        break;
    }
    setError('');
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    setUploadProgress(0);

    try {
      // Final validation
      if (!formData.schoolId || !formData.firstname || !formData.lastname || 
          !formData.email || !formData.password || !formData.confirmPassword) {
        throw new Error('All required fields must be filled');
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      if (formData.userType === 'student' && !formData.classId) {
        throw new Error('Please select your class');
      }

      // Create FormData
      const formDataToSend = new FormData();
      formDataToSend.append('userType', formData.userType);
      formDataToSend.append('schoolId', formData.schoolId);
      formDataToSend.append('firstname', formData.firstname);
      formDataToSend.append('lastname', formData.lastname);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('confirmPassword', formData.confirmPassword);
      
      if (formData.selectedAvatar) {
        formDataToSend.append('selectedAvatar', formData.selectedAvatar);
      }
      
      if (formData.userType === 'student') {
        formDataToSend.append('classId', formData.classId);
      }
      
      if (formData.userType === 'faculty' && formData.classesHandled && formData.classesHandled.length > 0) {
        formData.classesHandled.forEach((classId) => {
          formDataToSend.append('classesHandled[]', classId);
        });
      }
      
      if (formData.profilePicture) {
        formDataToSend.append('profilePicture', formData.profilePicture);
      }

      // Upload
      const response = await axios.post('/api/auth/register', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
        timeout: 30000
      });
      
      if (response.data.success) {
        setSuccess('Registration successful! Redirecting to login...');
        setCurrentStep(5); // Success step
        
        // Reset form after delay
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || err.message || 'Registration failed');
      setCurrentStep(4); // Go back to review step
    } finally {
      setLoading(false);
    }
  };

  // Progress Steps
  const steps = [
    { number: 1, title: 'Account Type', description: 'Choose your role' },
    { number: 2, title: 'Profile Picture', description: 'Add your photo' },
    { number: 3, title: 'Class Info', description: 'Academic details' },
    { number: 4, title: 'Security', description: 'Set password' },
    { number: 5, title: 'Complete', description: 'Finish registration' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12 px-4">
      {/* Background with Gradient Overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url("/uploads/background.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/70 to-purple-900/70"></div>
      </div>
      
      {/* Floating Particles Effect */}
      <div className="absolute inset-0 z-1 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/10 animate-float"
            style={{
              width: `${Math.random() * 30 + 10}px`,
              height: `${Math.random() * 30 + 10}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 10 + 10}s`
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-6xl mx-4">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-12">
          {/* Left Side - Branding & Progress Steps */}
          <div className="w-full lg:w-2/5">
            
            {/* Progress Steps Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
              <div className="space-y-6">
                {steps.map((step) => (
                  <div key={step.number} className="flex items-center space-x-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                      currentStep === step.number 
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg' 
                        : currentStep > step.number
                          ? 'bg-green-500/20'
                          : 'bg-white/10'
                    }`}>
                      {currentStep > step.number ? (
                        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className={`text-lg font-bold ${
                          currentStep === step.number ? 'text-white' : 'text-blue-200'
                        }`}>
                          {step.number}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className={`font-medium ${
                        currentStep === step.number ? 'text-white' : 'text-blue-200'
                      }`}>
                        {step.title}
                      </h3>
                      <p className="text-sm text-blue-300/70">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Registration Form */}
          <div className="w-full lg:w-3/5">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 border border-white/30 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">Create Account</h3>
                  <p className="text-gray-600 mt-1">Step {currentStep} of 5</p>
                </div>
                <div className="text-sm">
                  <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                    Already have an account?
                  </Link>
                </div>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 rounded-lg">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-red-500 mr-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-green-700 font-medium">{success}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Step 1: Account Type & Basic Info */}
                {currentStep === 1 && (
                  <div className="space-y-8">
                    <div>
                      <h4 className="text-xl font-semibold text-gray-800 mb-6">Choose Your Role</h4>
                      <div className="grid grid-cols-2 gap-6">
                        {['student', 'faculty'].map((type) => (
                          <label
                            key={type}
                            className={`relative p-8 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                              formData.userType === type 
                                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg' 
                                : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                            }`}
                          >
                            <input
                              type="radio"
                              name="userType"
                              value={type}
                              checked={formData.userType === type}
                              onChange={handleChange}
                              className="sr-only"
                            />
                            <div className="flex flex-col items-center text-center">
                              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                                formData.userType === type 
                                  ? 'bg-gradient-to-br from-blue-100 to-purple-100 text-blue-600' 
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                {type === 'student' ? (
                                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                ) : (
                                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                )}
                              </div>
                              <span className="text-lg font-semibold text-gray-800 capitalize">{type}</span>
                              <p className="text-sm text-gray-600 mt-2">
                                {type === 'student' ? 'Evaluate faculty members' : 'Receive student evaluations'}
                              </p>
                              {formData.userType === type && (
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">School ID *</label>
                        <input
                          type="text"
                          name="schoolId"
                          value={formData.schoolId}
                          onChange={handleChange}
                          className="w-full px-5 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder-gray-500"
                          placeholder="Enter your school ID"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full px-5 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder-gray-500"
                          placeholder="student@school.edu"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                        <input
                          type="text"
                          name="firstname"
                          value={formData.firstname}
                          onChange={handleChange}
                          className="w-full px-5 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder-gray-500"
                          placeholder="Enter your first name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                        <input
                          type="text"
                          name="lastname"
                          value={formData.lastname}
                          onChange={handleChange}
                          className="w-full px-5 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder-gray-500"
                          placeholder="Enter your last name"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Profile Picture */}
                {currentStep === 2 && (
                  <div className="space-y-8">
                    <h4 className="text-xl font-semibold text-gray-800 mb-6">Add Profile Picture</h4>
                    
                    <div className="flex flex-col items-center">
                      {/* Profile Picture Preview */}
                      <div className="relative mb-8">
                        {previewUrl ? (
                          <div className="relative">
                            <img 
                              src={previewUrl} 
                              alt="Profile preview" 
                              className="w-56 h-56 rounded-full object-cover border-4 border-white shadow-2xl"
                            />
                            <button
                              type="button"
                              onClick={removeProfilePicture}
                              className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 shadow-lg transition"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : formData.selectedAvatar ? (
                          <div className="relative">
                            <img 
                              src={`/uploads/${formData.selectedAvatar}`} 
                              alt="Selected avatar" 
                              className="w-56 h-56 rounded-full object-cover border-4 border-white shadow-2xl"
                              onError={(e) => e.target.src = '/uploads/default-avatar.png'}
                            />
                            <button
                              type="button"
                              onClick={() => handleAvatarSelect(null)}
                              className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 shadow-lg transition"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div 
                            onClick={triggerFileInput}
                            className="w-56 h-56 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-4 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:from-gray-50 hover:to-gray-100 transition-all duration-300"
                          >
                            <div className="text-center">
                              <svg className="mx-auto h-20 w-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="mt-4 block text-lg font-medium text-gray-600">Upload Photo</span>
                              <span className="text-sm text-gray-500">Click to browse</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={triggerFileInput}
                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                      >
                        {previewUrl ? 'Change Photo' : 'Upload Custom Photo'}
                      </button>

                      <p className="mt-6 text-sm text-gray-500 text-center">
                        Supports JPG, PNG, GIF, WebP • Maximum file size 5MB
                      </p>

                      {/* Default Avatars */}
                      <div className="w-full mt-10">
                        <p className="text-lg font-semibold text-gray-800 mb-6 text-center">Or choose a default avatar:</p>
                        <div className="grid grid-cols-5 gap-4">
                          {defaultAvatars.map((avatar) => (
                            <div
                              key={avatar}
                              className={`cursor-pointer p-3 rounded-2xl border-2 transition-all duration-300 ${formData.selectedAvatar === avatar 
                                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 scale-105 shadow-md' 
                                : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                              }`}
                              onClick={() => handleAvatarSelect(avatar)}
                            >
                              <img 
                                src={`/uploads/${avatar}`} 
                                alt={avatar}
                                className="w-full h-20 object-cover rounded-xl"
                                onError={(e) => e.target.src = '/uploads/default-avatar.png'}
                              />
                              <p className="text-xs font-medium text-center mt-3 truncate">
                                {avatar.replace('.png', '').replace('-', ' ')}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Class Information */}
                {currentStep === 3 && (
                  <div className="space-y-8">
                    {formData.userType === 'student' ? (
                      <>
                        <h4 className="text-xl font-semibold text-gray-800 mb-6">Select Your Class</h4>
                        {loadingClasses ? (
                          <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                            <span className="ml-4 text-gray-600 text-lg">Loading classes...</span>
                          </div>
                        ) : (
                          <select
                            name="classId"
                            value={formData.classId}
                            onChange={handleChange}
                            className="w-full px-5 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-700"
                            required
                          >
                            <option value="" className="text-gray-500">Select your class</option>
                            {classes.map((cls) => (
                              <option key={cls.id} value={cls.id} className="text-gray-700">
                                {cls.curriculum} - Year {cls.level} - Section {cls.section}
                              </option>
                            ))}
                          </select>
                        )}
                      </>
                    ) : (
                      <>
                        <h4 className="text-xl font-semibold text-gray-800 mb-6">Classes You Teach (Optional)</h4>
                        <p className="text-gray-600 mb-6">Select the classes you'll be teaching. You can add more later.</p>
                        {loadingClasses ? (
                          <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                            <span className="ml-4 text-gray-600 text-lg">Loading classes...</span>
                          </div>
                        ) : classes.length === 0 ? (
                          <div className="text-center py-12">
                            <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <p className="text-yellow-600 text-lg">No classes available to select</p>
                          </div>
                        ) : (
                          <select
                            name="classesHandled"
                            multiple
                            value={formData.classesHandled}
                            onChange={(e) => {
                              const selected = Array.from(e.target.selectedOptions, option => option.value);
                              setFormData(prev => ({ ...prev, classesHandled: selected }));
                            }}
                            className="w-full px-5 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition h-80"
                            size="8"
                          >
                            {classes.map((cls) => (
                              <option key={cls.id} value={cls.id} className="text-gray-700">
                                {cls.curriculum} - Year {cls.level} - Section {cls.section}
                              </option>
                            ))}
                          </select>
                        )}
                        <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Hold Ctrl/Cmd to select multiple
                          </span>
                          <span className="font-medium">Selected: {formData.classesHandled.length}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Step 4: Password & Review */}
                {currentStep === 4 && (
                  <div className="space-y-8">
                    <h4 className="text-xl font-semibold text-gray-800 mb-6">Set Your Password</h4>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          className="w-full px-5 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          placeholder="At least 6 characters"
                          required
                          minLength="6"
                        />
                        <p className="text-xs text-gray-500 mt-2">Minimum 6 characters required</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="w-full px-5 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          placeholder="Confirm your password"
                          required
                          minLength="6"
                        />
                        <p className="text-xs text-gray-500 mt-2">Must match the password above</p>
                      </div>
                    </div>

                    {/* Review Summary */}
                    <div className="mt-8 p-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border border-gray-200">
                      <h5 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Review Your Information
                      </h5>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                          <span className="text-gray-500 text-xs">Account Type:</span>
                          <p className="font-semibold text-gray-800 capitalize mt-1">{formData.userType}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                          <span className="text-gray-500 text-xs">Name:</span>
                          <p className="font-semibold text-gray-800 mt-1">{formData.firstname} {formData.lastname}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                          <span className="text-gray-500 text-xs">Email:</span>
                          <p className="font-semibold text-gray-800 mt-1">{formData.email}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                          <span className="text-gray-500 text-xs">School ID:</span>
                          <p className="font-semibold text-gray-800 mt-1">{formData.schoolId}</p>
                        </div>
                        {formData.userType === 'student' && formData.classId && (
                          <div className="bg-white p-4 rounded-xl border border-gray-200">
                            <span className="text-gray-500 text-xs">Class:</span>
                            <p className="font-semibold text-gray-800 mt-1">
                              {classes.find(c => c.id == formData.classId)?.curriculum || 'Not selected'}
                            </p>
                          </div>
                        )}
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                          <span className="text-gray-500 text-xs">Profile Picture:</span>
                          <p className="font-semibold text-gray-800 mt-1">
                            {formData.profilePicture ? 'Custom Upload' : formData.selectedAvatar ? 'Default Avatar' : 'None'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Success */}
                {currentStep === 5 && (
                  <div className="text-center py-16">
                    <div className="w-28 h-28 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
                      <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h4 className="text-3xl font-bold text-gray-800 mb-4">Registration Complete!</h4>
                    <p className="text-gray-600 text-lg mb-10 max-w-md mx-auto">
                      Your account has been created successfully. You'll be redirected to login shortly.
                    </p>
                    <div className="animate-pulse inline-flex items-center text-blue-600 text-lg">
                      <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      Redirecting to login...
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                {currentStep < 5 && (
                  <div className="flex justify-between pt-10 mt-10 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={prevStep}
                      disabled={currentStep === 1}
                      className={`px-8 py-3 rounded-xl transition-all duration-300 flex items-center ${
                        currentStep === 1
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                      }`}
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                      Back
                    </button>

                    {currentStep < 4 ? (
                      <button
                        type="button"
                        onClick={nextStep}
                        className="px-10 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center"
                      >
                        Continue
                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-10 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {uploadProgress > 0 ? `Creating Account... ${uploadProgress}%` : 'Creating Account...'}
                          </>
                        ) : (
                          <>
                            Complete Registration
                            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Add floating animation to CSS */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }
        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
    </div>
  );
}
