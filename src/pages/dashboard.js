import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import Link from 'next/link';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluationStats, setEvaluationStats] = useState({
    submitted: 0,
    pending: 0,
    totalFaculty: 0
  });
  const [pendingEvaluations, setPendingEvaluations] = useState([]);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const router = useRouter();

  // Helper function to get user initials
  const getStudentInitials = () => {
    if (user?.firstname && user?.lastname) {
      return `${user.firstname[0]}${user.lastname[0]}`.toUpperCase();
    }
    return 'S';
  };

  // Helper function to get avatar color
  const getStudentAvatarColor = () => {
    const name = `${user?.firstname || ''}${user?.lastname || ''}`;
    if (!name) return '#10b981';
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    const userType = parsedUser.userType || parsedUser.user_type;
    
    // Redirect based on user type
    if (userType === 'admin' || userType === 1) {
      router.push('/admin/dashboard');
      return;
    } else if (userType === 'faculty' || userType === 2) {
      router.push('/faculty/dashboard');
      return;
    }

    setUser(parsedUser);
    fetchDashboardData(parsedUser.id, token);
  }, [router]);

  const fetchDashboardData = async (studentId, token) => {
    try {
      console.log('📊 Fetching dashboard data for student:', studentId);
      
      // Fetch ONLY valid evaluations (with faculty relationship check)
      const response = await fetch(`/api/student/evaluations?studentId=${studentId}&checkFaculty=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch evaluations');
      }
      
      const data = await response.json();
      console.log('📊 Evaluations API response:', data);
      
      // Handle different response formats
      let evaluations = [];
      if (data.success && data.data) {
        evaluations = data.data; // New format: { success: true, data: [...] }
      } else if (Array.isArray(data)) {
        evaluations = data; // Old format: [...]
      } else if (data.evaluations) {
        evaluations = data.evaluations; // Another format: { evaluations: [...] }
      }
      
      console.log(`📊 Total evaluations fetched: ${evaluations.length}`);
      
      // CRITICAL: Filter out evaluations where student doesn't have faculty relationship
      // First, let's check if the API already filtered them
      let validEvaluations = evaluations;
      
      // If API doesn't filter, we need to check faculty relationships
      if (evaluations.length > 0 && evaluations[0].hasFacultyRelationship !== undefined) {
        // API returned hasFacultyRelationship field
        validEvaluations = evaluations.filter(e => e.hasFacultyRelationship === true);
        console.log(`✅ Filtered to ${validEvaluations.length} evaluations with faculty relationship`);
      } else {
        // API doesn't have faculty relationship check, we'll show all but warn
        console.log('⚠️ API does not support faculty relationship check');
        console.log('📋 Showing ALL evaluations (may include invalid ones)');
      }
      
      // Calculate statistics
      const submitted = validEvaluations.filter(e => 
        e.status === 'completed' || e.submitted_at || e.submittedAt || 
        (e.displayStatus && e.displayStatus === 'Completed')
      ).length;
      
      const pendingEvalsList = validEvaluations.filter(e => {
        const isCompleted = e.status === 'completed' || e.submitted_at || e.submittedAt;
        const isOverdue = e.due_date && new Date(e.due_date) < new Date();
        return !isCompleted && !isOverdue;
      });
      
      const pending = pendingEvalsList.length;
      
      const facultyIds = [...new Set(validEvaluations.map(e => e.faculty_id || e.faculty?.id).filter(Boolean))];
      
      setEvaluationStats({
        submitted,
        pending,
        totalFaculty: facultyIds.length
      });
      
      // Set pending evaluations for display
      const pendingToShow = pendingEvalsList.slice(0, 5).map(e => ({
        id: e.id,
        status: e.status,
        displayStatus: e.displayStatus,
        form_title: e.title || e.form_title || 'Evaluation Form',
        faculty_name: e.faculty?.name || 
                     `${e.faculty_firstname || ''} ${e.faculty_lastname || ''}`.trim() || 
                     'Faculty Member',
        due_date: e.due_date || e.dueDate,
        canSubmit: e.canSubmit,
        faculty_firstname: e.faculty_firstname || e.faculty?.firstname,
        faculty_lastname: e.faculty_lastname || e.faculty?.lastname
      }));
      
      setPendingEvaluations(pendingToShow);
      
      // Set recent submissions
      const recentSubs = validEvaluations.filter(e => 
        e.status === 'completed' || e.submitted_at || e.submittedAt
      ).slice(0, 3).map(e => ({
        id: e.id,
        submitted_at: e.submitted_at || e.submittedAt || e.assigned_at,
        form_title: e.title || e.form_title || 'Evaluation Form',
        faculty_firstname: e.faculty_firstname || e.faculty?.firstname || 'Faculty',
        faculty_lastname: e.faculty_lastname || e.faculty?.lastname || 'Member'
      }));
      
      setRecentSubmissions(recentSubs);
      
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      setEvaluationStats({ submitted: 0, pending: 0, totalFaculty: 0 });
      setPendingEvaluations([]);
      setRecentSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getDaysRemaining = (dueDate) => {
    if (!dueDate) return null;
    try {
      const due = new Date(dueDate);
      const today = new Date();
      const diffTime = due - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      return null;
    }
  };

  const getStatusBadge = (status, dueDate) => {
    const daysRemaining = getDaysRemaining(dueDate);
    
    if (status === 'completed') {
      return { text: 'COMPLETED', color: 'bg-green-100 text-green-800' };
    }
    
    if (daysRemaining !== null && daysRemaining < 0) {
      return { text: 'OVERDUE', color: 'bg-red-100 text-red-800' };
    }
    
    if (daysRemaining !== null && daysRemaining <= 3) {
      return { text: 'URGENT', color: 'bg-red-100 text-red-800' };
    }
    
    return { text: 'PENDING', color: 'bg-yellow-100 text-yellow-800' };
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
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 mb-8 text-white">
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
                    style={{ backgroundColor: getStudentAvatarColor() }}
                  >
                    {getStudentInitials()}
                  </div>
                </div>
              )}
            </div>
            
            {/* Profile Info */}
            <div className="text-center md:text-left flex-1">
              <h2 className="text-3xl md:text-4xl font-bold mb-2">
                {user?.firstname} {user?.lastname}
              </h2>
              <p className="text-xl mb-1 opacity-90">Student</p>
              <p className="text-lg mb-4 opacity-80">
                {user?.class?.curriculum || 'Not assigned'} - Year {user?.class?.level || 'N/A'} - Section {user?.class?.section || 'N/A'}
              </p>
              
              <div className="flex flex-wrap gap-3 mt-4">
                <div className="bg-white bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <p className="text-sm opacity-90">Student ID</p>
                  <p className="font-semibold">{user?.school_id || user?.student_id || 'N/A'}</p>
                </div>
                
                <div className="bg-white bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <p className="text-sm opacity-90">Email</p>
                  <p className="font-semibold">{user?.email}</p>
                </div>
                
                <div className="bg-white bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <p className="text-sm opacity-90">Academic Year</p>
                  <p className="font-semibold">{user?.class?.academic_year || '2024-2025'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Student Dashboard</h1>
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

        {/* Academic Information Card */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Academic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
                <h3 className="font-semibold text-blue-700">Student ID</h3>
              </div>
              <p className="text-lg font-bold text-gray-800">{user?.school_id || user?.student_id || 'N/A'}</p>
            </div>
            
            <div className="bg-green-50 border border-green-100 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <h3 className="font-semibold text-green-700">Program</h3>
              </div>
              <p className="text-lg font-bold text-gray-800">{user?.class?.curriculum || 'Not assigned'}</p>
            </div>
            
            <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="font-semibold text-purple-700">Year & Section</h3>
              </div>
              <p className="text-lg font-bold text-gray-800">
                {user?.class ? `Year ${user.class.level} - ${user.class.section}` : 'Not assigned'}
              </p>
            </div>
            
            <div className="bg-orange-50 border border-orange-100 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="font-semibold text-orange-700">Academic Year</h3>
              </div>
              <p className="text-lg font-bold text-gray-800">{user?.class?.academic_year || '2024-2025'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Quick Actions & Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions Card */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link 
                  href="/student/evaluations"
                  className="block w-full text-left px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 flex items-center hover:shadow-md"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Evaluate Faculty
                </Link>
                
                <Link 
                  href="/student/evaluations"
                  className="block w-full text-left px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 flex items-center hover:shadow-md"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  View My Submissions
                </Link>
                
                <button
                  onClick={() => fetchDashboardData(user?.id, localStorage.getItem('token'))}
                  className="block w-full text-left px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 flex items-center hover:shadow-md"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Dashboard
                </button>
              </div>
            </div>

            {/* Evaluation Statistics Card */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Evaluation Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-gray-700">Evaluations Submitted</span>
                  </div>
                  <span className="font-bold text-blue-600 text-xl">{evaluationStats.submitted}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                    <span className="text-gray-700">Pending Evaluations</span>
                  </div>
                  <span className="font-bold text-red-600 text-xl">{evaluationStats.pending}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-500 rounded-full mr-3"></div>
                    <span className="text-gray-700">Total Faculty</span>
                  </div>
                  <span className="font-bold text-gray-600 text-xl">{evaluationStats.totalFaculty}</span>
                </div>
              </div>
              
              {evaluationStats.pending > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-sm text-yellow-800">
                      You have <span className="font-bold">{evaluationStats.pending}</span> pending evaluation{evaluationStats.pending !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Pending Evaluations & Recent Submissions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pending Evaluations Card */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Pending Evaluations</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Complete these evaluations before the due date
                  </p>
                </div>
                {pendingEvaluations.length > 0 && (
                  <Link 
                    href="/student/evaluations"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                  >
                    View All
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </div>
              
              {pendingEvaluations.length > 0 ? (
                <div className="space-y-4">
                  {pendingEvaluations.map((evaluation) => {
                    const statusBadge = getStatusBadge(evaluation.status, evaluation.due_date);
                    const daysRemaining = getDaysRemaining(evaluation.due_date);
                    
                    return (
                      <div key={evaluation.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800">{evaluation.form_title || 'Evaluation Form'}</h4>
                            <div className="flex items-center mt-1">
                              <svg className="w-4 h-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <p className="text-sm text-gray-600">Faculty: {evaluation.faculty_name || 'Faculty Member'}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusBadge.color}`}>
                            {statusBadge.text}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center mt-4">
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Due: {formatDate(evaluation.due_date)}
                            </div>
                            {daysRemaining !== null && daysRemaining >= 0 && (
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
                              </div>
                            )}
                          </div>
                          <Link
                            href={`/student/evaluate/${evaluation.id}`}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Start Evaluation
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h4 className="mt-4 text-lg font-medium text-gray-900">No pending evaluations</h4>
                  <p className="mt-1 text-gray-500 max-w-md mx-auto">
                    Great job! You've completed all your assigned evaluations. 
                    New evaluations will appear here when assigned by your instructors.
                  </p>
                </div>
              )}
            </div>

            {/* Recent Submissions Card */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Submissions</h3>
              
              {recentSubmissions.length > 0 ? (
                <div className="space-y-3">
                  {recentSubmissions.map((submission) => (
                    <div key={submission.id} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                      <div>
                        <p className="font-medium text-gray-800">{submission.form_title}</p>
                        <div className="flex items-center mt-1">
                          <svg className="w-3 h-3 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <p className="text-xs text-gray-600">
                            {submission.faculty_firstname} {submission.faculty_lastname}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                          SUBMITTED
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(submission.submitted_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {evaluationStats.submitted > recentSubmissions.length && (
                    <div className="mt-4 text-center">
                      <Link
                        href="/student/evaluations"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
                      >
                        View all {evaluationStats.submitted} submissions
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="mt-2 text-gray-500">No submissions yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Your submitted evaluations will appear here
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
