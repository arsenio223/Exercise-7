import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';

export default function FacultyDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvaluations: 0,
    averageRating: 0,
    totalStudents: 0
  });
  const [loadingStats, setLoadingStats] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    const userType = parsedUser.userType || parsedUser.user_type;
    
    if (userType !== 'faculty' && userType !== 2) {
      router.push('/unauthorized');
      return;
    }

    setUser(parsedUser);
    fetchFacultyStats(parsedUser.id, token);
  }, []);

  // Helper function to get user initials
  const getUserInitials = () => {
    if (user?.firstname && user?.lastname) {
      return `${user.firstname[0]}${user.lastname[0]}`.toUpperCase();
    }
    return 'F';
  };

  // Helper function to get avatar color
  const getAvatarColor = () => {
    const name = `${user?.firstname || ''}${user?.lastname || ''}`;
    if (!name) return '#3b82f6';
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  const fetchFacultyStats = async (facultyId, token) => {
    setLoadingStats(true);
    try {
      const response = await fetch(`/api/faculty/evaluations?facultyId=${facultyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          const evaluationsData = data.data || [];
          calculateStatistics(evaluationsData);
        }
      }
    } catch (error) {
      console.error('Error fetching faculty stats:', error);
    } finally {
      setLoading(false);
      setLoadingStats(false);
    }
  };

  const calculateStatistics = (evaluationsData) => {
    let totalRating = 0;
    let ratedEvaluations = 0;
    const studentIds = new Set();
    
    evaluationsData.forEach(evaluation => {
      if (evaluation.student_id) {
        studentIds.add(evaluation.student_id);
      }
      
      const rating = evaluation.score || 
                     evaluation.calculated_score ||
                     evaluation.total_score || 
                     evaluation.average_rating;
      
      if (rating !== undefined && rating !== null && !isNaN(rating)) {
        totalRating += parseFloat(rating);
        ratedEvaluations++;
      }
    });
    
    const averageRating = ratedEvaluations > 0 ? (totalRating / ratedEvaluations).toFixed(2) : 0;
    
    setStats({
      totalEvaluations: evaluationsData.length,
      averageRating: parseFloat(averageRating),
      totalStudents: studentIds.size
    });
  };

  const refreshStats = () => {
    if (user) {
      fetchFacultyStats(user.id, localStorage.getItem('token'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout user={user}>
      <div className="p-6">
        {/* Large Profile Section */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-center md:items-start">
            {/* Large Profile Picture */}
            <div className="mb-6 md:mb-0 md:mr-8 flex-shrink-0">
              {user?.profile_picture || user?.profilePicture ? (
                <img
                  src={(user.profile_picture || user.profilePicture).startsWith('http') || (user.profile_picture || user.profilePicture).startsWith('/') 
                    ? (user.profile_picture || user.profilePicture)
                    : `/${user.profile_picture || user.profilePicture}`}
                  alt={`${user?.firstname || ''} ${user?.lastname || ''}`}
                  className="w-40 h-40 md:w-48 md:h-48 rounded-full object-cover border-4 border-white shadow-2xl"
                  onError={(e) => {
                    console.log('Profile picture failed to load, using fallback');
                    e.target.src = '/uploads/default-avatar.png';
                  }}
                />
              ) : (
                <div className="w-40 h-40 md:w-48 md:h-48 rounded-full flex items-center justify-center bg-white bg-opacity-20 border-4 border-white shadow-2xl">
                  <div 
                    className="w-36 h-36 md:w-44 md:h-44 rounded-full flex items-center justify-center text-white text-6xl font-bold"
                    style={{ backgroundColor: getAvatarColor() }}
                  >
                    {getUserInitials()}
                  </div>
                </div>
              )}
            </div>
            
            {/* Profile Info */}
            <div className="text-center md:text-left flex-1">
              <h2 className="text-3xl md:text-4xl font-bold mb-2">
                {user?.firstname} {user?.lastname}
              </h2>
              <p className="text-xl mb-6 opacity-90">Faculty Member</p>
              
              <div className="flex flex-wrap gap-3 mt-4">
                <div className="bg-white bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <p className="text-sm opacity-90">Email</p>
                  <p className="font-semibold">{user?.email}</p>
                </div>
                
                <div className="bg-white bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <p className="text-sm opacity-90">Faculty ID</p>
                  <p className="font-semibold">{user?.school_id || user?.faculty_id || 'N/A'}</p>
                </div>
                
                <div className="bg-white bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <p className="text-sm opacity-90">Status</p>
                  <p className="font-semibold">Active</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Faculty Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Welcome back, <span className="font-semibold">{user?.firstname} {user?.lastname}</span>
            </p>
          </div>
          <div className="text-sm text-gray-500">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
        
        {/* Faculty Information Card - UPDATED: Removed Department field */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Faculty Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h3 className="font-semibold text-green-700">Email</h3>
              </div>
              <p className="text-lg font-bold text-gray-800">{user?.email}</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="font-semibold text-purple-700">Status</h3>
              </div>
              <p className="text-lg font-bold text-gray-800">Active</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => router.push('/faculty/evaluations')}
                  className="w-full text-left px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 flex items-center hover:shadow-md"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  View Evaluation Results
                </button>
                
                <button 
                  onClick={() => router.push('/faculty/profile')}
                  className="w-full text-left px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 flex items-center hover:shadow-md"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Update Profile
                </button>
                
                <button
                  onClick={refreshStats}
                  disabled={loadingStats}
                  className="w-full text-left px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 flex items-center hover:shadow-md disabled:opacity-50"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {loadingStats ? 'Refreshing...' : 'Refresh Dashboard'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Statistics */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Evaluation Statistics</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Overview of your student evaluations
                  </p>
                </div>
                {stats.totalEvaluations > 0 && (
                  <button 
                    onClick={() => router.push('/faculty/evaluations')}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                  >
                    View Details
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl">
                  <div className="flex items-center mb-2">
                    <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="font-semibold text-blue-700">Total Evaluations</h3>
                  </div>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalEvaluations}</p>
                </div>
                
                <div className="bg-green-50 border border-green-100 p-6 rounded-xl">
                  <div className="flex items-center mb-2">
                    <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <h3 className="font-semibold text-green-700">Average Rating</h3>
                  </div>
                  <p className="text-3xl font-bold text-gray-800">
                    {stats.averageRating > 0 ? stats.averageRating.toFixed(2) : 'N/A'}
                    {stats.averageRating > 0 && <span className="text-sm text-gray-500 ml-1">/5</span>}
                  </p>
                </div>
                
                <div className="bg-purple-50 border border-purple-100 p-6 rounded-xl">
                  <div className="flex items-center mb-2">
                    <svg className="w-6 h-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-1.205a21.047 21.047 0 01-3.437 5.192M9.75 9.348a9 9 0 0111.25 0" />
                    </svg>
                    <h3 className="font-semibold text-purple-700">Students Evaluated</h3>
                  </div>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalStudents}</p>
                </div>
              </div>
              
              {loadingStats ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Updating statistics...</p>
                </div>
              ) : stats.totalEvaluations === 0 ? (
                <div className="text-center py-6">
                  <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h4 className="mt-4 text-lg font-medium text-gray-900">No evaluations yet</h4>
                  <p className="mt-1 text-gray-500">
                    Your evaluation statistics will appear here when students evaluate you.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-gray-700">
                      Based on {stats.totalEvaluations} evaluation{stats.totalEvaluations !== 1 ? 's' : ''} from {stats.totalStudents} student{stats.totalStudents !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
